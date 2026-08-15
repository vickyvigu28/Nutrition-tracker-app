import { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { h, F } from '../../utils/h.js';
import { calculateMacros } from '../../utils/bmiCalculator.js';
import { DEFAULT_PROFILE, GOAL_OPTIONS, emptyUserData } from '../../utils/constants.js';

// PIN is a lightweight "which family member is this" gate, not real
// authentication - profiles and data live in localStorage on this device.
export default function ProfileGate({ profiles, onCreateProfile, onLogin }) {
  const [view, setView] = useState(profiles.length ? 'list' : 'create');
  const [selected, setSelected] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [form, setForm] = useState({ ...DEFAULT_PROFILE, email: '', pin: '', confirmPin: '' });
  const [formError, setFormError] = useState('');

  const handleSelectProfile = (profile) => {
    setSelected(profile);
    setPinInput('');
    setPinError('');
    setView('pin');
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === selected.pin) {
      onLogin(selected.user_id);
    } else {
      setPinError('Incorrect PIN');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['height_cm', 'weight_kg', 'goal_weight_kg', 'age'];
    setForm((prev) => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value }));
  };

  const toggleGoal = (value) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((g) => g !== value) : [...prev.goals, value]
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required');
      return;
    }
    if (profiles.some((p) => p.user_id === form.email.trim())) {
      setFormError('A profile with this email already exists');
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setFormError('PIN must be exactly 4 digits');
      return;
    }
    if (form.pin !== form.confirmPin) {
      setFormError('PINs do not match');
      return;
    }

    const userId = form.email.trim();
    const profile = {
      name: form.name.trim(),
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      goal_weight_kg: form.goal_weight_kg,
      goals: form.goals,
      age: form.age,
      gender: form.gender,
      bmi: 0
    };
    const targets = calculateMacros(
      profile.height_cm,
      profile.weight_kg,
      profile.goal_weight_kg,
      profile.age,
      profile.gender,
      profile.goals
    );
    profile.bmi = targets.bmi;

    const newProfileMeta = { user_id: userId, name: profile.name, pin: form.pin };
    const userData = emptyUserData(userId, profile, targets);

    onCreateProfile(newProfileMeta, userData);
  };

  if (view === 'pin' && selected) {
    return h(
      'div',
      { className: 'min-h-screen flex items-center justify-center bg-gray-50 p-4' },
      h(
        'div',
        { className: 'app-max-width w-full bg-white rounded-xl border border-gray-200 p-6' },
        h(
          'button',
          { onClick: () => setView('list'), className: 'flex items-center gap-1 text-sm text-gray-500 mb-4' },
          h(ArrowLeft, { size: 16 }),
          ' Back'
        ),
        h(
          'div',
          { className: 'flex flex-col items-center mb-4' },
          h(
            'div',
            { className: 'w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-2' },
            h(User, { className: 'text-green-600', size: 26 })
          ),
          h('div', { className: 'font-semibold' }, selected.name)
        ),
        h(
          'form',
          { onSubmit: handlePinSubmit, className: 'space-y-3' },
          h('input', {
            type: 'password',
            inputMode: 'numeric',
            maxLength: 4,
            value: pinInput,
            onChange: (e) => setPinInput(e.target.value.replace(/\D/g, '')),
            placeholder: '4-digit PIN',
            className: 'w-full text-center text-lg tracking-widest p-3 border rounded-lg',
            autoFocus: true
          }),
          pinError && h('div', { className: 'text-sm text-red-600' }, pinError),
          h('button', { type: 'submit', className: 'w-full bg-green-600 text-white py-3 rounded-lg font-semibold' }, 'Unlock')
        )
      )
    );
  }

  if (view === 'list') {
    return h(
      'div',
      { className: 'min-h-screen flex items-center justify-center bg-gray-50 p-4' },
      h(
        'div',
        { className: 'app-max-width w-full bg-white rounded-xl border border-gray-200 p-6 space-y-3' },
        h('h2', { className: 'text-lg font-bold mb-2' }, "Who's tracking?"),
        profiles.map((p) =>
          h(
            'button',
            {
              key: p.user_id,
              onClick: () => handleSelectProfile(p),
              className: 'w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50'
            },
            h(
              'div',
              { className: 'w-10 h-10 rounded-full bg-green-100 flex items-center justify-center' },
              h(User, { className: 'text-green-600', size: 18 })
            ),
            h('span', { className: 'font-medium' }, p.name)
          )
        ),
        h(
          'button',
          { onClick: () => setView('create'), className: 'w-full p-3 border border-dashed rounded-lg text-green-700 font-medium' },
          '+ Create new profile'
        )
      )
    );
  }

  return h(
    'div',
    { className: 'min-h-screen bg-gray-50 p-4' },
    h(
      'div',
      { className: 'app-max-width w-full bg-white rounded-xl border border-gray-200 p-6 space-y-4 my-4' },
      profiles.length > 0 &&
        h(
          'button',
          { onClick: () => setView('list'), className: 'flex items-center gap-1 text-sm text-gray-500' },
          h(ArrowLeft, { size: 16 }),
          ' Back'
        ),
      h('h2', { className: 'text-lg font-bold' }, 'Create your profile'),
      h(
        'form',
        { onSubmit: handleCreateSubmit, className: 'space-y-3' },
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-1' }, 'Name'),
          h('input', { name: 'name', value: form.name, onChange: handleFormChange, className: 'w-full p-2 border rounded-lg' })
        ),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-1' }, 'Email (used as your ID)'),
          h('input', {
            type: 'email',
            name: 'email',
            value: form.email,
            onChange: handleFormChange,
            className: 'w-full p-2 border rounded-lg'
          })
        ),
        h(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Height (cm)'),
            h('input', {
              type: 'number',
              name: 'height_cm',
              value: form.height_cm,
              onChange: handleFormChange,
              className: 'w-full p-2 border rounded-lg'
            })
          ),
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Weight (kg)'),
            h('input', {
              type: 'number',
              name: 'weight_kg',
              value: form.weight_kg,
              onChange: handleFormChange,
              className: 'w-full p-2 border rounded-lg'
            })
          )
        ),
        h(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Goal weight (kg)'),
            h('input', {
              type: 'number',
              name: 'goal_weight_kg',
              value: form.goal_weight_kg,
              onChange: handleFormChange,
              className: 'w-full p-2 border rounded-lg'
            })
          ),
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Age'),
            h('input', {
              type: 'number',
              name: 'age',
              value: form.age,
              onChange: handleFormChange,
              className: 'w-full p-2 border rounded-lg'
            })
          )
        ),
        h(
          'div',
          null,
          h('label', { className: 'block text-sm font-medium mb-1' }, 'Gender'),
          h(
            'select',
            { name: 'gender', value: form.gender, onChange: handleFormChange, className: 'w-full p-2 border rounded-lg' },
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
                    form.goals.includes(g.value) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'
                  }`
                },
                g.label
              )
            )
          )
        ),
        h(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Set a 4-digit PIN'),
            h('input', {
              type: 'password',
              inputMode: 'numeric',
              maxLength: 4,
              name: 'pin',
              value: form.pin,
              onChange: (e) => setForm((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, '') })),
              className: 'w-full p-2 border rounded-lg text-center tracking-widest'
            })
          ),
          h(
            'div',
            null,
            h('label', { className: 'block text-sm font-medium mb-1' }, 'Confirm PIN'),
            h('input', {
              type: 'password',
              inputMode: 'numeric',
              maxLength: 4,
              name: 'confirmPin',
              value: form.confirmPin,
              onChange: (e) => setForm((prev) => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, '') })),
              className: 'w-full p-2 border rounded-lg text-center tracking-widest'
            })
          )
        ),
        formError && h('div', { className: 'text-sm text-red-600' }, formError),
        h('button', { type: 'submit', className: 'w-full bg-green-600 text-white py-3 rounded-lg font-semibold' }, 'Create profile & continue')
      )
    )
  );
}
