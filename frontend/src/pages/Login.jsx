import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', formData);
      localStorage.setItem('session_token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reimbursement Login</h2>
        {error && <div className="auth-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p className="auth-link">New user? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}
