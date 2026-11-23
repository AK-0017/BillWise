'use client';
import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CreditCard, Smartphone, Building, CheckCircle, Loader2, Lock } from 'lucide-react';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function PaymentPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ num: '', name: '', exp: '', cvv: '' });

  useEffect(() => {
    if (params?.id && params.id !== 'undefined') {
      fetch(`/api/invoices/${params.id}`)
        .then(r => r.json())
        .then(d => { setInvoice(d); setLoading(false); });
    }
  }, [params?.id]);

  const handlePay = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 2500));
    await fetch(`/api/pay/${params.id}`, { method: 'POST' });
    setSuccess(true);
    setPaying(false);
    setTimeout(() => router.push(`/invoices/${params.id}`), 2500);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  if (invoice?.status === 'paid') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <CheckCircle size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Already Paid</h2>
        <p style={{ color: 'var(--text-muted)' }}>This invoice has already been paid.</p>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center' }} className="fade-in">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={40} color="var(--success)" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful! 🎉</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {fmt(invoice?.total)} paid for {invoice?.invoiceNumber}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redirecting to invoice...</p>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1.5rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 460 }} className="fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Zap size={20} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>BillWise Pay</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Secure Payment Portal</p>
        </div>

        {/* Invoice Summary */}
        <div style={{
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)', borderRadius: 16, padding: '1.25rem',
          marginBottom: '1.25rem', textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{invoice?.invoiceNumber} · {invoice?.customerName}</p>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(invoice?.total)}</div>
        </div>

        {/* Payment Tabs Card */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'upi', label: 'UPI', icon: Smartphone },
              { key: 'card', label: 'Card', icon: CreditCard },
              { key: 'netbanking', label: 'Banking', icon: Building },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  flex: 1, padding: '0.55rem 0.35rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  background: tab === key ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: tab === key ? 'white' : 'var(--text-muted)',
                  border: tab === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'all 0.15s'
                }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* UPI Tab */}
          {tab === 'upi' && (
            <div>
              <div className="form-group">
                <label className="label">UPI ID</label>
                <input className="input" placeholder="yourname@upi" value={upi} onChange={e => setUpi(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['GPay', 'PhonePe', 'Paytm'].map(app => (
                  <button key={app} type="button"
                    style={{ padding: '0.55rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Tab */}
          {tab === 'card' && (
            <div>
              <div className="form-group">
                <label className="label">Card Number</label>
                <input className="input" placeholder="4242 4242 4242 4242" maxLength={19}
                  value={card.num} onChange={e => setCard({ ...card, num: e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() })} />
              </div>
              <div className="form-group">
                <label className="label">Cardholder Name</label>
                <input className="input" placeholder="Rahul Sharma" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label">Expiry</label>
                  <input className="input" placeholder="MM/YY" maxLength={5} value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">CVV</label>
                  <input className="input" type="password" placeholder="•••" maxLength={4} value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking Tab */}
          {tab === 'netbanking' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Select Your Bank</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank'].map(bank => (
                  <button key={bank} type="button"
                    style={{ padding: '0.55rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pay Button */}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }} onClick={handlePay} disabled={paying}>
            {paying ? <Loader2 size={18} className="spin" /> : <Lock size={18} />}
            {paying ? 'Processing Payment...' : `Pay ${fmt(invoice?.total)}`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Lock size={11} /> Secured by BillWise · SSL Encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
