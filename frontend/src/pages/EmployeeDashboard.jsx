import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const api = axios.create({ baseURL: 'http://localhost:8000' });
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('session_token')}` });

const STATUS_COLORS = {
    Pending:  { bg: '#fff8e1', color: '#f57f17' },
    Approved: { bg: '#e8f5e9', color: '#2e7d32' },
    Rejected: { bg: '#ffebee', color: '#c62828' },
};

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading]   = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/api/expenses/history', { headers: authH() });
            setExpenses(r.data.data || []);
        } catch (e) { if (e.response?.status === 401) navigate('/login'); }
        finally { setLoading(false); }
    }, [navigate]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const stats = {
        pending:  expenses.filter(e => e.status === 'Pending').length,
        approved: expenses.filter(e => e.status === 'Approved').length,
        rejected: expenses.filter(e => e.status === 'Rejected').length,
        total:    expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2),
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.35rem' }}>🧑‍💼 My Dashboard</h2>
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{userData.first_name} {userData.last_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/submit-expense')} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Submit Expense</button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '950px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ margin: 0, color: '#2c3e50' }}>Hello, {userData.first_name}! 👋</h1>
                    <p style={{ color: '#aaa', margin: '4px 0 0' }}>Here's a summary of your reimbursement claims.</p>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: '2rem' }}>
                    {[
                        { label: 'Pending', value: stats.pending, color: '#f57f17', bg: '#fff8e1', emoji: '⏳' },
                        { label: 'Approved', value: stats.approved, color: '#2e7d32', bg: '#e8f5e9', emoji: '✅' },
                        { label: 'Rejected', value: stats.rejected, color: '#c62828', bg: '#ffebee', emoji: '❌' },
                        { label: 'Total Submitted', value: `${stats.total}`, color: '#3498db', bg: '#e8f0fe', emoji: '💵' },
                    ].map(({ label, value, color, bg, emoji }) => (
                        <div key={label} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}` }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{emoji}</div>
                            <div style={{ fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Expense History Table */}
                <div style={{ backgroundColor: '#fff', borderRadius: 14, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontWeight: 600, color: '#2c3e50' }}>My Expense History ({expenses.length})</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={fetchHistory} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', background: '#fff', color: '#666' }}>↻ Refresh</button>
                            <Link to="/submit-expense" style={{ padding: '7px 16px', borderRadius: 8, backgroundColor: '#3498db', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                                + New Claim
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading your expenses...</div>
                    ) : expenses.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧾</div>
                            <h3 style={{ color: '#2c3e50' }}>No expenses yet</h3>
                            <p style={{ color: '#aaa', marginBottom: 20 }}>Submit your first reimbursement claim.</p>
                            <Link to="/submit-expense" style={{ padding: '10px 24px', borderRadius: 8, backgroundColor: '#3498db', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>+ New Expense Claim</Link>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fafafa' }}>
                                    {['Date', 'Merchant', 'Amount', 'Category', 'Description', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => {
                                    const ss = STATUS_COLORS[exp.status] || {};
                                    return (
                                        <tr key={exp.id} style={{ borderBottom: '1px solid #f8f9fa' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                            <td style={{ padding: '13px 18px', color: '#999', fontSize: '0.88rem' }}>{exp.expense_date}</td>
                                            <td style={{ padding: '13px 18px', fontWeight: 600, color: '#2c3e50' }}>{exp.merchant_name}</td>
                                            <td style={{ padding: '13px 18px', color: '#555' }}>{exp.currency} {exp.amount}</td>
                                            <td style={{ padding: '13px 18px' }}>
                                                <span style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{exp.category}</span>
                                            </td>
                                            <td style={{ padding: '13px 18px', color: '#777', fontSize: '0.86rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description || '—'}</td>
                                            <td style={{ padding: '13px 18px' }}>
                                                <span style={{ ...ss, padding: '5px 12px', borderRadius: 20, fontWeight: 600, fontSize: '0.8rem' }}>{exp.status}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
