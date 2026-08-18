import { useEffect, useState } from 'react';
import { h, F } from '../../utils/h.js';
import { calculateMacros } from '../../utils/bmiCalculator.js';
import { GOAL_OPTIONS } from '../../utils/constants.js';

const MACRO_FIELDS = [
  { key: 'calories_daily', label: 'Daily calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g' }
];

export default function Settings({ profile, targets, onSave, sync, onSyncNow }) {
  const [formData, setFormData] = useState(profile);
  const [calculatedTargets, setCalculatedTargets] = useState(targets);
  const [overrides, setOverrides] = useState(targets.user_overrides || {});

  useEffect(() => {
    const calculated = calculateMacros(
      formData.height_cm,
      formData.weight_kg,
      formData.goal_weight_kg,
      formData.age,
      formData.gender,
      formData.goals || []
    );
    setCalculatedTargets(calculated);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['height_cm', 'weight_kg', 'goal_weight_kg', 'age'];
    setFormData((prev) => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value }));
  };

  const toggleGoal = (value) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((g) => g !== value) : [...prev.goals, value]
    }));
  };

  const handleOverride = (macro, value) => {
    setOverrides((prev) => ({ ...prev, [macro]: value === '' ? undefined : parseInt(value, 10) }));
  };

  const handleSave = () => {
    const finalTargets = { ...calculatedTargets, ...overrides, user_overrides: overrides };
    onSave({ profile: { ...formData, bmi: calculatedTargets.bmi }, targets: finalTargets });
  };

  const syncLabel = {
    idle: 'Not synced yet',
    syncing: 'Syncing...',
    success: 'Synced',
    error: 'Sync failed'
  }[sync.status];

  return h(
    'div',
    { className: 'p-4 space-y-6 pb-8' },
    h('h2', { className: 'text-lg font-bold' }, 'Profile Settings'),

    h(
      'div',
      null,
      h('h3', { className: 'font-semibold text-sm mb-3' }, 'Basic Information'),
      h(
        'div',
        { className: 'space-y-3' },
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-2' }, 'Name'),
          h('input', { type: 'text', name: 'name', value: formData.name, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' })
        ),
        h(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-2' }, 'Height (cm)'),
            h('input', { type: 'number', name: 'height_cm', value: formData.height_cm, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' })
          ),
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-2' }, 'Weight (kg)'),
            h('input', { type: 'number', name: 'weight_kg', value: formData.weight_kg, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' })
          )
        ),
        h(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-2' }, 'Goal weight (kg)'),
            h('input', { type: 'number', name: 'goal_weight_kg', value: formData.goal_weight_kg, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' })
          ),
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-2' }, 'Age'),
            h('input', { type: 'number', name: 'age', value: formData.age, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' })
          )
        ),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-2' }, 'Gender'),
          h(
            'select',
            { name: 'gender', value: formData.gender, onChange: handleInputChange, className: 'w-full p-2 border rounded-lg' },
            h('option', { value: 'male' }, 'Male'),
            h('option', { value: 'female' }, 'Female')
          )
        ),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-2' }, 'Goals'),
          h(
            'div',
            { className: 'flex flex-wrap gap-2' },
            GOAL_OPTIONS.map((g) =>
              h(
                'button',
                {
                  type: 'button',
                  key: g.value,
                  onClick: () => toggleGoal(g.value),
                  className: `px-3 py-1.5 rounded-full text-sm border ${
                    formData.goals.includes(g.value) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'
                  }`
                },
                g.label
              )
            )
          )
        ),
        h(
          'div',
          { className: 'text-sm text-gray-500' },
          'Current BMI: ',
          h('span', { className: 'font-semibold text-gray-700' }, calculatedTargets.bmi)
        )
      )
    ),

    h(
      'div',
      null,
      h('h3', { className: 'font-semibold text-sm mb-3' }, 'Nutrition Targets (Auto-calculated - override if needed)'),
      h(
        'div',
        { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3' },
        MACRO_FIELDS.map((field) =>
          h(
            'div',
            { key: field.key, className: 'flex items-center gap-3' },
            h('label', { className: 'text-sm font-medium flex-1' }, field.label),
            h('input', {
              type: 'number',
              value: overrides[field.key] ?? calculatedTargets[field.key],
              onChange: (e) => handleOverride(field.key, e.target.value),
              className: 'w-20 p-2 border rounded text-sm'
            }),
            h('span', { className: 'text-sm text-gray-600 w-8' }, field.unit)
          )
        )
      )
    ),

    h('button', { onClick: handleSave, className: 'w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700' }, 'Save Profile'),

    h(
      'div',
      null,
      h('h3', { className: 'font-semibold text-sm mb-3' }, 'GitHub Sync'),
      h(
        'div',
        { className: 'bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2' },
        h(
          'div',
          { className: 'text-sm text-gray-600' },
          'Status: ',
          h('span', { className: 'font-medium text-gray-800' }, sync.configured ? syncLabel : 'Not configured')
        ),
        sync.lastSynced && h('div', { className: 'text-xs text-gray-500' }, `Last synced: ${new Date(sync.lastSynced).toLocaleString()}`),
        sync.error && h('div', { className: 'text-xs text-red-600' }, sync.error),
        !sync.configured &&
          h(
            'div',
            { className: 'text-xs text-gray-500' },
            'The app owner needs to add GITHUB_TOKEN/OWNER/REPO in the Vercel project settings.'
          ),
        h(
          'button',
          {
            onClick: onSyncNow,
            disabled: sync.status === 'syncing',
            className: 'w-full border border-gray-300 py-2 rounded-lg text-sm font-semibold disabled:opacity-50'
          },
          sync.status === 'syncing' ? 'Syncing...' : 'Sync now'
        )
      )
    )
  );
}
