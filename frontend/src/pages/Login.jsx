import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('user@Demo.com');
  const [password,setPassword] = useState('User@123');
  const [loading, setLoading] = useState(false);
  const [err, setErr] =useState(null);
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email.trim(),password);
      nav('/');
    } catch (e) {
      console.error('login failed', e && e.response && e.response.data);
      const msg = e?.response?.data?.error || 'Login failed — check credentials';
      setErr(msg);
    } finally { setLoading(false); }
  }

  return (
    <div className="container">
      <div className="login-box">
        <h1 className="login-title">Finance Tracker</h1>

        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label>Email :</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@Demo.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password :</label>
            <input
              type="password"
              value= {password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <div className="login-actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <span className="demo-note">Demo: admin/user/readonly</span>
          </div>

          {err && <div className="error">{err}</div>}
        </form>

        <div className="demo-info">
          <p>Demo credentials:</p>
          <ul>
            <li>Admin: admin@Demo.com / Admin@123</li>
            <li>User: user@Demo.com / User@123</li>
            <li>Read-only: readonly@Demo.com / ReadOnly@123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
