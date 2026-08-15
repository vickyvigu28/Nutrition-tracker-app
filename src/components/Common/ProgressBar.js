import { h } from '../../utils/h.js';
import { STATUS_COLORS } from '../../utils/constants.js';

export const getStatus = (current, target) => (current >= target ? 'success' : 'warning');

export default function ProgressBar({ current = 0, target = 1 }) {
  const percent = Math.min((current / (target || 1)) * 100, 100);
  const status = getStatus(current, target);

  return h(
    'div',
    { className: 'w-full bg-gray-200 rounded-full h-2' },
    h('div', {
      className: 'h-2 rounded-full transition-all',
      style: {
        width: `${percent}%`,
        backgroundColor: STATUS_COLORS[status]
      }
    })
  );
}
