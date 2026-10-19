import { useState } from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Crown,
  Medal,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { socialService } from '../services/socialService';
import { useAuth } from '../context/AuthContext';
import { sfx } from '../utils/soundEngine';

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('weekly'); // daily, weekly, allTime
  const [filter, setFilter] = useState('global'); // global, friends

  const leaderboardData = socialService.getLeaderboard(period, filter, currentUser);
  const top3 = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="podium-crown gold" size={24} />;
    if (rank === 2) return <Medal className="podium-crown silver" size={22} />;
    if (rank === 3) return <Medal className="podium-crown bronze" size={20} />;
    return <span className="rank-number">#{rank}</span>;
  };

  return (
    <div className="page-content-wrapper">
      {/* Top Header & Time Period Filters */}
      <section className="section-header-row">
        <div>
          <h2 className="section-heading">Competitive Leaderboard</h2>
          <p className="section-subheading">
            Authentic rankings calculated from verified goal completions, workout consistency, and challenges.
          </p>
        </div>

        <div className="tab-pill-container inline">
          <button
            type="button"
            className={`tab-btn ${period === 'daily' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setPeriod('daily');
            }}
          >
            Daily
          </button>
          <button
            type="button"
            className={`tab-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setPeriod('weekly');
            }}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`tab-btn ${period === 'allTime' ? 'active' : ''}`}
            onClick={() => {
              sfx.playSwitch();
              setPeriod('allTime');
            }}
          >
            All-Time
          </button>
        </div>
      </section>

      {/* Top 3 Podium Cards */}
      <section className="podium-section">
        {/* Rank 2 (Silver) */}
        {top3[1] && (
          <div className="podium-card silver">
            <div className="podium-rank-badge silver">2</div>
            <img src={top3[1].avatar} alt={top3[1].displayName} className="podium-avatar" />
            <span className="podium-name">{top3[1].displayName}</span>
            <span className="podium-username">@{top3[1].username}</span>
            <div className="podium-xp-badge">{top3[1].xp} XP</div>
            <div className="podium-substats">
              <span>{top3[1].goalsCompleted} goals</span> • <span>{top3[1].currentStreak}d streak</span>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold - Elevated Center) */}
        {top3[0] && (
          <div className="podium-card gold elevated">
            <div className="crown-wrap">
              <Crown size={28} className="crown-icon" />
            </div>
            <div className="podium-rank-badge gold">1</div>
            <img src={top3[0].avatar} alt={top3[0].displayName} className="podium-avatar gold-ring" />
            <span className="podium-name">{top3[0].displayName}</span>
            <span className="podium-username">@{top3[0].username}</span>
            <div className="podium-xp-badge gold">{top3[0].xp} XP</div>
            <div className="podium-substats">
              <span>{top3[0].goalsCompleted} goals</span> • <span>{top3[0].currentStreak}d streak</span>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3[2] && (
          <div className="podium-card bronze">
            <div className="podium-rank-badge bronze">3</div>
            <img src={top3[2].avatar} alt={top3[2].displayName} className="podium-avatar" />
            <span className="podium-name">{top3[2].displayName}</span>
            <span className="podium-username">@{top3[2].username}</span>
            <div className="podium-xp-badge">{top3[2].xp} XP</div>
            <div className="podium-substats">
              <span>{top3[2].goalsCompleted} goals</span> • <span>{top3[2].currentStreak}d streak</span>
            </div>
          </div>
        )}
      </section>

      {/* Rankings Table */}
      <section className="dashboard-section">
        <div className="rankings-table-container">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Athlete</th>
                <th>Level</th>
                <th>Streak</th>
                <th>Goals Crushed</th>
                <th className="text-right">Total XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((row) => (
                <tr key={row.rank} className={row.isCurrentUser ? 'current-user-row' : ''}>
                  <td className="rank-col">{getRankBadge(row.rank)}</td>
                  <td className="athlete-col">
                    <div className="athlete-inline-cell">
                      <img src={row.avatar} alt={row.displayName} className="table-avatar" />
                      <div>
                        <span className="athlete-display-name">
                          {row.displayName} {row.isCurrentUser && <span className="you-pill">You</span>}
                        </span>
                        <span className="athlete-handle">@{row.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-lvl">LVL {row.level}</span>
                  </td>
                  <td>
                    <span className="streak-pill-table">
                      <Flame size={14} /> {row.currentStreak}d
                    </span>
                  </td>
                  <td>
                    <span className="table-goals-count">{row.goalsCompleted}</span>
                  </td>
                  <td className="text-right">
                    <span className="table-xp-num">{row.xp.toLocaleString()} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scoring Explanation Card */}
      <section className="scoring-info-card">
        <div className="scoring-header">
          <ShieldCheck size={20} className="icon-violet" />
          <h4 className="scoring-title">Transparent & Tamper-Proof Scoring Rules</h4>
        </div>
        <p className="scoring-desc">
          To ensure fair competition, points are verified upon authentic database events. Duplicate completion awards are blocked.
        </p>
        <div className="scoring-grid">
          <div className="scoring-rule">
            <span className="rule-pts">+25 XP</span>
            <span className="rule-action">Daily Goal Checkoff</span>
          </div>
          <div className="scoring-rule">
            <span className="rule-pts">+50 XP</span>
            <span className="rule-action">45+ Min Logged Workout</span>
          </div>
          <div className="scoring-rule">
            <span className="rule-pts">+20 XP</span>
            <span className="rule-action">Meeting Daily Hydration Target</span>
          </div>
          <div className="scoring-rule">
            <span className="rule-pts">+150 XP</span>
            <span className="rule-action">7-Day Unbroken Streak Bonus</span>
          </div>
        </div>
      </section>
    </div>
  );
}
