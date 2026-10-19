import { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Trash2,
  Calendar,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  Target,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { nutritionService, FOOD_DATABASE } from '../services/nutritionService';
import { getTodayDateKey, formatDateDisplay } from '../services/storageHelper';
import { sfx } from '../utils/soundEngine';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🥗' },
  { id: 'dinner', label: 'Dinner', icon: '🥩' },
  { id: 'snacks', label: 'Snacks & Fuel', icon: '🥑' },
];

export default function NutritionPage() {
  const { currentUser, awardXp } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [logs, setLogs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [customFood, setCustomFood] = useState({
    name: '',
    serving: '1 serving',
    quantity: 1,
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  const todayKey = getTodayDateKey();
  const userTargets = currentUser?.targets || {
    calories: 2600,
    protein: 165,
    carbs: 280,
    fats: 70,
  };

  const loadData = async () => {
    const dayLogs = await nutritionService.getDayLogs(currentUser?.uid, selectedDate);
    setLogs(dayLogs || []);
    setFavorites(nutritionService.getFavorites(currentUser?.uid));
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedDate]);

  const totals = nutritionService.calculateTotals(logs, userTargets);

  // Navigate Days
  const handleDateChange = (delta) => {
    sfx.playClick();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const newDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  // Add Item from Catalog
  const handleLogFromCatalog = async (item) => {
    sfx.playClick();
    await nutritionService.addFoodLog(currentUser?.uid, {
      name: item.name,
      mealType: activeMealType,
      serving: item.serving,
      quantity: 1,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      date: selectedDate,
    });
    awardXp(15, 'Logged meal');
    setShowAddModal(false);
    loadData();
  };

  // Add Custom Food
  const handleCustomFoodSubmit = async (e) => {
    e.preventDefault();
    if (!customFood.name.trim() || !customFood.calories) return;
    sfx.playClick();
    await nutritionService.addFoodLog(currentUser?.uid, {
      name: customFood.name,
      mealType: activeMealType,
      serving: customFood.serving,
      quantity: customFood.quantity,
      calories: customFood.calories,
      protein: customFood.protein || 0,
      carbs: customFood.carbs || 0,
      fats: customFood.fats || 0,
      date: selectedDate,
    });
    awardXp(15, 'Logged meal');
    setCustomFood({
      name: '',
      serving: '1 serving',
      quantity: 1,
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
    });
    setShowAddModal(false);
    loadData();
  };

  // Delete Item
  const handleDeleteLog = async (logId) => {
    sfx.playClick();
    await nutritionService.deleteFoodLog(currentUser?.uid, logId, selectedDate);
    loadData();
  };

  // Filter Catalog
  const filteredCatalog = FOOD_DATABASE.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-content-wrapper">
      {/* Top Header & Date Navigation */}
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

        <button
          type="button"
          className="btn-primary-add"
          onClick={() => {
            setActiveMealType('lunch');
            setShowAddModal(true);
          }}
        >
          <Plus size={18} />
          <span>Log Food</span>
        </button>
      </section>

      {/* Daily Nutrition Macro Cards */}
      <section className="summary-cards-grid">
        {/* Calories Card */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Calories</span>
            <span className="card-kpi-badge cyan">{totals.remainingCalories} kcal left</span>
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{totals.consumed.calories}</span>
                <span className="metric-target">/ {totals.targets.calories} kcal</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill cyan" style={{ width: `${totals.caloriesPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Protein</span>
            <span className="card-kpi-badge green">{totals.proteinPct}% Target</span>
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{totals.consumed.protein}g</span>
                <span className="metric-target">/ {totals.targets.protein}g</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${totals.proteinPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Carbohydrates</span>
            <span className="card-kpi-badge orange">{totals.carbsPct}% Target</span>
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{totals.consumed.carbs}g</span>
                <span className="metric-target">/ {totals.targets.carbs}g</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill orange" style={{ width: `${totals.carbsPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Fats Card */}
        <div className="metric-card">
          <div className="card-top-row">
            <span className="card-kpi-label">Healthy Fats</span>
            <span className="card-kpi-badge gold">{totals.fatsPct}% Target</span>
          </div>
          <div className="card-center-metric">
            <div className="metric-details full-width">
              <div className="metric-number-row">
                <span className="metric-primary">{totals.consumed.fats}g</span>
                <span className="metric-target">/ {totals.targets.fats}g</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill gold" style={{ width: `${totals.fatsPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Meal Diary Sections */}
      <section className="meal-diary-grid">
        {MEAL_TYPES.map((meal) => {
          const mealLogs = logs.filter((l) => l.mealType === meal.id);
          const mealCals = mealLogs.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
          const mealProtein = mealLogs.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);

          return (
            <div key={meal.id} className="meal-type-card">
              <div className="meal-header">
                <div className="meal-title-wrap">
                  <span className="meal-emoji">{meal.icon}</span>
                  <div>
                    <h3 className="meal-name">{meal.label}</h3>
                    <span className="meal-summary-tag">
                      {mealCals} kcal • {mealProtein}g protein
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-food-quick"
                  onClick={() => {
                    setActiveMealType(meal.id);
                    setShowAddModal(true);
                  }}
                  title={`Add food to ${meal.label}`}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {/* Logged Foods List */}
              <div className="meal-items-list">
                {mealLogs.length === 0 ? (
                  <div className="empty-meal-hint">No food logged for {meal.label.toLowerCase()} yet.</div>
                ) : (
                  mealLogs.map((item) => (
                    <div key={item.id} className="food-entry-row">
                      <div className="food-entry-info">
                        <span className="food-name">{item.name}</span>
                        <span className="food-macros">
                          {item.serving} • {item.calories} kcal (P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-del-food"
                        onClick={() => handleDeleteLog(item.id)}
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Add Food Modal with Catalog & Custom Entry */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) setShowAddModal(false);
          }}
        >
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div className="modal-icon-wrap cyan">
                <Utensils size={22} />
              </div>
              <h3 className="modal-title">
                Log Food to {MEAL_TYPES.find((m) => m.id === activeMealType)?.label || 'Diary'}
              </h3>
              <p className="modal-subtitle">
                Select from verified healthy athletic foods or enter custom whole-food items.
              </p>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Food Catalog Search */}
            <div className="catalog-search-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search food database (e.g. Chicken, Oats, Salmon, Rice)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Quick Catalog Results */}
            <div className="catalog-results-grid">
              {filteredCatalog.slice(0, 6).map((food) => (
                <div
                  key={food.id}
                  className="catalog-food-card"
                  onClick={() => handleLogFromCatalog(food)}
                >
                  <div className="cat-food-header">
                    <span className="cat-food-name">{food.name}</span>
                    <span className="cat-food-cals">{food.calories} kcal</span>
                  </div>
                  <span className="cat-food-sub">{food.serving}</span>
                  <div className="cat-macro-row">
                    <span className="macro-chip green">P: {food.protein}g</span>
                    <span className="macro-chip orange">C: {food.carbs}g</span>
                    <span className="macro-chip gold">F: {food.fats}g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Food Form */}
            <div className="custom-food-divider">
              <span>OR ENTER CUSTOM FOOD</span>
            </div>

            <form onSubmit={handleCustomFoodSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="input-field-group">
                  <label className="field-label">Food Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Scrambled Eggs with Avocado"
                    value={customFood.name}
                    onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-field-group">
                  <label className="field-label">Portion / Serving Size</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1 plate, 200g"
                    value={customFood.serving}
                    onChange={(e) => setCustomFood({ ...customFood, serving: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-4">
                <div className="input-field-group">
                  <label className="field-label">Calories (kcal) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="350"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                    required
                  />
                </div>
                <div className="input-field-group">
                  <label className="field-label">Protein (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="25"
                    value={customFood.protein}
                    onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                  />
                </div>
                <div className="input-field-group">
                  <label className="field-label">Carbs (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="30"
                    value={customFood.carbs}
                    onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                  />
                </div>
                <div className="input-field-group">
                  <label className="field-label">Fats (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="12"
                    value={customFood.fats}
                    onChange={(e) => setCustomFood({ ...customFood, fats: e.target.value })}
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
                    <span>Log Food Entry</span>
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
