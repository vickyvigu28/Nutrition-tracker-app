// Server-side proxy for nutrition lookups. Only ever called for items the
// client couldn't resolve from its local database/cache, so this is the
// minority of requests, not every food.
const SYSTEM_PROMPT_NUTRITION = `You are a nutrition lookup service. Given confirmed food items with amounts, return accurate nutrition data scaled to the stated amount.
Use USDA FoodData Central estimates. Be conservative - don't inflate numbers.

Return ONLY valid JSON array with no markdown, including all of these nutrient fields for every item:
[
  { "food_name": "egg, medium, boiled", "portion": "1 medium (50g)", "calories": 78, "protein_g": 6.3, "carbs_g": 0.6, "fat_g": 5.3, "fiber_g": 0, "calcium_mg": 28, "zinc_mg": 0.6, "iron_mg": 0.9, "magnesium_mg": 5, "potassium_mg": 63, "sodium_mg": 62, "vitamin_d_mcg": 1, "vitamin_b12_mcg": 0.35, "vitamin_c_mg": 0, "folate_mcg": 12, "source": "USDA" }
]`;

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

  const { items } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items array is required' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_NUTRITION },
          { role: 'user', content: `Get nutrition for: ${JSON.stringify(items)}` }
        ],
        temperature: 0.5,
        max_tokens: 800
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
