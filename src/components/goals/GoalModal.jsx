import { useState, useEffect } from 'react';
import { X, Target, Sparkles } from 'lucide-react';
import { sfx } from '../../utils/soundEngine';
import { getTodayDateKey } from '../../services/storageHelper';

const CATEGORIES = [
  'Study',
  'Fitness',
  'Health',
  'Personal Development',
  'Work',
  'Custom',
];

export default function GoalModal({ isOpen, onClose, onSaveGoal, initialGoal = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Fitness',
    frequency: 'daily',
    targetValue: '1',
    targetUnit: 'session',
    startDate: getTodayDateKey(),
    endDate: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setFormData({
        title: initialGoal.title || '',
        description: initialGoal.description || '',
        category: initialGoal.category || 'Fitness',
        frequency: initialGoal.frequency || 'daily',
        targetValue: String(initialGoal.targetValue || '1'),
        targetUnit: initialGoal.targetUnit || 'session',
        startDate: initialGoal.startDate || getTodayDateKey(),
        endDate: initialGoal.endDate || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Fitness',
        frequency: 'daily',
        targetValue: '1',
        targetUnit: 'session',
        startDate: getTodayDateKey(),
        endDate: '',
      });
    }
    setError('');
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a goal title.');
      sfx.playError();
      return;
    }

    sfx.playClick();
    onSaveGoal(formData);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target.classList.contains('modal-backdrop')) onClose();
      }}
    >
      <div className="modal-card modal-lg">
        <div className="modal-header">
          <div className="modal-icon-wrap violet">
            <Target size={22} />
          </div>
          <h2 className="modal-title">{initialGoal ? 'Edit Goal' : 'Create New Athletic Goal'}</h2>
          <p className="modal-subtitle">
            Set deliberate targets to elevate your daily discipline and performance.
          </p>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error-banner">{error}</div>}

          {/* Goal Title */}
          <div className="input-field-group">
            <label className="field-label">Goal Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Study DSA for 2 hours, Walk 10k steps"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="input-field-group">
            <label className="field-label">Description / Execution Note</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Solve 2 LeetCode medium questions without looking at solutions"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Category & Frequency Row */}
          <div className="form-grid-2">
            <div className="input-field-group">
              <label className="field-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-field-group">
              <label className="field-label">Frequency</label>
              <select
                className="form-select"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="daily">Daily Target</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                <option value="weekends">Weekends Only</option>
                <option value="custom">3x per Week</option>
              </select>
            </div>
          </div>

          {/* Target Value & Unit */}
          <div className="form-grid-2">
            <div className="input-field-group">
              <label className="field-label">Target Number</label>
              <input
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="2"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">Unit of Measure</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. hours, steps, pages, litres, reps"
                value={formData.targetUnit}
                onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="form-grid-2">
            <div className="input-field-group">
              <label className="field-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label className="field-label">End Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-cta-btn">
              <span className="btn-text">
                <Sparkles size={16} />
                <span>{initialGoal ? 'Update Goal' : 'Save & Track Goal'}</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
