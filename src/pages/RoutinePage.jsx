import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { routineService } from '../services/routineService';
import { getTodayDateKey, formatDateDisplay } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';

const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function RoutinePage() {
  const { currentUser, awardXp } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    detail: '',
    timeBlock: 'Morning',
    timeHint: '07:00 AM',
  });

  const todayKey = getTodayDateKey();

  const loadRoutines = () => {
    const list = routineService.getRoutines(currentUser?.uid);
    setRoutines(list || []);
    const completed = routineService.getCompletedRoutines(currentUser?.uid, todayKey);
    setCompletedIds(completed || []);
  };

  useEffect(() => {
    loadRoutines();
  }, [currentUser]);

  const handleToggle = (id) => {
    sfx.playClick();
    const updated = routineService.toggleRoutineCompletion(currentUser?.uid, id, todayKey);
    setCompletedIds(updated);

    if (updated.includes(id)) {
      sfx.playSuccess();
      awardXp(15, 'Routine item completed');
    }
  };

  const handleDelete = (id) => {
    sfx.playClick();
    routineService.deleteRoutineItem(currentUser?.uid, id);
    loadRoutines();
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    sfx.playClick();
    routineService.addRoutineItem(currentUser?.uid, newItem);
    setShowAddModal(false);
    setNewItem({ title: '', detail: '', timeBlock: 'Morning', timeHint: '07:00 AM' });
    loadRoutines();
  };

  const totalCount = routines.length;
  const completedCount = completedIds.filter((id) => routines.some((r) => r.id === id)).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getBlockIcon = (block) => {
    switch (block) {
      case 'Morning':
        return <Sun size={18} className="block-icon morning" />;
      case 'Afternoon':
        return <Zap size={18} className="block-icon afternoon" />;
      case 'Evening':
        return <Sunset size={18} className="block-icon evening" />;
      default:
        return <Moon size={18} className="block-icon night" />;
    }
  };

  return (
    <div className="page-content-wrapper">
      {/* Top Banner & Progress */}
      <section className="routine-hero-card">
        <div className="routine-hero-left">
          <div className="routine-badge">DAILY PERFORMANCE PROTOCOL</div>
          <h2 className="routine-hero-title">Disciplined Routine for {formatDateDisplay(todayKey)}</h2>
          <p className="routine-hero-sub">
            Elite performers never negotiate their daily routine. Execute without excuses.
          </p>

          <div className="routine-stats-inline">
            <div className="stat-pill-inline">
              <span className="pill-num">{completedCount} / {totalCount}</span>
              <span className="pill-lbl">Protocols Completed</span>
            </div>
            <div className="stat-pill-inline highlight">
              <span className="pill-num">{progressPct}%</span>
              <span className="pill-lbl">Execution Rate</span>
            </div>
          </div>
        </div>

        <div className="routine-hero-right">
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            <span>Add Protocol</span>
          </button>
        </div>
      </section>

      {/* Time-Blocked Groups */}
      <section className="routine-blocks-grid">
        {TIME_BLOCKS.map((block) => {
          const blockItems = routines.filter((r) => r.timeBlock === block);
          return (
            <div key={block} className="routine-block-column">
              <div className="block-header">
                <div className="block-title-wrap">
                  {getBlockIcon(block)}
                  <h3 className="block-name">{block} Protocol</h3>
                </div>
                <span className="block-count-badge">
                  {blockItems.filter((i) => completedIds.includes(i.id)).length}/{blockItems.length}
                </span>
              </div>

              <div className="block-items-stack">
                {blockItems.length === 0 ? (
                  <div className="empty-block-hint">No {block.toLowerCase()} protocols added.</div>
                ) : (
                  blockItems.map((item) => {
                    const isDone = completedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`routine-item-card ${isDone ? 'done' : ''}`}
                      >
                        <div
                          className="routine-check-clickable"
                          onClick={() => handleToggle(item.id)}
                        >
                          {isDone ? (
                            <CheckCircle2 size={20} className="check-icon checked" />
                          ) : (
                            <Circle size={20} className="check-icon unchecked" />
                          )}
                          <div className="routine-text-wrap">
                            <div className="routine-time-row">
                              <span className="routine-time-hint">{item.timeHint}</span>
                            </div>
                            <span className="routine-title">{item.title}</span>
                            {item.detail && <p className="routine-detail">{item.detail}</p>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-del-item"
                          onClick={() => handleDelete(item.id)}
                          title="Delete protocol"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Add Protocol Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) setShowAddModal(false);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon-wrap violet">
                <Clock size={22} />
              </div>
              <h3 className="modal-title">Add Daily Protocol</h3>
              <p className="modal-subtitle">Add a time-blocked habit to your daily routine.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="input-field-group">
                <label className="field-label">Protocol Action</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500ml Water + Himalayan Salt"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="input-field-group">
                <label className="field-label">Detail / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Before looking at phone or checking email"
                  value={newItem.detail}
                  onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="input-field-group">
                  <label className="field-label">Time Block</label>
                  <select
                    className="form-select"
                    value={newItem.timeBlock}
                    onChange={(e) => setNewItem({ ...newItem, timeBlock: e.target.value })}
                  >
                    {TIME_BLOCKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-field-group">
                  <label className="field-label">Scheduled Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="07:00 AM"
                    value={newItem.timeHint}
                    onChange={(e) => setNewItem({ ...newItem, timeHint: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-cta-btn">
                  <span className="btn-text">
                    <Sparkles size={16} />
                    <span>Save Protocol</span>
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
