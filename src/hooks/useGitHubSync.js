import { useCallback, useEffect, useState } from 'react';
import { isGitHubConfigured, syncData } from '../services/githubService.js';

export const useGitHubSync = (userId, userData, onSynced) => {
  const [status, setStatus] = useState('idle'); // idle | syncing | success | error
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(userData?.last_synced || null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    isGitHubConfigured().then(setConfigured);
  }, []);

  const syncNow = useCallback(async () => {
    if (!userId || !userData) return;

    if (!(await isGitHubConfigured())) {
      setConfigured(false);
      setStatus('error');
      setError('GitHub sync is not configured on the server yet.');
      return;
    }

    setStatus('syncing');
    setError(null);
    try {
      const result = await syncData(userId, userData);
      onSynced(result.data);
      setLastSynced(result.data.last_synced);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }, [userId, userData, onSynced]);

  return { status, error, lastSynced, syncNow, configured };
};
