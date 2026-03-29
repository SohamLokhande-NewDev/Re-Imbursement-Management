import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* ─── Stitch "Structure Ledger" tokens ─── */
const T = {
  bg:       '#f8f9fb',
  surface:  '#ffffff',
  surfLow:  '#f3f4f6',
  surfHigh: '#e7e8ea',
  primary:  '#003d9b',
  primaryC: '#0052cc',
  onPrim:   '#ffffff',
  textMain: '#191c1e',
  textSub:  '#434654',
  outline:  '#c3c6d6',
  error:    '#ba1a1a',
  errCont:  '#ffdad6',
  onErr:    '#93000a',
  ambShadow:'0 12px 32px rgba(0,24,72,0.06)',
};

const STATUS_CHIP = {
  Pending:  { bg: '#ffdbcf', color: '#812800' },
  Approved: { bg: '#b6c8fe', color: '#344573' },
  Rejected: { bg: T.errCont, color: T.onErr    },
};

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const Chip = ({ label, map }) => {
  const s = map[label] || { bg: T.surfHigh, color: T.textSub };
  return <span style={{ background: s.bg, color: s.color, padding: '5px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', display: 'inline-block' }}>{label}</span>;
};

const PrimaryBtn = ({ onClick, children, style = {} }) => (
  <button onClick={onClick} style={{ background: `linear-gradient(135deg,${T.primary},${T.primaryC})`, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', ...style }}>
    {children}
  </button>
);

const GhostBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: 'transparent', color: T.textSub, border: `1px solid ${T.outline}`, borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
    {children}
  </button>
);

const Toast = ({ toast }) => toast ? (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, fontWeight: 600, background: toast.type === 'success' ? T.primary : T.error, color: '#fff', boxShadow: T.ambShadow }}>
    {toast.text}
  </div>
) : null;

const ThField = ({ children }) => (
  <th style={{ padding: '11px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', background: T.surfLow }}>
    {children}
  </th>
);

