import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  Utensils,
  Dumbbell,
  Zap,
  TrendingUp,
  Sparkles,
  Trophy,
  Calendar as CalendarIcon,
  Plus,
  BookOpen,
  Heart,
  Briefcase,
  Target,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsService } from '../services/goalsService';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { gamificationService } from '../services/gamificationService';
import { getTodayDateKey, formatDateDisplay } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';
import MonthlyGoalsMatrix from '../components/goals/MonthlyGoalsMatrix';

// Default starter logs matching the matrix reference image
const getInitialStarterLogs = () => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const seeded = {};
  [7, 9, 13].forEach((day) => {
    const dStr = String(day).padStart(2, '0');
    const key = `${yr}-${mo}-${dStr}`;
    seeded[key] = [...(seeded[key] || []), 'goal_wake_up'];
  });
  [6, 13, 16, 19].forEach((day) => {
    const dStr = String(day).padStart(2, '0');
    const key = `${yr}-${mo}-${dStr}`;
    seeded[key] = [...(seeded[key] || []), 'goal_drink_3l'];
  });
  return seeded;
};

// Rich Interactive Tooltip for Matrix Goal Completion Bar Chart
const MatrixChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: '#121624',
          border: '1px solid rgba(0, 242, 203, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 14px rgba(0, 242, 203, 0.25)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          color: '#fff',
          fontSize: '0.82rem',
          minWidth: '190px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.4rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '0.35rem',
          }}
        >
          <span style={{ fontWeight: '800', color: '#f8fafc' }}>
            {data.formattedDate || `Day ${data.dayNum}`}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              color: data.rate === 100 ? '#00f2cb' : data.rate > 0 ? '#c084fc' : '#94a3b8',
              background: data.rate === 100 ? 'rgba(0, 242, 203, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            {data.rate}%
          </span>
        </div>
        <div style={{ color: '#cbd5e1', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
          <strong>{data.completed}</strong> of <strong>{data.scheduled}</strong>{' '}
          {data.scheduled === 1 ? 'goal routine' : 'goal routines'} completed
        </div>
        {data.completedGoalTitles && data.completedGoalTitles.length > 0 && (
          <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#00f2cb', fontWeight: '700', marginBottom: '2px' }}>
              Crushed:
            </div>
            {data.completedGoalTitles.map((t, idx) => (
              <div key={idx} style={{ fontSize: '0.74rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#00f2cb' }}>✓</span> {t}
              </div>
            ))}
          </div>
        )}
        {data.pendingGoalTitles && data.pendingGoalTitles.length > 0 && (
          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              Pending:
            </div>
            {data.pendingGoalTitles.map((t, idx) => (
              <div key={idx} style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#64748b' }}>○</span> {t}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Tooltip for Habit Consistency Trend Area Chart
const TrendChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: '#121624',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 12px rgba(139, 92, 246, 0.25)',
          borderRadius: '10px',
          padding: '0.65rem 0.9rem',
          color: '#fff',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ fontWeight: '800', color: '#f8fafc', marginBottom: '0.25rem' }}>
          {data.label || data.week || data.day}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#c084fc', fontWeight: '800', fontSize: '0.95rem' }}>
            {data.score}%
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Consistency Index</span>
        </div>
        {data.details && (
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
            {data.details}
          </div>
        )}
      </div>
    );
  }
  return null;
};


export default function OverviewPage({ onOpenAddGoal, onNavigate }) {
  const { currentUser, awardXp } = useAuth();
  const [goals, setGoals] = useState([]);
  const [completedGoalIds, setCompletedGoalIds] = useState([]);
  const [allDailyLogs, setAllDailyLogs] = useState(() => getInitialStarterLogs());
  const [nutritionTotals, setNutritionTotals] = useState(null);
  const [streaks, setStreaks] = useState({ currentStreak: 0, bestStreak: 0 });
  const [loading, setLoading] = useState(true);

  // Matrix-driven graph interaction state
  const [matrixViewMode, setMatrixViewMode] = useState('month'); // 'week' | 'month'
  const [matrixSelectedGoalId, setMatrixSelectedGoalId] = useState(null);
  const [matrixSelectedDay, setMatrixSelectedDay] = useState(null);
  const [activeMatrixGoals, setActiveMatrixGoals] = useState([]);

  const todayKey = getTodayDateKey();

  // Reset and subscribe to live Firestore metrics
  useEffect(() => {
    // 1. Immediately wipe previous user state
    setGoals([]);
    setCompletedGoalIds([]);
    setNutritionTotals(null);
    setLoading(true);

    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // 2. Real-time Firestore goals subscription: users/{uid}/goals
    const unsubscribeGoals = goalsService.subscribeToGoals(
      currentUser.uid,
      (liveGoals) => {
        const activeGoals = (liveGoals || []).filter((g) => g.status !== 'paused');
        setGoals(activeGoals);
        setLoading(false);
        const streakData = goalsService.calculateStreaks(currentUser.uid);
        setStreaks(streakData);
      },
      () => {
        setLoading(false);
      }
    );

    // 3. Load today's completed goals from users/{uid}/dailyLogs/{todayKey}
    goalsService.getDailyLog(currentUser.uid, todayKey).then((dayLogs) => {
      setCompletedGoalIds(dayLogs || []);
      const logs = goalsService.getAllDailyLogs(currentUser.uid);
      if (logs && Object.keys(logs).length > 0) {
        setAllDailyLogs(logs);
      }
    });

    // 4. Load nutrition logs for today
    nutritionService.getDayLogs(currentUser.uid, todayKey).then((foodLogs) => {
      const userTargets = currentUser?.targets || {
        calories: 2600,
        protein: 165,
        carbs: 280,
        fats: 70,
      };
      setNutritionTotals(nutritionService.calculateTotals(foodLogs, userTargets));
    });

    return () => {
      if (typeof unsubscribeGoals === 'function') unsubscribeGoals();
    };
  }, [currentUser?.uid]);

  // Handle Goal Checkbox Toggle
  const handleToggleGoal = async (goalId) => {
    sfx.playClick();
    const result = await goalsService.toggleGoalCompletion(currentUser?.uid, goalId, todayKey);
    setCompletedGoalIds(result.completedGoalIds);
    setAllDailyLogs((prev) => ({
      ...prev,
      [todayKey]: result.completedGoalIds,
    }));

    if (result.isCompletedNow) {
      sfx.playSuccess();
      awardXp(25, 'Goal Completed');
    }
  };

  // Calculations
  const totalGoalsCount = goals.length;
  const completedCount = completedGoalIds.filter((id) => goals.some((g) => g.id === id)).length;
  const progressPct = totalGoalsCount > 0 ? Math.round((completedCount / totalGoalsCount) * 100) : 0;
  const isAllCompleted = totalGoalsCount > 0 && completedCount === totalGoalsCount;

  // Level & XP
  const levelInfo = gamificationService.calculateLevel(currentUser?.xp || 2450);

  // Effective active goals across dashboard and matrix
  const effectiveGoals = useMemo(() => {
    if (goals && goals.length > 0) return goals;
    if (activeMatrixGoals && activeMatrixGoals.length > 0) return activeMatrixGoals;
    return [
      { id: 'goal_wake_up', title: 'wake up', category: 'Health' },
      { id: 'goal_drink_3l', title: 'druink 3 l', category: 'Health' },
    ];
  }, [goals, activeMatrixGoals]);

  // Selected goal object if filtered
  const selectedGoalObj = useMemo(() => {
    if (!matrixSelectedGoalId) return null;
    return effectiveGoals.find((g) => g.id === matrixSelectedGoalId) || null;
  }, [matrixSelectedGoalId, effectiveGoals]);

  // Dynamic Bar Chart Data: Computed directly from the Monthly Matrix selections & logs
  const matrixBarChartData = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const totalDays = new Date(curYear, curMonth + 1, 0).getDate();
    const curTodayNum = now.getDate();

    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let daysToInclude = [];
    if (matrixViewMode === 'week') {
      const start = Math.max(1, Math.min(curTodayNum - 3, totalDays - 6));
      for (let d = start; d < start + 7; d++) {
        daysToInclude.push(d);
      }
    } else {
      for (let d = 1; d <= totalDays; d++) {
        daysToInclude.push(d);
      }
    }

    const targetGoals = matrixSelectedGoalId
      ? effectiveGoals.filter((g) => g.id === matrixSelectedGoalId)
      : effectiveGoals;

    const scheduledCount = Math.max(1, targetGoals.length);

    return daysToInclude.map((dayNum) => {
      const dateObj = new Date(curYear, curMonth, dayNum);
      const dayName = DAYS_SHORT[dateObj.getDay()];
      const mStr = String(curMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateKey = `${curYear}-${mStr}-${dStr}`;

      const logsForDate = allDailyLogs[dateKey] || [];
      const completedGoalsList = targetGoals.filter((g) => logsForDate.includes(g.id));
      const pendingGoalsList = targetGoals.filter((g) => !logsForDate.includes(g.id));
      const completedCount = completedGoalsList.length;

      const rate = Math.round((completedCount / scheduledCount) * 100);

      return {
        day: matrixViewMode === 'week' ? `${dayNum} ${dayName}` : `${dayNum}`,
        dayNum,
        dayName,
        dateKey,
        formattedDate: `Oct ${dayNum}, ${curYear} (${dayName})`,
        completed: completedCount,
        scheduled: scheduledCount,
        rate,
        isToday: dayNum === curTodayNum,
        isSelected: matrixSelectedDay === dayNum,
        completedGoalTitles: completedGoalsList.map((g) => g.title),
        pendingGoalTitles: pendingGoalsList.map((g) => g.title),
      };
    });
  }, [matrixViewMode, matrixSelectedGoalId, matrixSelectedDay, effectiveGoals, allDailyLogs]);

  // Selected Day Details for Inspector Badge
  const selectedDayStats = useMemo(() => {
    if (!matrixSelectedDay) return null;
    return matrixBarChartData.find((d) => d.dayNum === matrixSelectedDay) || null;
  }, [matrixSelectedDay, matrixBarChartData]);

  // Dynamic Habit Consistency Trend Data: Rolling momentum or weekly buckets from matrix
  const matrixTrendChartData = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const totalDays = new Date(curYear, curMonth + 1, 0).getDate();
    const curTodayNum = now.getDate();

    const targetGoals = matrixSelectedGoalId
      ? effectiveGoals.filter((g) => g.id === matrixSelectedGoalId)
      : effectiveGoals;

    const scheduledCount = Math.max(1, targetGoals.length);

    const getDayRate = (dayNum) => {
      const mStr = String(curMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateKey = `${curYear}-${mStr}-${dStr}`;
      const logsForDate = allDailyLogs[dateKey] || [];
      const done = targetGoals.filter((g) => logsForDate.includes(g.id)).length;
      return Math.round((done / scheduledCount) * 100);
    };

    if (matrixViewMode === 'week') {
      const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const start = Math.max(1, Math.min(curTodayNum - 3, totalDays - 6));
      return Array.from({ length: 7 }, (_, i) => {
        const d = start + i;
        const dateObj = new Date(curYear, curMonth, d);
        const dayName = DAYS_SHORT[dateObj.getDay()];
        const score = getDayRate(d);
        return {
          week: `${d} ${dayName}`,
          label: `Oct ${d} (${dayName})`,
          score,
          details: `Adherence on Oct ${d}: ${score}%`,
        };
      });
    }

    // Full Month View: 5 Weekly consistency milestones
    const weekBuckets = [
      { name: 'W1 (1-7)', start: 1, end: 7 },
      { name: 'W2 (8-14)', start: 8, end: 14 },
      { name: 'W3 (15-21)', start: 15, end: 21 },
      { name: 'W4 (22-28)', start: 22, end: 28 },
      { name: 'W5 (29-31)', start: 29, end: totalDays },
    ];

    return weekBuckets.map((bucket) => {
      let sum = 0;
      let count = 0;
      for (let d = bucket.start; d <= bucket.end; d++) {
        sum += getDayRate(d);
        count++;
      }
      const avg = Math.round(sum / count);
      return {
        week: bucket.name,
        label: `October ${bucket.start} - ${bucket.end}`,
        score: avg,
        details: `Average execution rate: ${avg}% across ${count} days`,
      };
    });
  }, [matrixViewMode, matrixSelectedGoalId, effectiveGoals, allDailyLogs]);

  // Trend Growth calculation
  const trendGrowth = useMemo(() => {
    if (!matrixTrendChartData || matrixTrendChartData.length < 2) return '+14% Growth';
    const firstScore = matrixTrendChartData[0]?.score || 0;
    const lastActive =
      matrixTrendChartData.slice().reverse().find((d) => d.score > 0) ||
      matrixTrendChartData[matrixTrendChartData.length - 1];
    const diff = (lastActive?.score || 0) - firstScore;
    if (diff > 0) return `+${diff}% Momentum`;
    if (diff < 0) return `${diff}% Momentum`;
    return '100% Consistent';
  }, [matrixTrendChartData]);

  // Helper for Category Icons
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
      {/* ===================================================================
          1. Top 5 Summary Cards
          =================================================================== */}
      <section className="summary-cards-grid" aria-label="Key Performance Indicators">
        {/* Card A: Today's Progress */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Today's Progress</span>
            <span className="card-kpi-badge violet">{completedCount}/{totalGoalsCount} Done</span>
          </div>
          <div className="card-center-metric">
            <div className="circular-progress-wrap">
              <svg className="progress-ring" viewBox="0 0 80 80">
                <circle className="progress-ring-track" cx="40" cy="40" r="32" strokeWidth="6" />
                <circle
                  className="progress-ring-fill"
                  cx="40"
                  cy="40"
                  r="32"
                  strokeWidth="6"
                  strokeDasharray="201"
                  strokeDashoffset={201 - (201 * progressPct) / 100}
                />
              </svg>
              <span className="ring-percentage">{progressPct}%</span>
            </div>
            <div className="metric-details">
              <span className="metric-primary">{progressPct}%</span>
              <span className="metric-caption">
                {isAllCompleted ? 'All targets crushed! 🏆' : `${totalGoalsCount - completedCount} goals remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Card B: Current Streak */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Current Streak</span>
            <Flame size={18} className="kpi-icon flame" />
          </div>
          <div className="card-center-metric">
            <div className="streak-badge-wrap">
              <Flame size={28} className="streak-main-icon" />
            </div>
            <div className="metric-details">
              <div className="streak-number-row">
                <span className="metric-primary">{streaks.currentStreak}</span>
                <span className="metric-unit">DAYS</span>
              </div>
              <span className="metric-caption">Best: {streaks.bestStreak} consecutive days</span>
            </div>
          </div>
        </div>

        {/* Card C: Calories Consumed */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Calories Intake</span>
            <Utensils size={18} className="kpi-icon cyan" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{nutritionTotals?.consumed.calories || 1380}</span>
                <span className="metric-target">/ {nutritionTotals?.targets.calories || 2600} kcal</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill cyan"
                  style={{ width: `${nutritionTotals?.caloriesPct || 53}%` }}
                />
              </div>
              <span className="metric-caption">
                {nutritionTotals?.remainingCalories || 1220} kcal remaining today
              </span>
            </div>
          </div>
        </div>

        {/* Card D: Protein Intake */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Protein Intake</span>
            <Dumbbell size={18} className="kpi-icon green" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{nutritionTotals?.consumed.protein || 117}g</span>
                <span className="metric-target">/ {nutritionTotals?.targets.protein || 165}g</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill green"
                  style={{ width: `${nutritionTotals?.proteinPct || 71}%` }}
                />
              </div>
              <span className="metric-caption">
                {nutritionTotals?.proteinPct || 71}% of daily protein goal met
              </span>
            </div>
          </div>
        </div>

        {/* Card E: Level & XP */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Athlete Rank</span>
            <Zap size={18} className="kpi-icon gold" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">LVL {levelInfo.level}</span>
                <span className="metric-target">{currentUser?.xp || 2450} XP</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill gold"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <span className="metric-caption">
                {levelInfo.xpNeededForNext} XP to Level {levelInfo.level + 1}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. Today's Goals Section
          =================================================================== */}
      <section className="dashboard-section goals-dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Today's Daily Disciplines</h2>
            <p className="section-subheading">
              Complete your scheduled daily performance standards to maintain streak momentum.
            </p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn-text-action"
              onClick={() => onNavigate('goals')}
            >
              <span>View All Goals</span>
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={onOpenAddGoal}
            >
              <Plus size={16} />
              <span>Add Goal</span>
            </button>
          </div>
        </div>

        {/* 100% All Goals Completed Celebration Banner */}
        {isAllCompleted && (
          <div className="celebration-banner">
            <div className="celebration-icon">🏆</div>
            <div className="celebration-text">
              <h3>Phenomenal Work, Champion!</h3>
              <p>You have crushed 100% of today's scheduled disciplines. Your streak is secure.</p>
            </div>
            <div className="celebration-badge">+150 XP Earned</div>
          </div>
        )}

        {/* Goals Checklist */}
        {loading ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(19, 21, 31, 0.4)',
            borderRadius: '14px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            color: '#94a3b8'
          }}>
            <p>Loading live Firestore goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(19, 21, 31, 0.4)',
            borderRadius: '14px',
            border: '1px dashed rgba(139, 92, 246, 0.3)',
            color: '#94a3b8'
          }}>
            <Target size={36} style={{ color: '#8b5cf6', margin: '0 auto 0.75rem', display: 'block', opacity: 0.8 }} />
            <div style={{ fontWeight: '700', color: '#f1f5f9', marginBottom: '0.35rem' }}>No Active Goals In Arena</div>
            <div style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Define high-impact personal or fitness goals to track live in Cloud Firestore.
            </div>
            <button
              type="button"
              className="btn-add-goal"
              onClick={onOpenAddGoal}
            >
              <Plus size={16} />
              <span>Create First Goal</span>
            </button>
          </div>
        ) : (
          <div className="goals-checklist-grid">
            {goals.map((goal) => {
              const isDone = completedGoalIds.includes(goal.id);
              return (
                <div
                  key={goal.id}
                  className={`goal-item-card ${isDone ? 'completed' : ''}`}
                  onClick={() => handleToggleGoal(goal.id)}
                >
                  <div className="goal-checkbox-wrap">
                    {isDone ? (
                      <CheckCircle2 size={22} className="check-icon checked" />
                    ) : (
                      <Circle size={22} className="check-icon unchecked" />
                    )}
                  </div>

                  <div className="goal-main-info">
                    <div className="goal-title-row">
                      <span className="goal-title-text">{goal.title}</span>
                      <span className="goal-category-tag">
                        {getCategoryIcon(goal.category)}
                        <span>{goal.category}</span>
                      </span>
                    </div>
                    {goal.description && (
                      <p className="goal-desc-text">{goal.description}</p>
                    )}
                  </div>

                  <div className="goal-target-chip">
                    <span className="target-num">{goal.targetValue}</span>
                    <span className="target-unit">{goal.targetUnit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================================================================
          2b. Monthly Achieved Goals in Matrix Format (Directly Below Today)
          =================================================================== */}
      <MonthlyGoalsMatrix
        goals={goals}
        dailyLogs={allDailyLogs}
        currentUser={currentUser}
        viewMode={matrixViewMode}
        onViewModeChange={setMatrixViewMode}
        selectedGoalId={matrixSelectedGoalId}
        onSelectGoal={setMatrixSelectedGoalId}
        selectedDay={matrixSelectedDay}
        onSelectDay={setMatrixSelectedDay}
        onLogsChange={(updatedLogs) => setAllDailyLogs(updatedLogs)}
        onActiveGoalsChange={setActiveMatrixGoals}
        onRefresh={() => setAllDailyLogs(goalsService.getAllDailyLogs(currentUser?.uid))}
      />

      {/* ===================================================================
          3. Performance Visualizations & Charts (Reactive to Matrix Selection)
          =================================================================== */}
      <section className="dashboard-grid-2">
        {/* Dynamic Goal Completion Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                {selectedGoalObj
                  ? `Goal Completion: ${selectedGoalObj.title}`
                  : matrixViewMode === 'week'
                  ? 'Weekly Goal Completion (Matrix)'
                  : 'Monthly Goal Completion (Matrix)'}
              </h3>
              <p className="chart-subtitle">
                {selectedGoalObj
                  ? `Showing execution for "${selectedGoalObj.title}" across ${
                      matrixViewMode === 'week' ? 'selected 7-day window' : 'all 31 days'
                    }`
                  : matrixViewMode === 'week'
                  ? 'Daily execution rate over the selected 7-day routine window'
                  : 'Daily execution rate across all 31 days of the monthly matrix'}
              </p>
            </div>

            <div className="chart-meta-row">
              {selectedGoalObj && (
                <div className="chart-focus-pill">
                  <span>Goal: {selectedGoalObj.title}</span>
                  <button
                    type="button"
                    className="chart-focus-clear-btn"
                    onClick={() => {
                      sfx.playClick();
                      setMatrixSelectedGoalId(null);
                    }}
                    title="Clear goal filter and show all routines"
                  >
                    ✕
                  </button>
                </div>
              )}
              {selectedDayStats && (
                <div className="chart-focus-pill day-pill">
                  <span>Day {selectedDayStats.dayNum}: {selectedDayStats.rate}%</span>
                  <button
                    type="button"
                    className="chart-focus-clear-btn"
                    onClick={() => {
                      sfx.playClick();
                      setMatrixSelectedDay(null);
                    }}
                    title="Clear day filter"
                  >
                    ✕
                  </button>
                </div>
              )}
              <span className="chart-badge cyan">
                {matrixViewMode === 'week' ? '1 Week (7d)' : 'Full Month (31d)'}
              </span>
            </div>
          </div>

          <div className="chart-container-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={matrixBarChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data) => {
                  if (data?.activePayload?.[0]?.payload?.dayNum) {
                    sfx.playClick();
                    const clickedDay = data.activePayload[0].payload.dayNum;
                    setMatrixSelectedDay((prev) => (prev === clickedDay ? null : clickedDay));
                  }
                }}
              >
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={matrixViewMode === 'month' ? 10 : 12}
                  tickLine={false}
                  interval={matrixViewMode === 'month' ? 1 : 0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<MatrixChartTooltip />} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {matrixBarChartData.map((entry, index) => {
                    const isSelected = matrixSelectedDay === entry.dayNum;
                    const isToday = entry.isToday;
                    let fill = '#8B5CF6';
                    if (isSelected) fill = '#00f2cb';
                    else if (isToday) fill = '#38bdf8';
                    else if (entry.rate === 100) fill = '#a855f7';
                    else if (entry.rate === 0) fill = '#1e2640';
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        stroke={isSelected ? '#00f2cb' : isToday ? '#38bdf8' : 'none'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Habit Consistency Trend Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Habit Consistency Trend</h3>
              <p className="chart-subtitle">
                {matrixViewMode === 'week'
                  ? 'Daily performance momentum index across selected 7 days'
                  : 'Weekly performance rolling index computed from matrix routines'}
              </p>
            </div>
            <div className="chart-tag green">
              <TrendingUp size={14} />
              <span>{trendGrowth}</span>
            </div>
          </div>

          <div className="chart-container-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={matrixTrendChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<TrendChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#violetGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
