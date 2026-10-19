import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Bell, Sparkles, CheckCircle2, UserCheck, UserX, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { socialService } from '../../services/socialService';
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
  const [notifications, setNotifications] = useState([]);
  const [incomingToast, setIncomingToast] = useState(null);
  const prevCountRef = useRef(0);

  // Subscribe to real-time incoming friend requests and notifications
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      return;
    }

    const unsubscribe = socialService.subscribeNotifications(currentUser.uid, (notifs) => {
      // Check if new incoming friend request arrived
      if (notifs.length > prevCountRef.current && prevCountRef.current !== 0) {
        const latest = notifs[0];
        if (latest && latest.type === 'friend_request') {
          sfx.playSuccess();
          setIncomingToast({
            id: latest.id,
            text: latest.message || `${latest.senderName} sent you a friend request!`,
            senderName: latest.senderName,
          });
          setTimeout(() => setIncomingToast(null), 6000);
        }
      }
      prevCountRef.current = notifs.length;
      setNotifications(notifs);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.uid]);

  // Accept incoming friend request
  const handleAcceptRequest = async (requestId) => {
    sfx.playSuccess();
    await socialService.acceptFriendRequest(currentUser, requestId);
    setNotifications((prev) => prev.filter((n) => n.id !== requestId));
  };

  // Decline incoming friend request
  const handleDeclineRequest = async (requestId) => {
    sfx.playClick();
    await socialService.rejectFriendRequest(currentUser, requestId);
    setNotifications((prev) => prev.filter((n) => n.id !== requestId));
  };

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

  const randomQuote = MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length];

  const firstName = currentUser?.displayName
    ? currentUser.displayName.split(' ')[0]
    : (currentUser?.email ? currentUser.email.split('@')[0] : 'Athlete');

  const unreadCount = notifications.length;

  return (
    <>
      {/* Live Pop Notification Toast Banner */}
      {incomingToast && (
        <div
          className="incoming-toast-banner"
          onClick={() => {
            setShowNotifications(true);
            setIncomingToast(null);
          }}
          style={{ cursor: 'pointer' }}
          role="alert"
        >
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.25)',
              padding: '7px',
              borderRadius: '9px',
              color: '#c084fc',
              display: 'flex',
            }}
          >
            <Bell size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'block' }}>
              New Friend Request!
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>{incomingToast.text}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIncomingToast(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              padding: '4px',
            }}
            aria-label="Dismiss toast"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
              style={{ position: 'relative' }}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span
                  className="bell-badge"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-popover">
                <div className="popover-header">
                  <span className="popover-title">Notifications</span>
                  <span className="badge-chip">{unreadCount} New</span>
                </div>

                <div className="popover-list">
                  {notifications.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.4rem 0.5rem',
                        color: '#94a3b8',
                        fontSize: '0.78rem',
                      }}
                    >
                      <Sparkles
                        size={20}
                        style={{ color: '#8b5cf6', marginBottom: '0.4rem', display: 'block', margin: '0 auto' }}
                      />
                      <span style={{ fontWeight: 600, color: '#f1f5f9', display: 'block' }}>
                        No pending notifications
                      </span>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                        Friend requests and milestone alerts will pop here in real time!
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      if (notif.type === 'friend_request') {
                        return (
                          <div key={notif.id} className="notification-item unread">
                            <img
                              src={
                                notif.senderAvatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={notif.senderName}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: '1.5px solid #8b5cf6',
                              }}
                            />
                            <div className="notif-content" style={{ flex: 1 }}>
                              <p
                                className="notif-msg"
                                style={{ margin: '0 0 0.25rem 0', fontSize: '0.76rem', lineHeight: 1.35 }}
                              >
                                <strong>{notif.senderName}</strong>{' '}
                                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                  @{notif.senderUsername}
                                </span>{' '}
                                sent you a friend request!
                              </p>
                              <span className="notif-time">{notif.timeAgo || 'Just now'}</span>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '0.4rem',
                                  marginTop: '0.45rem',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleAcceptRequest(notif.id)}
                                  style={{
                                    background: '#00f2cb',
                                    color: '#070b13',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.75rem',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <UserCheck size={12} />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineRequest(notif.id)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#94a3b8',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.65rem',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <UserX size={12} />
                                  <span>Decline</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Generic notification item
                      return (
                        <div key={notif.id} className="notification-item">
                          <div className="notif-icon-wrap violet">
                            <Sparkles size={14} />
                          </div>
                          <div className="notif-content">
                            <p className="notif-msg">{notif.message}</p>
                            <span className="notif-time">{notif.timeAgo || 'Just now'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
