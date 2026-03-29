import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/* ─── Stitch "Ventura Ledger" design tokens ─── */
const T = {
  bg:       '#f7f9fc',
  surface:  '#ffffff',
  surfLow:  '#f2f4f7',
  surfHigh: '#e6e8eb',
  primary:  '#003d9b',
  primaryC: '#0052cc',
  onPrim:   '#ffffff',
  textMain: '#191c1e',
  textSub:  '#434654',
  outline:  '#c3c6d6',
  error:    '#ba1a1a',
  errCont:  '#ffdad6',
  onErr:    '#93000a',
  tertiary: '#5120a9',
  tertiaryC:'#693ec2',
  tertiaryF:'#eaddff',
  shadow:   '0 12px 32px -4px rgba(25,28,30,0.06)',
};

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const ROLE_CHIP = {
  Admin:    { bg: T.tertiaryF, color: T.tertiary },
  Manager:  { bg: '#dae2ff',   color: T.primary   },
  Employee: { bg: '#e8f5e9',   color: '#2e7d32'   },
};
const STATUS_CHIP = {
  Pending:  { bg: '#fff8e1', color: '#f57f17' },
  Approved: { bg: '#e8f5e9', color: '#2e7d32' },
  Rejected: { bg: T.errCont, color: T.onErr    },
};

/* ─── Shared atoms ─── */
const Chip = ({ label, map }) => {
  const s = map[label] || { bg: T.surfHigh, color: T.textSub };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
};

const PrimaryBtn = ({ onClick, children, style = {} }) => (
  <button onClick={onClick} style={{ background: `linear-gradient(135deg,${T.primary},${T.primaryC})`, color: T.onPrim, border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'box-shadow 0.2s', ...style }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
    {children}
  </button>
);

const GhostBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: 'transparent', color: T.textSub, border: `1px solid ${T.outline}`, borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
    {children}
  </button>
);

const Toast = ({ toast }) => toast ? (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, fontWeight: 600, background: toast.type === 'success' ? T.primary : T.error, color: '#fff', boxShadow: T.shadow }}>
    {toast.text}
  </div>
) : null;

const ThField = ({ children }) => (
  <th style={{ padding: '11px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', background: T.surfLow }}>
    {children}
  </th>
);

const TdRow = ({ children, style = {} }) => (
  <tr style={{ ...style }}
    onMouseEnter={e => e.currentTarget.style.background = T.surfLow}
    onMouseLeave={e => e.currentTarget.style.background = T.surface}>
    {children}
  </tr>
);