const Td = ({ children, style = {} }) => (
  <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: T.textMain, verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

/* ExpenseModal for Review */
function ExpenseModal({ expense, onClose, onAction }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (action) => {
    if (action === 'reject' && !comment.trim()) { setError('Comment required for rejection.'); return; }
    setLoading(true);
    try {
      await api.post(`/api/approvals/${expense.id}/action`, { action, comment }, { headers: authH() });
      onAction(expense.id, action); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Failed.'); }
    finally { setLoading(false); }
  };

  const emp = expense.users || {};
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,61,155,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: '32px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,24,72,0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: T.textMain }}>Review Expense</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: T.textSub }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['Employee', `${emp.first_name || ''} ${emp.last_name || ''}`.trim()], ['Merchant', expense.merchant_name], ['Amount', `${expense.currency} ${expense.amount}`], ['Converted', `${expense.company_currency||''} ${expense.converted_amount||''}`], ['Category', expense.category], ['Date', expense.expense_date], ['Status', expense.status], ['Step', `Step ${expense.approval_step || 1}`]].map(([l, v]) => (
            <div key={l} style={{ background: T.surfLow, padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.7rem', color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{l}</div>
              <div style={{ fontWeight: 600, color: T.textMain }}>{v}</div>
            </div>
          ))}
        </div>
        {expense.description && <div style={{ background: T.surfLow, padding: '10px 14px', borderRadius: 8, marginBottom: 16, color: T.textSub, fontSize: '0.875rem' }}>{expense.description}</div>}
        <textarea value={comment} onChange={e => { setComment(e.target.value); setError(''); }} placeholder="Add a comment (required to reject)..."
          style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.outline}`, minHeight: 80, boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', marginBottom: 12, fontSize: '0.875rem' }} />
        {error && <div style={{ color: T.onErr, marginBottom: 10, fontSize: '0.85rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handleAction('approve')} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg,#1b6e2e,#2e7d32)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{loading ? '…' : '✓ Approve'}</button>
          <button onClick={() => handleAction('reject')} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 8, background: T.error, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{loading ? '…' : '✕ Reject'}</button>
        </div>
      </div>
    </div>
  );
}

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.outline}`, padding: '0 24px' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '14px 28px', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter,sans-serif',
        background: 'transparent', fontSize: '0.92rem',
        color: active === t ? T.primaryC : T.textSub,
        borderBottom: active === t ? `3px solid ${T.primaryC}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [tab, setTab]         = useState('⏳ Team Approvals');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingP, setLP]     = useState(true);
  const [loadingH, setLH]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]     = useState(null);

  const boom = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

  const fetchPending = useCallback(async () => {
    setLP(true);
    try { const r = await api.get('/api/approvals/pending', { headers: authH() }); setPending(r.data.data || []); }
    catch (e) { if (e.response?.status === 401) navigate('/login'); }
    finally { setLP(false); }
  }, [navigate]);

  const fetchHistory = useCallback(async () => {
    setLH(true);
    try { const r = await api.get('/api/expenses/history', { headers: authH() }); setHistory(r.data.data || []); }
    catch (_) {} finally { setLH(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => { if (tab === '📋 My Expense History') fetchHistory(); }, [tab, fetchHistory]);

  const handleAction = (id, action) => {
    setPending(p => p.filter(e => e.id !== id));
    boom(`Expense ${action === 'approve' ? 'approved ✓' : 'rejected'}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.textMain }}>
      <Toast toast={toast} />
      {selected && <ExpenseModal expense={selected} onClose={() => setSelected(null)} onAction={handleAction} />}

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 3rem', height: 64, background: T.surface, boxShadow: '0 1px 0 rgba(195,198,214,0.4)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: T.primary }}>👔 Manager Dashboard</span>
          <span style={{ marginLeft: 8, fontSize: '0.78rem', color: T.textSub }}>{userData.first_name} {userData.last_name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn onClick={() => navigate('/submit-expense')} style={{ background: 'linear-gradient(135deg,#1b6e2e,#2e7d32)' }}>
            + Submit My Own Expense
          </PrimaryBtn>
          <GhostBtn onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</GhostBtn>
        </div>
      </nav>

      <div style={{ padding: '2.5rem 3rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: T.surface, borderRadius: 12, boxShadow: T.ambShadow, overflow: 'hidden' }}>
          <TabBar
            tabs={[`⏳ Team Approvals${pending.length > 0 ? ` (${pending.length})` : ''}`, '📋 My Expense History']}
            active={tab.startsWith('⏳') ? tab : '📋 My Expense History'}
            onChange={t => setTab(t.startsWith('⏳') ? '⏳ Team Approvals' : '📋 My Expense History')}
          />

          {/* ─ Team Approvals ─ */}
          {tab === '⏳ Team Approvals' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <span style={{ fontWeight: 700 }}>{pending.length} expense(s) awaiting review</span>
                <GhostBtn onClick={fetchPending}>↻ Refresh</GhostBtn>
              </div>
              {loadingP ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>Loading…</div>
              ) : pending.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                  <h3 style={{ color: T.textMain }}>All caught up!</h3>
                  <p style={{ color: T.textSub }}>No pending expenses.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Employee', 'Merchant', 'Amount', 'Converted', 'Category', 'Date', 'Step', ''].map(h => <ThField key={h}>{h}</ThField>)}</tr></thead>
                  <tbody>
                    {pending.map(exp => {
                      const emp = exp.users || {};
                      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—';
                      return (
                        <tr key={exp.id} style={{ background: T.surface }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfLow}
                          onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                          <Td style={{ fontWeight: 600 }}>{name}</Td>
                          <Td>{exp.merchant_name}</Td>
                          <Td>{exp.currency} {exp.amount}</Td>
                          <Td style={{ color: '#2e7d32', fontWeight: 600 }}>{exp.company_currency} {exp.converted_amount}</Td>
                          <Td><Chip label={exp.category} map={{}} /></Td>
                          <Td style={{ color: T.textSub, fontSize: '0.82rem' }}>{exp.expense_date}</Td>
                          <Td style={{ color: T.textSub, fontSize: '0.82rem' }}>Step {exp.approval_step || 1}</Td>
                          <Td>
                            <PrimaryBtn onClick={() => setSelected(exp)} style={{ padding: '7px 16px', fontSize: '0.82rem' }}>Review</PrimaryBtn>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ─ My Expense History ─ */}
          {tab === '📋 My Expense History' && (
            <>
              <div style={{ padding: '16px 24px', fontWeight: 700 }}>My Submitted Expenses ({history.length})</div>
              {loadingH ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>Loading…</div>
              ) : history.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧾</div>
                  <p style={{ color: T.textSub }}>No expenses submitted yet.</p>
                  <PrimaryBtn onClick={() => navigate('/submit-expense')}>+ New Expense</PrimaryBtn>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Date', 'Merchant', 'Amount', 'Category', 'Status'].map(h => <ThField key={h}>{h}</ThField>)}</tr></thead>
                  <tbody>
                    {history.map(exp => (
                      <tr key={exp.id} style={{ background: T.surface }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfLow}
                        onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                        <Td style={{ color: T.textSub, fontSize: '0.82rem' }}>{exp.expense_date}</Td>
                        <Td style={{ fontWeight: 600 }}>{exp.merchant_name}</Td>
                        <Td>{exp.currency} {exp.amount}</Td>
                        <Td><Chip label={exp.category} map={{}} /></Td>
                        <Td><Chip label={exp.status} map={STATUS_CHIP} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
