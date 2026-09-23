import React, { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (diff < 1) return 'just now';
  if (diff < 24) return `${diff}h ago`;
  return `${Math.floor(diff / 24)}d ago`;
}

const STATUS_PILL = {
  PENDING: { bg: '#F3E7CE', color: '#8a5c17' },
  APPROVED: { bg: '#DFF0E4', color: '#237a45' },
  REJECTED: { bg: '#F6DEDE', color: 'var(--danger)' },
};

export default function Refunds() {
  const { showToast } = useAuth();
  const [requests, setRequests] = useState([]);
  const [decision, setDecision] = useState(null); // { request, type: 'approve' | 'reject' }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null); // image src

  const load = () => client.get('/refunds').then((r) => setRequests(r.data));
  useEffect(() => { load(); }, []);

  const openDecision = (request, type) => { setDecision({ request, type }); setNote(''); };
  const closeDecision = () => setDecision(null);

  const submitDecision = async () => {
    setBusy(true);
    try {
      await client.post(`/refunds/${decision.request.id}/${decision.type}`, { note });
      showToast(decision.type === 'approve' ? 'Refund approved.' : 'Refund rejected.', decision.type === 'approve' ? 'ok' : 'err');
      closeDecision();
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not record decision.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');
  const resolved = requests.filter((r) => r.status !== 'PENDING');

  const renderCard = (r) => (
    <div className="card" style={{ marginBottom: 16 }} key={r.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong className="mono">{r.order.orderCode}</strong>
            <span className="pill" style={{ background: STATUS_PILL[r.status].bg, color: STATUS_PILL[r.status].color }}>{r.status}</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#8a7256', marginTop: 4 }}>{r.buyer.name} · requested {timeAgo(r.createdAt)}</div>
        </div>
      </div>

      <p style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 10 }}>{r.reason}</p>

      {r.images?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {r.images.map((img) => (
            <img
              key={img.id}
              src={`data:${img.contentType};base64,${img.imageBase64}`}
              alt="Refund evidence"
              onClick={() => setLightbox(`data:${img.contentType};base64,${img.imageBase64}`)}
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer' }}
            />
          ))}
        </div>
      )}

      {r.staffNote && (
        <div style={{ fontSize: 12, color: '#6b5947', marginTop: 10, padding: '9px 12px', background: 'var(--parchment)', borderRadius: 8 }}>
          <strong>{r.status === 'APPROVED' ? 'Approval note' : 'Rejection reason'} — {r.reviewedBy}:</strong> {r.staffNote}
        </div>
      )}

      {r.status === 'PENDING' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-danger btn-sm" onClick={() => openDecision(r, 'reject')}>Reject</button>
          <button className="btn btn-jade btn-sm" onClick={() => openDecision(r, 'approve')}>Approve</button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="topbar"><div><h1>Refund Requests</h1><div className="desc">{pending.length} pending review</div></div></div>

      {pending.length ? pending.map(renderCard) : <div className="card"><div className="empty-state">No pending refund requests.</div></div>}

      {resolved.length > 0 && (
        <>
          <div className="section-title"><h3>Resolved</h3></div>
          {resolved.map(renderCard)}
        </>
      )}

      {decision && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && !busy && closeDecision()}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3>{decision.type === 'approve' ? 'Approve refund?' : 'Reject refund?'}</h3>
            <p style={{ fontSize: 13.5, color: '#6b5947', marginTop: 8 }}>
              Order <strong className="mono">{decision.request.order.orderCode}</strong> — {decision.request.buyer.name}
            </p>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{decision.type === 'approve' ? 'Note to buyer (optional)' : 'Reason for buyer (recommended)'}</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={decision.type === 'approve' ? 'e.g. Refund will be processed within 5 business days.' : 'e.g. Photos show normal wear, not a defect.'} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost" disabled={busy} onClick={closeDecision}>Go back</button>
              <button className={decision.type === 'approve' ? 'btn btn-jade' : 'btn btn-danger'} disabled={busy} onClick={submitDecision}>
                {busy ? 'Please wait…' : decision.type === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="modal-bg" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Refund evidence enlarged" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}
