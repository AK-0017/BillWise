'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock, User, Building2, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); }
    else router.push('/login?registered=true');
  };

  return (
    <div className="auth-split-container">
      {/* Left panel */}
      <div className="auth-split-left">
        {[200,310,420].map(s => (
          <div key={s} style={{ position: 'absolute', borderRadius: '50%', width: s, height: s, border: '1px solid rgba(255,255,255,0.06)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(37,99,235,0.5)' }}>
              <Zap size={22} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'white' }}>BillWise</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: '1rem' }}>
            Join thousands of<br />SMEs using BillWise
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Set up your free account in under a minute.<br />No credit card required.
          </p>
          <div style={{ marginTop: '3rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
            Dept. of Computer Engineering · Atharva College of Engineering
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-split-right">
        <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Create your account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Start managing your business finances with AI</p>
          </div>

          <div className="card" style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.08)' }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 9, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="label">Your Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input type="text" className="input" placeholder="Atharva" style={{ paddingLeft: '2.1rem' }}
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Business Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input type="text" className="input" placeholder="My Shop" style={{ paddingLeft: '2.1rem' }}
                      value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                  <input type="email" className="input" placeholder="you@business.com" style={{ paddingLeft: '2.1rem' }}
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                  <input type="password" className="input" placeholder="Min. 6 characters" style={{ paddingLeft: '2.1rem' }}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                </div>
              </div>

              <button type="submit" className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }} disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
