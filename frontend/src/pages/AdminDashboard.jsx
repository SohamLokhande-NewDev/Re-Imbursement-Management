import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const api = axios.create({ baseURL: 'http://localhost:8000' });

function getAuthHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('session_token')}` };
}

const ROLE_COLORS = {
    Admin:    { bg: '#fce8ff', color: '#7b2d8b' },
    Manager:  { bg: '#e8f0fe', color: '#1a5cb5' },
    Employee: { bg: '#e8f5e9', color: '#2e7d32' },
};

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            padding: '14px 22px', borderRadius: '10px', fontWeight: 600,
            backgroundColor: toast.type === 'success' ? '#27ae60' : '#e74c3c',
            color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            animation: 'fadeIn 0.2s ease',
        }}>
            {toast.text}
        </div>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const [users, setUsers]       = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [updatingId, setUpdatingId]     = useState(null);
    const [toast, setToast]       = useState(null);
    const [stats, setStats]       = useState({ pending: 0, approved: 0 });

    const showToast = (text, type = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/api/users/', { headers: getAuthHeaders() });
            setUsers(res.data.data || []);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoadingUsers(false);
        }
    }, [navigate]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/api/approvals/pending', { headers: getAuthHeaders() });
            const pending = (res.data.data || []).length;
            setStats(s => ({ ...s, pending }));
        } catch (_) {}
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [fetchUsers, fetchStats]);

    const handleRoleChange = async (targetUserId, newRole) => {
        setUpdatingId(targetUserId);
        try {
            await api.patch(`/api/users/${targetUserId}/role`, { new_role: newRole }, { headers: getAuthHeaders() });
            setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
            showToast(`Role updated to ${newRole} ✓`);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Update failed', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const employees = users.filter(u => u.role === 'Employee').length;
    const managers  = users.filter(u => u.role === 'Manager').length;
    const admins    = users.filter(u => u.role === 'Admin').length;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
            <Toast toast={toast} />

            {/* Navbar */}
            <nav style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>⚙️ Admin Workspace</h2>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        Logged in as {userData.first_name} {userData.last_name}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/manager-dashboard')} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#9b59b6' }}>
                        Approvals {stats.pending > 0 && <span style={{ backgroundColor: '#e74c3c', borderRadius: '50%', padding: '2px 7px', marginLeft: '6px', fontSize: '0.75rem' }}>{stats.pending}</span>}
                    </button>
                    <button onClick={() => navigate('/submit-expense')} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#3498db' }}>
                        + Expense
                    </button>
                    <button onClick={handleLogout} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#e74c3c' }}>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

                {/* Welcome */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, color: '#2c3e50' }}>Welcome, {userData.first_name}! 👋</h1>
                    <p style={{ color: '#999', margin: '4px 0 0' }}>Manage your organization's users and view pending approvals.</p>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Total Members', value: users.length, color: '#3498db', emoji: '👥' },
                        { label: 'Admins', value: admins, color: '#7b2d8b', emoji: '🛡️' },
                        { label: 'Managers', value: managers, color: '#1a5cb5', emoji: '👔' },
                        { label: 'Employees', value: employees, color: '#2e7d32', emoji: '🧑‍💼' },
                        { label: 'Pending Approvals', value: stats.pending, color: '#f39c12', emoji: '⏳' },
                    ].map(({ label, value, color, emoji }) => (
                        <div key={label} style={{
                            backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}`,
                        }}>
                            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{emoji}</div>
                            <div style={{ fontSize: '0.78rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* User Management Table */}
                <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>Team Members</h3>
                        <button onClick={fetchUsers} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: '#666' }}>
                            ↻ Refresh
                        </button>
                    </div>

                    {loadingUsers ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>Loading team...</div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>No users found.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fafafa' }}>
                                    {['Member', 'Email', 'Joined', 'Role'].map(h => (
                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const roleStyle = ROLE_COLORS[u.role] || {};
                                    const isMe = u.id === userData.id;
                                    const isUpdating = updatingId === u.id;

                                    return (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f8f9fa', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '38px', height: '38px', borderRadius: '50%',
                                                        backgroundColor: roleStyle.bg || '#f0f2f5',
                                                        color: roleStyle.color || '#666',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: '1rem',
                                                    }}>
                                                        {(u.first_name?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                                                            {u.first_name} {u.last_name}
                                                            {isMe && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#aaa' }}>(You)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#666', fontSize: '0.9rem' }}>{u.email}</td>
                                            <td style={{ padding: '14px 20px', color: '#aaa', fontSize: '0.85rem' }}>
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                {isMe ? (
                                                    <span style={{ ...roleStyle, padding: '5px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.82rem' }}>
                                                        {u.role}
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={u.role}
                                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                                        disabled={isUpdating}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                                                            border: `1px solid ${roleStyle.color || '#ddd'}`,
                                                            backgroundColor: roleStyle.bg || '#f8f9fa',
                                                            color: roleStyle.color || '#333',
                                                            fontSize: '0.85rem', outline: 'none',
                                                            opacity: isUpdating ? 0.6 : 1,
                                                        }}
                                                    >
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

                {/* Quick Links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '2rem' }}>
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center', border: '2px dashed #9b59b6' }}>
                        <h4 style={{ color: '#2c3e50', marginTop: 0 }}>Approval Queue</h4>
                        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '16px' }}>Review and action pending expense claims.</p>
                        <Link to="/manager-dashboard" className="auth-button" style={{ textDecoration: 'none', display: 'inline-block', backgroundColor: '#9b59b6' }}>
                            Open Approvals
                        </Link>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center', border: '2px dashed #27ae60' }}>
                        <h4 style={{ color: '#2c3e50', marginTop: 0 }}>Submit an Expense</h4>
                        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '16px' }}>Upload your receipt and use AI-powered OCR.</p>
                        <Link to="/submit-expense" className="auth-button" style={{ textDecoration: 'none', display: 'inline-block', backgroundColor: '#27ae60' }}>
                            + New Expense
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
