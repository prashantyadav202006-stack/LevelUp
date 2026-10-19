import { useState, useEffect } from 'react';
import { UserPlus, X, Check, ArrowRight, Sparkles, Clock, Trash2, Search, Loader2 } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { sfx } from '../../utils/soundEngine';

export default function AddFriendModal({ isOpen, onClose, currentUser, onFriendRequestSent }) {
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'sent'
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [sentList, setSentList] = useState([]);
  const [requestedPartnerIds, setRequestedPartnerIds] = useState(new Set());
  const [legitimateUsers, setLegitimateUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load existing sent requests & legitimate registered users when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && currentUser?.uid) {
      const existing = socialService.getSentRequests(currentUser.uid) || [];
      setSentList(existing);

      const requestedSet = new Set();
      existing.forEach((item) => {
        if (typeof item === 'string') requestedSet.add(item.toLowerCase().replace(/^@/, ''));
        if (item?.recipientId) requestedSet.add(item.recipientId);
        if (item?.recipientUsername) requestedSet.add(item.recipientUsername.toLowerCase());
      });
      setRequestedPartnerIds(requestedSet);

      setInputValue('');
      setFeedback({ text: '', type: '' });

      setIsLoading(true);
      socialService.getLegitimateUsers(currentUser.uid).then((users) => {
        if (isMounted) {
          setLegitimateUsers(users || []);
          setIsLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Filter legitimate users according to input value
  const filteredAthletes = legitimateUsers.filter((user) => {
    if (!inputValue.trim()) return true;
    const q = inputValue.trim().toLowerCase().replace(/^@/, '');
    return (
      user.displayName?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q)
    );
  });

  // Handle manual input submit (search username and send)
  const handleSendCustomRequest = async (e) => {
    e.preventDefault();
    const query = inputValue.trim().replace(/^@/, '');
    if (!query) {
      setFeedback({ text: 'Please enter an athlete username or name.', type: 'error' });
      sfx.playError();
      return;
    }

    setIsSending(true);
    try {
      const res = await socialService.sendFriendRequest(currentUser, query);
      sfx.playSuccess();

      const updated = socialService.getSentRequests(currentUser?.uid);
      setSentList(updated);
      setRequestedPartnerIds((prev) => new Set(prev).add(query.toLowerCase()));
      setInputValue('');
      setFeedback({
        text: res.message,
        type: 'success',
      });

      if (onFriendRequestSent) onFriendRequestSent(query);
    } catch (err) {
      sfx.playError();
      setFeedback({
        text: err.message || 'No registered athlete found with that username.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setFeedback({ text: '', type: '' }), 4500);
    }
  };

  // Handle clicking "+ Request" on legitimate athlete card
  const handleRequestAthlete = async (partner) => {
    sfx.playClick();
    setIsSending(true);
    try {
      const res = await socialService.sendFriendRequest(currentUser, partner);
      sfx.playSuccess();

      setRequestedPartnerIds((prev) => {
        const next = new Set(prev);
        if (partner.uid) next.add(partner.uid);
        if (partner.id) next.add(partner.id);
        if (partner.username) next.add(partner.username.toLowerCase());
        return next;
      });

      const updated = socialService.getSentRequests(currentUser?.uid);
      setSentList(updated);

      setFeedback({
        text: res.message,
        type: 'success',
      });

      if (onFriendRequestSent) onFriendRequestSent(partner.username);
    } catch (err) {
      sfx.playError();
      setFeedback({
        text: err.message || 'Failed to dispatch friend request.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setFeedback({ text: '', type: '' }), 4500);
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (handleOrId) => {
    sfx.playClick();
    const updated = await socialService.cancelSentRequest(currentUser?.uid, handleOrId);
    setSentList(updated);

    const cleanTarget = String(handleOrId).toLowerCase().replace(/^@/, '');
    setRequestedPartnerIds((prev) => {
      const next = new Set(prev);
      next.delete(cleanTarget);
      return next;
    });
  };

  return (
    <div
      className="add-friend-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add a Friend"
    >
      <div
        className="add-friend-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================================
            1. Modal Header
            =================================================================== */}
        <div className="af-header-row">
          <div className="af-header-left">
            <div className="af-logo-icon">
              <UserPlus size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="af-title">Add a Friend</h2>
              <p className="af-subtitle">
                Connect with authentic athletes to track daily habits & accountability together
              </p>
            </div>
          </div>
          <button
            type="button"
            className="af-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* ===================================================================
            2. Tabs: Send Friend Request vs Sent Requests (N)
            =================================================================== */}
        <div className="af-tabs-bar">
          <button
            type="button"
            className={`af-tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('send');
            }}
          >
            Send Friend Request
          </button>
          <button
            type="button"
            className={`af-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('sent');
            }}
          >
            Sent Requests ({sentList.length})
          </button>
        </div>

        {/* Action feedback notification */}
        {feedback.text && (
          <div className={`af-feedback-banner ${feedback.type}`}>
            <Sparkles size={14} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* ===================================================================
            3. TAB 1: Send Friend Request
            =================================================================== */}
        {activeTab === 'send' && (
          <div className="af-body-content">
            {/* Input & Action Form */}
            <form onSubmit={handleSendCustomRequest} className="af-form-group">
              <label htmlFor="friend-search-input" className="af-label">
                Search Authenticated Athletes or Enter Username
              </label>

              <div className="af-input-wrap">
                <span className="af-input-prefix">@</span>
                <input
                  id="friend-search-input"
                  type="text"
                  className="af-input"
                  placeholder="e.g. prashant_yadav or athlete username"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="af-submit-btn"
                disabled={!inputValue.trim() || isSending}
              >
                <span>{isSending ? 'Sending Request...' : 'Send Friend Request'}</span>
                <ArrowRight size={17} strokeWidth={2.4} />
              </button>
            </form>

            {/* Authenticated Community Athletes Section */}
            <div className="af-suggested-section">
              <span className="af-suggested-title">
                🌟 REGISTERED LEVELUP ATHLETES ({filteredAthletes.length})
              </span>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                  <Loader2 size={24} className="spin-animate" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Searching registered athletes...</p>
                </div>
              ) : filteredAthletes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.8rem 1rem', color: '#94a3b8' }}>
                  <Sparkles size={24} style={{ color: '#8b5cf6', marginBottom: '0.4rem', display: 'block', margin: '0 auto' }} />
                  <span style={{ fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                    {inputValue.trim() ? `No athlete found matching "${inputValue.trim()}"` : 'No other athletes registered yet'}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                    Only legitimate registered profiles appear here. Invite your friends to join LevelUp to compete together!
                  </p>
                </div>
              ) : (
                <div className="af-suggested-list">
                  {filteredAthletes.map((partner) => {
                    const partnerUid = partner.uid || partner.id;
                    const isSent =
                      requestedPartnerIds.has(partnerUid) ||
                      requestedPartnerIds.has(partner.username?.toLowerCase());

                    return (
                      <div key={partnerUid} className="af-partner-card">
                        <div className="af-partner-left">
                          {partner.avatar ? (
                            <img
                              src={partner.avatar}
                              alt={partner.displayName}
                              className="af-partner-avatar"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="af-partner-avatar avatar-generic">
                              {partner.initials || 'AT'}
                            </div>
                          )}
                          <div className="af-partner-info">
                            <span className="af-partner-name">{partner.displayName}</span>
                            <span className="af-partner-meta">
                              @{partner.username} • LVL {partner.level} • {partner.consistency} consistency
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`af-request-btn ${isSent ? 'sent' : ''}`}
                          onClick={() => !isSent && handleRequestAthlete(partner)}
                          disabled={isSent || isSending}
                        >
                          {isSent ? (
                            <>
                              <Check size={13} strokeWidth={2.5} />
                              <span>Sent</span>
                            </>
                          ) : (
                            <span>+ Request</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            4. TAB 2: Sent Requests (N)
            =================================================================== */}
        {activeTab === 'sent' && (
          <div className="af-body-content sent-tab-body">
            {sentList.length === 0 ? (
              <div className="af-empty-sent">
                <Clock size={32} style={{ color: '#475569', marginBottom: '0.5rem' }} />
                <span className="empty-title">No pending sent requests</span>
                <p className="empty-desc">
                  When you send requests to legitimate athletes, they will appear here until accepted.
                </p>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => setActiveTab('send')}
                >
                  Send your first request →
                </button>
              </div>
            ) : (
              <div className="af-suggested-list">
                {sentList.map((item, idx) => {
                  const label =
                    item?.recipientName || item?.recipientUsername || (typeof item === 'string' ? item : 'Athlete');
                  const sub = item?.recipientUsername ? `@${item.recipientUsername}` : 'Pending request';
                  const key = item?.id || item?.recipientId || idx;

                  return (
                    <div key={key} className="af-partner-card">
                      <div className="af-partner-left">
                        <div className="af-partner-avatar avatar-generic">
                          {String(label).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="af-partner-info">
                          <span className="af-partner-name">{label}</span>
                          <span className="af-partner-meta">{sub} • Notification dispatched</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="af-cancel-btn"
                        onClick={() => handleCancelRequest(item?.id || item?.recipientId || label)}
                        title="Cancel request"
                      >
                        <Trash2 size={13} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
