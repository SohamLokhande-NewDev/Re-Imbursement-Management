import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, User, MapPin, Building2, ArrowRight } from 'lucide-react';

const Auth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [countries, setCountries] = useState([]);

    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', country: '', company_name: ''
    });

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flag');
                const data = await response.json();
                const sortedCountries = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
                setCountries(sortedCountries);
                if (sortedCountries.length > 0) {
                    setFormData(prev => ({ ...prev, country: sortedCountries[0].name.common }));
                }
            } catch (err) {
                console.error("Failed to load countries", err);
            }
        };
        fetchCountries();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                // Custom Login
                const res = await api.post('/api/auth/login', {
                    email: formData.email,
                    password: formData.password,
                });
                localStorage.setItem('token', res.data.token);
                setMessage(`Welcome back!`);
                setTimeout(() => navigate('/dashboard'), 800);
            } else {
                // Custom Registration bypassing Supabase GoTrue limits
                const res = await api.post('/api/auth/register', {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    country: formData.country,
                    company_name: formData.company_name
                });
                localStorage.setItem('token', res.data.token);
                setMessage("Registration successful! Your setup is complete.");
                setTimeout(() => navigate('/dashboard'), 1000);
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p>{isLogin ? 'Sign in to manage your reimbursements securely.' : 'Join your company workspace today.'}</p>
                </div>

                <form className="auth-form" onSubmit={handleAuth}>
                    {error && <div className="auth-alert error">{error}</div>}
                    {message && <div className="auth-alert success">{message}</div>}

                    {!isLogin && (
                        <>
                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input type="text" name="full_name" placeholder="Full Name" required={!isLogin} onChange={handleChange} value={formData.full_name} />
                            </div>
                            <div className="input-group">
                                <Building2 className="input-icon" size={18} />
                                <input type="text" name="company_name" placeholder="Company Name" required={!isLogin} onChange={handleChange} value={formData.company_name} />
                            </div>
                            <div className="input-group">
                                <MapPin className="input-icon" size={18} />
                                <select 
                                    name="country" 
                                    required={!isLogin} 
                                    onChange={handleChange} 
                                    value={formData.country}
                                    className="country-select"
                                >
                                    <option value="" disabled>Select your country</option>
                                    {countries.map((c, idx) => (
                                        <option key={idx} value={c.name.common}>
                                            {c.flag} {c.name.common}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    
                    <div className="input-group">
                        <Mail className="input-icon" size={18} />
                        <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} value={formData.email} />
                    </div>
                    <div className="input-group">
                        <Lock className="input-icon" size={18} />
                        <input type="password" name="password" placeholder="Password" required onChange={handleChange} value={formData.password} />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                    
                    <p className="auth-switch">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Sign up' : 'Sign in'}</span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Auth;
