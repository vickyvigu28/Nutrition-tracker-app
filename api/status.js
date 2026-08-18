// Tells the client which server-side integrations are configured, without
// ever exposing the actual secrets. The client uses this to decide whether
// to call the proxy endpoints below or fall back to local/mocked data.
module.exports = async (req, res) => {
  res.status(200).json({
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
  });
};
