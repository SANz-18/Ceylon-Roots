import React, { useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const REPORTS = [
  {
    key: 'summary',
    title: 'Business Summary',
    desc: 'Revenue, orders by status, sales by grade, local vs. international split, and sentiment distribution — the same figures as the dashboard, in one PDF.',
  },
  {
    key: 'orders',
    title: 'Orders & Sales Report',
    desc: 'Every order with buyer, destination, status, currency and total — useful for reconciling revenue or handing to logistics.',
  },
  {
    key: 'feedback',
    title: 'Feedback & Sentiment Report',
    desc: 'All buyer reviews with rating and sentiment label, plus aggregate sentiment counts.',
  },
];

export default function Reports() {
  const { showToast } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);

  const download = async (key, title) => {
    setLoadingKey(key);
    try {
      const res = await client.get(`/reports/${key}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ceylon-roots-${key}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Could not generate report.', 'err');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div><h1>Reports</h1><div className="desc">Generate PDF reports for exports, sales, and buyer feedback.</div></div>
      </div>

      <div className="grid grid-3">
        {REPORTS.map((r) => (
          <div key={r.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h4 style={{ fontSize: 16 }}>{r.title}</h4>
              <p style={{ fontSize: 12.5, color: '#6b5947', lineHeight: 1.55, marginTop: 6 }}>{r.desc}</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'auto', justifyContent: 'center' }}
              disabled={loadingKey === r.key}
              onClick={() => download(r.key, r.title)}
            >
              {loadingKey === r.key ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
