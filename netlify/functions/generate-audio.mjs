function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function instruction(kind) {
  if (kind === 'slow') return 'Pronounce this single English spelling word slowly, clearly, and naturally for an 8-year-old spelling learner. Keep the word sounding like real American English. Make the internal sounds and syllable rhythm easy to hear, but do not spell the letters, do not add pauses between every letter, and do not add any explanation. Say only the supplied word.';
  if (kind === 'meaning') return 'Read this short English definition clearly and naturally for an 8-year-old learner, at a calm slightly-slow pace. Say only the supplied definition.';
  if (kind === 'example') return 'Read this child-friendly English example sentence naturally, clearly, and warmly in American English. Say only the supplied sentence.';
  return 'Pronounce this single English spelling word clearly and naturally in American English for an 8-year-old learner. Use a calm, friendly voice and ordinary natural timing. Say only the supplied word.';
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only.' });

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json(503, { error: 'Audio service is not configured yet. Add OPENAI_API_KEY to the Netlify site environment variables.' });
  }

  let body;
  try { body = await req.json(); }
  catch { return json(400, { error: 'Invalid JSON request.' }); }

  const text = String(body.text || '').trim();
  const kind = ['word', 'slow', 'meaning', 'example'].includes(body.kind) ? body.kind : 'word';
  if (!text) return json(400, { error: 'No text was supplied for audio.' });
  if (text.length > 700) return json(400, { error: 'Audio text is too long.' });

  const model = Netlify.env.get('MWG_TTS_MODEL') || 'gpt-4o-mini-tts';
  const voice = Netlify.env.get('MWG_TTS_VOICE') || 'coral';

  let resp;
  try {
    resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        instructions: instruction(kind),
        response_format: 'mp3'
      })
    });
  } catch {
    return json(502, { error: 'Could not reach the speech service.' });
  }

  if (!resp.ok) {
    let msg = 'The speech service returned an error.';
    try {
      const d = await resp.json();
      if (d?.error?.message) msg = d.error.message;
    } catch {}
    return json(resp.status >= 500 ? 502 : resp.status, { error: msg });
  }

  const ab = await resp.arrayBuffer();
  return json(200, {
    audioBase64: Buffer.from(ab).toString('base64'),
    contentType: resp.headers.get('content-type') || 'audio/mpeg',
    model,
    voice,
    aiGenerated: true
  });
};

export const config = { path: '/api/audio' };
