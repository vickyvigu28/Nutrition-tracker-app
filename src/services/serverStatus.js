// Caches the one-time /api/status check (which integrations the deployed
// server has configured) so every screen isn't re-fetching it separately.
let cached = null;
let pending = null;

export const getServerStatus = async () => {
  if (cached) return cached;
  if (!pending) {
    pending = fetch('/api/status')
      .then((r) => r.json())
      .catch(() => ({ openaiConfigured: false, githubConfigured: false }));
  }
  cached = await pending;
  return cached;
};
