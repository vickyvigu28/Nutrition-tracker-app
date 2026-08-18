import { useCallback, useState } from 'react';
import { h } from './utils/h.js';
import { ToastProvider, useToast } from './components/Common/Toast.js';
import ProfileGate from './components/Profile/ProfileGate.js';
import AppShell from './components/Layout/AppShell.js';
import Dashboard from './components/Screens/Dashboard.js';
import AddFood from './components/Screens/AddFood.js';
import History from './components/Screens/History.js';
import Settings from './components/Screens/Settings.js';
import MealDetail from './components/Screens/MealDetail.js';
import {
  useLocalStorage,
  writeJSON,
  PROFILES_KEY,
  ACTIVE_USER_KEY,
  userDataKey
} from './hooks/useLocalStorage.js';
import { useGitHubSync } from './hooks/useGitHubSync.js';
import { todayStr } from './utils/dateUtils.js';
import { ALL_NUTRIENT_KEYS } from './utils/constants.js';
import { round2 } from './utils/format.js';

const EMPTY_TOTALS = ALL_NUTRIENT_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

const sumTotals = (items) =>
  items.reduce((acc, item) => {
    const next = { ...acc };
    Object.keys(EMPTY_TOTALS).forEach((k) => {
      next[k] = round2(acc[k] + Number(item[k] || 0));
    });
    return next;
  }, { ...EMPTY_TOTALS });

const recomputeDailyTotals = (meals) => {
  const totals = {};
  meals.forEach((meal) => {
    const existing = totals[meal.date] || { ...EMPTY_TOTALS };
    const next = { ...existing };
    Object.keys(EMPTY_TOTALS).forEach((k) => {
      next[k] = round2(existing[k] + (meal.totals[k] || 0));
    });
    totals[meal.date] = next;
  });
  return totals;
};

function AuthedApp({ userId, onSwitchProfile }) {
  const [userData, setUserData] = useLocalStorage(userDataKey(userId), null);
  const [screen, setScreen] = useState('dashboard');
  const [activeMealId, setActiveMealId] = useState(null);
  const showToast = useToast();

  const handleSynced = useCallback((data) => setUserData(data), [setUserData]);
  const sync = useGitHubSync(userId, userData, handleSynced);

  if (!userData) {
    return h('div', { className: 'p-4 text-sm text-gray-500' }, 'Loading profile...');
  }

  const handleAddMeal = (meal) => {
    setUserData((prev) => {
      const meals = [...prev.meals, meal];
      return { ...prev, meals, daily_totals: recomputeDailyTotals(meals) };
    });
  };

  const handleDeleteMeal = (mealId) => {
    setUserData((prev) => {
      const meals = prev.meals.filter((m) => m.id !== mealId);
      return { ...prev, meals, daily_totals: recomputeDailyTotals(meals) };
    });
    setActiveMealId(null);
    setScreen('dashboard');
  };

  const handleDeleteItem = (mealId, itemIndex) => {
    setUserData((prev) => {
      const meals = prev.meals.map((m) => {
        if (m.id !== mealId) return m;
        const items = m.items.filter((_, i) => i !== itemIndex);
        return { ...m, items, totals: sumTotals(items) };
      });
      return { ...prev, meals, daily_totals: recomputeDailyTotals(meals) };
    });
  };

  const handleEditItem = (mealId, itemIndex, updates) => {
    setUserData((prev) => {
      const meals = prev.meals.map((m) => {
        if (m.id !== mealId) return m;
        const items = m.items.map((item, i) => (i === itemIndex ? { ...item, ...updates } : item));
        return { ...m, items, totals: sumTotals(items) };
      });
      return { ...prev, meals, daily_totals: recomputeDailyTotals(meals) };
    });
    showToast('Item updated', 'success');
  };

  const handleAddWater = (cups) => {
    setUserData((prev) => ({ ...prev, water_intake: { ...prev.water_intake, [todayStr()]: cups } }));
  };

  const handleSaveSettings = ({ profile, targets }) => {
    setUserData((prev) => ({ ...prev, profile, targets }));
    showToast('Profile saved', 'success');
  };

  const handleOpenMeal = (mealId) => {
    setActiveMealId(mealId);
    setScreen('mealDetail');
  };

  const activeMeal = userData.meals.find((m) => m.id === activeMealId);

  const screens = {
    dashboard: h(Dashboard, { userData, onOpenMeal: handleOpenMeal, onAddWater: handleAddWater }),
    addFood: h(AddFood, { onAddMeal: handleAddMeal }),
    history: h(History, { userData }),
    settings: h(Settings, {
      profile: userData.profile,
      targets: userData.targets,
      onSave: handleSaveSettings,
      sync,
      onSyncNow: sync.syncNow
    }),
    mealDetail: h(MealDetail, {
      meal: activeMeal,
      onBack: () => setScreen('dashboard'),
      onDeleteMeal: handleDeleteMeal,
      onDeleteItem: handleDeleteItem,
      onEditItem: handleEditItem
    })
  };

  return h(
    AppShell,
    {
      activeScreen: screen,
      onNavigate: setScreen,
      profileName: userData.profile.name,
      onSwitchProfile,
      syncStatus: sync.status,
      syncConfigured: sync.configured,
      onSync: sync.syncNow
    },
    screens[screen]
  );
}

function Root() {
  const [profiles, setProfiles] = useLocalStorage(PROFILES_KEY, []);
  const [activeUserId, setActiveUserId] = useLocalStorage(ACTIVE_USER_KEY, null);

  const handleCreateProfile = (profileMeta, userData) => {
    setProfiles((prev) => [...prev, profileMeta]);
    writeJSON(userDataKey(profileMeta.user_id), userData);
    setActiveUserId(profileMeta.user_id);
  };

  const handleLogin = (userId) => setActiveUserId(userId);
  const handleSwitchProfile = () => setActiveUserId(null);

  if (!activeUserId) {
    return h(ProfileGate, { profiles, onCreateProfile: handleCreateProfile, onLogin: handleLogin });
  }

  return h(AuthedApp, { key: activeUserId, userId: activeUserId, onSwitchProfile: handleSwitchProfile });
}

export default function App() {
  return h(ToastProvider, null, h(Root, null));
}
