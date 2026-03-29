import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const STATUS_COLORS = {
    Pending:  { bg: '#fff8e1', color: '#f57f17' },
    Approved: { bg: '#e8f5e9', color: '#2e7d32' },
    Rejected: { bg: '#ffebee', color: '#c62828' },
};

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '14px 22px', borderRadius: 10, fontWeight: 600, backgroundColor: toast.type === 'success' ? '#27ae60' : '#e74c3c', color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>{toast.text}</div>
    );
}

function ExpenseModal({ expense, onClose, onAction }) {
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAction = async (action) => {
        if (action === 'reject' && !comment.trim()) { setError('Comment required for rejection.'); return; }
        setLoading(true);
        try {
            await api.post(`/api/approvals/${expense.id}/action`, { action, comment }, { headers: authH() });
            onAction(expense.id, action);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Action failed.');
        } finally { setLoading(false); }
    };

    const emp = expense.users || {};
    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 50px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>Expense Review</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[['Employee', `${emp.first_name || ''} ${emp.last_name || ''}`.trim()], ['Merchant', expense.merchant_name], ['Amount', `${expense.currency} ${expense.amount}`], ['Converted', `${expense.company_currency || ''} ${expense.converted_amount || ''}`], ['Category', expense.category], ['Date', expense.expense_date], ['Status', expense.status], ['Step', `Step ${expense.approval_step || 1}`]].map(([l, v]) => (
                        <div key={l} style={{ backgroundColor: '#f8f9fa', padding: '10px 12px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.72rem', color: '#999', marginBottom: 2 }}>{l}</div>
                            <div style={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.9rem' }}>{v}</div>
                        </div>
                    ))}
                </div>
                {expense.description && <div style={{ marginBottom: 16, padding: '10px 12px', backgroundColor: '#f8f9fa', borderRadius: 8, fontSize: '0.9rem', color: '#444' }}>{expense.description}</div>}
                <textarea value={comment} onChange={e => { setComment(e.target.value); setError(''); }} placeholder="Add a comment (required for rejection)..."
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', minHeight: 80, boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }} />
                {error && <div style={{ color: '#c62828', marginBottom: 10, fontSize: '0.88rem' }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleAction('approve')} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 8, backgroundColor: '#27ae60', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{loading ? '...' : '✓ Approve'}</button>
                    <button onClick={() => handleAction('reject')} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 8, backgroundColor: '#e74c3c', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{loading ? '...' : '✕ Reject'}</button>
                </div>
            </div>
        </div>
    );
}

