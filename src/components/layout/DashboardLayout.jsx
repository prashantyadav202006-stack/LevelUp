import { useState, useEffect } from 'react';
import '../../dashboard.css';
import Sidebar from './Sidebar';
import Header from './Header';
import GoalModal from '../goals/GoalModal';
import DownloadAppModal from './DownloadAppModal';
import AddFriendModal from '../social/AddFriendModal';
import YourFriendsModal from '../social/YourFriendsModal';
import GoogleOnboardingModal from '../auth/GoogleOnboardingModal';
import OverviewPage from '../../pages/OverviewPage';
import GoalsPage from '../../pages/GoalsPage';
import RoutinePage from '../../pages/RoutinePage';
import NutritionPage from '../../pages/NutritionPage';
import FitnessPage from '../../pages/FitnessPage';
import SocialPage from '../../pages/SocialPage';
import LeaderboardPage from '../../pages/LeaderboardPage';
import AnalyticsPage from '../../pages/AnalyticsPage';
import AchievementsPage from '../../pages/AchievementsPage';
import SettingsPage from '../../pages/SettingsPage';
import { useAuth } from '../../context/AuthContext';
import { goalsService } from '../../services/goalsService';
import { sfx } from '../../utils/soundEngine';

export default function DashboardLayout({ showToast }) {
  const { currentUser, awardXp, updateProfile } = useAuth();
  // Match reference screenshot: 'dashboard' is the active landing view
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);

  // Download App Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Add Friend Modal State (matching reference image)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  // Your Friends Modal State (matching reference image)
  const [isYourFriendsModalOpen, setIsYourFriendsModalOpen] = useState(false);

  // Google Sign-In Onboarding Modal State (matching user uploaded picture)
  const [isGoogleOnboardingModalOpen, setIsGoogleOnboardingModalOpen] = useState(false);

  // Automatically check if Google user needs onboarding profile configuration
  useEffect(() => {
    const isGoogleUser =
      currentUser?.authProvider === 'google' ||
      currentUser?.provider === 'google' ||
      currentUser?.providerData?.some((p) => p.providerId === 'google.com') ||
      sessionStorage.getItem('last_auth_provider') === 'google';

    const needsOnboarding =
      currentUser?.isOnboardingCompleted !== true ||
      sessionStorage.getItem('prompt_google_onboarding') === 'true';

    if (isGoogleUser && needsOnboarding) {
      setIsGoogleOnboardingModalOpen(true);
    }
  }, [currentUser]);

  const handleSaveGoogleOnboarding = async (formData) => {
    try {
      const updates = {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        targets: {
          calories: Number(formData.calories) || 2600,
          protein: Number(formData.protein) || 165,
          carbs: Number(formData.carbs) || 280,
          fats: Number(formData.fats) || 70,
          water: Number(formData.water) || 3500,
          steps: Number(formData.steps) || 10000,
        },
        settings: {
          units: formData.units || 'metric',
          timeZone: formData.timeZone || 'Asia/Kolkata',
          visibility: formData.visibility || 'public',
          notifications: true,
        },
        isOnboardingCompleted: true,
        authProvider: 'google',
      };

      if (typeof updateProfile === 'function') {
        await updateProfile(updates);
      }
      sessionStorage.removeItem('prompt_google_onboarding');
      setIsGoogleOnboardingModalOpen(false);
      sfx.playSuccess();
      showToast(`Athlete Profile Established! Welcome, ${updates.displayName}! 🚀`, 'success');
    } catch (err) {
      console.error('Error saving Google onboarding profile:', err);
      showToast('Error saving profile settings. Please try again.', 'error');
    }
  };

  const handleOpenAddGoal = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (goalToEdit) {
        await goalsService.updateGoal(currentUser?.uid, goalToEdit.id, goalData);
        showToast('Goal updated in Firestore! ⚡', 'success');
      } else {
        await goalsService.createGoal(currentUser?.uid, goalData);
        awardXp(50, 'Created goal');
        showToast('New discipline goal saved to Firestore! +50 XP 🚀', 'success');
      }
    } catch (err) {
      console.error('Error saving goal:', err);
      showToast(err.message || 'Failed to save goal to Firestore', 'error');
    }
  };

  // Window View Action (Ambient Focus Fullscreen Toggle)
  const handleToggleWindowView = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        showToast('🌅 Window Focus Mode activated! Press Esc to exit.', 'info');
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        showToast('Exited Window Focus Mode.', 'info');
      }
    } catch {
      showToast('🌅 Window Focus Mode enabled.', 'info');
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <OverviewPage
            onOpenAddGoal={handleOpenAddGoal}
            onNavigate={(page) => setActivePage(page)}
          />
        );
      case 'overview':
      case 'goals':
        return (
          <GoalsPage
            onOpenAddGoal={handleOpenAddGoal}
            onEditGoal={handleOpenEditGoal}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'whats-next':
      case 'routine':
        return <RoutinePage />;
      case 'add-friend':
        return <SocialPage initialTab="add-friends" />;
      case 'your-friends':
      case 'social':
        return <SocialPage initialTab="your-friends" />;
      case 'fitness':
        return <FitnessPage />;
      case 'nutrition':
        return <NutritionPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <OverviewPage
            onOpenAddGoal={handleOpenAddGoal}
            onNavigate={(page) => setActivePage(page)}
          />
        );
    }
  };

  return (
    <div className={`dashboard-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Persistent Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        onOpenWindowView={handleToggleWindowView}
        onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
        onOpenAddFriendModal={() => setIsAddFriendModalOpen(true)}
        onOpenYourFriendsModal={() => setIsYourFriendsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="dashboard-main-pane">
        <Header
          onOpenAddGoal={handleOpenAddGoal}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        <main className="dashboard-scrollable-content">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Goal Creation & Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
        initialGoal={goalToEdit}
      />

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Add a Friend Modal (Exact match to reference design) */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        currentUser={currentUser}
        onFriendRequestSent={(handle) => showToast(`Friend request sent to @${handle}! ⚡`, 'success')}
      />

      {/* Your Friends & Accountability Circle Modal (Exact match to reference design) */}
      <YourFriendsModal
        isOpen={isYourFriendsModalOpen}
        onClose={() => setIsYourFriendsModalOpen(false)}
        currentUser={currentUser}
        onOpenAddFriend={() => {
          setIsYourFriendsModalOpen(false);
          setIsAddFriendModalOpen(true);
        }}
        showToast={showToast}
      />

      {/* Google Athlete Profile Onboarding Modal (Matching Reference Picture) */}
      <GoogleOnboardingModal
        isOpen={isGoogleOnboardingModalOpen}
        onClose={() => {
          sessionStorage.removeItem('prompt_google_onboarding');
          setIsGoogleOnboardingModalOpen(false);
        }}
        currentUser={currentUser}
        onSave={handleSaveGoogleOnboarding}
      />
    </div>
  );
}
