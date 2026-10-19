import { useState } from 'react';
import { sfx } from '../utils/soundEngine';

export default function SignInForm({
  formData,
  onFormChange,
  onSubmit,
  onForgotPassword,
  isLoading,
  errors,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="auth-form active" onSubmit={onSubmit} noValidate>
      {/* Email / Username Input */}
      <div className={`input-field-group ${errors.signinEmail ? 'has-error' : ''}`}>
        <label htmlFor="signinEmail" className="field-label">
          Email or Athlete ID
        </label>
        <div className="input-wrapper">
          <svg
            className="input-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            type="email"
            id="signinEmail"
            name="signinEmail"
            className="form-input"
            placeholder="athlete@levelup.com"
            autoComplete="username"
            value={formData.signinEmail}
            onChange={onFormChange}
            required
          />
        </div>
        <span className="error-hint" id="signinEmailError">
          {errors.signinEmail}
        </span>
      </div>

      {/* Password Input */}
      <div className={`input-field-group ${errors.signinPassword ? 'has-error' : ''}`}>
        <div className="label-row">
          <label htmlFor="signinPassword" className="field-label">
            Password
          </label>
          <button
            type="button"
            className="forgot-link"
            id="forgotPasswordBtn"
            onClick={() => {
              sfx.playClick();
              onForgotPassword();
            }}
          >
            Forgot code?
          </button>
        </div>
        <div className="input-wrapper">
          <svg
            className="input-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showPassword ? 'text' : 'password'}
            id="signinPassword"
            name="signinPassword"
            className="form-input"
            placeholder="••••••••••••"
            autoComplete="current-password"
            value={formData.signinPassword}
            onChange={onFormChange}
            required
          />
          <button
            type="button"
            className="toggle-password-btn"
            aria-label="Toggle password visibility"
            onClick={() => {
              sfx.playClick();
              setShowPassword(!showPassword);
            }}
          >
            {showPassword ? (
              <svg
                className="eye-hide"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                className="eye-show"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <span className="error-hint" id="signinPasswordError">
          {errors.signinPassword}
        </span>
      </div>

      {/* Options Row: Remember Me & Security Badge */}
      <div className="form-options-row">
        <label className="custom-checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={onFormChange}
          />
          <span className="custom-checkbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="checkbox-text">Keep me logged in</span>
        </label>
        <span className="security-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          SSL Secured
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-cta-btn"
        id="signInSubmitBtn"
        disabled={isLoading}
      >
        <span className="btn-glow-layer" />
        {isLoading ? (
          <span className="btn-spinner">
            <span className="spinner-circle" />
          </span>
        ) : (
          <span className="btn-text">
            <span>Sign In to LevelUp</span>
            <svg className="cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}
