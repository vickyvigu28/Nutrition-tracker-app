import { getServerStatus } from './serverStatus.js';

const callProxy = async (body) => {
  const response = await fetch('/api/github-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `GitHub proxy error ${response.status}`);
  return result;
};

export const isGitHubConfigured = async () => (await getServerStatus()).githubConfigured;

export const downloadUserData = async (userId) => {
  try {
    return await callProxy({ action: 'download', userId });
  } catch (error) {
    throw new Error(`Failed to download: ${error.message}`);
  }
};

export const uploadUserData = async (userId, userData, sha = null) => {
  try {
    return await callProxy({ action: 'upload', userId, data: userData, sha });
  } catch (error) {
    throw new Error(`Failed to upload: ${error.message}`);
  }
};

const mergeData = (localData, remoteData) => {
  const localMealIds = new Set(localData.meals.map((m) => m.id));
  const newRemoteMeals = remoteData.meals.filter((m) => !localMealIds.has(m.id));
  const mergedMeals = [...localData.meals, ...newRemoteMeals];

  const mergedDailyTotals = {
    ...remoteData.daily_totals,
    ...localData.daily_totals
  };

  const mergedWater = {
    ...remoteData.water_intake,
    ...localData.water_intake
  };

  return {
    ...localData,
    meals: mergedMeals,
    daily_totals: mergedDailyTotals,
    water_intake: mergedWater,
    last_synced: new Date().toISOString()
  };
};

export const syncData = async (userId, localData) => {
  if (!(await isGitHubConfigured())) {
    throw new Error('GitHub sync is not configured on the server yet.');
  }

  const remote = await downloadUserData(userId);

  if (!remote.exists) {
    const result = await uploadUserData(userId, localData);
    return { data: { ...localData, last_synced: result.timestamp }, synced: true, result: 'uploaded' };
  }

  const remoteData = remote.data;
  const localTime = new Date(localData.last_synced || 0);
  const remoteTime = new Date(remoteData.last_synced || 0);

  if (localTime >= remoteTime) {
    const result = await uploadUserData(userId, localData, remote.sha);
    return { data: { ...localData, last_synced: result.timestamp }, synced: true, result: 'uploaded' };
  }

  const merged = mergeData(localData, remoteData);
  await uploadUserData(userId, merged, remote.sha);
  return { data: merged, synced: true, result: 'merged' };
};

export const testConnection = async () => {
  if (!(await isGitHubConfigured())) {
    return { connected: false, error: 'Not configured' };
  }
  try {
    const result = await callProxy({ action: 'test' });
    return { connected: Boolean(result.connected) };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};