const Td = ({ children, style = {} }) => (
  <td style={{ padding: '13px 20px', fontSize: '0.875rem', color: T.textMain, verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

/* ─── Create User Modal ─── */
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'Employee' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/api/users/', form, { headers: authH() });
      onCreated(); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create user'); }
    finally { setLoading(false); }
  };

  const inp = (pl, k, type = 'text', extra = {}) => (
    <input type={type} placeholder={pl} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required
      style={{ padding: '12px 14px', borderRadius: 8, border: `1px solid ${T.outline}`, background: T.surfLow, fontSize: '0.875rem', color: T.textMain, outline: 'none', width: '100%', boxSizing: 'border-box' }} {...extra} />
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,61,155,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: '32px', width: 460, boxShadow: '0 24px 64px rgba(0,24,72,0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: T.textMain, fontSize: '1.25rem', fontWeight: 700 }}>Create New User</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: T.textSub }}>✕</button>
        </div>
        {error && <div style={{ background: T.errCont, color: T.onErr, padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem', fontWeight: 600 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {inp('First Name', 'first_name')}
            {inp('Last Name', 'last_name')}
          </div>
          {inp('Email Address', 'email', 'email')}
          {inp('Password', 'password', 'password', { minLength: 6 })}
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: 8, border: `1px solid ${T.outline}`, background: T.surfLow, color: T.textMain, fontSize: '0.875rem' }}>
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
          <PrimaryBtn style={{ marginTop: 8, padding: '12px' }}>
            {loading ? 'Creating...' : 'Create User'}
          </PrimaryBtn>
        </form>
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
const KpiCard = ({ emoji, label, value, borderColor }) => (
  <div style={{ background: T.surface, borderRadius: 12, padding: '20px 22px', boxShadow: T.shadow, borderLeft: `4px solid ${borderColor}` }}>
    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontSize: '0.68rem', color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: borderColor, letterSpacing: '-0.02em' }}>{value}</div>
  </div>
);

/* ─── Tab bar ─── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.outline}` }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '12px 28px', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif',
        background: 'transparent', fontSize: '0.92rem',
        color: active === t ? T.primaryC : T.textSub,
        borderBottom: active === t ? `3px solid ${T.primaryC}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [tab, setTab]               = useState('👥 User Management');
  const [users, setUsers]           = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [filterStatus, setFilter]   = useState('All');
  const [loadingU, setLoadingU]     = useState(true);
  const [loadingE, setLoadingE]     = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingCnt, setPending]    = useState(0);

  const boom = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = useCallback(async () => {
    setLoadingU(true);
    try { const r = await api.get('/api/users/', { headers: authH() }); setUsers(r.data.data || []); }
    catch (e) { if (e.response?.status === 401) navigate('/login'); }
    finally { setLoadingU(false); }
  }, [navigate]);

  const fetchExpenses = useCallback(async () => {
    setLoadingE(true);
    try { const r = await api.get('/api/expenses/history', { headers: authH() }); setExpenses(r.data.data || []); }
    catch (_) {} finally { setLoadingE(false); }
  }, []);

  const fetchPending = useCallback(async () => {
    try { const r = await api.get('/api/approvals/pending', { headers: authH() }); setPending((r.data.data || []).length); }
    catch (_) {}
  }, []);

  useEffect(() => { fetchUsers(); fetchPending(); }, [fetchUsers, fetchPending]);
  useEffect(() => { if (tab === '📊 Global Ledger') fetchExpenses(); }, [tab, fetchExpenses]);

  const handleRoleChange = async (uid, newRole) => {
    setUpdatingId(uid);
    try {
      await api.patch(`/api/users/${uid}/role`, { new_role: newRole }, { headers: authH() });
      setUsers(p => p.map(u => u.id === uid ? { ...u, role: newRole } : u));
      boom(`Role updated → ${newRole} ✓`);
    } catch (e) { boom(e.response?.data?.detail || 'Update failed', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleManagerChange = async (uid, mgr_id) => {
    if (!mgr_id) return;
    try {
      await api.patch(`/api/users/${uid}/assign-manager`, { manager_id: mgr_id }, { headers: authH() });
      setUsers(p => p.map(u => u.id === uid ? { ...u, manager_id: mgr_id } : u));
      boom('Manager assigned ✓');
    } catch (e) { boom(e.response?.data?.detail || 'Failed', 'error'); }
  };

  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');
  const filtered = filterStatus === 'All' ? expenses : expenses.filter(e => e.status === filterStatus);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.textMain }}>
      <Toast toast={toast} />
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 3rem', height: 64, background: T.surface, boxShadow: '0 1px 0 rgba(195,198,214,0.4)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: T.primary }}>⚙️ Admin Workspace</span>
          <span style={{ marginLeft: 8, fontSize: '0.78rem', color: T.textSub }}>{userData.first_name} {userData.last_name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/manager-dashboard')} style={{ background: T.surfLow, border: `1px solid ${T.outline}`, color: T.textMain, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            Approvals {pendingCnt > 0 && <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '1px 7px', marginLeft: 5, fontSize: '0.72rem' }}>{pendingCnt}</span>}
          </button>
          <PrimaryBtn onClick={() => navigate('/submit-expense')}>+ Expense</PrimaryBtn>
          <GhostBtn onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</GhostBtn>
        </div>
      </nav>

      <div style={{ padding: '2.5rem 3rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: '2.5rem' }}>
          <KpiCard emoji="👥" label="Total Members" value={users.length}                                   borderColor={T.primaryC} />
          <KpiCard emoji="🛡️" label="Admins"         value={users.filter(u=>u.role==='Admin').length}    borderColor={T.tertiary} />
          <KpiCard emoji="👔" label="Managers"       value={users.filter(u=>u.role==='Manager').length}  borderColor={T.primary}  />
          <KpiCard emoji="🧑‍💼" label="Employees"     value={users.filter(u=>u.role==='Employee').length} borderColor="#2e7d32"     />
          <KpiCard emoji="⏳" label="Pending"        value={pendingCnt}                                   borderColor="#f57f17"     />
        </div>

        {/* Tabs */}
        <div style={{ background: T.surface, borderRadius: '12px 12px 0 0', boxShadow: T.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '0 24px' }}>
            <TabBar tabs={['👥 User Management', '📊 Global Ledger']} active={tab} onChange={setTab} />
          </div>

          {/* ── User Management Tab ── */}
          {tab === '👥 User Management' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <span style={{ fontWeight: 700, color: T.textMain }}>Team Members ({users.length})</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <GhostBtn onClick={fetchUsers}>↻ Refresh</GhostBtn>
                  <PrimaryBtn onClick={() => setShowCreate(true)}>+ Create User</PrimaryBtn>
                </div>
              </div>
              {loadingU ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>Loading…</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Member', 'Email', 'Reports To', 'Joined', 'Role'].map(h => <ThField key={h}>{h}</ThField>)}</tr></thead>
                  <tbody>
                    {users.map(u => {
                      const rc = ROLE_CHIP[u.role] || {};
                      const isMe = u.id === userData.id;
                      return (
                        <TdRow key={u.id}>
                          <Td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                {(u.first_name?.[0] || '?').toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name} {isMe && <span style={{ color: T.textSub, fontWeight: 400, fontSize: '0.8rem' }}>(you)</span>}</span>
                            </div>
                          </Td>
                          <Td style={{ color: T.textSub }}>{u.email}</Td>
                          <Td>
                            {isMe ? <span style={{ color: T.textSub }}>—</span> : (
                              <select value={u.manager_id || ''} onChange={e => handleManagerChange(u.id, e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.outline}`, background: T.surfLow, fontSize: '0.83rem', color: T.textMain, cursor: 'pointer' }}>
                                <option value="">— Unassigned —</option>
                                {managers.filter(m => m.id !== u.id).map(m => (
                                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                ))}
                              </select>
                            )}
                          </Td>
                          <Td style={{ color: T.textSub, fontSize: '0.8rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</Td>
                          <Td>
                            {isMe ? (
                              <Chip label={u.role} map={ROLE_CHIP} />
                            ) : (
                              <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={updatingId === u.id}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${rc.color || T.outline}`, background: rc.bg, color: rc.color, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: updatingId === u.id ? 0.6 : 1 }}>
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                              </select>
                            )}
                          </Td>
                        </TdRow>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── Global Ledger Tab ── */}
          {tab === '📊 Global Ledger' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <span style={{ fontWeight: 700, color: T.textMain }}>All Company Expenses ({filtered.length})</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                      background: filterStatus === s ? T.primary : T.surfLow,
                      color: filterStatus === s ? '#fff' : T.textSub,
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              {loadingE ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>No expenses found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Date', 'Employee', 'Merchant', 'Amount', 'Category', 'Status'].map(h => <ThField key={h}>{h}</ThField>)}</tr></thead>
                  <tbody>
                    {filtered.map(exp => {
                      const emp = exp.users || {};
                      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—';
                      return (
                        <TdRow key={exp.id}>
                          <Td style={{ color: T.textSub, fontSize: '0.82rem' }}>{exp.expense_date}</Td>
                          <Td style={{ fontWeight: 600 }}>{name}</Td>
                          <Td>{exp.merchant_name}</Td>
                          <Td style={{ fontWeight: 600 }}>{exp.currency} {exp.amount}</Td>
                          <Td><Chip label={exp.category} map={{}} /></Td>
                          <Td><Chip label={exp.status} map={STATUS_CHIP} /></Td>
                        </TdRow>
                      );
                    })}
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
