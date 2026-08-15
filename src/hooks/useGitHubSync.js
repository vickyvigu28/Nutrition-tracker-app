import { useCallback, useState } from 'react';
import { isGitHubConfigured, syncData } from '../services/githubService.js';

export const useGitHubSync = (userId, userData, onSynced) => {
  const [status, setStatus] = useState('idle'); // idle | syncing | success | error
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(userData?.last_synced || null);

  const syncNow = useCallback(async () => {
    if (!userId || !userData) return;

    if (!isGitHubConfigured()) {
      setStatus('error');
      setError('GitHub sync is not configured yet. Fill in Settings → Connections.');
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

  return { status, error, lastSynced, syncNow, configured: isGitHubConfigured() };
};
