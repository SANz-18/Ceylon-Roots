import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getCart, setCart } from './Catalog.jsx';

function money(v, cur) {
  return cur === 'USD' ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `Rs. ${v.toLocaleString()}`;
}
function luhnCheck(num) {
  const digits = (num || '').replace(/\D/g, '');
  if (digits.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

const METHODS = {
  USD: [{ id: 'CARD', label: 'Credit / Debit Card' }, { id: 'PAYPAL', label: 'PayPal' }, { id: 'BANK_TRANSFER', label: 'Wire Transfer' }],
  LKR: [{ id: 'CARD', label: 'Credit / Debit Card' }, { id: 'LANKA_QR', label: 'LankaQR' }, { id: 'COD', label: 'Cash on Delivery' }],
};

export default function Payment() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const currency = sessionStorage.getItem('cr_checkout_currency') || 'USD';
  const couponCode = sessionStorage.getItem('cr_checkout_coupon') || '';
  const [products, setProducts] = useState([]);
  const [cart] = useState(getCart());
  const [method, setMethod] = useState(METHODS[currency][0].id);
  const [card, setCard] = useState({ number: '', holderName: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => { client.get('/products').then((r) => setProducts(r.data)); }, []);

  const lines = cart.map((c) => {
    const product = products.find((p) => p.id === c.productId);
    if (!product) return null;
    const priceEach = currency === 'USD' ? product.priceUsd : product.priceLkr;
    return { ...c, product, priceEach };
  }).filter(Boolean);

  const subtotal = lines.reduce((a, l) => a + l.priceEach * l.qty, 0);
  const destinationType = currency === 'USD' ? 'international' : 'local';
  const shipping = destinationType === 'international' ? (currency === 'USD' ? 85 : 25500) : (currency === 'USD' ? 0 : 1200);

  // Re-check the coupon here too — it's the figure actually charged, and the discount
  // could've changed (expired / used up) between the cart page and now.
  useEffect(() => {
    if (!couponCode || !lines.length) { setDiscount(0); return; }
    client.post('/coupons/validate', { code: couponCode, subtotal, currency })
      .then((r) => setDiscount(r.data.discountAmount))
      .catch(() => setDiscount(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, subtotal, currency, products.length]);

  const total = subtotal - discount + shipping;

  const formatCardNum = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    let d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
    return d;
  };

  const pay = async () => {
    setError('');
    if (method === 'CARD') {
      if (!luhnCheck(card.number)) { setError('Card number failed validation — please re-check.'); return; }
      if (!card.holderName.trim()) { setError('Cardholder name is required.'); return; }
      const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry);
      if (!m) { setError('Enter expiry as MM/YY.'); return; }
      if (!/^\d{3,4}$/.test(card.cvv)) { setError('Enter a valid CVV.'); return; }
    }

    setSubmitting(true);
    try {
      const { data } = await client.post('/orders/checkout', {
        items: cart,
        currency,
        paymentMethod: method,
        card: method === 'CARD' ? card : null,
        couponCode: couponCode || null,
      });
      setCart([]);
      sessionStorage.removeItem('cr_checkout_coupon');
      setConfirmedOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '20px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DFF0E4', color: '#237a45', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>✓</div>
        <h2>Payment confirmed</h2>
        <div style={{ color: '#6b5947', marginTop: 8, fontSize: 13.5 }}>Your order has been placed and is now in the confirmed stage.</div>
        <div className="card" style={{ marginTop: 22, background: 'var(--parchment)', textAlign: 'left' }}>
          <div className="summary-row"><span>Order ID</span><span className="mono">{confirmedOrder.orderCode}</span></div>
          <div className="summary-row"><span>Tracking code</span><span className="mono">{confirmedOrder.trackingCode}</span></div>
          {confirmedOrder.couponCode && <div className="summary-row" style={{ color: 'var(--jade-dark)' }}><span>Coupon ({confirmedOrder.couponCode})</span><span className="mono">−{money(confirmedOrder.discountAmount, confirmedOrder.currency)}</span></div>}
          <div className="summary-row total"><span>Total paid</span><span className="mono">{money(confirmedOrder.total, confirmedOrder.currency)}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/orders')}>View my orders</button>
          <button className="btn btn-primary" onClick={() => navigate('/catalog')}>Continue shopping</button>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return <div className="card"><div className="empty-state">Your cart is empty.</div></div>;
  }

  return (
    <div>
      <div className="topbar">
        <div><h1>Payment</h1><div className="desc">Total due: <strong className="mono">{money(total, currency)}</strong></div></div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cart')}>← Back to cart</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="pay-methods">
            {METHODS[currency].map((m) => (
              <div key={m.id} className={`pay-method ${method === m.id ? 'active' : ''}`} onClick={() => setMethod(m.id)}>
                <div>{m.label}</div>
              </div>
            ))}
          </div>

          {method === 'CARD' && (
            <>
              <div className="card-visual">
                <div style={{ fontSize: 11, opacity: 0.7 }}>CEYLON ROOTS SECURE PAY</div>
                <div className="num">{card.number ? formatCardNum(card.number).padEnd(19, '•').slice(0, 19) : '•••• •••• •••• ••••'}</div>
                <div className="row"><span>{card.holderName.toUpperCase() || 'CARDHOLDER NAME'}</span><span>{card.expiry || 'MM/YY'}</span></div>
              </div>
              <div className="grid grid-2">
                <div className="field" style={{ gridColumn: '1/3' }}>
                  <label>Card number</label>
                  <input value={formatCardNum(card.number)} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" maxLength={19} />
                </div>
                <div className="field"><label>Cardholder name</label><input value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} placeholder="J. WHITFIELD" /></div>
                <div className="field"><label>Expiry</label><input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" maxLength={5} /></div>
                <div className="field"><label>CVV</label><input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" maxLength={4} /></div>
              </div>
            </>
          )}
          {method === 'PAYPAL' && <div className="card" style={{ background: 'var(--parchment)', borderStyle: 'dashed', textAlign: 'center', padding: 26 }}>You'll be redirected to PayPal to approve payment of <strong>{money(total, currency)}</strong> (simulated).</div>}
          {method === 'BANK_TRANSFER' && <div className="card" style={{ background: 'var(--parchment)', borderStyle: 'dashed', padding: 20, fontSize: 13, lineHeight: 1.7 }}><strong>Wire transfer instructions</strong><br />Beneficiary: Ceylon Roots Exports (Pvt) Ltd<br />Bank: Ceylon Trade Bank, Colombo<br />SWIFT: CTBKLKLX<br /><span style={{ color: '#8a7256' }}>Order confirms instantly here (simulated).</span></div>}
          {method === 'LANKA_QR' && <div className="card" style={{ background: 'var(--parchment)', borderStyle: 'dashed', textAlign: 'center', padding: 26 }}>Scan with any LankaQR-enabled banking app (simulated).</div>}
          {method === 'COD' && <div className="card" style={{ background: 'var(--parchment)', borderStyle: 'dashed', padding: 20, fontSize: 13.5 }}>Pay in cash on delivery. Our logistics team will call to confirm.</div>}

          {error && <div className="field-error" style={{ display: 'block', marginTop: 10 }}>{error}</div>}
          <div className="secure-note">🔒 Simulated encryption — this is a prototype; no real card network is contacted.</div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Summary</h4>
          {lines.map((l) => (
            <div className="summary-row" key={l.productId}><span>{l.product.grade} × {l.qty}kg</span><span className="mono">{money(l.priceEach * l.qty, currency)}</span></div>
          ))}
          {couponCode && discount > 0 && <div className="summary-row" style={{ color: 'var(--jade-dark)' }}><span>Coupon ({couponCode})</span><span className="mono">−{money(discount, currency)}</span></div>}
          <div className="summary-row"><span>Shipping</span><span className="mono">{shipping ? money(shipping, currency) : 'Free'}</span></div>
          <div className="summary-row total"><span>Total</span><span className="mono">{money(total, currency)}</span></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} disabled={submitting} onClick={pay}>
            {submitting ? 'Processing…' : `Pay ${money(total, currency)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
