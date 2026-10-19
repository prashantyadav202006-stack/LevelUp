import { useRef, useState } from 'react';
import SocialAuthGroup from './SocialAuthGroup';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { sfx } from '../utils/soundEngine';

export default function AuthCard({
  authMode,
  setAuthMode,
  signInData,
  signUpData,
  onSignInChange,
  onSignUpChange,
  onSignInSubmit,
  onSignUpSubmit,
  onSocialLogin,
  onForgotPassword,
  onOpenTerms,
  onOpenPrivacy,
  isSignInLoading,
  isSignUpLoading,
  signInErrors,
  signUpErrors,
}) {
  const cardWrapperRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({
    '--rotate-x': '0deg',
    '--rotate-y': '0deg',
    '--mouse-x': '50%',
    '--mouse-y': '50%',
  });

  const handleMouseMove = (e) => {
    if (!cardWrapperRef.current) return;
    const rect = cardWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTiltStyle({
      '--rotate-x': `${rotateX.toFixed(2)}deg`,
      '--rotate-y': `${rotateY.toFixed(2)}deg`,
      '--mouse-x': `${glareX.toFixed(1)}%`,
      '--mouse-y': `${glareY.toFixed(1)}%`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      '--rotate-x': '0deg',
      '--rotate-y': '0deg',
      '--mouse-x': '50%',
      '--mouse-y': '50%',
    });
  };

  const handleModeChange = (mode) => {
    sfx.playSwitch();
    setAuthMode(mode);
  };

  return (
    <div
      className="auth-card-wrapper"
      id="authCardWrapper"
      ref={cardWrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
    >
      {/* 3D Cursor Glare Overlay */}
      <div className="card-glare" id="cardGlare" />

      {/* Main Glassmorphic Card */}
      <section className="auth-card" id="authCard" aria-labelledby="authHeading" style={tiltStyle}>
        {/* Neon Top Border Accent */}
        <div className="card-neon-border-top" />

        {/* Card Header */}
        <div className="card-header">
          <div className="header-badge">
            <span className="pulse-dot" />
            <span>ATHLETE PORTAL</span>
          </div>
          <h1 className="auth-title" id="authHeading">
            {authMode === 'signin' ? 'Elevate Your Performance' : 'Unlock Championship Access'}
          </h1>
          <p className="auth-subtitle" id="authSubtitle">
            {authMode === 'signin'
              ? 'Enter your credentials to access your workout metrics & training plans.'
              : 'Join the elite athletic roster and start tracking your real power.'}
          </p>
        </div>

        {/* Tab Pill Mode Switcher */}
        <div
          className={`tab-pill-container ${authMode === 'signup' ? 'signup-active' : ''}`}
          role="tablist"
          aria-label="Sign in or Sign up"
        >
          <div className="tab-indicator" id="tabIndicator" />
          <button
            type="button"
            className={`tab-btn ${authMode === 'signin' ? 'active' : ''}`}
            id="tabSignIn"
            role="tab"
            aria-selected={authMode === 'signin'}
            onClick={() => handleModeChange('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${authMode === 'signup' ? 'active' : ''}`}
            id="tabSignUp"
            role="tab"
            aria-selected={authMode === 'signup'}
            onClick={() => handleModeChange('signup')}
          >
            Join LevelUp
          </button>
        </div>

        {/* Social Quick Logins */}
        <SocialAuthGroup onSocialLogin={onSocialLogin} />

        {/* Or Divider */}
        <div className="divider-row">
          <span className="divider-line" />
          <span className="divider-text">OR CONTINUE WITH EMAIL</span>
          <span className="divider-line" />
        </div>

        {/* Active Form Mode */}
        {authMode === 'signin' ? (
          <SignInForm
            formData={signInData}
            onFormChange={onSignInChange}
            onSubmit={onSignInSubmit}
            onForgotPassword={onForgotPassword}
            isLoading={isSignInLoading}
            errors={signInErrors}
          />
        ) : (
          <SignUpForm
            formData={signUpData}
            onFormChange={onSignUpChange}
            onSubmit={onSignUpSubmit}
            isLoading={isSignUpLoading}
            errors={signUpErrors}
            onOpenTerms={onOpenTerms}
            onOpenPrivacy={onOpenPrivacy}
          />
        )}

        {/* Card Footer Info */}
        <footer className="card-footer">
          <div className="footer-stats-pill">
            <span className="live-dot" />
            <span className="stat-text">
              <strong>2,480+</strong> athletes training now
            </span>
          </div>
          <div className="brand-subtext">LevelUp Athlete OS • Built for Champions</div>
        </footer>
      </section>
    </div>
  );
}
