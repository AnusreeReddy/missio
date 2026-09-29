// Narrow AI client: the model's ONLY job is to phrase a mission title and
// per-step instructions, and (for multi-subject days) balance which already-
// selected content items to emphasize. It never chooses which DSA problem or
// exercise exists — that's decided deterministically in missionGenerator
// Stage 1 before this is ever called. See plan §7.
//
// If ANTHROPIC_API_KEY isn't set (e.g. in this sandbox), callers fall back
// to a deterministic template — the app must never show an AI failure state.

const MODEL = 'claude-sonnet-4-6';

export async function packageMissionWithAI({ domain, topic, difficulty, items }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // caller falls back to deterministic template

  const systemPrompt = `You package a fitness/study mission into a short, motivating title and per-step instructions.
Respond with STRICT JSON only, matching exactly this shape, no prose, no markdown fences:
{"title": string, "steps": [{"itemIndex": number, "instruction": string}]}
Rules:
- "itemIndex" must reference the given items array by position (0-based) and every item must appear exactly once.
- Do not invent items, problems, or exercises that are not in the provided list.
- Keep "instruction" under 25 words, plain and encouraging, in the second person.`;

  const userPrompt = `Domain: ${domain}\nTopic: ${topic}\nDifficulty: ${difficulty}\nItems: ${JSON.stringify(
    items.map((it, idx) => ({ idx, label: it.payload?.title || it.payload?.name, meta: it.payload }))
  )}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || []).find((c) => c.type === 'text')?.text;
    if (!text) return null;
    const parsed = JSON.parse(text.trim());
    if (!validatePackaging(parsed, items.length)) return null;
    return parsed;
  } catch (err) {
    console.warn('[ai/client] packaging call failed, falling back:', err.message);
    return null;
  }
}

function validatePackaging(parsed, itemCount) {
  if (!parsed || typeof parsed.title !== 'string' || !Array.isArray(parsed.steps)) return false;
  if (parsed.steps.length !== itemCount) return false;
  const seen = new Set();
  for (const s of parsed.steps) {
    if (typeof s.itemIndex !== 'number' || typeof s.instruction !== 'string') return false;
    if (s.itemIndex < 0 || s.itemIndex >= itemCount) return false;
    seen.add(s.itemIndex);
  }
  return seen.size === itemCount;
}
