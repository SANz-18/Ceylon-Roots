import React, { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABEL = { ADMIN: 'Administrator', STAFF: 'Logistics Staff', BUYER: 'Buyer / Importer' };
const BLANK = { name: '', email: '', password: '', role: 'STAFF', country: '' };

export default function UsersAdmin() {
  const { user, showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');

  const load = () => client.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    try {
      await client.put(`/users/${id}/role`, { role });
      showToast('Role updated.', 'ok');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update role.', 'err');
    }
  };

  const toggleActive = async (id) => {
    try {
      await client.put(`/users/${id}/toggle-active`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update status.', 'err');
    }
  };

  const openNew = () => { setForm(BLANK); setError(''); setShowModal(true); };
  const close = () => setShowModal(false);

  const createUser = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Name, email and a password of at least 6 characters are required.');
      return;
    }
    try {
      await client.post('/users', form);
      showToast(`${ROLE_LABEL[form.role]} account created.`, 'ok');
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    }
  };

  return (
    <div>
      <div className="topbar">
        <div><h1>Users</h1><div className="desc">Role-based access — admin, logistics staff and buyers.</div></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add staff / admin</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Country</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <select value={u.role} disabled={u.id === user.id} onChange={(e) => changeRole(u.id, e.target.value)}>
                      {['BUYER', 'STAFF', 'ADMIN'].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td>{u.country}</td>
                  <td>
                    <span className="pill" style={{ background: u.active ? '#DFF0E4' : '#F6DEDE', color: u.active ? '#237a45' : 'var(--danger)' }}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    {u.id !== user.id
                      ? <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u.id)}>{u.active ? 'Suspend' : 'Reactivate'}</button>
                      : <span style={{ fontSize: 11, color: '#8a7256' }}>You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <h3>Add staff / admin account</h3>
            <div className="sub" style={{ color: '#6b5947', fontSize: 13, marginBottom: 14 }}>
              Buyers self-register from the sign-in page — use this only to provision internal accounts.
            </div>
            <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kasun Silva" /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ceylonroots.lk" /></div>
            <div className="grid grid-2">
              <div className="field"><label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="STAFF">Logistics Staff</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="field"><label>Country</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Sri Lanka" /></div>
            </div>
            <div className="field"><label>Temporary password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" /></div>
            {error && <div className="field-error" style={{ display: 'block' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={createUser}>Create account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
