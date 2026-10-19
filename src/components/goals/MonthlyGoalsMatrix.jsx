import { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Trash2, ChevronDown, Target } from 'lucide-react';
import { goalsService } from '../../services/goalsService';
import { sfx } from '../../utils/soundEngine';

const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyGoalsMatrix({
  goals = [],
  dailyLogs = {},
  currentUser,
  onRefresh,
  viewMode: controlledViewMode,
  onViewModeChange,
  selectedGoalId = null,
  onSelectGoal,
  selectedDay = null,
  onSelectDay,
  onLogsChange,
  onActiveGoalsChange,
}) {
  const [currentDate] = useState(new Date());
  const [internalViewMode, setInternalViewMode] = useState('month'); // 'week' | 'month'
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

  const handleViewModeChange = (mode) => {
    sfx.playClick();
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Health');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local optimistic logs state (excluding any legacy demo goal IDs)
  const [localLogs, setLocalLogs] = useState(() => {
    const cleaned = {};
    if (dailyLogs) {
      Object.entries(dailyLogs).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          const filtered = v.filter((id) => id !== 'goal_wake_up' && id !== 'goal_drink_3l');
          if (filtered.length > 0) cleaned[k] = filtered;
        }
      });
    }
    return cleaned;
  });

  useEffect(() => {
    if (dailyLogs) {
      const cleaned = {};
      Object.entries(dailyLogs).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          const filtered = v.filter((id) => id !== 'goal_wake_up' && id !== 'goal_drink_3l');
          if (filtered.length > 0) cleaned[k] = filtered;
        }
      });
      setLocalLogs(cleaned);
    }
  }, [dailyLogs]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper: Format YYYY-MM-DD
  const getDateKey = (dayNum) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Only display genuine user-created goals (clean slate for user data)
  const displayGoals = useMemo(() => {
    return (goals || []).filter((g) => g.id !== 'goal_wake_up' && g.id !== 'goal_drink_3l');
  }, [goals]);

  // Notify parent of active display goals
  useEffect(() => {
    if (onActiveGoalsChange) {
      onActiveGoalsChange(displayGoals);
    }
  }, [displayGoals, onActiveGoalsChange]);

  // Calculate days to display based on viewMode ('week' or 'month')
  const displayedDays = useMemo(() => {
    const all = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      all.push({
        dayNum: d,
        dayName: DAYS_SHORT[dateObj.getDay()],
        dateKey: getDateKey(d),
      });
    }

    if (viewMode === 'week') {
      // 7 days centered around today
      const start = Math.max(1, Math.min(todayDateNum - 3, daysInMonth - 6));
      return all.slice(start - 1, start + 6);
    }

    return all;
  }, [year, month, daysInMonth, viewMode, todayDateNum]);

  // Check if a goal is completed on a date
  const isGoalDoneOnDay = (goalId, dateKey) => {
    const list = localLogs[dateKey] || [];
    return list.includes(goalId);
  };

  // Get total days completed for this goal in current month
  const getGoalMonthCompletions = (goalId) => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = getDateKey(d);
      if (isGoalDoneOnDay(goalId, dateKey)) {
        count++;
      }
    }
    return count;
  };

  // Toggle cell on any day
  const handleToggleCell = async (goalId, dateKey) => {
    sfx.playClick();
    const currentlyDone = isGoalDoneOnDay(goalId, dateKey);

    // Optimistic state update
    const currentList = localLogs[dateKey] || [];
    const updatedList = currentlyDone
      ? currentList.filter((id) => id !== goalId)
      : [...currentList, goalId];

    const updatedLogs = {
      ...localLogs,
      [dateKey]: updatedList,
    };

    setLocalLogs(updatedLogs);
    if (onLogsChange) {
      onLogsChange(updatedLogs);
    }

    if (!currentlyDone) {
      sfx.playSuccess();
    }

    // Persist via goalsService
    if (currentUser?.uid) {
      try {
        await goalsService.toggleGoalCompletion(currentUser.uid, goalId, dateKey);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Failed to toggle goal completion:', err);
      }
    }
  };

  // Quick Add Goal Submission
  const handleQuickAdd = async (e) => {
    if (e) e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    sfx.playSuccess();
    setIsSubmitting(true);

    try {
      if (currentUser?.uid) {
        await goalsService.createGoal(currentUser.uid, {
          title,
          category: quickCategory,
          frequency: 'daily',
          targetValue: 1,
          targetUnit: 'session',
        });
      }
      setQuickTitle('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error creating goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Goal Action
  const handleDeleteGoal = async (goalId) => {
    sfx.playClick();
    if (window.confirm('Delete this routine goal from matrix?')) {
      if (currentUser?.uid) {
        try {
          await goalsService.deleteGoal(currentUser.uid, goalId);
          if (onRefresh) onRefresh();
        } catch (err) {
          console.error('Failed to delete goal:', err);
        }
      }
    }
  };

  return (
    <div className="routine-matrix-container">
      {/* ===================================================================
          1. Quick Add Goal Bar (Matching User Reference Image)
          =================================================================== */}
      <form onSubmit={handleQuickAdd} className="matrix-quick-add-bar">
        <div className="quick-add-input-wrap">
          <Clock size={16} className="quick-add-clock-icon" />
          <input
            type="text"
            className="quick-add-input"
            placeholder="Add a new daily routine goal (e.g., Morning Workout, Read 20 mins, Drink 3L Water)..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="quick-add-category-select-wrap">
          <select
            className="quick-add-category-select"
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="Health">💪 Health & Fitness</option>
            <option value="Discipline">📚 Discipline & Study</option>
            <option value="Mindset">🧘 Mindset & Focus</option>
            <option value="Work">💼 Work & Career</option>
            <option value="Custom">🎯 Personal Habit</option>
          </select>
          <ChevronDown size={14} className="category-select-arrow" />
        </div>

        <button
          type="submit"
          className="quick-add-submit-btn"
          disabled={!quickTitle.trim() || isSubmitting}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Goal</span>
        </button>
      </form>

      {/* ===================================================================
          2. Routine Matrix Card Container (Matching User Reference Image)
          =================================================================== */}
      <div className="routine-matrix-card">
        {/* Header Row */}
        <div className="routine-matrix-header">
          <div className="matrix-title-col">
            <h2 className="routine-matrix-title">
              {MONTH_NAMES[month]} {year} Routine Matrix
            </h2>
            <span className="matrix-active-badge">
              {displayGoals.length} Goals Active
            </span>
          </div>

          <div className="matrix-view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('week')}
              title="Filter matrix and performance graph to current 7-day window"
            >
              1 Week (7d)
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('month')}
              title="Filter matrix and performance graph to all 31 days of the month"
            >
              Full Month
            </button>
          </div>
        </div>

        {/* 2b. Matrix Interactive Graph Filter Pills */}
        <div className="matrix-filter-bar">
          <span className="matrix-filter-label">Graph Focus:</span>
          <button
            type="button"
            className={`matrix-filter-chip ${!selectedGoalId ? 'active' : ''}`}
            onClick={() => {
              sfx.playClick();
              if (onSelectGoal) onSelectGoal(null);
            }}
            title="Update graph to show aggregated completion of all active goals"
          >
            All Goals ({displayGoals.length})
          </button>
          {displayGoals.map((g) => {
            const isFocused = selectedGoalId === g.id;
            const count = getGoalMonthCompletions(g.id);
            return (
              <button
                key={g.id}
                type="button"
                className={`matrix-filter-chip ${isFocused ? 'active' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  if (onSelectGoal) onSelectGoal(isFocused ? null : g.id);
                }}
                title={`Filter performance graph to "${g.title}"`}
              >
                <span className="chip-indicator" />
                <span>{g.title}</span>
                <span className="chip-count">({count}d)</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Table Grid with Custom Glowing Scrollbar */}
        <div className="matrix-table-scroll-container">
          <table className="routine-matrix-table">
            <thead>
              <tr>
                <th className="col-goal-header">Daily Goal / Routine</th>
                {displayedDays.map((d) => {
                  const isToday = isCurrentMonth && d.dayNum === todayDateNum;
                  const isSelectedDay = selectedDay === d.dayNum;
                  return (
                    <th
                      key={d.dayNum}
                      className={`col-day-header clickable ${isToday ? 'is-today-col' : ''} ${
                        isSelectedDay ? 'is-selected-day' : ''
                      }`}
                      onClick={() => {
                        sfx.playClick();
                        if (onSelectDay) {
                          onSelectDay(isSelectedDay ? null : d.dayNum);
                        }
                      }}
                      title={`Click to focus performance graph on Day ${d.dayNum} (${d.dayName})`}
                    >
                      <div className="day-header-content">
                        <span className="day-number-text">{d.dayNum}</span>
                        <span className="day-name-text">{d.dayName}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayGoals.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayedDays.length + 1}
                    style={{
                      textAlign: 'center',
                      padding: '3.5rem 1.5rem',
                      color: '#94a3b8',
                      background: 'rgba(19, 21, 31, 0.45)',
                    }}
                  >
                    <Target
                      size={34}
                      style={{
                        color: '#00f2cb',
                        margin: '0 auto 0.75rem',
                        display: 'block',
                        opacity: 0.85,
                      }}
                    />
                    <div
                      style={{
                        fontWeight: '700',
                        color: '#f1f5f9',
                        marginBottom: '0.4rem',
                        fontSize: '0.98rem',
                      }}
                    >
                      No Routine Goals in Monthly Matrix
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        maxWidth: '460px',
                        margin: '0 auto',
                        lineHeight: '1.5',
                      }}
                    >
                      Type your daily routine or habit in the input bar above (e.g. <em>Morning Workout</em>, <em>Read 20 mins</em>, <em>Drink 3L Water</em>) and click <strong>Add Goal</strong> to start tracking!
                    </div>
                  </td>
                </tr>
              ) : (
                displayGoals.map((goal) => {
                const completedCount = getGoalMonthCompletions(goal.id);
                const isSelectedGoal = selectedGoalId === goal.id;
                return (
                  <tr
                    key={goal.id}
                    className={`matrix-data-row ${isSelectedGoal ? 'is-selected-goal' : ''}`}
                  >
                    {/* Goal Info Cell */}
                    <td
                      className={`cell-goal-info clickable ${isSelectedGoal ? 'is-selected-goal' : ''}`}
                      onClick={() => {
                        sfx.playClick();
                        if (onSelectGoal) {
                          onSelectGoal(isSelectedGoal ? null : goal.id);
                        }
                      }}
                      title={`Click to focus performance graph on "${goal.title}"`}
                    >
                      <div className="goal-title-container">
                        <span className="goal-neon-bar" />
                        <div className="goal-text-group">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="goal-title-label">{goal.title}</span>
                            {isSelectedGoal && (
                              <span className="goal-focus-tag">Graph Focus</span>
                            )}
                          </div>
                          <span className="goal-category-label">{goal.category}</span>
                        </div>
                      </div>

                      <div className="goal-actions-group" onClick={(e) => e.stopPropagation()}>
                        <span className="goal-ratio-badge">
                          {completedCount}/{daysInMonth}
                        </span>
                        <button
                          type="button"
                          className="goal-delete-btn"
                          onClick={() => handleDeleteGoal(goal.id)}
                          title="Delete Goal"
                          aria-label={`Delete ${goal.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Day Checkbox Cells */}
                    {displayedDays.map((d) => {
                      const isDone = isGoalDoneOnDay(goal.id, d.dateKey);
                      const isToday = isCurrentMonth && d.dayNum === todayDateNum;
                      const isSelectedDay = selectedDay === d.dayNum;
                      return (
                        <td
                          key={d.dayNum}
                          className={`cell-day-checkbox ${isToday ? 'is-today-col' : ''} ${
                            isSelectedDay ? 'is-selected-day' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className={`matrix-checkbox-box ${isDone ? 'checked' : ''}`}
                            onClick={() => handleToggleCell(goal.id, d.dateKey)}
                            title={`${goal.title} on ${MONTH_NAMES[month]} ${d.dayNum}: ${
                              isDone ? 'Completed (Click to uncheck)' : 'Click to complete'
                            }`}
                            aria-label={`Toggle ${goal.title} on ${MONTH_NAMES[month]} ${d.dayNum}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
