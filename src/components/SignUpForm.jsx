import { useState } from 'react';
import { sfx } from '../utils/soundEngine';

export default function SignUpForm({
  formData,
  onFormChange,
  onSubmit,
  isLoading,
  errors,
  onOpenTerms,
  onOpenPrivacy,
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Live Password Strength Calculation
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'None', className: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score++;

    if (score <= 1) return { score: 1, text: 'Rookie (Weak)', className: 'strength-weak' };
    if (score === 2) return { score: 2, text: 'Standard', className: 'strength-fair' };
    if (score === 3) return { score: 3, text: 'Pro Athlete', className: 'strength-good' };
    return { score: 4, text: 'ELITE BEAST ⚡', className: 'strength-elite' };
  };

  const strength = calculateStrength(formData.signupPassword);

  return (
    <form className="auth-form active" onSubmit={onSubmit} noValidate>
      {/* Full Name */}
      <div className={`input-field-group ${errors.signupName ? 'has-error' : ''}`}>
        <label htmlFor="signupName" className="field-label">
          Full Name
        </label>
        <div className="input-wrapper">
          <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            id="signupName"
            name="signupName"
            className="form-input"
            placeholder="Marcus Vance"
            autoComplete="name"
            value={formData.signupName}
            onChange={onFormChange}
            required
          />
        </div>
        <span className="error-hint" id="signupNameError">
          {errors.signupName}
        </span>
      </div>

      {/* Email Address */}
      <div className={`input-field-group ${errors.signupEmail ? 'has-error' : ''}`}>
        <label htmlFor="signupEmail" className="field-label">
          Email Address
        </label>
        <div className="input-wrapper">
          <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            type="email"
            id="signupEmail"
            name="signupEmail"
            className="form-input"
            placeholder="marcus@fitness.pro"
            autoComplete="email"
            value={formData.signupEmail}
            onChange={onFormChange}
            required
          />
        </div>
        <span className="error-hint" id="signupEmailError">
          {errors.signupEmail}
        </span>
      </div>

      {/* Password with Strength Meter */}
      <div className={`input-field-group ${errors.signupPassword ? 'has-error' : ''}`}>
        <label htmlFor="signupPassword" className="field-label">
          Create Strong Password
        </label>
        <div className="input-wrapper">
          <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showPassword ? 'text' : 'password'}
            id="signupPassword"
            name="signupPassword"
            className="form-input"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            value={formData.signupPassword}
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
              <svg className="eye-hide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="eye-show" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Live Password Strength Meter */}
        <div className={`strength-meter-wrap ${strength.className}`}>
          <div className="strength-bars">
            <div className="strength-bar" id="bar1" />
            <div className="strength-bar" id="bar2" />
            <div className="strength-bar" id="bar3" />
            <div className="strength-bar" id="bar4" />
          </div>
          <div className="strength-label-row">
            <span className="strength-status-text">Security level:</span>
            <span className="strength-tier">{strength.text}</span>
          </div>
        </div>
        <span className="error-hint" id="signupPasswordError">
          {errors.signupPassword}
        </span>
      </div>

      {/* Primary Training Goal */}
      <div className="input-field-group">
        <label className="field-label">Primary Training Goal</label>
        <div className="goal-pill-grid">
          <label className="goal-radio">
            <input
              type="radio"
              name="goal"
              value="strength"
              checked={formData.goal === 'strength'}
              onChange={onFormChange}
            />
            <span className="goal-card">
              <span className="goal-emoji">⚡</span>
              <span className="goal-title">Strength & Power</span>
            </span>
          </label>
          <label className="goal-radio">
            <input
              type="radio"
              name="goal"
              value="speed"
              checked={formData.goal === 'speed'}
              onChange={onFormChange}
            />
            <span className="goal-card">
              <span className="goal-emoji">🚀</span>
              <span className="goal-title">Speed & Agility</span>
            </span>
          </label>
          <label className="goal-radio">
            <input
              type="radio"
              name="goal"
              value="endurance"
              checked={formData.goal === 'endurance'}
              onChange={onFormChange}
            />
            <span className="goal-card">
              <span className="goal-emoji">🔥</span>
              <span className="goal-title">Hybrid Athletic</span>
            </span>
          </label>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className={`terms-agreement-row ${errors.terms ? 'has-error' : ''}`}>
        <label className="custom-checkbox-label">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={onFormChange}
            required
          />
          <span className="custom-checkbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="checkbox-text">
            I agree to the{' '}
            <button
              type="button"
              className="inline-link"
              onClick={(e) => {
                e.preventDefault();
                onOpenTerms();
              }}
            >
              Terms of Performance
            </button>{' '}
            &{' '}
            <button
              type="button"
              className="inline-link"
              onClick={(e) => {
                e.preventDefault();
                onOpenPrivacy();
              }}
            >
              Privacy Code
            </button>
          </span>
        </label>
        <span className="error-hint" id="termsError">
          {errors.terms}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-cta-btn"
        id="signUpSubmitBtn"
        disabled={isLoading}
      >
        <span className="btn-glow-layer" />
        {isLoading ? (
          <span className="btn-spinner">
            <span className="spinner-circle" />
          </span>
        ) : (
          <span className="btn-text">
            <span>Claim Athlete Access</span>
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
