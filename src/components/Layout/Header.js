import { Menu } from 'lucide-react';
import { h } from '../../utils/h.js';
import SyncStatus from '../Common/SyncStatus.js';

export default function Header({ title, onMenuClick, syncStatus, syncConfigured, onSync }) {
  return h(
    'header',
    { className: 'sticky top-0 z-20 bg-white border-b border-gray-200' },
    h(
      'div',
      { className: 'app-max-width flex items-center justify-between px-3 py-3' },
      h('button', { onClick: onMenuClick, 'aria-label': 'Open menu', className: 'p-1' }, h(Menu, { size: 22 })),
      h('h1', { className: 'text-base font-semibold absolute left-1/2 -translate-x-1/2' }, title),
      h(SyncStatus, { status: syncStatus, configured: syncConfigured, onSync })
    )
  );
}
