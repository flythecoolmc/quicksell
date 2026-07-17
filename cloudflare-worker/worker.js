// QuickSell Cloudflare Worker
// Gemini 1.5 Flash — no size limits, free tier 1500 req/day

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'API key not configured' }, 500);

    try {
      const body = await request.json();

      // Extract images and text from Anthropic-style messages
      const userContent = body.messages?.[0]?.content || [];
      const parts = [];

      for (const block of userContent) {
        if (block.type === 'image' && block.source?.type === 'base64') {
          // Gemini inline image — no size limit via Cloudflare
          parts.push({
            inline_data: {
              mime_type: block.source.media_type || 'image/jpeg',
              data: block.source.data,
            }
          });
        } else if (block.type === 'text') {
          parts.push({ text: block.text });
        }
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              maxOutputTokens: body.max_tokens || 1500,
              temperature: 0.4,
            },
          }),
        }
      );

      const data = await geminiRes.json();

      if (data.error) {
        return json({ error: data.error.message }, 400);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return json({ content: [{ type: 'text', text }] });

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
