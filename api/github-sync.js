// Server-side proxy for GitHub sync. The token/owner/repo are env vars set
// once in the Vercel dashboard - every visitor's data reads/writes through
// here, into the same repo, without any of them ever seeing the token.
const GITHUB_API = 'https://api.github.com';

const pathFor = (userId) => `data/${userId}.json`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    res.status(503).json({ error: 'GitHub sync is not configured on the server' });
    return;
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  const { action, userId, data, sha } = req.body || {};

  try {
    if (action === 'test') {
      const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
      res.status(200).json({ connected: r.ok });
      return;
    }

    if (action === 'download') {
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${pathFor(userId)}?ref=${branch}`, { headers });
      if (r.status === 404) {
        res.status(200).json({ exists: false, data: null, sha: null });
        return;
      }
      if (!r.ok) {
        res.status(502).json({ error: `GitHub error ${r.status}` });
        return;
      }
      const body = await r.json();
      const decoded = Buffer.from(body.content, 'base64').toString('utf-8');
      res.status(200).json({ exists: true, data: JSON.parse(decoded), sha: body.sha });
      return;
    }

    if (action === 'upload') {
      if (!userId || !data) {
        res.status(400).json({ error: 'userId and data are required' });
        return;
      }
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const payload = {
        message: `Update nutrition data for ${userId} - ${new Date().toISOString()}`,
        content,
        branch,
        ...(sha && { sha })
      };
      const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${pathFor(userId)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        res.status(502).json({ error: errBody.message || `GitHub error ${r.status}` });
        return;
      }
      const body = await r.json();
      res.status(200).json({ success: true, sha: body.content.sha, timestamp: new Date().toISOString() });
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