const TABS = ['Approvals', 'My Expenses'];

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const [tab, setTab]           = useState('Approvals');
    const [pending, setPending]   = useState([]);
    const [history, setHistory]   = useState([]);
    const [loadingP, setLoadingP] = useState(true);
    const [loadingH, setLoadingH] = useState(false);
    const [selected, setSelected] = useState(null);
    const [toast, setToast]       = useState(null);

    const showToast = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

    const fetchPending = useCallback(async () => {
        setLoadingP(true);
        try {
            const r = await api.get('/api/approvals/pending', { headers: authH() });
            setPending(r.data.data || []);
        } catch (e) { if (e.response?.status === 401) navigate('/login'); }
        finally { setLoadingP(false); }
    }, [navigate]);

    const fetchHistory = useCallback(async () => {
        setLoadingH(true);
        try {
            const r = await api.get('/api/expenses/history', { headers: authH() });
            setHistory(r.data.data || []);
        } catch (_) {}
        finally { setLoadingH(false); }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);
    useEffect(() => { if (tab === 'My Expenses') fetchHistory(); }, [tab, fetchHistory]);

    const handleAction = (id, action) => {
        setPending(p => p.filter(e => e.id !== id));
        showToast(`Expense ${action === 'approve' ? 'approved ✓' : 'rejected'}`);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
            <Toast toast={toast} />
            {selected && <ExpenseModal expense={selected} onClose={() => setSelected(null)} onAction={handleAction} />}

            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.35rem' }}>👔 Manager Dashboard</h2>
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{userData.first_name} {userData.last_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/submit-expense')} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#27ae60', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Submit My Expense</button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid #eee' }}>
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '12px 28px', border: 'none', cursor: 'pointer', fontWeight: 600,
                            backgroundColor: 'transparent', fontSize: '0.95rem',
                            color: tab === t ? '#3498db' : '#999',
                            borderBottom: tab === t ? '3px solid #3498db' : '3px solid transparent',
                        }}>
                            {t === 'Approvals' ? `⏳ Team Approvals ${pending.length > 0 ? `(${pending.length})` : ''}` : '📋 My Expense History'}
                        </button>
                    ))}
                </div>

                {/* APPROVALS TAB */}
                {tab === 'Approvals' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '0 0 14px 14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontWeight: 600, color: '#2c3e50' }}>{pending.length} expense(s) awaiting review</span>
                            <button onClick={fetchPending} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', background: '#fff', color: '#666' }}>↻ Refresh</button>
                        </div>
                        {loadingP ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading...</div> :
                            pending.length === 0 ? (
                                <div style={{ padding: 60, textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                                    <h3 style={{ color: '#2c3e50' }}>All caught up!</h3>
                                    <p style={{ color: '#aaa' }}>No pending expenses.</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ backgroundColor: '#fafafa' }}>
                                        {['Employee', 'Merchant', 'Amount', 'Converted', 'Category', 'Date', 'Step', ''].map(h => (
                                            <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>
                                        {pending.map(exp => {
                                            const emp = exp.users || {};
                                            const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—';
                                            return (
                                                <tr key={exp.id} style={{ borderBottom: '1px solid #f8f9fa' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#2c3e50' }}>{name}</td>
                                                    <td style={{ padding: '13px 16px', color: '#555' }}>{exp.merchant_name}</td>
                                                    <td style={{ padding: '13px 16px', color: '#555' }}>{exp.currency} {exp.amount}</td>
                                                    <td style={{ padding: '13px 16px', color: '#27ae60', fontWeight: 600 }}>{exp.company_currency} {exp.converted_amount}</td>
                                                    <td style={{ padding: '13px 16px' }}><span style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{exp.category}</span></td>
                                                    <td style={{ padding: '13px 16px', color: '#aaa', fontSize: '0.85rem' }}>{exp.expense_date}</td>
                                                    <td style={{ padding: '13px 16px', color: '#999', fontSize: '0.85rem' }}>Step {exp.approval_step || 1}</td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <button onClick={() => setSelected(exp)} style={{ padding: '6px 14px', borderRadius: 8, backgroundColor: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Review</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                )}

                {/* MY EXPENSES TAB */}
                {tab === 'My Expenses' && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '0 0 14px 14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f5f5f5', fontWeight: 600, color: '#2c3e50' }}>
                            My Submitted Expenses ({history.length})
                        </div>
                        {loadingH ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading...</div> :
                            history.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>No expenses submitted yet.</div> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ backgroundColor: '#fafafa' }}>
                                        {['Date', 'Merchant', 'Amount', 'Category', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>
                                        {history.map(exp => {
                                            const ss = STATUS_COLORS[exp.status] || {};
                                            return (
                                                <tr key={exp.id} style={{ borderBottom: '1px solid #f8f9fa' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                                    <td style={{ padding: '13px 18px', color: '#999', fontSize: '0.88rem' }}>{exp.expense_date}</td>
                                                    <td style={{ padding: '13px 18px', fontWeight: 600, color: '#2c3e50' }}>{exp.merchant_name}</td>
                                                    <td style={{ padding: '13px 18px', color: '#555' }}>{exp.currency} {exp.amount}</td>
                                                    <td style={{ padding: '13px 18px' }}><span style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{exp.category}</span></td>
                                                    <td style={{ padding: '13px 18px' }}><span style={{ ...ss, padding: '5px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.8rem' }}>{exp.status}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                )}
            </div>
        </div>
    );
}
