import { useState } from 'react';
import Navbar from './components/Navbar';
import BackgroundScene from './components/BackgroundScene';
import SpeedCanvas from './components/SpeedCanvas';
import AuthCard from './components/AuthCard';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import WelcomeModal from './components/WelcomeModal';
import ToastContainer from './components/ToastContainer';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getFriendlyAuthError } from './services/authService';
import { sfx } from './utils/soundEngine';

function AppContent() {
  const { currentUser, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [authMode, setAuthMode] = useState('signin');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    signinEmail: '',
    signinPassword: '',
    rememberMe: true,
  });
  const [signInErrors, setSignInErrors] = useState({});
  const [isSignInLoading, setIsSignInLoading] = useState(false);

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    signupName: '',
    signupEmail: '',
    signupPassword: '',
    goal: 'strength',
    termsAccepted: false,
  });
  const [signUpErrors, setSignUpErrors] = useState({});
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);

  // Modal & Toast States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [authenticatedAthlete, setAuthenticatedAthlete] = useState('');
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const nextState = sfx.toggle();
    setIsAudioEnabled(nextState);
    if (nextState) {
      sfx.playClick();
      showToast('Audio SFX: Enabled ⚡', 'info');
    } else {
      showToast('Audio SFX: Muted', 'info');
    }
  };

  // Demo Fill Handler
  const handleDemoFill = () => {
    setAuthMode('signin');
    setSignInData({
      signinEmail: 'athlete@levelup.com',
      signinPassword: 'ElitePower2026!',
      rememberMe: true,
    });
    setSignInErrors({});
    showToast('Demo Athlete credentials applied! ⚡', 'success');
  };

  // Controlled Input Handlers
  const handleSignInChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignInData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (signInErrors[name]) {
      setSignInErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignUpData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (signUpErrors[name]) {
      setSignUpErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Sign In Submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!signInData.signinEmail.trim()) {
      errors.signinEmail = 'Please enter your registered athlete email.';
    } else if (!isValidEmail(signInData.signinEmail.trim())) {
      errors.signinEmail = 'Please enter a valid email format.';
    }

    if (!signInData.signinPassword) {
      errors.signinPassword = 'Please enter your password.';
    } else if (signInData.signinPassword.length < 6) {
      errors.signinPassword = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setSignInErrors(errors);
      sfx.playError();
      showToast('Please correct highlighted fields.', 'error');
      return;
    }

    setSignInErrors({});
    sfx.playClick();
    setIsSignInLoading(true);

    try {
      const user = await signIn(signInData.signinEmail, signInData.signinPassword);
      setIsSignInLoading(false);
      const displayName = user?.displayName || user?.email?.split('@')[0] || signInData.signinEmail.split('@')[0];
      setAuthenticatedAthlete(displayName);
      setIsWelcomeModalOpen(true);
      sfx.playSuccess();
      showToast(`Access Granted! Welcome back, ${displayName} 🔥`, 'success');
    } catch (err) {
      setIsSignInLoading(false);
      sfx.playError();
      const friendlyMsg = getFriendlyAuthError(err);
      showToast(friendlyMsg, 'error');
    }
  };

  // Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!signUpData.signupName.trim()) {
      errors.signupName = 'Athlete name is required.';
    }
    if (!signUpData.signupEmail.trim()) {
      errors.signupEmail = 'Athlete email is required.';
    } else if (!isValidEmail(signUpData.signupEmail.trim())) {
      errors.signupEmail = 'Please enter a valid email format.';
    }
    if (!signUpData.signupPassword) {
      errors.signupPassword = 'A secure password is required.';
    } else if (signUpData.signupPassword.length < 8) {
      errors.signupPassword = 'Password must be at least 8 characters long.';
    }
    if (!signUpData.termsAccepted) {
      errors.terms = 'You must agree to the Terms of Performance.';
    }

    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      sfx.playError();
      showToast('Please complete all athlete registration requirements.', 'error');
      return;
    }

    setSignUpErrors({});
    sfx.playClick();
    setIsSignUpLoading(true);

    try {
      const user = await signUp(
        signUpData.signupEmail,
        signUpData.signupPassword,
        signUpData.signupName
      );
      setIsSignUpLoading(false);
      const name = user?.displayName || signUpData.signupName || user?.email?.split('@')[0];
      setAuthenticatedAthlete(name);
      setIsWelcomeModalOpen(true);
      sfx.playSuccess();
      showToast(`Athlete Profile Created! Welcome, ${name} 🚀`, 'success');
    } catch (err) {
      setIsSignUpLoading(false);
      sfx.playError();
      const friendlyMsg = getFriendlyAuthError(err);
      showToast(friendlyMsg, 'error');
    }
  };

  // Google Login
  const handleSocialLogin = async (provider) => {
    try {
      showToast(`Connecting to ${provider}...`, 'info');
      sessionStorage.setItem('last_auth_provider', 'google');
      sessionStorage.setItem('prompt_google_onboarding', 'true');
      const user = await signInWithGoogle();
      const name = user?.displayName || user?.email?.split('@')[0] || 'Athlete';
      setAuthenticatedAthlete(name);
      sfx.playSuccess();
      showToast(`Authenticated via ${provider}! ⚡`, 'success');
    } catch (err) {
      sessionStorage.removeItem('last_auth_provider');
      sessionStorage.removeItem('prompt_google_onboarding');
      sfx.playError();
      const friendlyMsg = getFriendlyAuthError(err);
      showToast(friendlyMsg, 'error');
    }
  };

  // =========================================================================
  // IF USER IS AUTHENTICATED: RENDER LEVELUP DASHBOARD
  // =========================================================================
  if (currentUser) {
    return (
      <div className="app-root-container">
        <ErrorBoundary>
          <DashboardLayout showToast={showToast} />
        </ErrorBoundary>
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // =========================================================================
  // IF USER IS NOT AUTHENTICATED: RENDER EXISTING SIGN IN & SIGN UP PAGE
  // =========================================================================
  return (
    <div className="app-layout">
      {/* Dynamic Purple Speed-Streaks Canvas */}
      <SpeedCanvas />

      {/* Atmospheric Background Scene */}
      <BackgroundScene />

      {/* Top Navigation */}
      <Navbar
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        onDemoFill={handleDemoFill}
      />

      {/* Main Centered Sign-In / Sign-Up Block */}
      <main className="page-container">
        <AuthCard
          authMode={authMode}
          setAuthMode={setAuthMode}
          signInData={signInData}
          signUpData={signUpData}
          onSignInChange={handleSignInChange}
          onSignUpChange={handleSignUpChange}
          onSignInSubmit={handleSignInSubmit}
          onSignUpSubmit={handleSignUpSubmit}
          onSocialLogin={handleSocialLogin}
          onForgotPassword={() => setIsForgotModalOpen(true)}
          onOpenTerms={() =>
            showToast('LevelUp Code: Dedication, Honor, and Maximum Effort.', 'info')
          }
          onOpenPrivacy={() =>
            showToast('Privacy Code: All biometrics and metrics are encrypted with 256-bit AES.', 'info')
          }
          isSignInLoading={isSignInLoading}
          isSignUpLoading={isSignUpLoading}
          signInErrors={signInErrors}
          signUpErrors={signUpErrors}
        />
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSubmitEmail={async (email) => {
          try {
            await resetPassword(email);
            sfx.playSuccess();
            showToast(`Password reset link dispatched to ${email}! 🚀`, 'success');
            setIsForgotModalOpen(false);
          } catch (err) {
            sfx.playError();
            showToast(getFriendlyAuthError(err), 'error');
          }
        }}
        initialEmail={signInData.signinEmail}
      />

      {/* Welcome Screen Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        athleteName={authenticatedAthlete}
        onEnterDashboard={() => {
          setIsWelcomeModalOpen(false);
          // Trigger entry to dashboard
        }}
      />

      {/* Toast Notification System */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
