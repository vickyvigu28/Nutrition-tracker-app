import { Droplet } from 'lucide-react';
import { h } from '../../utils/h.js';
import MacroCard from '../Common/MacroCard.js';
import MicroButton from '../Common/MicroButton.js';
import ProgressBar from '../Common/ProgressBar.js';
import { MACRO_FIELDS, MICRO_FIELDS } from '../../utils/constants.js';
import { todayStr } from '../../utils/dateUtils.js';
import { round2 } from '../../utils/format.js';

export default function Dashboard({ userData, onOpenMeal, onAddWater }) {
  const today = todayStr();
  const todayData = userData.daily_totals[today] || {};
  const todaysMeals = userData.meals.filter((m) => m.date === today);
  const waterCups = userData.water_intake[today] || 0;
  const targets = userData.targets;

  const micros = MICRO_FIELDS.map((m) => ({
    label: m.label,
    unit: m.unit,
    current: round2(todayData[m.key] || 0),
    target: round2(targets[m.key])
  }));

  return h(
    'div',
    { className: 'space-y-4 p-4 pb-8' },
    h(
      'div',
      { className: 'bg-white rounded-lg p-4 border border-gray-200' },
      h('div', { className: 'text-sm text-gray-600 mb-2' }, 'Total calories'),
      h(
        'div',
        { className: 'text-3xl font-bold' },
        round2(todayData.calories || 0),
        ' ',
        h('span', { className: 'text-lg text-gray-400' }, `/ ${round2(targets.calories_daily)}`)
      ),
      h(
        'div',
        { className: 'mt-3' },
        h(ProgressBar, { current: todayData.calories || 0, target: targets.calories_daily })
      )
    ),
    h(
      'div',
      { className: 'grid grid-cols-2 gap-3' },
      MACRO_FIELDS.map((macro) =>
        h(MacroCard, {
          key: macro.key,
          label: macro.label,
          unit: macro.unit,
          current: todayData[macro.key] || 0,
          target: targets[macro.key],
          colorClass: macro.color
        })
      )
    ),
    h(MicroButton, { micros }),
    h(
      'div',
      { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between' },
      h(
        'div',
        { className: 'flex items-center gap-2' },
        h(Droplet, { size: 18, className: 'text-blue-500' }),
        h('span', { className: 'text-sm font-medium text-gray-700' }, `Water: ${waterCups} cups`)
      ),
      h(
        'div',
        { className: 'flex gap-2' },
        h(
          'button',
          {
            onClick: () => onAddWater(Math.max(0, waterCups - 1)),
            className: 'w-8 h-8 rounded-full bg-white border border-blue-300 text-blue-600 font-bold'
          },
          '-'
        ),
        h(
          'button',
          {
            onClick: () => onAddWater(waterCups + 1),
            className: 'w-8 h-8 rounded-full bg-blue-500 text-white font-bold'
          },
          '+'
        )
      )
    ),
    h(
      'div',
      null,
      h('h3', { className: 'text-sm font-semibold text-gray-700 mb-2' }, "Today's meals"),
      todaysMeals.length === 0 &&
        h(
          'div',
          { className: 'text-sm text-gray-400 p-4 text-center border border-dashed rounded-lg' },
          'No meals logged yet today'
        ),
      h(
        'div',
        { className: 'space-y-2' },
        todaysMeals.map((meal) =>
          h(
            'button',
            {
              key: meal.id,
              onClick: () => onOpenMeal(meal.id),
              className: 'w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-left'
            },
            h(
              'div',
              null,
              h('div', { className: 'text-sm font-semibold capitalize' }, meal.meal_type),
              h('div', { className: 'text-xs text-gray-500' }, `${meal.timestamp} · ${meal.items.length} item(s)`)
            ),
            h('div', { className: 'text-sm font-semibold text-gray-700' }, `${meal.totals.calories} kcal`)
          )
        )
      )
    )
  );
}
