import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Trophy,
  UserPlus,
  Check,
  X,
  Flame,
  Zap,
  Calendar,
  Sparkles,
  Search,
  UserMinus,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socialService } from '../services/socialService';
import { sfx } from '../utils/soundEngine';

export default function SocialPage({ initialTab = 'your-friends' }) {
  const { currentUser } = useAuth();
  // Primary options: 'your-friends', 'add-friends', 'challenges'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [allAthletes, setAllAthletes] = useState([]);

  // Search & Filter state for Add Friends
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Challenge modal state
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'Fitness',
    rewardXp: 400,
    badgeReward: 'Titan',
  });

  const loadData = async () => {
    if (!currentUser?.uid) return;
    setFriends(socialService.getFriends(currentUser.uid));
    setRequests(socialService.getFriendRequests(currentUser.uid));
    setChallenges(socialService.getChallenges(currentUser.uid));
    const athletes = await socialService.getLegitimateUsers(currentUser.uid);
    setAllAthletes(athletes || []);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handle Add Friend Action from Directory
  const handleAddAthlete = async (athlete) => {
    sfx.playClick();
    try {
      const res = await socialService.sendFriendRequest(currentUser, athlete);
      sfx.playSuccess();
      setFeedbackMsg(res.message);
      await loadData();
    } catch (err) {
      sfx.playError();
      setFeedbackMsg(err.message);
    }
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // Accept Request
  const handleAcceptRequest = async (requestId) => {
    sfx.playSuccess();
    await socialService.acceptFriendRequest(currentUser, requestId);
    await loadData();
  };

  // Reject Request
  const handleRejectRequest = async (requestId) => {
    sfx.playClick();
    await socialService.rejectFriendRequest(currentUser, requestId);
    await loadData();
  };

  // Remove Friend
  const handleRemoveFriend = (friendId) => {
    sfx.playClick();
    if (window.confirm('Remove athlete from your training partners?')) {
      socialService.removeFriend(currentUser?.uid, friendId);
      loadData();
    }
  };

  // Toggle Join Challenge
  const handleToggleJoin = (challengeId) => {
    sfx.playClick();
    const updated = socialService.toggleJoinChallenge(currentUser?.uid, challengeId);
    setChallenges(updated);
  };

  // Create Challenge
  const handleCreateChallengeSubmit = (e) => {
    e.preventDefault();
    if (!newChallenge.title.trim()) return;
    sfx.playSuccess();
    socialService.createChallenge(currentUser?.uid, newChallenge);
    setShowCreateChallenge(false);
    setNewChallenge({ title: '', description: '', type: 'Fitness', rewardXp: 400, badgeReward: 'Titan' });
    loadData();
  };

  // Filtered Athletes in Add Friends
  const filteredAthletes = useMemo(() => {
    let list = allAthletes;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace('@', '');
      list = list.filter(
        (a) =>
          a.displayName.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          (a.discipline && a.discipline.toLowerCase().includes(q)) ||
          (a.bio && a.bio.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }
    if (selectedDiscipline !== 'All') {
      list = list.filter((a) => a.discipline && a.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase()));
    }
    return list;
  }, [allAthletes, searchQuery, selectedDiscipline]);

  const DISCIPLINE_FILTERS = [
    'All',
    'Endurance',
    'Powerlifting',
    'Calisthenics',
    'Triathlon',
    'Track',
    'Weightlifting',
  ];

  return (
    <div className="page-content-wrapper">
      {/* Primary Sub-Tab Switcher: Your Friends vs Add Friends */}
      <section className="social-subtab-bar">
        <div className="tab-pill-container inline">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'your-friends' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('your-friends');
            }}
          >
            <Users size={16} />
            <span>Your Friends ({friends.length})</span>
            {requests.length > 0 && (
              <span className="req-count-badge">{requests.length} new</span>
            )}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'add-friends' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('add-friends');
            }}
          >
            <UserPlus size={16} />
            <span>Add Friends</span>
            <span className="tab-explore-chip">Directory</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setActiveTab('challenges');
            }}
          >
            <Trophy size={16} />
            <span>Challenges ({challenges.length})</span>
          </button>
        </div>

        {activeTab === 'challenges' && (
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowCreateChallenge(true)}
          >
            <span>Create Challenge</span>
          </button>
        )}
      </section>

      {/* Action Notification Banner */}
      {feedbackMsg && (
        <div className="feedback-banner success" style={{ marginBottom: '1.25rem' }}>
          <Sparkles size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ===================================================================
          OPTION 1: YOUR FRIENDS
          =================================================================== */}
      {activeTab === 'your-friends' && (
        <div className="social-tab-content">
          {/* Pending Incoming Requests */}
          {requests.length > 0 && (
            <section className="pending-requests-section">
              <div className="pending-req-header">
                <Clock size={16} className="text-violet" />
                <h3 className="section-heading-sm">Incoming Friend Requests ({requests.length})</h3>
              </div>

              <div className="requests-grid">
                {requests.map((req) => (
                  <div key={req.id} className="request-card">
                    <img src={req.avatar} alt={req.displayName} className="req-avatar" />
                    <div className="req-info">
                      <span className="req-name">{req.displayName}</span>
                      <span className="req-username">@{req.username} • LVL {req.level}</span>
                      <span className="req-time">{req.sentAt}</span>
                    </div>
                    <div className="req-actions">
                      <button
                        type="button"
                        className="btn-req-accept"
                        onClick={() => handleAcceptRequest(req.id)}
                        title="Accept Request"
                      >
                        <Check size={16} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        className="btn-req-reject"
                        onClick={() => handleRejectRequest(req.id)}
                        title="Decline Request"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Training Partners List */}
          <section className="friends-list-section">
            <div className="friends-section-title-row">
              <h3 className="section-heading-sm">Active Training Partners ({friends.length})</h3>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => {
                  sfx.playClick();
                  setActiveTab('add-friends');
                }}
              >
                <UserPlus size={14} />
                <span>Find More Athletes</span>
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="empty-state-card">
                <Users size={44} className="empty-icon" />
                <h3 className="empty-title">Your Friends Roster is Empty</h3>
                <p className="empty-subtitle">
                  Connect with training partners to compare streaks, share accountability, and level up together.
                </p>
                <button
                  type="button"
                  className="btn-primary-add"
                  onClick={() => setActiveTab('add-friends')}
                >
                  <UserPlus size={16} />
                  <span>Discover Athletes in Directory</span>
                </button>
              </div>
            ) : (
              <div className="friends-grid">
                {friends.map((friend) => (
                  <div key={friend.id} className="friend-profile-card">
                    <div className="friend-card-top">
                      <img src={friend.avatar} alt={friend.displayName} className="friend-avatar" />
                      <div className="friend-meta-col">
                        <span className="friend-name">{friend.displayName}</span>
                        <span className="friend-username">@{friend.username}</span>
                        <span className="friend-status-text">{friend.status}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-friend"
                        onClick={() => handleRemoveFriend(friend.id)}
                        title="Remove friend from roster"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>

                    <div className="friend-stats-row">
                      <div className="f-stat">
                        <span className="f-stat-num">LVL {friend.level}</span>
                        <span className="f-stat-lbl">{friend.xp} XP</span>
                      </div>
                      <div className="f-stat">
                        <span className="f-stat-num flame-color">
                          <Flame size={14} /> {friend.currentStreak}d
                        </span>
                        <span className="f-stat-lbl">Streak</span>
                      </div>
                      <div className="f-stat">
                        <span className="f-stat-num">{friend.goalsCompleted}</span>
                        <span className="f-stat-lbl">Goals Crushed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ===================================================================
          OPTION 2: ADD FRIENDS (DIRECTORY & SEARCH ALL USERS)
          =================================================================== */}
      {activeTab === 'add-friends' && (
        <div className="social-tab-content add-friends-view">
          {/* Top Search & Filter Bar */}
          <section className="search-friend-card">
            <div className="search-friend-header">
              <div className="icon-badge-box">
                <UserPlus size={20} className="icon-cyan" />
              </div>
              <div>
                <h3 className="card-heading-sm">Discover Athletes in the LevelUp Arena</h3>
                <p className="card-sub-sm">
                  Search all community members across sports disciplines, send friend requests, and form squads.
                </p>
              </div>
            </div>

            <div className="friend-search-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-field"
                  placeholder="Search athletes by name, username (@elena), sport discipline, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Discipline Quick Filters */}
            <div className="discipline-filter-chips-row">
              {DISCIPLINE_FILTERS.map((disc) => (
                <button
                  key={disc}
                  type="button"
                  className={`disc-filter-chip ${selectedDiscipline === disc ? 'active' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedDiscipline(disc);
                  }}
                >
                  {disc}
                </button>
              ))}
            </div>
          </section>

          {/* Directory Grid Header */}
          <div className="directory-header-row">
            <span className="directory-count-text">
              Showing {filteredAthletes.length} Athlete{filteredAthletes.length === 1 ? '' : 's'}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
              {selectedDiscipline !== 'All' ? ` in ${selectedDiscipline}` : ''}
            </span>
          </div>

          {/* Athletes Cards Directory */}
          {filteredAthletes.length === 0 ? (
            <div className="empty-state-card">
              <Search size={40} className="empty-icon" />
              <h3 className="empty-title">No Athletes Found</h3>
              <p className="empty-subtitle">
                No community athletes matched "{searchQuery}". Try searching by another sport or username.
              </p>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDiscipline('All');
                }}
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <div className="community-athletes-grid">
              {filteredAthletes.map((athlete) => {
                return (
                  <div key={athlete.id} className="athlete-directory-card">
                    <div className="athlete-card-header">
                      <div className="avatar-wrapper">
                        <img
                          src={athlete.avatar}
                          alt={athlete.displayName}
                          className="directory-avatar"
                        />
                        <span className="lvl-bubble">LVL {athlete.level}</span>
                      </div>

                      <div className="athlete-identity">
                        <h4 className="athlete-name">{athlete.displayName}</h4>
                        <span className="athlete-handle">@{athlete.username}</span>
                        {athlete.location && (
                          <span className="athlete-loc">
                            <MapPin size={12} />
                            <span>{athlete.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="discipline-tag-wrap">
                      <span className="athlete-discipline-badge">{athlete.discipline}</span>
                    </div>

                    <p className="athlete-bio">{athlete.bio}</p>

                    <div className="athlete-stats-strip">
                      <div className="ath-stat-item">
                        <span className="ath-stat-val text-violet">{athlete.xp}</span>
                        <span className="ath-stat-lbl">XP</span>
                      </div>
                      <div className="ath-stat-item">
                        <span className="ath-stat-val text-gold">
                          <Flame size={13} style={{ display: 'inline', marginRight: 2 }} />
                          {athlete.currentStreak}d
                        </span>
                        <span className="ath-stat-lbl">Streak</span>
                      </div>
                      <div className="ath-stat-item">
                        <span className="ath-stat-val">{athlete.goalsCompleted}</span>
                        <span className="ath-stat-lbl">Goals</span>
                      </div>
                    </div>

                    <div className="athlete-card-action">
                      {athlete.isFriend ? (
                        <button
                          type="button"
                          className="btn-friend-status friends"
                          disabled
                        >
                          <CheckCircle2 size={16} />
                          <span>Friends</span>
                        </button>
                      ) : athlete.isPending ? (
                        <button
                          type="button"
                          className="btn-friend-status pending"
                          disabled
                        >
                          <Zap size={14} />
                          <span>Request Sent</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-add-athlete-action"
                          onClick={() => handleAddAthlete(athlete)}
                        >
                          <UserPlus size={16} />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          OPTION 3: CHALLENGES
          =================================================================== */}
      {activeTab === 'challenges' && (
        <div className="social-tab-content">
          <div className="challenges-grid">
            {challenges.map((ch) => (
              <div key={ch.id} className={`challenge-card ${ch.isJoined ? 'joined' : ''}`}>
                <div className="challenge-header">
                  <span className="challenge-type-chip">{ch.type}</span>
                  <span className="challenge-reward-badge">+{ch.rewardXp} XP</span>
                </div>

                <h3 className="challenge-title">{ch.title}</h3>
                <p className="challenge-desc">{ch.description}</p>

                <div className="challenge-meta-row">
                  <span className="ch-meta">
                    <Calendar size={14} />
                    <span>{ch.startDate} – {ch.endDate}</span>
                  </span>
                  <span className="ch-meta">
                    <Users size={14} />
                    <span>{ch.participantsCount} Athletes</span>
                  </span>
                </div>

                {ch.isJoined && (
                  <div className="ch-progress-wrap">
                    <div className="ch-progress-labels">
                      <span>Personal Progress</span>
                      <span>{ch.userProgress}%</span>
                    </div>
                    <div className="ch-progress-track">
                      <div className="ch-progress-fill" style={{ width: `${ch.userProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="challenge-card-footer">
                  <span className="badge-preview">🏅 {ch.badgeReward}</span>
                  <button
                    type="button"
                    className={`btn-challenge-toggle ${ch.isJoined ? 'joined' : ''}`}
                    onClick={() => handleToggleJoin(ch.id)}
                  >
                    {ch.isJoined ? 'Joined ✓' : 'Join Challenge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <div className="modal-overlay" onClick={() => setShowCreateChallenge(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Launch Athletic Challenge</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateChallenge(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChallengeSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Challenge Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 100k Steps in 10 Days"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Rules</label>
                <textarea
                  className="form-textarea"
                  placeholder="Define qualifying criteria and daily discipline requirements..."
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={newChallenge.type}
                    onChange={(e) => setNewChallenge({ ...newChallenge, type: e.target.value })}
                  >
                    <option value="Fitness">Fitness</option>
                    <option value="Consistency">Consistency</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">XP Reward</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newChallenge.rewardXp}
                    onChange={(e) => setNewChallenge({ ...newChallenge, rewardXp: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateChallenge(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-add">
                  Deploy to Arena
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
