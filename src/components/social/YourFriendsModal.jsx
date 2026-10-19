import { useState, useEffect } from 'react';
import { Users, X, UserPlus, Flame, Zap, Check, Trash2, Sparkles, Clock, Heart } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { sfx } from '../../utils/soundEngine';

export default function YourFriendsModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAddFriend,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'invites'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [cheeredIds, setCheeredIds] = useState(new Set());

  const loadData = async () => {
    if (currentUser?.uid) {
      const f = await socialService.fetchFriends(currentUser.uid);
      const r = socialService.getFriendRequests(currentUser.uid) || [];
      setFriends(f || []);
      setRequests(r || []);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      loadData();
      const unsub = socialService.subscribeFriends(currentUser.uid, (list) => {
        setFriends(list || []);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Accept incoming invite
  const handleAcceptInvite = async (requestId) => {
    sfx.playSuccess();
    await socialService.acceptFriendRequest(currentUser, requestId);
    await loadData();
    if (showToast) showToast('Friend request accepted! Welcome to the circle ⚡', 'success');
  };

  // Reject incoming invite
  const handleRejectInvite = async (requestId) => {
    sfx.playClick();
    await socialService.rejectFriendRequest(currentUser, requestId);
    await loadData();
    if (showToast) showToast('Invite declined.', 'info');
  };

  // Cheer / Nudge friend
  const handleCheerFriend = (friendId, name) => {
    sfx.playSuccess();
    setCheeredIds((prev) => new Set(prev).add(friendId));
    if (showToast) showToast(`Sent discipline cheer to ${name}! ⚡🔥`, 'success');
  };

  // Remove friend
  const handleRemoveFriend = async (friendId, name) => {
    sfx.playClick();
    if (window.confirm(`Remove ${name} from your accountability circle?`)) {
      const updated = await socialService.removeFriend(currentUser?.uid, friendId);
      setFriends(updated || []);
      if (showToast) showToast(`Removed ${name} from friends.`, 'info');
    }
  };

  return (
    <div
      className="your-friends-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Your Friends & Accountability Circle"
    >
      <div
        className="your-friends-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================================
            1. Header: Squircle icon, Title, Subtitle, + Add Friend, (X) Close
            =================================================================== */}
        <div className="yf-header-row">
          <div className="yf-header-left">
            <div className="yf-logo-icon">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="yf-title">Your Friends & Accountability Circle</h2>
              <p className="yf-subtitle">
                Track each other’s routines, consistency, and daily habits in real time
              </p>
            </div>
          </div>

          <div className="yf-header-actions">
            <button
              type="button"
              className="yf-add-friend-top-btn"
              onClick={() => {
                sfx.playClick();
                if (onOpenAddFriend) onOpenAddFriend();
              }}
            >
              <UserPlus size={13} strokeWidth={2.5} />
              <span>+ Add Friend</span>
            </button>

            <button
              type="button"
              className="yf-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ===================================================================
            2. Tabs: Active Friends (N) vs Incoming Invites (N)
            =================================================================== */}
        <div className="yf-tabs-bar">
          <button
            type="button"
            className={`yf-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('friends');
            }}
          >
            Active Friends ({friends.length})
          </button>

          <button
            type="button"
            className={`yf-tab-btn ${activeTab === 'invites' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('invites');
            }}
          >
            Incoming Invites ({requests.length})
          </button>
        </div>

        {/* ===================================================================
            3. TAB 1: Active Friends (Empty State or List)
            =================================================================== */}
        {activeTab === 'friends' && (
          <div className="yf-tab-content">
            {friends.length === 0 ? (
              /* Exact Empty State matching user reference screenshot */
              <div className="yf-empty-state">
                <div className="yf-purple-icon-wrap">
                  <Users size={36} className="yf-purple-users-icon" strokeWidth={2.2} />
                </div>
                <h3 className="yf-empty-title">No Friends Added Yet</h3>
                <p className="yf-empty-desc">
                  Connect with workout buddies or friends to check each other’s progress.
                </p>
                <button
                  type="button"
                  className="yf-empty-add-btn"
                  onClick={() => {
                    sfx.playClick();
                    if (onOpenAddFriend) onOpenAddFriend();
                  }}
                >
                  <span>+ Add Your First Friend</span>
                </button>
              </div>
            ) : (
              /* Friends List */
              <div className="yf-friends-list">
                {friends.map((friend) => {
                  const isCheered = cheeredIds.has(friend.id);
                  return (
                    <div key={friend.id} className="yf-friend-card">
                      <div className="yf-friend-left">
                        <div className="yf-avatar-wrap">
                          <img
                            src={
                              friend.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={friend.displayName}
                            className="yf-avatar-img"
                          />
                          <span className="online-indicator-dot" />
                        </div>
                        <div className="yf-friend-details">
                          <div className="yf-name-row">
                            <span className="yf-friend-name">{friend.displayName}</span>
                            <span className="yf-friend-handle">@{friend.username}</span>
                          </div>
                          <div className="yf-meta-row">
                            <span className="yf-streak-chip">
                              <Flame size={12} className="streak-flame-icon" />
                              <span>{friend.currentStreak || 0}d streak</span>
                            </span>
                            <span className="yf-status-text">
                              {friend.status || 'Active Habit Tracker'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="yf-friend-actions">
                        <button
                          type="button"
                          className={`yf-cheer-btn ${isCheered ? 'cheered' : ''}`}
                          onClick={() => handleCheerFriend(friend.id, friend.displayName)}
                          title="Send discipline cheer"
                        >
                          <Zap size={13} />
                          <span>{isCheered ? 'Cheered! ⚡' : 'Cheer ⚡'}</span>
                        </button>

                        <button
                          type="button"
                          className="yf-remove-btn"
                          onClick={() => handleRemoveFriend(friend.id, friend.displayName)}
                          title="Remove friend"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            4. TAB 2: Incoming Invites
            =================================================================== */}
        {activeTab === 'invites' && (
          <div className="yf-tab-content">
            {requests.length === 0 ? (
              <div className="yf-empty-state">
                <div className="yf-purple-icon-wrap muted">
                  <Clock size={32} className="yf-purple-users-icon" />
                </div>
                <h3 className="yf-empty-title">No Incoming Invites</h3>
                <p className="yf-empty-desc">
                  When workout buddies or friends send you accountability requests, they'll appear here.
                </p>
                <button
                  type="button"
                  className="yf-empty-add-btn"
                  onClick={() => {
                    sfx.playClick();
                    if (onOpenAddFriend) onOpenAddFriend();
                  }}
                >
                  <span>Send an Invite Instead →</span>
                </button>
              </div>
            ) : (
              <div className="yf-friends-list">
                {requests.map((req) => (
                  <div key={req.id} className="yf-friend-card">
                    <div className="yf-friend-left">
                      <img
                        src={req.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={req.displayName}
                        className="yf-avatar-img"
                      />
                      <div className="yf-friend-details">
                        <span className="yf-friend-name">{req.displayName}</span>
                        <span className="yf-friend-handle">@{req.username}</span>
                        <span className="yf-req-note">Sent accountability invitation</span>
                      </div>
                    </div>

                    <div className="yf-invite-action-group">
                      <button
                        type="button"
                        className="yf-accept-btn"
                        onClick={() => handleAcceptInvite(req.id)}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        className="yf-decline-btn"
                        onClick={() => handleRejectInvite(req.id)}
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
