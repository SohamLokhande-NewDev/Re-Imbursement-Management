import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const COUNTRIES = [
  { value: 'India', label: '🇮🇳 India' },
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'UAE', label: '🇦🇪 UAE' },
  { value: 'Brazil', label: '🇧🇷 Brazil' },
  { value: 'South Africa', label: '🇿🇦 South Africa' },
  { value: 'Netherlands', label: '🇳🇱 Netherlands' },
  { value: 'Sweden', label: '🇸🇪 Sweden' },
  { value: 'Switzerland', label: '🇨🇭 Switzerland' },
];

export default function Register() {
  const [formData, setFormData] = useState({ 
    first_name: '', last_name: '', email: '', password: '', 
    company_name: '', country: 'India'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('http://localhost:8000/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p style={{ color: '#999', marginBottom: '20px', textAlign: 'center' }}>
          New company? You'll be set as Admin. Joining an existing one? You'll be an Employee.
        </p>
        {error && <div className="auth-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input type="text" name="first_name" placeholder="First Name" onChange={handleChange} required />
            <input type="text" name="last_name" placeholder="Last Name" onChange={handleChange} required />
          </div>
          <input type="email" name="email" placeholder="Work Email Address" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password (min. 6 characters)" onChange={handleChange} required minLength={6} />

          {/* Company & Country */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '4px' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Company Details
            </label>
            <input 
              type="text" name="company_name" placeholder="Company Name" 
              onChange={handleChange} required 
            />
            <select 
              name="country" value={formData.country} onChange={handleChange}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', backgroundColor: '#fff', cursor: 'pointer', color: '#2c3e50' }}
            >
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}
