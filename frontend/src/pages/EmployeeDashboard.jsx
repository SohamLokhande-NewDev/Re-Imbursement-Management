import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/* ─── Stitch "Atlas Corporate" design tokens ─── */
const T = {
  bg:       '#faf9ff',
  surface:  '#ffffff',
  surfLow:  '#f1f3ff',
  primary:  '#003d9b',
  primaryC: '#0052cc',
  onPrim:   '#ffffff',
  textMain: '#051a3e',
  textSub:  '#434654',
  outline:  '#c3c6d6',
  error:    '#ba1a1a',
  errCont:  '#ffdad6',
  onErr:    '#93000a',
  ambShadow:'0 32px 48px -4px rgba(5,26,62,0.04)',
};

const STATUS_CHIP = {
  Pending:  { bg: '#FFF4E5', color: '#663C00' },
  Approved: { bg: '#8df7c1', color: '#002113' },
  Rejected: { bg: T.errCont, color: T.onErr   },
};

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const Chip = ({ label, map }) => {
  const s = map[label] || { bg: '#e9edff', color: T.primary };
  return <span style={{ background: s.bg, color: s.color, padding: '5px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>{label}</span>;
};

const PrimaryBtn = ({ onClick, children, style = {} }) => (
  <button onClick={onClick} style={{ background: `linear-gradient(135deg,${T.primary},${T.primaryC})`, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'box-shadow 0.2s', ...style }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,61,155,0.25)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
    {children}
  </button>
);

const GhostBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: 'transparent', color: T.textSub, border: `1px solid ${T.outline}`, borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
    {children}
  </button>
);

const ThField = ({ children }) => (
  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', background: T.surfLow }}>
    {children}
  </th>
);

const Td = ({ children, style = {} }) => (
  <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: T.textMain, verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

const KpiCard = ({ emoji, label, value, borderColor }) => (
  <div style={{ background: T.surface, borderRadius: 12, padding: '22px 24px', boxShadow: T.ambShadow, borderLeft: `4px solid ${borderColor}` }}>
    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontSize: '0.68rem', color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: borderColor, letterSpacing: '-0.02em' }}>{value}</div>
  </div>
);

export default function EmployeeDashboard() {
  const navigate  = useNavigate();
  const userData  = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/api/expenses/history', { headers: authH() }); setExpenses(r.data.data || []); }
    catch (e) { if (e.response?.status === 401) navigate('/login'); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const stats = {
    pending:  expenses.filter(e => e.status === 'Pending').length,
    approved: expenses.filter(e => e.status === 'Approved').length,
    rejected: expenses.filter(e => e.status === 'Rejected').length,
    total:    expenses.length,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.textMain }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 3rem', height: 64, background: T.surface, boxShadow: '0 1px 0 rgba(195,198,214,0.3)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: T.primary }}>🧑‍💼 My Dashboard</span>
          <span style={{ marginLeft: 8, fontSize: '0.78rem', color: T.textSub }}>{userData.first_name} {userData.last_name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn onClick={() => navigate('/submit-expense')}>+ Submit Expense</PrimaryBtn>
          <GhostBtn onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</GhostBtn>
        </div>
      </nav>

      <div style={{ padding: '2.5rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: T.textMain, letterSpacing: '-0.02em' }}>
            Hello, {userData.first_name || 'there'}! 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: T.textSub, fontSize: '0.95rem' }}>
            Here's a summary of your reimbursement claims.
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16, marginBottom: '2.5rem' }}>
          <KpiCard emoji="⏳" label="Pending"        value={stats.pending}  borderColor="#f57f17" />
          <KpiCard emoji="✅" label="Approved"       value={stats.approved} borderColor="#2e7d32" />
          <KpiCard emoji="❌" label="Rejected"       value={stats.rejected} borderColor={T.error} />
          <KpiCard emoji="📋" label="Total Submitted" value={stats.total}   borderColor={T.primaryC} />
        </div>

        {/* Expense History Table */}
        <div style={{ background: T.surface, borderRadius: 16, boxShadow: T.ambShadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: T.surface }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: T.textMain }}>My Expense History ({expenses.length})</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <GhostBtn onClick={fetchHistory}>↻ Refresh</GhostBtn>
              <Link to="/submit-expense" style={{ background: `linear-gradient(135deg,${T.primary},${T.primaryC})`, color: '#fff', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
                + New Claim
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>Loading your expenses…</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🧾</div>
              <h3 style={{ color: T.textMain, marginBottom: 8 }}>No expenses yet</h3>
              <p style={{ color: T.textSub, marginBottom: 24 }}>Submit your first reimbursement claim.</p>
              <PrimaryBtn onClick={() => navigate('/submit-expense')}>+ Submit Your First Claim</PrimaryBtn>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Merchant', 'Amount', 'Category', 'Description', 'Status'].map(h => (
                    <ThField key={h}>{h}</ThField>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} style={{ background: T.surface }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfLow}
                    onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                    <Td style={{ color: T.textSub, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{exp.expense_date}</Td>
                    <Td style={{ fontWeight: 600 }}>{exp.merchant_name}</Td>
                    <Td style={{ fontWeight: 600 }}>{exp.currency} {exp.amount}</Td>
                    <Td><Chip label={exp.category} map={{}} /></Td>
                    <Td style={{ color: T.textSub, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>
                      {exp.description || '—'}
                    </Td>
                    <Td><Chip label={exp.status} map={STATUS_CHIP} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
