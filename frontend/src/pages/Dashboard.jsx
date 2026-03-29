import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('session_token');
        navigate('/login');
    };

    return (
        <div className="dashboard-wrapper">
            {/* Navbar */}
            <nav className="dashboard-nav" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem 2rem', 
                backgroundColor: '#fff', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>Reimbursement Management</h2>
                <button onClick={handleLogout} className="auth-button" style={{ 
                    width: 'auto', 
                    padding: '8px 20px', 
                    backgroundColor: '#e74c3c' 
                }}>
                    Logout
                </button>
            </nav>

            <div className="dashboard-container" style={{ padding: '0 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ color: '#2c3e50' }}>Welcome back!</h1>
                    <p style={{ color: '#666' }}>Manage your claims and track your reimbursement status.</p>
                </div>

                {/* Dashboard Stats / Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px',
                    marginBottom: '3rem'
                }}>
                    {/* Primary CTA Card */}
                    <div className="auth-card" style={{ 
                        margin: 0, 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        border: '2px dashed #3498db',
                        backgroundColor: '#f7fbff'
                    }}>
                        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Need a Refund?</h3>
                        <p style={{ color: '#666', marginBottom: '25px' }}>Upload your receipt and get reimbursed in minutes.</p>
                        <Link to="/submit-expense" className="auth-button" style={{ 
                            textDecoration: 'none', 
                            display: 'inline-block',
                            backgroundColor: '#3498db'
                        }}>
                            + Submit New Expense
                        </Link>
                    </div>

                    {/* Placeholder Stat Cards */}
                    <div className="auth-card" style={{ margin: 0, padding: '20px', border: '1px solid #eee' }}>
                        <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>Pending Claims</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>0</div>
                    </div>

                    <div className="auth-card" style={{ margin: 0, padding: '20px', border: '1px solid #eee' }}>
                        <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>Total Reimbursed</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>$0.00</div>
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    border: '1px solid #eee'
                }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Recent Activity</h3>
                    <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No recent claims found. Start by submitting your first receipt!</p>
                </div>
            </div>
        </div>
    );
}
