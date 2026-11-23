'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  LayoutDashboard, ScanLine, FileText, CreditCard,
  ArrowLeftRight, LogOut, Zap, ChevronRight, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/receipts',     label: 'Receipt Scanner', icon: ScanLine },
  { href: '/expenses',     label: 'Expenses',        icon: FileText },
  { href: '/invoices',     label: 'Invoices',        icon: CreditCard },
  { href: '/transactions', label: 'Transactions',    icon: ArrowLeftRight },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const businessName = session?.user?.businessName || session?.user?.name || 'My Business';
  const userName = session?.user?.name || 'User';
  const initial = businessName[0].toUpperCase();

  return (
    <>
      {/* ── Mobile Top Header Bar ── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#ffffff' }}>BillWise</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            padding: '0.4rem', color: '#ffffff', cursor: 'pointer', display: 'flex',
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Overlay Backdrop ── */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>

        {/* ── Brand & Logo Header ── */}
        <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.6)', flexShrink: 0,
            }}>
              <Zap size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  BillWise
                </span>
                <span style={{
                  background: '#2563eb', color: '#ffffff', fontSize: '0.55rem', fontWeight: 800,
                  padding: '0.1rem 0.35rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>AI</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                Finance Manager for SMEs
              </div>
            </div>
          </div>

          {/* User & Business Profile Card (High Contrast) */}
          {session?.user && (
            <div style={{
              background: '#162e63',
              border: '1.5px solid #2563eb',
              borderRadius: 12, padding: '0.65rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: '1.5px solid #60a5fa',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: '0.9rem', fontWeight: 900, color: '#ffffff',
                boxShadow: '0 2px 8px rgba(37,99,235,0.5)',
              }}>
                {initial}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {businessName}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{userName}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }} />
                  <span style={{ color: '#60a5fa', fontWeight: 700 }}>Owner</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav Links ── */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', minHeight: 0 }}>
          <div className="section-label" style={{ marginBottom: '0.5rem', color: '#64748b' }}>MAIN MENU</div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} className={`nav-link${isActive ? ' active' : ''}`}
                style={{
                  background: isActive ? '#1c3d82' : 'transparent',
                  borderColor: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  marginBottom: '0.25rem',
                }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: isActive ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#ffffff' : '#94a3b8'} />
                </div>
                <span style={{ flex: 1, fontSize: '0.85rem' }}>{label}</span>
                {isActive && <ChevronRight size={12} color="#60a5fa" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer & Sign Out ── */}
        <div style={{ padding: '0.75rem 0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{
            fontSize: '0.62rem', color: '#64748b',
            textAlign: 'center', lineHeight: 1.5, marginBottom: '0.75rem',
            padding: '0 0.25rem',
          }}>
            Dept. of Computer Engineering<br />
            Atharva College of Engineering
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%', border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer',
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.55rem 0.75rem', borderRadius: 8, color: '#f87171',
              fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
