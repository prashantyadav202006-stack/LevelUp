import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Sliders,
  LogOut,
  Check,
  Sparkles,
  Camera,
  Flame,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';
import { sfx } from '../utils/soundEngine';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export default function SettingsPage() {
  const { currentUser, updateProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [units, setUnits] = useState('metric');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [visibility, setVisibility] = useState('public');

  // Targets
  const [targets, setTargets] = useState({
    calories: 2600,
    protein: 165,
    carbs: 280,
    fats: 70,
    water: 3500,
    steps: 10000,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const fallbackName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Athlete');
      setDisplayName(currentUser.displayName || fallbackName);
      setUsername(currentUser.username || fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      setAvatar(currentUser.avatar || currentUser.photoURL || AVATAR_PRESETS[0]);
      if (currentUser.settings) {
        setUnits(currentUser.settings.units || 'metric');
        setTimeZone(currentUser.settings.timeZone || 'Asia/Kolkata');
        setVisibility(currentUser.settings.visibility || 'public');
      }
      if (currentUser.targets) {
        setTargets({
          calories: currentUser.targets.calories ?? 2600,
          protein: currentUser.targets.protein ?? 165,
          carbs: currentUser.targets.carbs ?? 280,
          fats: currentUser.targets.fats ?? 70,
          water: currentUser.targets.water ?? 3500,
          steps: currentUser.targets.steps ?? 10000,
        });
      }
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    sfx.playClick();
    setIsSaving(true);

    try {
      const sanitizedTargets = {
        calories: Number(targets.calories) > 0 ? Number(targets.calories) : 2600,
        protein: Number(targets.protein) > 0 ? Number(targets.protein) : 165,
        carbs: Number(targets.carbs) > 0 ? Number(targets.carbs) : 280,
        fats: Number(targets.fats) > 0 ? Number(targets.fats) : 70,
        water: Number(targets.water) > 0 ? Number(targets.water) : 3500,
        steps: Number(targets.steps) > 0 ? Number(targets.steps) : 10000,
      };

      await updateProfile({
        displayName: displayName.trim(),
        username: username.toLowerCase().replace(/\s+/g, '_'),
        avatar,
        targets: sanitizedTargets,
        settings: {
          units,
          timeZone,
          visibility,
          notifications: true,
        },
        isOnboardingCompleted: true,
      });

      sfx.playSuccess();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    sfx.playClick();
    signOut();
  };

  return (
    <div className="page-content-wrapper">
      <section className="section-header-row">
        <div>
          <h2 className="section-heading">Athlete Profile & Settings</h2>
          <p className="section-subheading">
            Customize your biometrics, nutritional targets, and personal security preferences.
          </p>
        </div>

        <button type="button" className="btn-signout-danger" onClick={handleSignOut}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </section>

      {savedSuccess && (
        <div className="feedback-banner success">
          <Check size={18} />
          <span>All profile details and daily targets saved permanently in Cloud Firestore and local storage!</span>
        </div>
      )}

      {/* Firebase Status Banner */}
      <section className="firebase-status-banner">
        <div className="fb-status-left">
          <div className={`status-dot ${isFirebaseConfigured ? 'green' : 'amber'}`} />
          <div>
            <span className="fb-title">
              {isFirebaseConfigured ? 'Connected to Cloud Firestore' : 'Running in Offline / Local Sync Mode'}
            </span>
            <p className="fb-desc">
              {isFirebaseConfigured
                ? 'All private records are secured with your Firebase user UID.'
                : 'Add your Firebase credentials in .env to enable multi-device Cloud Firestore sync.'}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="settings-form">
        {/* Authenticated Firebase Account Information */}
        <div className="settings-section-card">
          <div className="card-header-inner">
            <Shield size={20} className="icon-violet" />
            <h3 className="settings-card-title">Firebase Authentication Identity</h3>
          </div>
          <div className="form-grid-3">
            <div className="input-field-group">
              <label className="field-label">Authenticated Email</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.email || 'No email attached'}
                readOnly
                disabled
                style={{ opacity: 0.9, cursor: 'default' }}
              />
            </div>
            <div className="input-field-group">
              <label className="field-label">Firebase User UID</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.uid || ''}
                readOnly
                disabled
                style={{ opacity: 0.9, cursor: 'default', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <div className="input-field-group">
              <label className="field-label">Auth Provider</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.authProvider === 'google' ? 'Google Authentication' : 'Email & Password'}
                readOnly
                disabled
                style={{ opacity: 0.9, cursor: 'default' }}
              />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="settings-section-card">
          <div className="card-header-inner">
            <User size={20} className="icon-violet" />
            <h3 className="settings-card-title">Profile Identity</h3>
          </div>

          <div className="avatar-selection-row">
            <img src={avatar} alt="Current Avatar" className="current-avatar-preview" />
            <div className="avatar-presets-col">
              <span className="preset-label">Choose Avatar Preset:</span>
              <div className="presets-list">
                {AVATAR_PRESETS.map((p, idx) => (
                  <img
                    key={idx}
                    src={p}
                    alt={`Preset ${idx}`}
                    className={`preset-thumb ${avatar === p ? 'selected' : ''}`}
                    onClick={() => setAvatar(p)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-field-group">
              <label className="field-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Unique Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Nutritional & Fitness Targets */}
        <div className="settings-section-card">
          <div className="card-header-inner">
            <Sliders size={20} className="icon-cyan" />
            <h3 className="settings-card-title">Daily Performance Targets</h3>
          </div>

          <div className="form-grid-3">
            <div className="input-field-group">
              <label className="field-label">Daily Calories (kcal)</label>
              <input
                type="number"
                className="form-input"
                value={targets.calories}
                onChange={(e) => setTargets({ ...targets, calories: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Protein Target (g)</label>
              <input
                type="number"
                className="form-input"
                value={targets.protein}
                onChange={(e) => setTargets({ ...targets, protein: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Carbs Target (g)</label>
              <input
                type="number"
                className="form-input"
                value={targets.carbs}
                onChange={(e) => setTargets({ ...targets, carbs: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="input-field-group">
              <label className="field-label">Fats Target (g)</label>
              <input
                type="number"
                className="form-input"
                value={targets.fats}
                onChange={(e) => setTargets({ ...targets, fats: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Water Intake (ml)</label>
              <input
                type="number"
                step="250"
                className="form-input"
                value={targets.water}
                onChange={(e) => setTargets({ ...targets, water: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Daily Steps Target</label>
              <input
                type="number"
                step="500"
                className="form-input"
                value={targets.steps}
                onChange={(e) => setTargets({ ...targets, steps: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Preferences & Privacy */}
        <div className="settings-section-card">
          <div className="card-header-inner">
            <Shield size={20} className="icon-green" />
            <h3 className="settings-card-title">Preferences & Social Privacy</h3>
          </div>

          <div className="form-grid-3">
            <div className="input-field-group">
              <label className="field-label">Unit Standard</label>
              <select
                className="form-select"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
              >
                <option value="metric">Metric (kg, km, ml)</option>
                <option value="imperial">Imperial (lbs, miles, oz)</option>
              </select>
            </div>

            <div className="input-field-group">
              <label className="field-label">Time Zone</label>
              <select
                className="form-select"
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

            <div className="input-field-group">
              <label className="field-label">Profile Visibility</label>
              <select
                className="form-select"
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

        <div className="settings-footer-actions">
          <button type="submit" className="submit-cta-btn max-w-sm" disabled={isSaving}>
            <span className="btn-text">
              <Sparkles size={16} />
              <span>{isSaving ? 'Saving Changes Forever...' : 'Save Changes Forever'}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
