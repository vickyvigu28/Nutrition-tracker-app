import { LayoutDashboard, PlusCircle, LineChart, Settings as SettingsIcon, X, LogOut } from 'lucide-react';
import { h, F } from '../../utils/h.js';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'addFood', label: 'Add Food', icon: PlusCircle },
  { key: 'history', label: 'History', icon: LineChart },
  { key: 'settings', label: 'Settings', icon: SettingsIcon }
];

export default function Drawer({ open, onClose, activeScreen, onNavigate, profileName, onSwitchProfile }) {
  return h(
    F,
    null,
    open && h('div', { className: 'fixed inset-0 bg-black/40 z-30', onClick: onClose }),
    h(
      'aside',
      {
        className: `fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`
      },
      h(
        'div',
        { className: 'flex items-center justify-between p-4 border-b border-gray-200' },
        h(
          'div',
          null,
          h('div', { className: 'text-xs text-gray-500' }, 'Signed in as'),
          h('div', { className: 'font-semibold' }, profileName || 'Guest')
        ),
        h('button', { onClick: onClose, 'aria-label': 'Close menu', className: 'p-1' }, h(X, { size: 20 }))
      ),
      h(
        'nav',
        { className: 'p-2' },
        NAV_ITEMS.map(({ key, label, icon: Icon }) =>
          h(
            'button',
            {
              key,
              onClick: () => {
                onNavigate(key);
                onClose();
              },
              className: `w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                activeScreen === key ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
              }`
            },
            h(Icon, { size: 18 }),
            label
          )
        )
      ),
      h(
        'div',
        { className: 'absolute bottom-0 left-0 w-full p-2 border-t border-gray-200' },
        h(
          'button',
          {
            onClick: onSwitchProfile,
            className: 'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50'
          },
          h(LogOut, { size: 18 }),
          'Switch profile'
        )
      )
    )
  );
}
