import React, { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const BLANK = { grade: '', name: '', description: '', priceUsd: '', priceLkr: '', stockKg: '' };

export default function ProductsAdmin() {
  const { showToast } = useAuth();
  const [products, setProducts] = useState([]);
  const [modalId, setModalId] = useState(null); // null = closed, 'new' = create, id = edit
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');

  const load = () => client.get('/products').then((r) => setProducts(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(BLANK); setError(''); setModalId('new'); };
  const openEdit = (p) => {
    setForm({ grade: p.grade, name: p.name, description: p.description || '', priceUsd: p.priceUsd, priceLkr: p.priceLkr, stockKg: p.stockKg });
    setError('');
    setModalId(p.id);
  };
  const close = () => setModalId(null);

  const save = async () => {
    if (!form.grade.trim() || !form.name.trim() || form.priceUsd === '' || form.priceLkr === '' || form.stockKg === '') {
      setError('Please fill all fields correctly.');
      return;
    }
    const payload = {
      grade: form.grade, name: form.name, description: form.description,
      priceUsd: parseFloat(form.priceUsd), priceLkr: parseFloat(form.priceLkr), stockKg: parseInt(form.stockKg, 10),
    };
    try {
      if (modalId === 'new') {
        await client.post('/products', payload);
        showToast('Product created.', 'ok');
      } else {
        await client.put(`/products/${modalId}`, payload);
        showToast('Product updated.', 'ok');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save product.');
    }
  };

  const remove = async (id) => {
    try {
      await client.delete(`/products/${id}`);
      showToast('Product removed.', 'err');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove product — it may be referenced by existing orders.', 'err');
    }
  };

  return (
    <div>
      <div className="topbar">
        <div><h1>Manage Products</h1><div className="desc">Grades, pricing and stock levels.</div></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add grade</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Grade</th><th>USD/kg</th><th>LKR/kg</th><th>Stock (kg)</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td className="mono">${p.priceUsd.toFixed(2)}</td>
                  <td className="mono">Rs.{p.priceLkr.toLocaleString()}</td>
                  <td className="mono">{p.stockKg}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && <div className="empty-state">No products yet — add your first export grade.</div>}
      </div>

      {modalId !== null && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <h3>{modalId === 'new' ? 'Add grade' : 'Edit grade'}</h3>
            <div className="field"><label>Grade code</label><input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. C4" /></div>
            <div className="field"><label>Display name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. C4 — 12mm Quills" /></div>
            <div className="grid grid-2">
              <div className="field"><label>USD / kg</label><input type="number" step="0.1" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} /></div>
              <div className="field"><label>LKR / kg</label><input type="number" value={form.priceLkr} onChange={(e) => setForm({ ...form, priceLkr: e.target.value })} /></div>
            </div>
            <div className="field"><label>Stock (kg)</label><input type="number" value={form.stockKg} onChange={(e) => setForm({ ...form, stockKg: e.target.value })} /></div>
            <div className="field"><label>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            {error && <div className="field-error" style={{ display: 'block' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
