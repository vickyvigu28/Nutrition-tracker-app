import { useCallback, useState } from 'react';

export const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const useLocalStorage = (key, fallback) => {
  const [value, setValue] = useState(() => readJSON(key, fallback));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
};

export const PROFILES_KEY = 'nutrition_profiles';
export const ACTIVE_USER_KEY = 'nutrition_active_user_id';
export const userDataKey = (userId) => `nutrition_data_${userId}`;
