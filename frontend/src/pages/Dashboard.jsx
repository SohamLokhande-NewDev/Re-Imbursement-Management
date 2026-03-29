import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LogOut, Home } from 'lucide-react';
import '../index.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/users/me');
                setUser(res.data.user);
            } catch (err) {
                // Token invalid or expired
                localStorage.removeItem('token');
                navigate('/auth');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    if (!user) return <div style={{ padding: '2rem' }}>Loading session...</div>;

    return (
        <div className="dashboard-container" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                        <Home size={24} />
                    </div>
                    <div>
                        <h1 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}>Corporate Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Expense & Reimbursement Portal</p>
                    </div>
                </div>
                <button onClick={handleSignOut} className="btn-primary" style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
            
            <div className="auth-card" style={{ maxWidth: '100%' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Welcome back, {user.email}!
                </h3>
                <p style={{ color: 'var(--text-muted)' }}>
                    Your page routing and security check is established. You are successfully logged in and viewing the private Dashboard!
                </p>
                <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>[ Step 3 Component Area (e.g. Submitting Expenses / Approvals Map) will go here ]</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
