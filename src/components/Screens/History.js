import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { h } from '../../utils/h.js';
import { getLastNDays, formatDateLabel } from '../../utils/dateUtils.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function History({ userData }) {
  const days = useMemo(() => getLastNDays(7), []);

  const chartData = useMemo(
    () => ({
      labels: days.map((d) => formatDateLabel(d)),
      datasets: [
        {
          label: 'Calories',
          data: days.map((d) => userData.daily_totals[d]?.calories || 0),
          backgroundColor: days.map((d) =>
            (userData.daily_totals[d]?.calories || 0) > userData.targets.calories_daily ? '#ef4444' : '#10b981'
          ),
          borderRadius: 4
        }
      ]
    }),
    [days, userData]
  );

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  const weekTotal = days.reduce((sum, d) => sum + (userData.daily_totals[d]?.calories || 0), 0);
  const daysLogged = days.filter((d) => userData.daily_totals[d]).length;
  const avgCalories = daysLogged ? Math.round(weekTotal / daysLogged) : 0;

  return h(
    'div',
    { className: 'p-4 space-y-4 pb-8' },
    h(
      'div',
      { className: 'grid grid-cols-2 gap-3' },
      h(
        'div',
        { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        h('div', { className: 'text-xs text-gray-500' }, 'Avg calories/day'),
        h('div', { className: 'text-2xl font-bold' }, avgCalories)
      ),
      h(
        'div',
        { className: 'bg-white border border-gray-200 rounded-lg p-4' },
        h('div', { className: 'text-xs text-gray-500' }, 'Days logged'),
        h('div', { className: 'text-2xl font-bold' }, `${daysLogged} / 7`)
      )
    ),
    h(
      'div',
      { className: 'bg-white border border-gray-200 rounded-lg p-4' },
      h('div', { className: 'text-sm font-semibold mb-3' }, 'Weekly calories'),
      h(Bar, { data: chartData, options: chartOptions })
    ),
    h(
      'div',
      { className: 'space-y-2' },
      days
        .slice()
        .reverse()
        .map((d) => {
          const totals = userData.daily_totals[d];
          return h(
            'div',
            { key: d, className: 'flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3' },
            h('span', { className: 'text-sm text-gray-600' }, formatDateLabel(d)),
            h('span', { className: 'text-sm font-semibold' }, totals ? `${totals.calories} kcal` : 'No data')
          );
        })
    )
  );
}
