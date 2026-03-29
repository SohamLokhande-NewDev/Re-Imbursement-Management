import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: 'http://localhost:8000' });

function getAuthHeaders() {
    const token = localStorage.getItem('session_token');
    return { Authorization: `Bearer ${token}` };
}

function ExpenseModal({ expense, onClose, onAction }) {
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAction = async (action) => {
        if (action === 'reject' && !comment.trim()) {
            setError('A comment is required when rejecting.');
            return;
        }
        setLoading(true);
        try {
            await api.post(`/api/approvals/${expense.id}/action`, { action, comment }, { headers: getAuthHeaders() });
            onAction(expense.id, action);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Action failed.');
        } finally {
            setLoading(false);
        }
    };

    const employee = expense.users || {};
    const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email || 'Unknown';

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="auth-card" style={{ maxWidth: '550px', width: '90%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>Expense Details</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                        ['Employee', employeeName],
                        ['Merchant', expense.merchant_name],
                        ['Amount', `${expense.currency} ${expense.amount}`],
                        ['Converted', `${expense.company_currency} ${expense.converted_amount}`],
                        ['Category', expense.category],
                        ['Date', expense.expense_date],
                        ['Status', expense.status],
                        ['Step', `Approval Step ${expense.approval_step || 1}`],
                    ].map(([label, value]) => (
                        <div key={label} style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>{value}</div>
                        </div>
                    ))}
                </div>

                {expense.description && (
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>Description</div>
                        <div style={{ color: '#444' }}>{expense.description}</div>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2c3e50' }}>
                        Comment {<span style={{ color: '#999', fontWeight: 400 }}>(required for rejection)</span>}
                    </label>
                    <textarea
                        value={comment}
                        onChange={e => { setComment(e.target.value); setError(''); }}
                        placeholder="Add a comment..."
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                </div>

                {error && <div style={{ color: '#c62828', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleAction('approve')} disabled={loading} className="auth-button"
                        style={{ flex: 1, backgroundColor: '#27ae60' }}>
                        {loading ? '...' : '✓ Approve'}
                    </button>
                    <button onClick={() => handleAction('reject')} disabled={loading} className="auth-button"
                        style={{ flex: 1, backgroundColor: '#e74c3c' }}>
                        {loading ? '...' : '✕ Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ManagerDashboard() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/approvals/pending', { headers: getAuthHeaders() });
            setExpenses(res.data.data || []);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (expenseId, action) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        setToast({ type: action === 'approve' ? 'success' : 'error', text: `Expense ${action === 'approve' ? 'approved' : 'rejected'} successfully!` });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('session_token');
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>Manager Dashboard</h2>
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>Reimbursement Management</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/dashboard')} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#3498db' }}>
                        My Dashboard
                    </button>
                    <button onClick={handleLogout} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#e74c3c' }}>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#2c3e50' }}>Pending Approvals</h1>
                        <p style={{ margin: '4px 0 0', color: '#999' }}>{expenses.length} expense(s) awaiting your review</p>
                    </div>
                    <button onClick={fetchPending} className="auth-button" style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#7f8c8d' }}>
                        ↻ Refresh
                    </button>
                </div>

                {/* Toast */}
                {toast && (
                    <div style={{
                        padding: '12px 20px', borderRadius: '8px', marginBottom: '20px',
                        backgroundColor: toast.type === 'success' ? '#e8f5e9' : '#ffebee',
                        color: toast.type === 'success' ? '#2e7d32' : '#c62828',
                        border: `1px solid ${toast.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                    }}>
                        {toast.text}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Loading...</div>
                ) : expenses.length === 0 ? (
                    <div className="auth-card" style={{ textAlign: 'center', padding: '60px', margin: 0 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                        <h3 style={{ color: '#2c3e50' }}>All caught up!</h3>
                        <p style={{ color: '#999' }}>No pending expenses waiting for approval.</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    {['Employee', 'Merchant', 'Amount', 'Converted', 'Category', 'Date', 'Step', ''].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', borderBottom: '1px solid #eee' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => {
                                    const emp = exp.users || {};
                                    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || '—';
                                    return (
                                        <tr key={exp.id} style={{ borderBottom: '1px solid #f0f2f5', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#2c3e50' }}>{name}</td>
                                            <td style={{ padding: '14px 16px', color: '#555' }}>{exp.merchant_name}</td>
                                            <td style={{ padding: '14px 16px', color: '#555' }}>{exp.currency} {exp.amount}</td>
                                            <td style={{ padding: '14px 16px', color: '#27ae60', fontWeight: 600 }}>{exp.company_currency} {exp.converted_amount}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#999', fontSize: '0.9rem' }}>{exp.expense_date}</td>
                                            <td style={{ padding: '14px 16px', color: '#999', fontSize: '0.9rem' }}>Step {exp.approval_step || 1}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <button onClick={() => setSelected(exp)} className="auth-button"
                                                    style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem', backgroundColor: '#3498db' }}>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && (
                <ExpenseModal expense={selected} onClose={() => setSelected(null)} onAction={handleAction} />
            )}
        </div>
    );
}
