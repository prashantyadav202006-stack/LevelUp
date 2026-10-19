import { useState } from 'react';
import { Menu, Plus, Bell, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sfx } from '../../utils/soundEngine';

const MOTIVATIONAL_QUOTES = [
  'Champions are built in the dark when nobody is watching.',
  'Momentum is your greatest weapon. Keep the streak alive.',
  'Excellence is not an act, but a daily habit.',
  'Small daily disciplines compound into unstoppable mastery.',
  'Focus on the process, and the scoreboard takes care of itself.',
];

export default function Header({ onOpenAddGoal, onToggleMobileNav }) {
  const { currentUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Formatted date (Desktop full format)
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Formatted date (Mobile compact format)
  const todayCompact = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const firstName = currentUser?.displayName
    ? currentUser.displayName.split(' ')[0]
    : (currentUser?.email ? currentUser.email.split('@')[0] : 'Athlete');

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-left">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileNav}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>

        <div className="greeting-block">
          <h1 className="greeting-title">
            <span className="greeting-prefix">{getGreeting()}, </span>
            <span className="greeting-name">{firstName}</span> ⚡
          </h1>
          <div className="greeting-sub">
            <span className="current-date-pill desktop-only">{todayFormatted}</span>
            <span className="current-date-pill mobile-only">{todayCompact}</span>
            <span className="quote-divider desktop-only">•</span>
            <span className="quote-text desktop-only">"{randomQuote}"</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Prominent + Add Goal Action */}
        <button
          type="button"
          className="btn-primary-add"
          onClick={() => {
            sfx.playClick();
            onOpenAddGoal();
          }}
          title="Add Goal"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="btn-add-label">Add Goal</span>
        </button>

        {/* Notifications Popover Toggle */}
        <div className="notification-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => {
              sfx.playClick();
              setShowNotifications(!showNotifications);
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="bell-badge" />
          </button>

          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-header">
                <span className="popover-title">Notifications</span>
                <span className="badge-chip">3 New</span>
              </div>
              <div className="popover-list">
                <div className="notification-item unread">
                  <div className="notif-icon-wrap violet">
                    <Sparkles size={14} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">
                      <strong>Streak Alert:</strong> 6-day streak active! 1 more day to claim Unstoppable Titan badge.
                    </p>
                    <span className="notif-time">20m ago</span>
                  </div>
                </div>

                <div className="notification-item unread">
                  <div className="notif-icon-wrap green">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">
                      <strong>Goal Complete:</strong> You solved 2 LeetCode problems (+25 XP).
                    </p>
                    <span className="notif-time">2 hours ago</span>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notif-icon-wrap cyan">
                    <Sparkles size={14} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">
                      <strong>Challenge Update:</strong> 7-Day Habit Sprint leaderboard updated.
                    </p>
                    <span className="notif-time">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
