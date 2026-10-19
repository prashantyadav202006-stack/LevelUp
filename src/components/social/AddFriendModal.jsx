import { useState, useEffect } from 'react';
import { UserPlus, X, Check, ArrowRight, Sparkles, Clock, Trash2 } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { sfx } from '../../utils/soundEngine';

// Suggested partners matching user's reference image
const SUGGESTED_PARTNERS = [
  {
    id: 'sug_rohit',
    name: 'Rohit Sharma',
    handle: 'rohit_sharma',
    consistency: '93%',
    initials: 'RS',
    colorClass: 'avatar-rs',
  },
  {
    id: 'sug_pooja',
    name: 'Pooja Verma',
    handle: 'pooja_fitness',
    consistency: '96%',
    initials: 'PV',
    colorClass: 'avatar-pv',
  },
  {
    id: 'sug_kabir',
    name: 'Kabir Mehta',
    handle: 'kabir_runner',
    consistency: '88%',
    initials: 'KM',
    colorClass: 'avatar-km',
  },
];

export default function AddFriendModal({ isOpen, onClose, currentUser, onFriendRequestSent }) {
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'sent'
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [sentList, setSentList] = useState([]);
  const [requestedPartnerIds, setRequestedPartnerIds] = useState(new Set());

  // Load existing sent requests when modal opens
  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      const existing = socialService.getSentRequests(currentUser.uid) || [];
      setSentList(existing);
      // Mark matching suggested partners as already requested
      const existingLower = existing.map((s) => String(s).toLowerCase());
      const partnerIds = new Set();
      SUGGESTED_PARTNERS.forEach((p) => {
        if (existingLower.includes(p.id) || existingLower.includes(p.handle.toLowerCase())) {
          partnerIds.add(p.id);
        }
      });
      setRequestedPartnerIds(partnerIds);
      setInputValue('');
      setFeedback({ text: '', type: '' });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle manual input submit
  const handleSendCustomRequest = (e) => {
    e.preventDefault();
    const query = inputValue.trim().replace(/^@/, '');
    if (!query) {
      setFeedback({ text: 'Please enter a username or phone number.', type: 'error' });
      sfx.playError();
      return;
    }

    sfx.playSuccess();
    socialService.sendFriendRequest(currentUser?.uid, query);

    const updated = socialService.getSentRequests(currentUser?.uid);
    setSentList(updated);
    setInputValue('');
    setFeedback({
      text: `Friend request sent to @${query}! ⚡`,
      type: 'success',
    });

    if (onFriendRequestSent) onFriendRequestSent(query);
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  // Handle clicking "+ Request" on suggested partner
  const handleRequestSuggested = (partner) => {
    sfx.playSuccess();
    socialService.sendFriendRequest(currentUser?.uid, partner.handle);

    setRequestedPartnerIds((prev) => new Set(prev).add(partner.id));
    const updated = socialService.getSentRequests(currentUser?.uid);
    setSentList(updated);

    setFeedback({
      text: `Friend request sent to ${partner.name}! 🚀`,
      type: 'success',
    });

    if (onFriendRequestSent) onFriendRequestSent(partner.handle);
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  // Cancel sent request
  const handleCancelRequest = (handle) => {
    sfx.playClick();
    if (socialService.cancelSentRequest) {
      const updated = socialService.cancelSentRequest(currentUser?.uid, handle);
      setSentList(updated);
    } else {
      const current = socialService.getSentRequests(currentUser?.uid);
      const filtered = current.filter((s) => s.toLowerCase() !== handle.toLowerCase());
      localStorage.setItem(`sent_requests_${currentUser?.uid || 'guest'}`, JSON.stringify(filtered));
      setSentList(filtered);
    }
    setRequestedPartnerIds((prev) => {
      const next = new Set(prev);
      SUGGESTED_PARTNERS.forEach((p) => {
        if (p.handle.toLowerCase() === handle.toLowerCase()) {
          next.delete(p.id);
        }
      });
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
                Track each other’s daily habits, consistency & diet targets together
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
                Friend's Username or Mobile Number
              </label>

              <div className="af-input-wrap">
                <span className="af-input-prefix">@</span>
                <input
                  id="friend-search-input"
                  type="text"
                  className="af-input"
                  placeholder="e.g. rohit_sharma, neha_fit, or phone"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="af-submit-btn"
                disabled={!inputValue.trim()}
              >
                <span>Send Friend Request</span>
                <ArrowRight size={17} strokeWidth={2.4} />
              </button>
            </form>

            {/* Suggested Accountability Partners */}
            <div className="af-suggested-section">
              <span className="af-suggested-title">
                🌟 SUGGESTED ACCOUNTABILITY PARTNERS
              </span>

              <div className="af-suggested-list">
                {SUGGESTED_PARTNERS.map((partner) => {
                  const isSent = requestedPartnerIds.has(partner.id);
                  return (
                    <div key={partner.id} className="af-partner-card">
                      <div className="af-partner-left">
                        <div className={`af-partner-avatar ${partner.colorClass}`}>
                          {partner.initials}
                        </div>
                        <div className="af-partner-info">
                          <span className="af-partner-name">{partner.name}</span>
                          <span className="af-partner-meta">
                            @{partner.handle} • {partner.consistency} consistency
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`af-request-btn ${isSent ? 'sent' : ''}`}
                        onClick={() => !isSent && handleRequestSuggested(partner)}
                        disabled={isSent}
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
                  When you send requests to friends or athletes, they will appear here until accepted.
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
                {sentList.map((handle, idx) => (
                  <div key={idx} className="af-partner-card">
                    <div className="af-partner-left">
                      <div className="af-partner-avatar avatar-generic">
                        {String(handle).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="af-partner-info">
                        <span className="af-partner-name">@{handle}</span>
                        <span className="af-partner-meta">Request pending response</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="af-cancel-btn"
                      onClick={() => handleCancelRequest(handle)}
                      title="Cancel request"
                    >
                      <Trash2 size={13} />
                      <span>Cancel</span>
                    </button>
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
