import { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
  Filter,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Edit2,
  BookOpen,
  Dumbbell,
  Heart,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { goalsService } from '../services/goalsService';
import { getTodayDateKey, formatDateDisplay } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';

const CATEGORIES = ['All', 'Study', 'Fitness', 'Health', 'Personal Development', 'Work'];

export default function GoalsPage({ onOpenAddGoal, onEditGoal }) {
  const { currentUser, awardXp } = useAuth();
  const [goals, setGoals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [completedGoalIds, setCompletedGoalIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [streaks, setStreaks] = useState({ currentStreak: 0, bestStreak: 0 });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  const todayKey = getTodayDateKey();

  // Reset and subscribe to Firestore goals on user or date change
  useEffect(() => {
    // 1. Immediately wipe previous user's goals to prevent data leaks between accounts
    setGoals([]);
    setCompletedGoalIds([]);
    setFirestoreError(null);
    setLoading(true);

    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // 2. Real-time Firestore subscription to users/{uid}/goals
    const unsubscribeGoals = goalsService.subscribeToGoals(
      currentUser.uid,
      (liveGoals) => {
        const cleanGoals = (liveGoals || []).filter(
          (g) => g.id !== 'goal_wake_up' && g.id !== 'goal_drink_3l'
        );
        setGoals(cleanGoals);
        setLoading(false);
        setFirestoreError(null);
        const streakData = goalsService.calculateStreaks(currentUser.uid);
        setStreaks(streakData);
      },
      (err) => {
        setLoading(false);
        if (err.code === 'permission-denied') {
          setFirestoreError(
            'Firestore Permission Notice: Ensure Firestore Security Rules permit read/write for users/' +
              currentUser.uid +
              '.'
          );
        } else {
          setFirestoreError(`Firestore: ${err.message || 'Offline resilient sync active'}`);
        }
      }
    );

    // 3. Load daily completed goals for selectedDate from users/{uid}/dailyLogs/{date}
    goalsService
      .getDailyLog(currentUser.uid, selectedDate)
      .then((logs) => {
        setCompletedGoalIds(logs || []);
      })
      .catch((err) => {
        console.warn('Error loading daily log:', err);
      });

    return () => {
      if (typeof unsubscribeGoals === 'function') unsubscribeGoals();
    };
  }, [currentUser?.uid, selectedDate]);

  // Handle Goal Checkbox Toggle
  const handleToggleGoal = async (goalId) => {
    sfx.playClick();
    const result = await goalsService.toggleGoalCompletion(currentUser?.uid, goalId, selectedDate);
    setCompletedGoalIds(result.completedGoalIds);

    if (result.isCompletedNow) {
      sfx.playSuccess();
      awardXp(25, 'Goal Completed');
    }
  };

  // Pause / Resume Goal
  const handleTogglePause = async (goal) => {
    sfx.playClick();
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    setActiveMenuId(null);
    await goalsService.updateGoal(currentUser?.uid, goal.id, { status: newStatus });
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId) => {
    sfx.playClick();
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setActiveMenuId(null);
      await goalsService.deleteGoal(currentUser?.uid, goalId);
    }
  };

  // Navigate Days
  const handleDateChange = (deltaDays) => {
    sfx.playClick();
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
      current.getDate()
    ).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  // Filter Goals
  const filteredGoals = goals.filter((g) => {
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const scheduledGoals = filteredGoals.filter((g) => g.status !== 'paused');
  const completedTodayCount = completedGoalIds.filter((id) =>
    scheduledGoals.some((g) => g.id === id)
  ).length;
  const completionPercentage =
    scheduledGoals.length > 0
      ? Math.round((completedTodayCount / scheduledGoals.length) * 100)
      : 0;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Study':
        return <BookOpen size={16} className="cat-icon blue" />;
      case 'Fitness':
        return <Dumbbell size={16} className="cat-icon violet" />;
      case 'Health':
        return <Heart size={16} className="cat-icon green" />;
      case 'Work':
        return <Briefcase size={16} className="cat-icon cyan" />;
      default:
        return <Target size={16} className="cat-icon orange" />;
    }
  };

  return (
    <div className="page-content-wrapper">
      {/* Top Header & Date Navigation Strip */}
      <section className="goals-top-bar">
        <div className="date-navigation-cluster">
          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => handleDateChange(-1)}
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="date-display-badge">
            <Calendar size={16} className="date-icon" />
            <span className="date-text">
              {selectedDate === todayKey ? `Today, ${formatDateDisplay(selectedDate)}` : formatDateDisplay(selectedDate)}
            </span>
          </div>

          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => handleDateChange(1)}
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {selectedDate !== todayKey && (
            <button
              type="button"
              className="btn-today-pill"
              onClick={() => setSelectedDate(todayKey)}
            >
              Jump to Today
            </button>
          )}
        </div>

        <button type="button" className="btn-primary-add" onClick={onOpenAddGoal}>
          <Plus size={18} />
          <span>New Goal</span>
        </button>
      </section>

      {/* KPI Stats Strip for Goals */}
      <section className="goals-stats-row">
        <div className="goal-mini-stat">
          <span className="mini-stat-label">Completion on {formatDateDisplay(selectedDate)}</span>
          <div className="mini-stat-val">
            <span>{completionPercentage}%</span>
            <span className="mini-stat-sub">({completedTodayCount}/{scheduledGoals.length} targets)</span>
          </div>
        </div>

        <div className="goal-mini-stat">
          <span className="mini-stat-label">Active Disciplines</span>
          <div className="mini-stat-val">
            <span>{scheduledGoals.length}</span>
            <span className="mini-stat-sub">Tracked daily</span>
          </div>
        </div>

        <div className="goal-mini-stat">
          <span className="mini-stat-label">Current Momentum</span>
          <div className="mini-stat-val flame-text">
            <Flame size={20} />
            <span>{streaks.currentStreak} Days</span>
          </div>
        </div>

        <div className="goal-mini-stat">
          <span className="mini-stat-label">Best Historical Streak</span>
          <div className="mini-stat-val">
            <span>{streaks.bestStreak} Days</span>
          </div>
        </div>
      </section>

      {/* Filters Strip */}
      <section className="filter-pills-bar">
        <div className="category-pills-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                sfx.playClick();
                setSelectedCategory(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="status-filter-pills">
          <button
            type="button"
            className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'paused' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paused')}
          >
            Paused
          </button>
        </div>
      </section>

      {/* Firestore Error Alert */}
      {firestoreError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.25rem',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          fontSize: '0.92rem'
        }}>
          <AlertCircle size={22} style={{ flexShrink: 0, color: '#ef4444' }} />
          <div>
            <div style={{ fontWeight: '700', color: '#f87171', marginBottom: '0.2rem' }}>Firestore Notice</div>
            <div style={{ color: '#cbd5e1' }}>{firestoreError}</div>
          </div>
        </div>
      )}

      {/* Goals List Cards */}
      <section className="goals-list-section">
        {loading ? (
          <div className="empty-state-card" style={{ padding: '3.5rem 1rem' }}>
            <Loader2 size={36} className="spin-icon" style={{ animation: 'spin 1s linear infinite', color: '#a855f7', marginBottom: '1rem' }} />
            <h3 className="empty-title">Accessing Firestore Arena...</h3>
            <p className="empty-subtitle">
              Retrieving live goals from users/{currentUser?.uid}/goals...
            </p>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="empty-state-card">
            <Target size={44} className="empty-icon" />
            <h3 className="empty-title">No Goals Found</h3>
            <p className="empty-subtitle">
              Start by defining high-impact personal, academic, or fitness goals to track daily.
            </p>
            <button type="button" className="btn-primary-add" onClick={onOpenAddGoal}>
              <Plus size={18} />
              <span>Create First Goal</span>
            </button>
          </div>
        ) : (
          <div className="goals-cards-stack">
            {filteredGoals.map((goal) => {
              const isDone = completedGoalIds.includes(goal.id);
              const isPaused = goal.status === 'paused';

              return (
                <div
                  key={goal.id}
                  className={`goal-card-item ${isDone ? 'done' : ''} ${isPaused ? 'paused' : ''}`}
                >
                  <div
                    className="goal-toggle-clickable"
                    onClick={() => !isPaused && handleToggleGoal(goal.id)}
                  >
                    <div className="check-box-indicator">
                      {isDone ? (
                        <CheckCircle2 size={24} className="icon-checked" />
                      ) : (
                        <Circle size={24} className="icon-unchecked" />
                      )}
                    </div>

                    <div className="goal-info-block">
                      <div className="goal-header-line">
                        <h4 className="goal-item-title">{goal.title}</h4>
                        <span className="goal-cat-badge">
                          {getCategoryIcon(goal.category)}
                          <span>{goal.category}</span>
                        </span>
                        {isPaused && <span className="status-pill paused">Paused</span>}
                      </div>

                      {goal.description && <p className="goal-item-desc">{goal.description}</p>}

                      <div className="goal-meta-chips">
                        <span className="meta-chip">
                          Target: <strong>{goal.targetValue} {goal.targetUnit}</strong>
                        </span>
                        <span className="meta-chip">Freq: {goal.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="goal-action-menu-wrap">
                    <button
                      type="button"
                      className="icon-dots-btn"
                      onClick={() => setActiveMenuId(activeMenuId === goal.id ? null : goal.id)}
                      title="Options"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenuId === goal.id && (
                      <div className="dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditGoal(goal);
                          }}
                        >
                          <Edit2 size={14} />
                          <span>Edit Goal</span>
                        </button>

                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => handleTogglePause(goal)}
                        >
                          {isPaused ? <Play size={14} /> : <Pause size={14} />}
                          <span>{isPaused ? 'Resume Goal' : 'Pause Goal'}</span>
                        </button>

                        <button
                          type="button"
                          className="dropdown-item delete"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 size={14} />
                          <span>Delete Goal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
