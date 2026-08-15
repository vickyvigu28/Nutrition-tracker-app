import axios from 'axios';
import { Base64 } from 'js-base64';
import { getConnections } from './connectionConfig.js';

const GITHUB_API = 'https://api.github.com';

export const isGitHubConfigured = () => {
  const c = getConnections();
  return Boolean(c.GITHUB_TOKEN && c.GITHUB_OWNER && c.GITHUB_REPO);
};

const headers = () => ({
  Authorization: `token ${getConnections().GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json'
});

const pathFor = (userId) => `data/${userId}.json`;

export const downloadUserData = async (userId) => {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = getConnections();
  try {
    const response = await axios.get(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pathFor(userId)}?ref=${GITHUB_BRANCH}`,
      { headers: headers() }
    );

    const decodedContent = Base64.decode(response.data.content);
    const userData = JSON.parse(decodedContent);

    return { data: userData, sha: response.data.sha, exists: true };
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: null, sha: null, exists: false };
    }
    throw new Error(`Failed to download: ${error.message}`);
  }
};

export const uploadUserData = async (userId, userData, sha = null) => {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = getConnections();
  try {
    const content = Base64.encode(JSON.stringify(userData, null, 2));

    const payload = {
      message: `Update nutrition data for ${userId} - ${new Date().toISOString()}`,
      content,
      branch: GITHUB_BRANCH,
      ...(sha && { sha })
    };

    const response = await axios.put(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pathFor(userId)}`,
      payload,
      { headers: headers() }
    );

    return {
      success: true,
      sha: response.data.content.sha,
      timestamp: new Date().toISOString()
    };
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
  if (!isGitHubConfigured()) {
    throw new Error('GitHub sync is not configured. Add your token, owner and repo in Settings → Connections.');
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

export const getSyncHistory = async (userId) => {
  const { GITHUB_OWNER, GITHUB_REPO } = getConnections();
  try {
    const response = await axios.get(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${pathFor(userId)}&per_page=10`,
      { headers: headers() }
    );

    return response.data.map((commit) => ({
      date: commit.commit.author.date,
      message: commit.commit.message,
      sha: commit.sha
    }));
  } catch (error) {
    return [];
  }
};

export const testConnection = async () => {
  if (!isGitHubConfigured()) {
    return { connected: false, error: 'Not configured' };
  }
  const { GITHUB_OWNER, GITHUB_REPO } = getConnections();
  try {
    await axios.get(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, { headers: headers() });
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};
