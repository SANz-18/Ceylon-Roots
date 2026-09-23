import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', country: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div id="login-screen">
      <div className="login-art">
        <div className="brandmark"><span>🌿 Ceylon Roots</span></div>
        <div className="login-headline">
          <div className="eyebrow">Create a buyer account</div>
          <h1>Join the export ledger.</h1>
          <p>Register to browse grades, place orders and track shipments in real time.</p>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-box">
          <h2>Create account</h2>
          <div className="sub">Buyer accounts can order and track shipments.</div>
          <form onSubmit={submit}>
            <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></div>
            <div className="field"><label>Country</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. United Kingdom" /></div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
              {error && <div className="field-error" style={{ display: 'block' }}>{error}</div>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">Create account</button>
          </form>
          <div style={{ marginTop: 14, fontSize: 12.5 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--jade)' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
