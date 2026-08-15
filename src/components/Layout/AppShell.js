import { useState } from 'react';
import { h } from '../../utils/h.js';
import Header from './Header.js';
import Drawer from './Drawer.js';

const TITLES = {
  dashboard: 'Dashboard',
  addFood: 'Add Food',
  history: 'History',
  settings: 'Settings',
  mealDetail: 'Meal Detail'
};

export default function AppShell({
  activeScreen,
  onNavigate,
  profileName,
  onSwitchProfile,
  syncStatus,
  syncConfigured,
  onSync,
  children
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return h(
    'div',
    { className: 'min-h-screen bg-gray-50' },
    h(
      'div',
      { className: 'app-max-width bg-gray-50 min-h-screen relative' },
      h(Header, {
        title: TITLES[activeScreen] || 'Nutrition Tracker',
        onMenuClick: () => setDrawerOpen(true),
        syncStatus,
        syncConfigured,
        onSync
      }),
      h(Drawer, {
        open: drawerOpen,
        onClose: () => setDrawerOpen(false),
        activeScreen,
        onNavigate,
        profileName,
        onSwitchProfile
      }),
      h('main', null, children)
    )
  );
}
