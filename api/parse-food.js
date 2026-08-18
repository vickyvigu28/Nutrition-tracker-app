// Server-side proxy for food-text parsing. Holds the OpenAI key as an env
// var (set in the Vercel dashboard) - it never reaches the browser.
const SYSTEM_PROMPT_PARSE = `You are a nutrition data validator, not a guesser.
Your job is to:
1. Parse food items mentioned, extracting any quantity/weight/volume already stated (e.g. "200ml milk", "2 eggs", "50g paneer")
2. Only flag an item as ambiguous if its amount genuinely cannot be determined (e.g. "a cup of dal", "some rice") - never ask again when a specific amount/unit was already given
3. When asking, always ask for a precise amount in grams or milliliters - never vague sizes like "small/medium/large"

Do NOT estimate calories or macros. Your job is to clarify intent only.

Return ONLY valid JSON with no markdown:
{
  "parsed_items": [
    { "item": "milk", "quantity": 200, "amount": { "value": 200, "unit": "ml" }, "confidence": "high" },
    { "item": "dal", "quantity": 1, "amount": null, "confidence": "low" }
  ],
  "ambiguities": [
    { "item": "dal", "question": "How many grams of dal?", "unit": "g", "placeholder": 200 }
  ]
}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'OpenAI is not configured on the server' });
    return;
  }

  const { userInput } = req.body || {};
  if (!userInput) {
    res.status(400).json({ error: 'userInput is required' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_PARSE },
          { role: 'user', content: `Parse this food input: "${userInput}"` }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(502).json({ error: data.error?.message || 'OpenAI API error' });
      return;
    }

    res.status(200).json({ content: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
