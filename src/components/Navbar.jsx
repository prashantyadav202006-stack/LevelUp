import { sfx } from '../utils/soundEngine';
import LevelUpLogo from './common/LevelUpLogo';

export default function Navbar({ isAudioEnabled, onToggleAudio, onDemoFill }) {
  return (
    <header className="top-nav">
      <a href="#" className="brand-link" id="brandLink">
        <LevelUpLogo size={36} />
        <span className="brand-title">
          LEVEL<span className="brand-highlight">UP</span>
        </span>
        <span className="brand-tag">PRO ATHLETICS</span>
      </a>

      <div className="top-nav-actions">
        {/* Synthetic Audio Toggle */}
        <button
          type="button"
          className="icon-btn"
          id="audioToggleBtn"
          title={isAudioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          aria-label="Toggle Sound Effects"
          onClick={() => {
            onToggleAudio();
          }}
        >
          {isAudioEnabled ? (
            <svg
              className="audio-on-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg
              className="audio-off-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
          <span className="audio-label">{isAudioEnabled ? 'FX ON' : 'MUTED'}</span>
        </button>

        {/* Demo Athlete Quick-Fill Button */}
        <button
          type="button"
          className="pill-btn demo-btn"
          id="demoFillBtn"
          title="Auto-fill demo athlete credentials"
          onClick={() => {
            sfx.playClick();
            onDemoFill();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>Demo Athlete</span>
        </button>
      </div>
    </header>
  );
}
