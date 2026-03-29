import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const ROLE_COLORS = {
    Admin:    { bg: '#fce8ff', color: '#7b2d8b' },
    Manager:  { bg: '#e8f0fe', color: '#1a5cb5' },
    Employee: { bg: '#e8f5e9', color: '#2e7d32' },
};

const STATUS_COLORS = {
    Pending:  { bg: '#fff8e1', color: '#f57f17' },
    Approved: { bg: '#e8f5e9', color: '#2e7d32' },
    Rejected: { bg: '#ffebee', color: '#c62828' },
};

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '14px 22px', borderRadius: 10, fontWeight: 600,
            backgroundColor: toast.type === 'success' ? '#27ae60' : '#e74c3c',
            color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>{toast.text}</div>
    );
}

function CreateUserModal({ onClose, onCreated, managers }) {
    const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'Employee' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/api/users/', form, { headers: authH() });
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '30px', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>Create New User</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999' }}>✕</button>
                </div>
                {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.9rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input placeholder="First Name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required style={{ padding: '12px', borderRadius: 8, border: '1px solid #ddd' }} />
                        <input placeholder="Last Name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required style={{ padding: '12px', borderRadius: 8, border: '1px solid #ddd' }} />
                    </div>
                    <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ padding: '12px', borderRadius: 8, border: '1px solid #ddd' }} />
                    <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} style={{ padding: '12px', borderRadius: 8, border: '1px solid #ddd' }} />
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ padding: '12px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 8, backgroundColor: '#3498db', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const TABS = ['Team', 'Expenses'];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const [tab, setTab]           = useState('Team');
    const [users, setUsers]       = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [loadingU, setLoadingU] = useState(true);
    const [loadingE, setLoadingE] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [toast, setToast]       = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const showToast = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

    const fetchUsers = useCallback(async () => {
        setLoadingU(true);
        try {
            const r = await api.get('/api/users/', { headers: authH() });
            setUsers(r.data.data || []);
        } catch (e) { if (e.response?.status === 401) navigate('/login'); }
        finally { setLoadingU(false); }
    }, [navigate]);

    const fetchExpenses = useCallback(async () => {
        setLoadingE(true);
        try {
            const r = await api.get('/api/expenses/history', { headers: authH() });
            setExpenses(r.data.data || []);
        } catch (_) {}
        finally { setLoadingE(false); }
    }, []);

    const fetchPendingCount = useCallback(async () => {
        try {
            const r = await api.get('/api/approvals/pending', { headers: authH() });
            setPendingCount((r.data.data || []).length);
        } catch (_) {}
    }, []);

    useEffect(() => { fetchUsers(); fetchPendingCount(); }, [fetchUsers, fetchPendingCount]);
    useEffect(() => { if (tab === 'Expenses') fetchExpenses(); }, [tab, fetchExpenses]);

    const handleRoleChange = async (uid, newRole) => {
        setUpdatingId(uid);
        try {
            await api.patch(`/api/users/${uid}/role`, { new_role: newRole }, { headers: authH() });
            setUsers(p => p.map(u => u.id === uid ? { ...u, role: newRole } : u));
            showToast(`Role → ${newRole} ✓`);
        } catch (e) { showToast(e.response?.data?.detail || 'Update failed', 'error'); }
        finally { setUpdatingId(null); }
    };

    const handleManagerChange = async (uid, managerId) => {
        if (!managerId) return;
        try {
            await api.patch(`/api/users/${uid}/assign-manager`, { manager_id: managerId }, { headers: authH() });
            setUsers(p => p.map(u => u.id === uid ? { ...u, manager_id: managerId } : u));
            showToast('Manager assigned ✓');
        } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); }
    };

    const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');
    const filteredExpenses = filterStatus === 'All' ? expenses : expenses.filter(e => e.status === filterStatus);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
            <Toast toast={toast} />
            {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} managers={managers} />}

            {/* Navbar */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.35rem' }}>⚙️ Admin Workspace</h2>
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{userData.first_name} {userData.last_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/manager-dashboard')} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#9b59b6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Approvals {pendingCount > 0 && <span style={{ background: '#e74c3c', borderRadius: 20, padding: '1px 6px', marginLeft: 6, fontSize: '0.75rem' }}>{pendingCount}</span>}
                    </button>
                    <button onClick={() => navigate('/submit-expense')} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#27ae60', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Expense</button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '1150px', margin: '0 auto' }}>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Members', value: users.length, color: '#3498db', emoji: '👥' },
                        { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, color: '#7b2d8b', emoji: '🛡️' },
                        { label: 'Managers', value: users.filter(u => u.role === 'Manager').length, color: '#1a5cb5', emoji: '👔' },
                        { label: 'Employees', value: users.filter(u => u.role === 'Employee').length, color: '#2e7d32', emoji: '🧑‍💼' },
                        { label: 'Pending', value: pendingCount, color: '#f39c12', emoji: '⏳' },
                    ].map(({ label, value, color, emoji }) => (
                        <div key={label} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}` }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{emoji}</div>
                            <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid #eee' }}>
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '12px 28px', border: 'none', cursor: 'pointer', fontWeight: 600,
                            backgroundColor: 'transparent', fontSize: '0.95rem',
                            color: tab === t ? '#3498db' : '#999',
                            borderBottom: tab === t ? '3px solid #3498db' : '3px solid transparent',
                        }}>{t === 'Team' ? '👥 Team' : '📊 Global Ledger'}</button>
                    ))}
                </div>

                {/* --- TEAM TAB --- */}
                {tab === 'Team' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '0 0 14px 14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontWeight: 600, color: '#2c3e50' }}>Team Members ({users.length})</span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={fetchUsers} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', color: '#666', background: '#fff' }}>↻ Refresh</button>
                                <button onClick={() => setShowCreate(true)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', backgroundColor: '#3498db', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Create User</button>
                            </div>
                        </div>
                        {loadingU ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading...</div> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa' }}>
                                        {['Member', 'Email', 'Reports To', 'Joined', 'Role'].map(h => (
                                            <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => {
                                        const rs = ROLE_COLORS[u.role] || {};
                                        const isMe = u.id === userData.id;
                                        return (
                                            <tr key={u.id} style={{ borderBottom: '1px solid #f8f9fa' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                                <td style={{ padding: '13px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                            {(u.first_name?.[0] || '?').toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: '#2c3e50' }}>{u.first_name} {u.last_name} {isMe && <span style={{ fontSize: '0.75rem', color: '#aaa' }}>(You)</span>}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '13px 18px', color: '#666', fontSize: '0.88rem' }}>{u.email}</td>
                                                <td style={{ padding: '13px 18px' }}>
                                                    {isMe ? <span style={{ color: '#aaa', fontSize: '0.85rem' }}>—</span> : (
                                                        <select
                                                            value={u.manager_id || ''}
                                                            onChange={e => handleManagerChange(u.id, e.target.value)}
                                                            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {managers.filter(m => m.id !== u.id).map(m => (
                                                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td style={{ padding: '13px 18px', color: '#aaa', fontSize: '0.83rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                                                <td style={{ padding: '13px 18px' }}>
                                                    {isMe ? (
                                                        <span style={{ ...rs, padding: '5px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.8rem' }}>{u.role}</span>
                                                    ) : (
                                                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={updatingId === u.id}
                                                            style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${rs.color || '#ddd'}`, backgroundColor: rs.bg, color: rs.color, fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem', opacity: updatingId === u.id ? 0.6 : 1 }}>
                                                            <option value="Employee">Employee</option>
                                                            <option value="Manager">Manager</option>
                                                            <option value="Admin">Admin</option>
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* --- GLOBAL LEDGER TAB --- */}
                {tab === 'Expenses' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '0 0 14px 14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontWeight: 600, color: '#2c3e50' }}>All Company Expenses ({filteredExpenses.length})</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                                    <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', backgroundColor: filterStatus === s ? '#2c3e50' : '#f0f2f5', color: filterStatus === s ? '#fff' : '#666' }}>{s}</button>
                                ))}
                            </div>
                        </div>
                        {loadingE ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading...</div> : filteredExpenses.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>No expenses found.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa' }}>
                                        {['Employee', 'Merchant', 'Amount', 'Category', 'Date', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(exp => {
                                        const emp = exp.users || {};
                                        const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || '—';
                                        const ss = STATUS_COLORS[exp.status] || {};
                                        return (
                                            <tr key={exp.id} style={{ borderBottom: '1px solid #f8f9fa' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                                <td style={{ padding: '13px 18px', fontWeight: 600, color: '#2c3e50' }}>{name}</td>
                                                <td style={{ padding: '13px 18px', color: '#555' }}>{exp.merchant_name}</td>
                                                <td style={{ padding: '13px 18px', color: '#555' }}>{exp.currency} {exp.amount}</td>
                                                <td style={{ padding: '13px 18px' }}><span style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{exp.category}</span></td>
                                                <td style={{ padding: '13px 18px', color: '#999', fontSize: '0.85rem' }}>{exp.expense_date}</td>
                                                <td style={{ padding: '13px 18px' }}><span style={{ ...ss, padding: '5px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.8rem' }}>{exp.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
