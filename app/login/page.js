'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    });
    if (result.error) { setError(result.error); setLoading(false); }
    else router.push('/dashboard');
  };

  return (
    <div className="auth-split-container">
      {/* Left panel — navy brand */}
      <div className="auth-split-left">
        {/* Decorative circles (PPT motif) */}
        {[200,300,400].map(s => (
          <div key={s} style={{
            position: 'absolute', borderRadius: '50%',
            width: s, height: s,
            border: '1px solid rgba(255,255,255,0.06)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(37,99,235,0.5)',
            }}>
              <Zap size={22} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'white' }}>BillWise</span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '1rem' }}>
            AI-Powered Finance<br />Manager for SMEs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Simplify bookkeeping, scan receipts with AI,<br />collect payments and track cash flow — all in one place.
          </p>

          {/* Features */}
          {[
            '✦ AI Receipt Scanning & OCR',
            '✦ Automated Expense Categorization',
            '✦ Invoice & Payment Management',
            '✦ Real-time Cash Flow Dashboard',
          ].map(f => (
            <div key={f} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {f}
            </div>
          ))}

          <div style={{ marginTop: '3rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
            Dept. of Computer Engineering · Atharva College of Engineering
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-split-right">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Welcome back 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sign in to your BillWise account</p>
          </div>

          <div className="card" style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.08)' }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 9, padding: '0.75rem 1rem', marginBottom: '1.25rem',
                  color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  ⚠ {error}
                </div>
              )}

              <div className="form-group">
                <label className="label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                  <input type="email" className="input" placeholder="you@business.com"
                    style={{ paddingLeft: '2.1rem' }}
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                  <input type="password" className="input" placeholder="••••••••"
                    style={{ paddingLeft: '2.1rem' }}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
              </div>

              <button type="submit" className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }}
                disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Create one free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
