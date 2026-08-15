import { CONFIG as DEFAULT_CONFIG } from '../config.js';

// Per-browser credential storage. Each person who opens the deployed app
// enters their own OpenAI/GitHub credentials once, here - stored only in
// their own browser's localStorage, never shipped in the app's source.
const STORAGE_KEY = 'nutrition_connections';

export const getConnections = () => {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    stored = {};
  }
  return { ...DEFAULT_CONFIG, ...stored };
};

export const saveConnections = (values) => {
  const next = { ...getConnections(), ...values };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearConnections = () => localStorage.removeItem(STORAGE_KEY);
