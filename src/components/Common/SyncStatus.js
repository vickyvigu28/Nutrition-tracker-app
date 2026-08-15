import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { h } from '../../utils/h.js';

export default function SyncStatus({ status, configured, onSync }) {
  if (!configured) {
    return h(
      'button',
      { onClick: onSync, title: 'GitHub sync not configured', className: 'text-gray-400' },
      h(CloudOff, { size: 20 })
    );
  }

  const icon =
    {
      idle: h(RefreshCw, { size: 20, className: 'text-gray-500' }),
      syncing: h(RefreshCw, { size: 20, className: 'text-blue-500 animate-spin' }),
      success: h(Check, { size: 20, className: 'text-green-500' }),
      error: h(AlertTriangle, { size: 20, className: 'text-red-500' })
    }[status] || h(RefreshCw, { size: 20, className: 'text-gray-500' });

  return h('button', { onClick: onSync, title: 'Sync with GitHub', className: 'p-1' }, icon);
}
