import { useState } from 'react';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { sfx } from '../utils/soundEngine';

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d'); // 7d, 30d, month

  // Sample analytics data derived from consistent tracking records
  const calorieTrendData = [
    { day: 'Mon', calories: 2450, target: 2600, protein: 155 },
    { day: 'Tue', calories: 2580, target: 2600, protein: 168 },
    { day: 'Wed', calories: 2390, target: 2600, protein: 148 },
    { day: 'Thu', calories: 2620, target: 2600, protein: 170 },
    { day: 'Fri', calories: 2510, target: 2600, protein: 162 },
    { day: 'Sat', calories: 2700, target: 2600, protein: 175 },
    { day: 'Sun', calories: 2420, target: 2600, protein: 158 },
  ];

  const goalPerformance = [
    { name: 'Study DSA', rate: 94, category: 'Study', status: 'Best' },
    { name: 'Strength Workout', rate: 91, category: 'Fitness', status: 'Best' },
    { name: '10k Daily Steps', rate: 85, category: 'Health', status: 'Good' },
    { name: 'Read 20 Pages', rate: 78, category: 'Personal Dev', status: 'Good' },
    { name: 'Drink 3.5L Water', rate: 64, category: 'Health', status: 'Needs Focus' },
  ];

  const workoutDistribution = [
    { type: 'Strength Push', sessions: 4 },
    { type: 'Strength Pull', sessions: 3 },
    { type: 'Legs / Squat', sessions: 3 },
    { type: 'Cardio / Sprints', sessions: 4 },
    { type: 'Mobility / Core', sessions: 2 },
  ];

  return (
    <div className="page-content-wrapper">
      {/* Top Header & Range Filter */}
      <section className="section-header-row">
        <div>
          <h2 className="section-heading">Analytics & Performance Reports</h2>
          <p className="section-subheading">
            Comprehensive quantitative analysis of your daily disciplines and habits.
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
            <span className="metric-primary">87.4%</span>
            <span className="card-kpi-badge green">+6.2% vs last week</span>
          </div>
          <span className="metric-caption">Consistent high-tier discipline</span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Total Workouts Logged</span>
          <div className="metric-number-row">
            <span className="metric-primary">16 Sessions</span>
          </div>
          <span className="metric-caption">Avg 52 mins per workout session</span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Avg Daily Protein</span>
          <div className="metric-number-row">
            <span className="metric-primary">163g</span>
            <span className="card-kpi-badge cyan">98.8% Target</span>
          </div>
          <span className="metric-caption">Optimal muscle synthesis range</span>
        </div>

        <div className="metric-card">
          <span className="card-kpi-label">Discipline Index</span>
          <div className="metric-number-row">
            <span className="metric-primary">9.2 / 10</span>
            <span className="card-kpi-badge violet">Elite</span>
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
              <p className="chart-subtitle">Daily calories consumed against 2,600 kcal target</p>
            </div>
            <Utensils size={18} className="kpi-icon cyan" />
          </div>

          <div className="chart-container-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={calorieTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} domain={[1500, 3000]} />
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
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                layout="vertical"
                data={workoutDistribution}
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 6]} />
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
              {goalPerformance.map((item, idx) => (
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
                        className={`bar-fill ${item.rate >= 90 ? 'green' : item.rate >= 75 ? 'violet' : 'gold'}`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
