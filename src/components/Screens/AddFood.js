import { useState } from 'react';
import { h, F } from '../../utils/h.js';
import { useOpenAI } from '../../hooks/useOpenAI.js';
import { useToast } from '../Common/Toast.js';
import { MEAL_TYPES, ALL_NUTRIENT_KEYS } from '../../utils/constants.js';
import { nowTimeStr, todayStr, addDaysStr } from '../../utils/dateUtils.js';
import { round2 } from '../../utils/format.js';

const MIN_PAST_DAYS = 5;

export default function AddFood({ onAddMeal }) {
  const { parse, lookupNutrition, loading, mocked } = useOpenAI();
  const showToast = useToast();

  const today = todayStr();
  const minDate = addDaysStr(today, -MIN_PAST_DAYS);

  const [step, setStep] = useState('input');
  const [inputText, setInputText] = useState('');
  const [mealDate, setMealDate] = useState(today);
  const [ambiguities, setAmbiguities] = useState([]);
  const [parsedItems, setParsedItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [mealType, setMealType] = useState('breakfast');

  const resetAll = () => {
    setStep('input');
    setInputText('');
    setMealDate(today);
    setAmbiguities([]);
    setParsedItems([]);
    setAnswers({});
  };

  const addMealFromItems = async (items) => {
    try {
      const nutritionItems = (await lookupNutrition(items)).map((d) => ({ ...d, user_confirmed: true }));

      const totals = nutritionItems.reduce((acc, item) => {
        const next = { ...acc };
        ALL_NUTRIENT_KEYS.forEach((key) => {
          next[key] = round2(acc[key] + Number(item[key] || 0));
        });
        return next;
      }, ALL_NUTRIENT_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}));

      const meal = {
        id: `meal_${Date.now()}`,
        date: mealDate,
        meal_type: mealType,
        timestamp: nowTimeStr(),
        items: nutritionItems,
        totals
      };

      onAddMeal(meal);
      showToast('Meal added to the log', 'success');
      resetAll();
    } catch (err) {
      showToast(`Couldn't fetch nutrition: ${err.message}`, 'error');
    }
  };

  const handleParse = async () => {
    if (!inputText.trim()) return;
    try {
      const result = await parse(inputText);
      setParsedItems(result.parsed_items || []);
      if (result.ambiguities && result.ambiguities.length > 0) {
        setAmbiguities(result.ambiguities);
        setStep('clarify');
      } else {
        await addMealFromItems(result.parsed_items || []);
      }
    } catch (err) {
      showToast(`Couldn't parse food: ${err.message}`, 'error');
    }
  };

  const handleClarificationAnswer = (item, value) => {
    setAnswers((prev) => ({ ...prev, [item]: value }));
  };

  const handleClarificationSubmit = async () => {
    const enriched = parsedItems.map((p) => {
      const amb = ambiguities.find((a) => a.item === p.item);
      if (!amb) return p;
      return { ...p, amount: { value: Number(answers[p.item]), unit: amb.unit } };
    });
    await addMealFromItems(enriched);
  };

  const clarificationsReady = ambiguities.every((a) => Number(answers[a.item]) > 0);

  return h(
    'div',
    { className: 'p-4 space-y-4 pb-8' },
    mocked &&
      h(
        'div',
        { className: 'text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-2' },
        'OpenAI key not set - using the local food list only. Unrecognized foods get a rough placeholder estimate. Add a key in Settings → Connections to look up and learn new foods automatically.'
      ),

    step === 'input' &&
      h(
        F,
        null,
        h('label', { className: 'block text-sm font-medium' }, 'What did you eat?'),
        h('textarea', {
          value: inputText,
          onChange: (e) => setInputText(e.target.value),
          placeholder: 'e.g. 200ml milk, 2 eggs, 50g paneer',
          className: 'w-full p-3 border rounded-lg h-28 resize-none'
        }),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-2' }, 'Date'),
          h('input', {
            type: 'date',
            value: mealDate,
            min: minDate,
            max: today,
            onChange: (e) => setMealDate(e.target.value),
            className: 'w-full p-2 border rounded-lg'
          })
        ),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-2' }, 'Meal type'),
          h(
            'div',
            { className: 'flex gap-2' },
            MEAL_TYPES.map((type) =>
              h(
                'button',
                {
                  key: type,
                  onClick: () => setMealType(type),
                  className: `px-3 py-1.5 rounded-full text-sm border capitalize ${
                    mealType === type ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'
                  }`
                },
                type
              )
            )
          )
        ),
        h(
          'button',
          {
            onClick: handleParse,
            disabled: loading || !inputText.trim(),
            className: 'w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50'
          },
          loading ? 'Adding...' : 'Add food'
        )
      ),

    step === 'clarify' &&
      h(
        F,
        null,
        h('h3', { className: 'font-semibold' }, 'A few quick questions'),
        ambiguities.map((a) =>
          h(
            'div',
            { key: a.item, className: 'border rounded-lg p-3 space-y-2' },
            h('div', { className: 'text-sm font-medium capitalize' }, `${a.item}: ${a.question}`),
            h(
              'div',
              { className: 'flex items-center gap-2' },
              h('input', {
                type: 'number',
                min: 0,
                value: answers[a.item] ?? '',
                placeholder: String(a.placeholder ?? ''),
                onChange: (e) => handleClarificationAnswer(a.item, e.target.value),
                className: 'flex-1 p-2 border rounded-lg'
              }),
              h('span', { className: 'text-sm text-gray-500' }, a.unit)
            )
          )
        ),
        h(
          'div',
          { className: 'flex gap-2' },
          h('button', { onClick: resetAll, className: 'flex-1 border border-gray-300 py-3 rounded-lg font-semibold' }, 'Cancel'),
          h(
            'button',
            {
              onClick: handleClarificationSubmit,
              disabled: loading || !clarificationsReady,
              className: 'flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50'
            },
            loading ? 'Adding...' : 'Confirm and add'
          )
        )
      )
  );
}
