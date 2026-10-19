import { useState, useEffect } from 'react';
import { Sliders, Shield, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { sfx } from '../../utils/soundEngine';

export default function GoogleOnboardingModal({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [targets, setTargets] = useState({
    calories: 2600,
    protein: 165,
    carbs: 280,
    fats: 70,
    water: 3500,
    steps: 10000,
  });
  const [units, setUnits] = useState('metric');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [visibility, setVisibility] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form fields matching the user's reference picture and Google profile data
  useEffect(() => {
    if (currentUser) {
      const defaultName = currentUser.displayName || 'Prashant Yadav';
      setDisplayName(defaultName);

      const generatedUsername =
        currentUser.username ||
        defaultName.toLowerCase().replace(/\s+/g, '_') ||
        'prashant_beast';
      setUsername(generatedUsername);

      if (currentUser.targets) {
        setTargets({
          calories: currentUser.targets.calories ?? 2600,
          protein: currentUser.targets.protein ?? 165,
          carbs: currentUser.targets.carbs ?? 280,
          fats: currentUser.targets.fats ?? 70,
          water: currentUser.targets.water ?? 3500,
          steps: currentUser.targets.steps ?? 10000,
        });
      } else {
        setTargets({
          calories: 2600,
          protein: 165,
          carbs: 280,
          fats: 70,
          water: 3500,
          steps: 10000,
        });
      }

      if (currentUser.settings) {
        setUnits(currentUser.settings.units || 'metric');
        setTimeZone(currentUser.settings.timeZone || 'Asia/Kolkata');
        setVisibility(currentUser.settings.visibility || 'public');
      }
    } else {
      setDisplayName('Prashant Yadav');
      setUsername('prashant_beast');
      setTargets({
        calories: 2600,
        protein: 165,
        carbs: 280,
        fats: 70,
        water: 3500,
        steps: 10000,
      });
      setUnits('metric');
      setTimeZone('Asia/Kolkata');
      setVisibility('public');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    sfx.playClick();
    setIsSubmitting(true);

    try {
      await onSave({
        displayName: displayName.trim() || 'Prashant Yadav',
        username: username.trim() || 'prashant_beast',
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fats: targets.fats,
        water: targets.water,
        steps: targets.steps,
        units,
        timeZone,
        visibility,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="google-onboarding-backdrop"
      id="googleOnboardingModal"
      onClick={(e) => {
        if (e.target.classList.contains('google-onboarding-backdrop')) {
          onClose();
        }
      }}
    >
      <div className="google-onboarding-card">
        {/* Header */}
        <div className="google-onboarding-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="google-badge-pill">
              <svg className="google-pill-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google Account Connected</span>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close modal"
              aria-label="Close"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <h2 className="google-onboarding-title">Configure Your Athlete Profile</h2>
          <p className="google-onboarding-subtitle">
            Welcome to LevelUp! Confirm your daily performance targets and social preferences to enter the Arena.
          </p>
        </div>

        {/* Form Body - Exactly matching the user reference picture */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 1: Display Name & Unique Username */}
          <div className="onboarding-card-box">
            <div className="form-grid-2">
              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Display Name</label>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="e.g. Prashant Yadav"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Unique Username</label>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="e.g. prashant_beast"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Daily Performance Targets */}
          <div className="onboarding-card-box">
            <div className="onboarding-card-header">
              <Sliders size={18} style={{ color: '#00f2cb' }} />
              <h3 className="onboarding-card-title">Daily Performance Targets</h3>
            </div>

            <div className="form-grid-3">
              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Daily Calories (kcal)</label>
                <input
                  type="number"
                  className="onboarding-input"
                  value={targets.calories}
                  onChange={(e) => setTargets({ ...targets, calories: e.target.value })}
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Protein Target (g)</label>
                <input
                  type="number"
                  className="onboarding-input"
                  value={targets.protein}
                  onChange={(e) => setTargets({ ...targets, protein: e.target.value })}
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Carbs Target (g)</label>
                <input
                  type="number"
                  className="onboarding-input"
                  value={targets.carbs}
                  onChange={(e) => setTargets({ ...targets, carbs: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3" style={{ marginTop: '0.25rem' }}>
              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Fats Target (g)</label>
                <input
                  type="number"
                  className="onboarding-input"
                  value={targets.fats}
                  onChange={(e) => setTargets({ ...targets, fats: e.target.value })}
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Water Intake (ml)</label>
                <input
                  type="number"
                  step="250"
                  className="onboarding-input"
                  value={targets.water}
                  onChange={(e) => setTargets({ ...targets, water: e.target.value })}
                  required
                />
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Daily Steps Target</label>
                <input
                  type="number"
                  step="500"
                  className="onboarding-input"
                  value={targets.steps}
                  onChange={(e) => setTargets({ ...targets, steps: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 3: Preferences & Social Privacy */}
          <div className="onboarding-card-box">
            <div className="onboarding-card-header">
              <Shield size={18} style={{ color: '#10b981' }} />
              <h3 className="onboarding-card-title">Preferences & Social Privacy</h3>
            </div>

            <div className="form-grid-3">
              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Unit Standard</label>
                <select
                  className="onboarding-select"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                >
                  <option value="metric">Metric (kg, km, ml)</option>
                  <option value="imperial">Imperial (lbs, miles, oz)</option>
                </select>
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Time Zone</label>
                <select
                  className="onboarding-select"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC Standard</option>
                </select>
              </div>

              <div className="onboarding-input-group">
                <label className="onboarding-input-label">Profile Visibility</label>
                <select
                  className="onboarding-select"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="public">Public (Show on Leaderboard)</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private (Ghost Mode)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="google-onboarding-actions">
            <button
              type="submit"
              className="onboarding-submit-btn"
              disabled={isSubmitting}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Saving Profile...' : 'Save & Enter Athlete Arena 🚀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
