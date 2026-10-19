import { useState, useEffect } from 'react';
import {
  Dumbbell,
  Droplets,
  Footprints,
  Scale,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Flame,
  Clock,
  Activity,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fitnessService } from '../services/fitnessService';
import { getTodayDateKey, formatDateDisplay } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';

const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Running', 'Mobility', 'Custom'];

export default function FitnessPage() {
  const { currentUser, awardXp } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [waterAmount, setWaterAmount] = useState(2250);
  const [stepsCount, setStepsCount] = useState(7840);
  const [weightLogs, setWeightLogs] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    type: 'Strength',
    duration: '45',
    caloriesBurned: '350',
    notes: '',
  });
  const [newWeight, setNewWeight] = useState('');

  const todayKey = getTodayDateKey();
  const waterTarget = currentUser?.targets?.water || 3500;
  const stepsTarget = currentUser?.targets?.steps || 10000;

  const loadData = async () => {
    const [fetchedWorkouts, fetchedWater, fetchedSteps, fetchedWeights] = await Promise.all([
      fitnessService.getWorkouts(currentUser?.uid),
      fitnessService.getWaterLog(currentUser?.uid, todayKey),
      fitnessService.getStepsLog(currentUser?.uid, todayKey),
      fitnessService.getWeightLogs(currentUser?.uid),
    ]);

    setWorkouts(fetchedWorkouts || []);
    setWaterAmount(fetchedWater);
    setStepsCount(fetchedSteps);
    setWeightLogs(fetchedWeights || []);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Log Workout
  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!newWorkout.title.trim()) return;
    sfx.playClick();
    await fitnessService.logWorkout(currentUser?.uid, newWorkout);
    awardXp(50, 'Completed workout');
    setShowWorkoutModal(false);
    setNewWorkout({ title: '', type: 'Strength', duration: '45', caloriesBurned: '350', notes: '' });
    loadData();
  };

  const handleDeleteWorkout = async (id) => {
    sfx.playClick();
    await fitnessService.deleteWorkout(currentUser?.uid, id);
    loadData();
  };

  // Water Quick Add
  const handleAddWater = async (amount) => {
    sfx.playClick();
    const updated = await fitnessService.addWater(currentUser?.uid, amount, todayKey);
    setWaterAmount(updated);
    if (updated >= waterTarget) {
      awardXp(20, 'Met hydration target');
    }
  };

  // Steps Update
  const handleStepsChange = async (e) => {
    const val = Number(e.target.value) || 0;
    setStepsCount(val);
    await fitnessService.updateSteps(currentUser?.uid, val, todayKey);
  };

  // Log Weight
  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    sfx.playClick();
    const updated = await fitnessService.logWeight(currentUser?.uid, newWeight, todayKey);
    setWeightLogs(updated);
    setNewWeight('');
    setShowWeightModal(false);
  };

  const waterPct = Math.min(100, Math.round((waterAmount / waterTarget) * 100));
  const stepsPct = Math.min(100, Math.round((stepsCount / stepsTarget) * 100));

  return (
    <div className="page-content-wrapper">
      {/* Top Header */}
      <section className="section-header-row">
        <div>
          <h2 className="section-heading">Fitness & Training Center</h2>
          <p className="section-subheading">
            Track workouts, daily hydration, steps, and body metrics.
          </p>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setShowWeightModal(true)}
          >
            <Scale size={16} />
            <span>Log Weight</span>
          </button>
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowWorkoutModal(true)}
          >
            <Plus size={18} />
            <span>Log Workout</span>
          </button>
        </div>
      </section>

      {/* Fitness 3 Main Health Cards (Hydration, Steps, Weight) */}
      <section className="summary-cards-grid">
        {/* Hydration Tracker */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Hydration Tracker</span>
            <Droplets size={18} className="kpi-icon cyan" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{waterAmount} ml</span>
                <span className="metric-target">/ {waterTarget} ml</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill cyan" style={{ width: `${waterPct}%` }} />
              </div>
              <div className="quick-water-buttons">
                <button type="button" className="water-btn" onClick={() => handleAddWater(250)}>
                  +250ml
                </button>
                <button type="button" className="water-btn" onClick={() => handleAddWater(500)}>
                  +500ml
                </button>
                <button type="button" className="water-btn" onClick={() => handleAddWater(1000)}>
                  +1L
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Steps */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Daily Steps</span>
            <Footprints size={18} className="kpi-icon green" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{stepsCount.toLocaleString()}</span>
                <span className="metric-target">/ {stepsTarget.toLocaleString()} steps</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${stepsPct}%` }} />
              </div>
              <div className="steps-input-row">
                <input
                  type="number"
                  className="steps-input-field"
                  placeholder="Update steps..."
                  value={stepsCount}
                  onChange={handleStepsChange}
                />
                <span className="steps-hint-text">Edit value anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Body Weight */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Current Weight</span>
            <Scale size={18} className="kpi-icon gold" />
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">
                  {weightLogs.length > 0 ? `${weightLogs[weightLogs.length - 1].weight} kg` : '77.2 kg'}
                </span>
                <span className="metric-target">Trend: -1.2 kg this month</span>
              </div>
              <div className="sparkline-wrap">
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={weightLogs}>
                    <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workout History Table */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-heading">Logged Training Sessions</h3>
          <span className="stat-badge-violet">{workouts.length} Sessions Logged</span>
        </div>

        <div className="workouts-table-card">
          {workouts.length === 0 ? (
            <div className="empty-state-card">
              <Dumbbell size={40} className="empty-icon" />
              <h4 className="empty-title">No Workouts Logged</h4>
              <p className="empty-subtitle">Record your sets, reps, running mileage, or HIIT circuits.</p>
              <button
                type="button"
                className="btn-primary-add"
                onClick={() => setShowWorkoutModal(true)}
              >
                <Plus size={16} />
                <span>Log First Workout</span>
              </button>
            </div>
          ) : (
            <div className="workouts-list-stack">
              {workouts.map((w) => (
                <div key={w.id} className="workout-item-card">
                  <div className="workout-icon-badge">
                    <Dumbbell size={20} />
                  </div>

                  <div className="workout-details-col">
                    <div className="workout-title-line">
                      <h4 className="workout-name">{w.title}</h4>
                      <span className="workout-type-pill">{w.type}</span>
                    </div>

                    {w.notes && <p className="workout-notes-text">{w.notes}</p>}

                    <div className="workout-metrics-pills">
                      <span className="metric-pill">
                        <Clock size={13} />
                        <span>{w.duration} mins</span>
                      </span>
                      <span className="metric-pill">
                        <Flame size={13} />
                        <span>{w.caloriesBurned} kcal</span>
                      </span>
                      <span className="metric-pill date">
                        <Calendar size={13} />
                        <span>{w.date}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-del-item"
                    onClick={() => handleDeleteWorkout(w.id)}
                    title="Delete workout"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Log Workout Modal */}
      {showWorkoutModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) setShowWorkoutModal(false);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon-wrap violet">
                <Dumbbell size={22} />
              </div>
              <h3 className="modal-title">Log Training Session</h3>
              <p className="modal-subtitle">Record your sets, duration, and energy output.</p>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowWorkoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWorkoutSubmit} className="modal-form">
              <div className="input-field-group">
                <label className="field-label">Workout Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Heavy Upper Body Push + Core"
                  value={newWorkout.title}
                  onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-grid-3">
                <div className="input-field-group">
                  <label className="field-label">Type</label>
                  <select
                    className="form-select"
                    value={newWorkout.type}
                    onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-field-group">
                  <label className="field-label">Duration (min)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="45"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                  />
                </div>

                <div className="input-field-group">
                  <label className="field-label">Est. Calories</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="350"
                    value={newWorkout.caloriesBurned}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, caloriesBurned: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="input-field-group">
                <label className="field-label">Exercises & Sets Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Bench press 4x8 @ 80kg, Dumbbell incline 3x10 @ 28kg..."
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowWorkoutModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-cta-btn">
                  <span className="btn-text">
                    <Sparkles size={16} />
                    <span>Save Workout (+50 XP)</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Body Weight Modal */}
      {showWeightModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) setShowWeightModal(false);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon-wrap green">
                <Scale size={22} />
              </div>
              <h3 className="modal-title">Record Body Weight</h3>
              <p className="modal-subtitle">Track consistent morning weigh-ins.</p>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowWeightModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWeightSubmit} className="modal-form">
              <div className="input-field-group">
                <label className="field-label">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 77.2"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowWeightModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-cta-btn">
                  <span className="btn-text">
                    <Sparkles size={16} />
                    <span>Save Weigh-In</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
