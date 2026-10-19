import { useState } from 'react';
import { sfx } from '../utils/soundEngine';

export default function ForgotPasswordModal({ isOpen, onClose, onSubmitEmail, initialEmail }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your athlete email.');
      sfx.playError();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email format.');
      sfx.playError();
      return;
    }
    setError('');
    onSubmitEmail(email.trim());
  };

  return (
    <div
      className="modal-backdrop"
      id="forgotModal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-backdrop')) {
          onClose();
        }
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="modal-title">Reset Athlete Code</h3>
          <p className="modal-subtitle">
            Enter your email and we'll dispatch an instant secure authentication key.
          </p>
          <button
            type="button"
            className="modal-close-btn"
            id="closeForgotModal"
            aria-label="Close modal"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className={`input-field-group ${error ? 'has-error' : ''}`}>
            <label htmlFor="forgotEmail" className="field-label">
              Registered Athlete Email
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                id="forgotEmail"
                className="form-input"
                placeholder="athlete@levelup.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
                autoFocus
              />
            </div>
            {error && <span className="error-hint">{error}</span>}
          </div>

          <button type="submit" className="submit-cta-btn" id="sendResetBtn">
            <span className="btn-text">
              <span>Send Reset Key</span>
              <svg className="cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
