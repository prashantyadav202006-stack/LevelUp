import { useEffect, useState } from 'react';
import {
  ArrowUp,
  PanelLeft,
  LayoutGrid,
  Compass,
  BarChart3,
  Send,
  UserPlus,
  Users,
  Settings,
  Download,
  Dumbbell,
  Utensils,
  Trophy,
  Award,
  LogOut,
  ChevronDown,
  ChevronUp,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sfx } from '../../utils/soundEngine';
import LevelUpLogo from '../common/LevelUpLogo';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', section: 'main' },
  { id: 'overview', label: 'Overview', section: 'main' },
  { id: 'analytics', label: 'Analytics', section: 'main' },
  { id: 'whats-next', label: 'See What’s Next', section: 'main' },
  { id: 'add-friend', label: 'Add Friend', section: 'friends' },
  { id: 'your-friends', label: 'Your Friends', section: 'friends' },
  { id: 'fitness', label: 'Fitness & Iron', section: 'arena' },
  { id: 'nutrition', label: 'Nutrition & Diet', section: 'arena' },
  { id: 'leaderboard', label: 'Leaderboard', section: 'arena' },
  { id: 'achievements', label: 'Achievements', section: 'arena' },
  { id: 'settings', label: 'Settings', section: 'settings' },
];

export default function Sidebar({
  activePage,
  setActivePage,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenWindowView,
  onOpenDownloadApp,
  onOpenAddFriendModal,
  onOpenYourFriendsModal,
}) {
  const { currentUser, signOut } = useAuth();
  const [showArenaSection, setShowArenaSection] = useState(true);
  const [uiScale, setUiScale] = useState(() => {
    try {
      const saved = localStorage.getItem('levelup_ui_scale');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.scale || 96;
      }
    } catch {
      // fallback
    }
    return 96;
  });

  const [isAutoUiSize, setIsAutoUiSize] = useState(() => {
    try {
      const saved = localStorage.getItem('levelup_ui_scale');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.isAuto !== false;
      }
    } catch {
      // fallback
    }
    return true;
  });

  // Apply UI Scaling to document root and set scale attributes
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    const effectiveScale = isAutoUiSize ? (isMobile ? 88 : 96) : uiScale;

    document.documentElement.style.fontSize = `${(effectiveScale / 100) * 16}px`;
    document.documentElement.style.setProperty('--ui-scale', `${effectiveScale / 100}`);
    document.documentElement.setAttribute(
      'data-ui-scale',
      effectiveScale <= 88 ? 'compact' : effectiveScale >= 115 ? 'large' : 'normal'
    );

    try {
      localStorage.setItem(
        'levelup_ui_scale',
        JSON.stringify({ scale: effectiveScale, isAuto: isAutoUiSize })
      );
    } catch {
      // ignore
    }

    return () => {
      document.documentElement.style.fontSize = '';
      document.documentElement.removeAttribute('data-ui-scale');
    };
  }, [uiScale, isAutoUiSize]);

  // Lock body scroll when mobile drawer is open so background never scrolls
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileOpen]);

  const handleNavClick = (pageId) => {
    sfx.playClick();
    setActivePage(pageId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    sfx.playClick();
    signOut();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ref-styled-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* ===================================================================
            1. Brand Header (Matching Reference Image)
            =================================================================== */}
        <div className="sidebar-brand-ref">
          <div className="brand-left-group" onClick={() => handleNavClick('dashboard')}>
            {/* Official Brand Logo */}
            <LevelUpLogo size={42} className="brand-logo-img-wrap" />

            {!isCollapsed && (
              <div className="brand-text-col">
                <span className="brand-title-text">LevelUp</span>
                <span className="brand-subtitle-tracked">HABITS & DISCIPLINE</span>
              </div>
            )}
          </div>

          {/* Sidebar Split Pane Toggle Icon Button */}
          <button
            type="button"
            className="collapse-panel-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        {/* ===================================================================
            2. Navigation Sections (MAIN / FRIENDS / SETTINGS)
            =================================================================== */}
        <nav className="sidebar-nav ref-nav-container" aria-label="Main navigation">
          {/* ---------------- SECTION 1: MAIN ---------------- */}
          <div className="nav-group-block">
            {!isCollapsed && <span className="nav-group-title">MAIN</span>}

            {/* Dashboard (Active Pill with Purple Glow in reference) */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'dashboard' ? 'active-pill' : ''}`}
              onClick={() => handleNavClick('dashboard')}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutGrid size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Dashboard</span>}
            </button>

            {/* Overview */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'overview' ? 'active-pill' : ''}`}
              onClick={() => handleNavClick('overview')}
              title={isCollapsed ? 'Overview' : undefined}
            >
              <Compass size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Overview</span>}
            </button>

            {/* Analytics */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'analytics' ? 'active-pill' : ''}`}
              onClick={() => handleNavClick('analytics')}
              title={isCollapsed ? 'Analytics' : undefined}
            >
              <BarChart3 size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Analytics</span>}
            </button>

            {/* See What's Next */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'whats-next' ? 'active-pill' : ''}`}
              onClick={() => handleNavClick('whats-next')}
              title={isCollapsed ? 'See What’s Next' : undefined}
            >
              <Send size={17} className="nav-ref-icon send-icon-tilt" />
              {!isCollapsed && <span className="nav-ref-label">See What’s Next</span>}
            </button>
          </div>

          {/* ---------------- SECTION 2: ARENA & ATHLETE TRAINING ---------------- */}
          <div className="nav-group-block">
            {!isCollapsed && (
              <div
                className="nav-group-header-row"
                onClick={() => setShowArenaSection(!showArenaSection)}
                title="Toggle Arena modules"
              >
                <span className="nav-group-title">ARENA</span>
                <button type="button" className="group-toggle-arrow">
                  {showArenaSection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}

            {(showArenaSection || isCollapsed) && (
              <>
                <button
                  type="button"
                  className={`nav-ref-item ${activePage === 'fitness' ? 'active-pill' : ''}`}
                  onClick={() => handleNavClick('fitness')}
                  title={isCollapsed ? 'Fitness & Iron' : undefined}
                >
                  <Dumbbell size={18} className="nav-ref-icon" />
                  {!isCollapsed && <span className="nav-ref-label">Fitness & Iron</span>}
                </button>

                <button
                  type="button"
                  className={`nav-ref-item ${activePage === 'nutrition' ? 'active-pill' : ''}`}
                  onClick={() => handleNavClick('nutrition')}
                  title={isCollapsed ? 'Nutrition & Diet' : undefined}
                >
                  <Utensils size={18} className="nav-ref-icon" />
                  {!isCollapsed && <span className="nav-ref-label">Nutrition & Diet</span>}
                </button>

                <button
                  type="button"
                  className={`nav-ref-item ${activePage === 'leaderboard' ? 'active-pill' : ''}`}
                  onClick={() => handleNavClick('leaderboard')}
                  title={isCollapsed ? 'Leaderboard' : undefined}
                >
                  <Trophy size={18} className="nav-ref-icon" />
                  {!isCollapsed && <span className="nav-ref-label">Leaderboard</span>}
                </button>

                <button
                  type="button"
                  className={`nav-ref-item ${activePage === 'achievements' ? 'active-pill' : ''}`}
                  onClick={() => handleNavClick('achievements')}
                  title={isCollapsed ? 'Achievements' : undefined}
                >
                  <Award size={18} className="nav-ref-icon" />
                  {!isCollapsed && <span className="nav-ref-label">Achievements</span>}
                </button>
              </>
            )}
          </div>

          {/* ---------------- SECTION 3: FRIENDS ---------------- */}
          <div className="nav-group-block">
            {!isCollapsed && <span className="nav-group-title">FRIENDS</span>}

            {/* Add Friend */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'add-friend' ? 'active-pill' : ''}`}
              onClick={() => {
                sfx.playClick();
                if (onOpenAddFriendModal) {
                  onOpenAddFriendModal();
                } else {
                  handleNavClick('add-friend');
                }
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              title={isCollapsed ? 'Add Friend' : undefined}
            >
              <UserPlus size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Add Friend</span>}
            </button>

            {/* Your Friends */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'your-friends' ? 'active-pill' : ''}`}
              onClick={() => {
                sfx.playClick();
                if (onOpenYourFriendsModal) {
                  onOpenYourFriendsModal();
                } else {
                  handleNavClick('your-friends');
                }
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              title={isCollapsed ? 'Your Friends' : undefined}
            >
              <Users size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Your Friends</span>}
            </button>
          </div>

          {/* ---------------- SECTION 4: SETTINGS ---------------- */}
          <div className="nav-group-block">
            {!isCollapsed && <span className="nav-group-title">SETTINGS</span>}

            {/* Window View (Sunset gradient icon) */}
            <button
              type="button"
              className="nav-ref-item"
              onClick={() => {
                sfx.playClick();
                if (onOpenWindowView) onOpenWindowView();
              }}
              title={isCollapsed ? 'Window View' : undefined}
            >
              <div className="sunset-gradient-badge">
                <span className="sunset-symbol">🌅</span>
              </div>
              {!isCollapsed && <span className="nav-ref-label">Window View</span>}
            </button>

            {/* Settings */}
            <button
              type="button"
              className={`nav-ref-item ${activePage === 'settings' ? 'active-pill' : ''}`}
              onClick={() => handleNavClick('settings')}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings size={18} className="nav-ref-icon" />
              {!isCollapsed && <span className="nav-ref-label">Settings</span>}
            </button>

            {/* Download App with [App] chip */}
            <button
              type="button"
              className="nav-ref-item download-item"
              onClick={() => {
                sfx.playClick();
                if (onOpenDownloadApp) onOpenDownloadApp();
              }}
              title={isCollapsed ? 'Download App' : undefined}
            >
              <Download size={18} className="nav-ref-icon" />
              {!isCollapsed && (
                <div className="download-app-label-wrap">
                  <span className="nav-ref-label">Download App</span>
                  <span className="app-badge-pill">App</span>
                </div>
              )}
            </button>
          </div>

          {/* UI Scale Controller (Directly from user screenshot) */}
          {!isCollapsed && (
            <div className="sidebar-uisize-widget">
              <div className="uisize-header">
                <span className="uisize-title">
                  <Monitor size={12} className="uisize-icon" />
                  <span>UI SIZE</span>
                </span>
                <span className="uisize-mode-badge">
                  {isAutoUiSize ? 'Auto (96%)' : `${uiScale}%`}
                </span>
              </div>
              <div className="uisize-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(false);
                    setUiScale((prev) => Math.max(75, prev - 5));
                  }}
                  title="Decrease UI scale"
                >
                  -
                </button>
                <span className="stepper-value">{uiScale}%</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(false);
                    setUiScale((prev) => Math.min(130, prev + 5));
                  }}
                  title="Increase UI scale"
                >
                  +
                </button>
              </div>
              <div className="uisize-presets">
                <button
                  type="button"
                  className={`preset-pill ${uiScale === 85 && !isAutoUiSize ? 'active' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(false);
                    setUiScale(85);
                  }}
                >
                  85%
                </button>
                <button
                  type="button"
                  className={`preset-pill ${uiScale === 100 && !isAutoUiSize ? 'active' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(false);
                    setUiScale(100);
                  }}
                >
                  100%
                </button>
                <button
                  type="button"
                  className={`preset-pill ${uiScale === 115 && !isAutoUiSize ? 'active' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(false);
                    setUiScale(115);
                  }}
                >
                  115%
                </button>
                <button
                  type="button"
                  className={`preset-pill ${isAutoUiSize ? 'active' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setIsAutoUiSize(true);
                    setUiScale(96);
                  }}
                >
                  Auto
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* ===================================================================
            3. User Profile Footer
            =================================================================== */}
        <div className="sidebar-user-footer ref-user-footer">
          <div
            className="user-profile-card"
            onClick={() => handleNavClick('settings')}
            title={`Account: ${currentUser?.email || 'Athlete'} (UID: ${currentUser?.uid || ''})`}
          >
            <img
              src={
                currentUser?.avatar ||
                currentUser?.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.displayName || currentUser?.email || 'Athlete'}
              className="user-avatar"
            />
            {!isCollapsed && (
              <div className="user-details">
                <span className="user-name">
                  {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Athlete')}
                </span>
                {currentUser?.email && (
                  <span
                    className="user-email-text"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted, #94a3b8)',
                      maxWidth: '135px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      lineHeight: '1.2',
                    }}
                    title={currentUser.email}
                  >
                    {currentUser.email}
                  </span>
                )}
                <span className="user-level-badge">LVL {currentUser?.level || 1} • {currentUser?.xp || 0} XP</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="signout-btn"
            onClick={handleSignOut}
            title="Sign out of LevelUp"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
