import React, { useState } from 'react';
import axios from 'axios';

export default function SubmitExpense() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'USD',
        expense_date: '',
        merchant_name: '',
        category: '',
        description: '',
        is_manager_approver: false
    });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await axios.post('http://localhost:8000/api/expenses/extract', uploadData);
            const data = res.data.data;
            setFormData({
                ...formData,
                amount: data.amount || '',
                currency: data.currency || 'USD',
                expense_date: data.date || '',
                merchant_name: data.merchant_name || '',
                category: data.category || ''
            });
            setMessage({ type: 'success', text: 'OCR Extraction complete! Please verify fields.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'OCR Failed. Please fill manually.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('session_token');
        
        try {
            await axios.post('http://localhost:8000/api/expenses/', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Expense submitted successfully!' });
            setFormData({ amount: '', currency: 'USD', expense_date: '', merchant_name: '', category: '', description: '', is_manager_approver: false });
        } catch (err) {
            setMessage({ type: 'error', text: 'Submission failed. Check login state.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="auth-card" style={{ maxWidth: '600px', textAlign: 'left' }}>
                <h2>Submit New Expense</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>Upload a receipt to auto-fill details using Gemini AI.</p>
                
                <div style={{ marginBottom: '30px' }}>
                    <label className="auth-button" style={{ display: 'inline-block', backgroundColor: '#2ecc71' }}>
                        {loading ? 'Processing...' : 'Upload Receipt Image'}
                        <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    </label>
                </div>

                {message && (
                    <div className={message.type === 'success' ? 'auth-success' : 'auth-error'}
                         style={{ padding: '10px', borderRadius: '4px', marginBottom: '20px', backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee', color: message.type === 'success' ? '#2e7d32' : '#c62828' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input type="number" step="0.01" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} required />
                        <input type="text" name="currency" placeholder="Currency (USD/EUR)" value={formData.currency} onChange={handleChange} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
                        <input type="text" name="merchant_name" placeholder="Merchant" value={formData.merchant_name} onChange={handleChange} required />
                    </div>
                    <input type="text" name="category" placeholder="Category (e.g. Travel, Meals)" value={formData.category} onChange={handleChange} required />
                    <textarea name="description" placeholder="Short description..." value={formData.description} onChange={handleChange} 
                              style={{ padding: '14px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }}></textarea>
                    
                    {/* Manager Approval Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #b3d8ff' }}>
                        <input 
                            type="checkbox" 
                            id="is_manager_approver" 
                            name="is_manager_approver" 
                            checked={formData.is_manager_approver} 
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="is_manager_approver" style={{ cursor: 'pointer', color: '#2c3e50', fontWeight: '500' }}>
                            Require Direct Manager Approval First
                        </label>
                    </div>
                    
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
}
