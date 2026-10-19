import { sfx } from '../utils/soundEngine';

export default function WelcomeModal({ isOpen, athleteName, onEnterDashboard }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" id="welcomeModal">
      <div className="modal-card welcome-modal-card">
        <div className="welcome-badge-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="welcome-title">
          Welcome to LevelUp, <span id="welcomeUserName">{athleteName || 'Athlete'}</span>!
        </h3>
        <p className="welcome-status">
          Authentication Verified • Tier: <strong>ELITE HYBRID</strong>
        </p>

        <div className="welcome-stats-grid">
          <div className="stat-box">
            <span className="stat-num">98.4%</span>
            <span className="stat-desc">Readiness Score</span>
          </div>
          <div className="stat-box highlight">
            <span className="stat-num">DAY 1</span>
            <span className="stat-desc">Next Workout</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">1,850</span>
            <span className="stat-desc">XP Points</span>
          </div>
        </div>

        <p className="redirect-hint">Session Active • Ready to Level Up!</p>

        <div className="modal-actions">
          <button
            type="button"
            className="submit-cta-btn"
            id="enterDashboardBtn"
            onClick={() => {
              sfx.playClick();
              onEnterDashboard();
            }}
          >
            <span>Enter Athlete Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
