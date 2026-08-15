import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { h, F } from '../../utils/h.js';

export default function MicroButton({ micros }) {
  const [open, setOpen] = useState(false);

  return h(
    'div',
    null,
    h(
      'button',
      {
        onClick: () => setOpen(!open),
        className: 'w-full flex items-center justify-between text-left p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-700 font-medium'
      },
      h('span', null, `Minerals (${micros.map((m) => m.label).join(', ')})`),
      open ? h(ChevronDown, { size: 18 }) : h(ChevronRight, { size: 18 })
    ),
    open &&
      h(
        'div',
        { className: 'bg-teal-50 border border-teal-200 rounded-lg p-4 mt-2 space-y-3' },
        micros.map((micro) =>
          h(
            'div',
            { key: micro.label, className: 'flex justify-between items-center' },
            h('span', { className: 'text-sm font-medium text-gray-700' }, micro.label),
            h(
              'div',
              { className: 'flex gap-2' },
              h('span', { className: 'font-semibold text-teal-700' }, micro.current || 0),
              h('span', { className: 'text-gray-400' }, '/'),
              h('span', { className: 'text-gray-600' }, `${micro.target} ${micro.unit}`)
            )
          )
        )
      )
  );
}
