import { h } from '../../utils/h.js';
import ProgressBar from './ProgressBar.js';
import { round2 } from '../../utils/format.js';

export default function MacroCard({ label, unit, current = 0, target = 0, colorClass }) {
  return h(
    'div',
    { className: `${colorClass} rounded-lg p-4 border border-black/5` },
    h('div', { className: 'text-xs font-medium mb-2' }, label),
    h(
      'div',
      { className: 'text-xl font-bold' },
      round2(current),
      h('span', { className: 'text-sm font-normal' }, ` ${unit}`)
    ),
    h('div', { className: 'text-xs mt-1 mb-2 opacity-80' }, `/ ${round2(target)} ${unit}`),
    h(ProgressBar, { current, target })
  );
}
