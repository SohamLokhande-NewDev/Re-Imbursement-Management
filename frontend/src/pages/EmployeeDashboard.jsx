import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <nav style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 2rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>My Dashboard</h2>
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>Reimbursement Management</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/submit-expense')} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#3498db' }}>
                        + Submit Expense
                    </button>
                    <button onClick={handleLogout} className="auth-button"
                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#e74c3c' }}>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, color: '#2c3e50' }}>
                        Hello, {userData.first_name || 'there'}! 👋
                    </h1>
                    <p style={{ color: '#999' }}>Track your expense submissions and their approval status.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pending', value: '0', color: '#f39c12', emoji: '⏳' },
                        { label: 'Approved', value: '0', color: '#27ae60', emoji: '✅' },
                        { label: 'Rejected', value: '0', color: '#e74c3c', emoji: '❌' },
                        { label: 'Total Amount', value: '$0', color: '#3498db', emoji: '💵' },
                    ].map(({ label, value, color, emoji }) => (
                        <div key={label} className="auth-card" style={{ margin: 0, padding: '20px', border: `2px solid ${color}25` }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{emoji}</div>
                            <div style={{ fontSize: '0.8rem', color: '#999' }}>{label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                <div className="auth-card" style={{ margin: 0, padding: '30px', textAlign: 'center', border: '2px dashed #3498db', backgroundColor: '#f7fbff' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧾</div>
                    <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Submit a Reimbursement</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Upload your receipt and our AI will extract the details for you.</p>
                    <Link to="/submit-expense" className="auth-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        + New Expense Claim
                    </Link>
                </div>
            </div>
        </div>
    );
}
