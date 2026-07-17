export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const body = req.body;

    const convertedMessages = body.messages.map(msg => {
      if (!Array.isArray(msg.content)) return msg;
      return {
        ...msg,
        content: msg.content.map(block => {
          if (block.type === 'image' && block.source?.type === 'base64') {
            return {
              type: 'image_url',
              image_url: {
                url: `data:${block.source.media_type};base64,${block.source.data}`
              }
            };
          }
          if (block.type === 'text') return { type: 'text', text: block.text };
          return block;
        })
      };
    });

    const firstImg = convertedMessages[0]?.content?.find(b => b.type === 'image_url');
    console.log('Image block present:', !!firstImg);
    console.log('Image url prefix:', firstImg?.image_url?.url?.substring(0, 50));

    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://quicksell-topaz-eta.vercel.app',
        'X-Title': 'QuickSell',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: body.max_tokens || 1500,
        messages: convertedMessages,
      }),
    });

    const data = await orResponse.json();
    console.log('OpenRouter error:', data.error);

    if (data.error) return res.status(400).json({ error: data.error.message });

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
