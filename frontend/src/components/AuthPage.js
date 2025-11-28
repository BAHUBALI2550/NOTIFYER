// frontend/src/components/AuthPage.js
import React, { useState } from 'react';

function AuthPage({ loading, onSignup, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signup') {
      onSignup({ email, name });
    } else {
      onLogin({ email });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {mode === 'signup' && (
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'signup'
              ? 'Create account'
              : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
