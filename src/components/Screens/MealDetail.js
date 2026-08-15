import { useState } from 'react';
import { ArrowLeft, Trash2, Pencil, Check, X } from 'lucide-react';
import { h, F } from '../../utils/h.js';
import { round2 } from '../../utils/format.js';
import { ALL_NUTRIENT_KEYS } from '../../utils/constants.js';
import { NUTRITION_DB, findDbKey, scaleEntry } from '../../services/nutritionDB.js';

const NUTRIENT_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'vitamin_d_mcg', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitamin_b12_mcg', label: 'Vitamin B12', unit: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'folate_mcg', label: 'Folate', unit: 'mcg' }
];

const UNIT_LABEL = { g: 'grams', ml: 'milliliters', count: 'pieces', serving: 'servings' };

// Best-effort amount for items saved before amount/dbKey were tracked on the item itself.
const resolveItemAmount = (item, dbKey) => {
  if (item.amount) return item.amount;
  if (!dbKey) return { value: 1, unit: 'serving' };
  const entry = NUTRITION_DB[dbKey];
  const unit = entry.unitType === 'volume' ? 'ml' : entry.unitType === 'count' ? 'count' : 'g';
  const value = entry.calories ? round2((item.calories / entry.calories) * entry.baseAmount) : entry.baseAmount;
  return { value, unit };
};

export default function MealDetail({ meal, onBack, onDeleteMeal, onDeleteItem, onEditItem }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftDbKey, setDraftDbKey] = useState(null);
  const [draftUnit, setDraftUnit] = useState('g');

  if (!meal) {
    return h(
      'div',
      { className: 'p-4' },
      h('button', { onClick: onBack, className: 'flex items-center gap-1 text-sm text-gray-500' }, h(ArrowLeft, { size: 16 }), ' Back'),
      h('div', { className: 'mt-4 text-sm text-gray-400' }, 'Meal not found.')
    );
  }

  const startEdit = (index, item) => {
    const dbKey = item.dbKey !== undefined ? item.dbKey : findDbKey(item.food_name || '');
    const amount = resolveItemAmount(item, dbKey);
    setEditingIndex(index);
    setDraftValue(String(amount.value));
    setDraftDbKey(dbKey);
    setDraftUnit(amount.unit);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftValue('');
    setDraftDbKey(null);
  };

  const saveEdit = (index) => {
    const newValue = Number(draftValue);
    if (!newValue || newValue <= 0) return;

    if (draftDbKey) {
      const entry = NUTRITION_DB[draftDbKey];
      const rescaled = scaleEntry({ ...entry, source: 'local_fallback' }, { value: newValue, unit: draftUnit });
      onEditItem(meal.id, index, { ...rescaled, dbKey: draftDbKey });
    } else {
      const item = meal.items[index];
      const currentValue = item.amount?.value || 1;
      const multiplier = newValue / currentValue;
      const updates = ALL_NUTRIENT_KEYS.reduce((acc, key) => ({ ...acc, [key]: round2((item[key] || 0) * multiplier) }), {});
      updates.amount = { value: newValue, unit: draftUnit };
      updates.portion = `${newValue} ${newValue === 1 ? UNIT_LABEL[draftUnit].replace(/s$/, '') : UNIT_LABEL[draftUnit]}`;
      onEditItem(meal.id, index, updates);
    }
    cancelEdit();
  };

  return h(
    'div',
    { className: 'p-4 space-y-4 pb-8' },
    h(
      'div',
      { className: 'flex items-center justify-between' },
      h('button', { onClick: onBack, className: 'flex items-center gap-1 text-sm text-gray-500' }, h(ArrowLeft, { size: 16 }), ' Back'),
      h(
        'button',
        { onClick: () => onDeleteMeal(meal.id), className: 'flex items-center gap-1 text-sm text-red-500' },
        h(Trash2, { size: 16 }),
        ' Delete meal'
      )
    ),
    h(
      'div',
      null,
      h('h2', { className: 'text-lg font-bold capitalize' }, meal.meal_type),
      h('div', { className: 'text-sm text-gray-500' }, `${meal.date} · ${meal.timestamp}`)
    ),
    h(
      'div',
      { className: 'bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-3' },
      NUTRIENT_FIELDS.map((f) =>
        h(
          'div',
          { key: f.key },
          h('div', { className: 'text-xs text-gray-500' }, f.label),
          h('div', { className: 'text-lg font-bold' }, `${round2(meal.totals[f.key] || 0)} ${f.unit}`)
        )
      )
    ),
    h(
      'div',
      null,
      h('h3', { className: 'text-sm font-semibold text-gray-700 mb-2' }, 'Items'),
      h(
        'div',
        { className: 'space-y-2' },
        meal.items.map((item, i) => {
          const isEditing = editingIndex === i;
          return h(
            'div',
            { key: `${item.food_name}-${i}`, className: 'bg-white border border-gray-200 rounded-lg p-3' },
            h(
              'div',
              { className: 'flex justify-between items-start' },
              h(
                'div',
                null,
                h('div', { className: 'text-sm font-semibold' }, item.food_name),
                h('div', { className: 'text-xs text-gray-500' }, item.portion)
              ),
              !isEditing &&
                h(
                  'div',
                  { className: 'flex gap-2' },
                  h('button', { onClick: () => startEdit(i, item), className: 'flex items-center gap-1 text-xs text-blue-600' }, h(Pencil, { size: 12 }), ' Edit'),
                  h('button', { onClick: () => onDeleteItem(meal.id, i), className: 'flex items-center gap-1 text-xs text-red-500' }, 'Remove')
                )
            ),
            !isEditing &&
              h(
                'div',
                { className: 'text-xs text-gray-600 mt-2' },
                `${item.calories} kcal · P ${item.protein_g}g · C ${item.carbs_g}g · F ${item.fat_g}g`
              ),
            isEditing &&
              h(
                F,
                null,
                h(
                  'div',
                  { className: 'flex items-center gap-2 mt-2' },
                  h('label', { className: 'text-xs text-gray-600' }, `How much ${item.food_name.split(',')[0]} did you have?`)
                ),
                h(
                  'div',
                  { className: 'flex items-center gap-2 mt-1' },
                  h('input', {
                    type: 'number',
                    min: 0,
                    value: draftValue,
                    onChange: (e) => setDraftValue(e.target.value),
                    className: 'flex-1 p-2 border rounded-lg text-sm'
                  }),
                  h('span', { className: 'text-sm text-gray-500' }, UNIT_LABEL[draftUnit])
                ),
                h(
                  'div',
                  { className: 'flex gap-2 mt-2' },
                  h(
                    'button',
                    { onClick: () => saveEdit(i), className: 'flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-xs font-semibold' },
                    h(Check, { size: 14 }),
                    ' Save'
                  ),
                  h(
                    'button',
                    { onClick: cancelEdit, className: 'flex-1 flex items-center justify-center gap-1 border border-gray-300 py-2 rounded-lg text-xs font-semibold' },
                    h(X, { size: 14 }),
                    ' Cancel'
                  )
                )
              )
          );
        })
      )
    )
  );
}
