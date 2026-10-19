import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Flame,
  Utensils,
  Dumbbell,
  AlertCircle,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsService } from '../services/goalsService';
import { fitnessService } from '../services/fitnessService';
import { nutritionService } from '../services/nutritionService';
import { getTodayDateKey } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [range, setRange] = useState('7d'); // 7d, 30d, month
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [dailyLogs, setDailyLogs] = useState({});
  const [calorieTrendData, setCalorieTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load real user data
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      const uid = currentUser?.uid;

      try {
        const [userWorkouts, userGoals] = await Promise.all([
          fitnessService.getWorkouts(uid),
          goalsService.getGoals(uid),
        ]);

        const allLogs = goalsService.getAllDailyLogs(uid);

        if (!isMounted) return;
        setWorkouts(userWorkouts || []);
        setGoals(userGoals || []);
        setDailyLogs(allLogs || {});

        // Build past 7 days caloric intake from nutritionService
        const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const numDays = range === '30d' ? 30 : range === 'month' ? 30 : 7;
        const trendList = [];
        const today = new Date();

        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayNum = String(d.getDate()).padStart(2, '0');
          const dateKey = `${y}-${m}-${dayNum}`;

          const dayMeals = await nutritionService.getDayLogs(uid, dateKey);
          const totals = nutritionService.calculateTotals(dayMeals, currentUser?.targets);

          trendList.push({
            day: range === '7d' ? daysShort[d.getDay()] : `${dayNum}`,
            dateKey,
            calories: totals.consumed.calories,
            protein: totals.consumed.protein,
            target: currentUser?.targets?.calories || 2600,
          });
        }

        if (isMounted) {
          setCalorieTrendData(trendList);
        }
      } catch (err) {
        console.warn('Error loading analytics data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, range]);

  // Real workout type distribution
  const workoutDistribution = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    const counts = {};
    workouts.forEach((w) => {
      const type = w.type || 'Strength';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, sessions]) => ({ type, sessions }));
  }, [workouts]);

  // Real goal performance from user's logs
  const goalPerformance = useMemo(() => {
    if (!goals || goals.length === 0) return [];

    const totalDaysChecked = Math.max(1, Object.keys(dailyLogs).length);

    return goals.map((g) => {
      let completedDays = 0;
      Object.values(dailyLogs).forEach((dayList) => {
        if (Array.isArray(dayList) && dayList.includes(g.id)) {
          completedDays++;
        }
      });
      const rate = Math.min(100, Math.round((completedDays / totalDaysChecked) * 100));
      const status = rate >= 85 ? 'Best' : rate >= 60 ? 'Good' : 'Needs Focus';

      return {
        name: g.title,
        category: g.category || 'General',
        rate,
        status,
        completedDays,
      };
    });
  }, [goals, dailyLogs]);

  // Derived KPIs
  const avgCompletionRate = useMemo(() => {
    if (goalPerformance.length === 0) return 0;
    const sum = goalPerformance.reduce((acc, curr) => acc + curr.rate, 0);
    return Math.round(sum / goalPerformance.length);
  }, [goalPerformance]);

  const avgWorkoutDuration = useMemo(() => {
    if (workouts.length === 0) return 0;
    const sum = workouts.reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0);
    return Math.round(sum / workouts.length);
  }, [workouts]);

  const avgProteinIntake = useMemo(() => {
    const activeDays = calorieTrendData.filter((d) => d.protein > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, curr) => acc + curr.protein, 0);
    return Math.round(sum / activeDays.length);
  }, [calorieTrendData]);

  const disciplineIndex = useMemo(() => {
    const streak = currentUser?.currentStreak || 0;
    if (streak === 0 && avgCompletionRate === 0) return '0.0 / 10';
    const score = Math.min(10, Math.max(1, (streak * 0.5 + (avgCompletionRate / 100) * 5))).toFixed(1);
    return `${score} / 10`;
  }, [currentUser?.currentStreak, avgCompletionRate]);

  return (
    <div className="page-content-wrapper">
      {/* Top Header & Range Filter */}
      <section className="section-header-row">
        <div>
          <h2 className="section-heading">Analytics & Performance Reports</h2>
          <p className="section-subheading">
            Comprehensive quantitative analysis of your daily disciplines, workouts, and nutrition.
          </p>
        </div>

        <div className="tab-pill-container inline">
          <button
            type="button"
            className={`tab-btn ${range === '7d' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setRange('7d');
            }}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${range === '30d' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setRange('30d');
            }}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${range === 'month' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setRange('month');
            }}
          >
            This Month
          </button>
        </div>
      </section>

      {/* KPI Stats Strip */}
      <section className="summary-cards-grid">
        <div className="metric-card">
          <span className="card-kpi-label">Average Completion</span>
          <div className="metric-number-row">
            <span className="metric-primary">{avgCompletionRate}%</span>
            <span className="card-kpi-badge green">
              {goals.length > 0 ? `${goals.length} Goals Active` : 'No goals yet'}
            </span>
          </div>
          <span className="metric-caption">
            {goals.length > 0 ? 'Consistent adherence to disciplines' : 'Define goals to compute rate'}
          </span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Total Workouts Logged</span>
          <div className="metric-number-row">
            <span className="metric-primary">{workouts.length} Sessions</span>
          </div>
          <span className="metric-caption">
            {workouts.length > 0 ? `Avg ${avgWorkoutDuration} mins per workout` : 'Log workouts to track duration'}
          </span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Avg Daily Protein</span>
          <div className="metric-number-row">
            <span className="metric-primary">{avgProteinIntake}g</span>
            <span className="card-kpi-badge cyan">
              {currentUser?.targets?.protein || 165}g Target
            </span>
          </div>
          <span className="metric-caption">
            {avgProteinIntake > 0 ? 'Optimal muscle synthesis tracking' : 'Log meals to track macros'}
          </span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Discipline Index</span>
          <div className="metric-number-row">
            <span className="metric-primary">{disciplineIndex}</span>
            <span className="card-kpi-badge violet">
              {(currentUser?.currentStreak || 0) > 5 ? 'Elite' : 'Active'}
            </span>
          </div>
          <span className="metric-caption">Calculated from streak retention</span>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="dashboard-grid-2">
        {/* Calorie & Protein Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Caloric Intake vs Daily Target</h3>
              <p className="chart-subtitle">
                Daily calories consumed against {currentUser?.targets?.calories || 2600} kcal target
              </p>
            </div>
            <Utensils size={18} className="kpi-icon cyan" />
          </div>

          <div className="chart-container-wrap">
            {calorieTrendData.every((d) => d.calories === 0) ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <Utensils size={28} style={{ color: '#00f2cb', margin: '0 auto 0.5rem', display: 'block', opacity: 0.8 }} />
                <div style={{ fontWeight: '700', color: '#f1f5f9', marginBottom: '0.25rem' }}>No Food Logged Yet</div>
                <div style={{ fontSize: '0.85rem' }}>Log meals in the Nutrition Center to visualize intake trends.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={calorieTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161926',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(val) => [`${val} kcal`, 'Calories']}
                  />
                  <Bar dataKey="calories" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workout Volume Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Workout Type Distribution</h3>
              <p className="chart-subtitle">Session frequency across training modalities</p>
            </div>
            <Dumbbell size={18} className="kpi-icon violet" />
          </div>

          <div className="chart-container-wrap">
            {workoutDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <Dumbbell size={28} style={{ color: '#8b5cf6', margin: '0 auto 0.5rem', display: 'block', opacity: 0.8 }} />
                <div style={{ fontWeight: '700', color: '#f1f5f9', marginBottom: '0.25rem' }}>No Workouts Logged Yet</div>
                <div style={{ fontSize: '0.85rem' }}>Log workouts in the Fitness Center to visualize distribution.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  layout="vertical"
                  data={workoutDistribution}
                  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="type" stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161926',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="sessions" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Goal Consistency Breakdown Table */}
      <section className="dashboard-section">
        <h3 className="section-heading">Discipline Consistency Breakdown</h3>
        <div className="rankings-table-container">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>Goal Habit</th>
                <th>Category</th>
                <th>Success Rate</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {goalPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <Target size={28} style={{ color: '#00f2cb', margin: '0 auto 0.5rem', display: 'block', opacity: 0.8 }} />
                    <div style={{ fontWeight: '700', color: '#f1f5f9', marginBottom: '0.25rem' }}>No Goals Defined Yet</div>
                    <div style={{ fontSize: '0.85rem' }}>Create goals in the Goals Arena to view breakdown performance.</div>
                  </td>
                </tr>
              ) : (
                goalPerformance.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{item.name}</td>
                    <td>
                      <span className="goal-cat-badge">{item.category}</span>
                    </td>
                    <td>
                      <strong>{item.rate}%</strong>
                    </td>
                    <td>
                      <span
                        className={`badge-chip ${
                          item.status === 'Best' ? 'green' : item.status === 'Good' ? 'cyan' : 'gold'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ width: '30%' }}>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${item.rate >= 85 ? 'green' : item.rate >= 60 ? 'violet' : 'gold'}`}
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
