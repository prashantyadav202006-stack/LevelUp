import { useState, useEffect } from 'react';
import {
  Award,
  Zap,
  Target,
  Flame,
  Dumbbell,
  Calendar,
  Utensils,
  Trophy,
  Lock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gamificationService } from '../services/gamificationService';

export default function AchievementsPage() {
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    setAchievements(gamificationService.getAchievements(currentUser?.uid));
  }, [currentUser]);

  const levelInfo = gamificationService.calculateLevel(currentUser?.xp || 2450);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case 'Target':
        return <Target size={24} />;
      case 'Flame':
        return <Flame size={24} />;
      case 'Dumbbell':
        return <Dumbbell size={24} />;
      case 'Calendar':
        return <Calendar size={24} />;
      case 'Utensils':
        return <Utensils size={24} />;
      case 'Trophy':
        return <Trophy size={24} />;
      default:
        return <Zap size={24} />;
    }
  };

  return (
    <div className="page-content-wrapper">
      {/* Level & XP Overview Banner */}
      <section className="achievements-hero-card">
        <div className="ach-hero-left">
          <div className="level-hexagon-wrap">
            <span className="hex-lvl-label">LVL</span>
            <span className="hex-lvl-num">{levelInfo.level}</span>
          </div>

          <div className="ach-hero-text">
            <h2 className="ach-hero-title">Level {levelInfo.level} Pro Athlete</h2>
            <p className="ach-hero-sub">
              Total Experience: <strong>{currentUser?.xp || 2450} XP</strong> • {levelInfo.xpNeededForNext} XP required for Level {levelInfo.level + 1}
            </p>

            <div className="ach-level-bar-wrap">
              <div className="bar-track">
                <div className="bar-fill gold" style={{ width: `${levelInfo.progressPct}%` }} />
              </div>
              <span className="ach-level-progress-text">{levelInfo.progressPct}% Complete</span>
            </div>
          </div>
        </div>

        <div className="ach-hero-stats">
          <div className="stat-pill-inline highlight">
            <Award size={18} />
            <span className="pill-num">{unlockedCount} / {achievements.length}</span>
            <span className="pill-lbl">Badges Unlocked</span>
          </div>
        </div>
      </section>

      {/* Badges Grid */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-heading">Trophy & Badges Collection</h3>
          <span className="stat-badge-violet">{unlockedCount} Badges Claimed</span>
        </div>

        <div className="achievements-grid">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`achievement-card ${ach.isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="ach-icon-wrapper">
                {ach.isUnlocked ? (
                  <div className="ach-icon-circle unlocked">
                    {getBadgeIcon(ach.icon)}
                  </div>
                ) : (
                  <div className="ach-icon-circle locked">
                    <Lock size={20} className="lock-icon" />
                  </div>
                )}
              </div>

              <div className="ach-info-col">
                <div className="ach-title-row">
                  <h4 className="ach-title">{ach.title}</h4>
                  <span className="ach-xp-chip">+{ach.xpReward} XP</span>
                </div>

                <p className="ach-desc">{ach.description}</p>

                {ach.isUnlocked ? (
                  <div className="ach-unlocked-status">
                    <CheckCircle2 size={14} className="icon-green" />
                    <span>Unlocked on {ach.unlockedAt || 'Jan 2026'}</span>
                  </div>
                ) : (
                  <div className="ach-progress-block">
                    <div className="ach-prog-label-row">
                      <span>Progress</span>
                      <span>{ach.progress}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill violet" style={{ width: `${ach.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
