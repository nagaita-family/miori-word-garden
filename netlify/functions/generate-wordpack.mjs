function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function outputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const chunks = [];
  for (const item of data?.output || []) {
    if (item?.type !== 'message') continue;
    for (const c of item.content || []) {
      if (c?.type === 'output_text' && typeof c.text === 'string') chunks.push(c.text);
    }
  }
  return chunks.join('');
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only.' });

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json(503, { error: 'Word Pack service is not configured yet. Add OPENAI_API_KEY to the Netlify site environment variables.' });
  }

  let body;
  try { body = await req.json(); }
  catch { return json(400, { error: 'Invalid JSON request.' }); }

  const filename = String(body.filename || 'school-spelling.pdf').slice(0, 160);
  const pdfBase64 = String(body.pdfBase64 || '');
  const maxPdfBase64 = Math.ceil((4 * 1024 * 1024) * 4 / 3) + 1024;
  if (!pdfBase64) return json(400, { error: 'No PDF was supplied.' });
  if (pdfBase64.length > maxPdfBase64) return json(413, { error: 'PDF is too large. Please use a PDF under 4 MB.' });

  const schema = {
    type: 'object',
    properties: {
      packTitle: { type: 'string' },
      words: {
        type: 'array', minItems: 1, maxItems: 15,
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            meaningEn: { type: 'string' },
            meaningJa: { type: 'string' },
            example: { type: 'string' },
            phonicsFocus: { type: 'string' },
            pictureCue: { type: 'string' }
          },
          required: ['word', 'meaningEn', 'meaningJa', 'example', 'phonicsFocus', 'pictureCue'],
          additionalProperties: false
        }
      }
    },
    required: ['packTitle', 'words'],
    additionalProperties: false
  };

  const instructions = [
    'You create spelling-study Word Packs for an 8-year-old English learner.',
    'The attached PDF is the authoritative school source.',
    'Extract only the spelling words that are actually presented by the school as the target word list. Preserve their spelling exactly, then output lowercase unless the word is normally a proper noun.',
    'For meaningEn: if the school PDF gives an English definition/meaning for that word, copy that wording faithfully. Do not paraphrase, correct, expand, or silently replace the school wording. If no English meaning is present, return an empty string.',
    'For meaningJa: give a short, natural Japanese meaning that matches the school meaning or the ordinary sense intended by the worksheet.',
    'For example: write one short, natural, child-friendly English sentence that clearly demonstrates the target word. Prefer familiar daily-life language and do not make the sentence overly easy to infer the spelling from morphology alone.',
    'For phonicsFocus: give a very short spelling/phonics chunk that is useful for remembering this exact word, such as ee, igh, -ble, tion, ur. If none is useful, return an empty string.',
    'For pictureCue: return a single useful emoji when a visual cue helps; otherwise return an empty string. Never return an image URL.',
    'Return no extra words. Maximum 15 words. If the PDF contains more than one list, choose the list that is clearly the current spelling/word-study assignment.'
  ].join('\n');

  const model = Netlify.env.get('MWG_WORDPACK_MODEL') || 'gpt-5.6-luna';
  const payload = {
    model,
    input: [
      { role: 'system', content: instructions },
      {
        role: 'user',
        content: [
          { type: 'input_file', filename, file_data: `data:application/pdf;base64,${pdfBase64}`, detail: 'high' },
          { type: 'input_text', text: 'Create the Word Garden Word Pack from this school PDF. Preserve school English meanings exactly when present.' }
        ]
      }
    ],
    text: { format: { type: 'json_schema', name: 'miori_word_pack', strict: true, schema } },
    max_output_tokens: 5000
  };

  let resp;
  try {
    resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    return json(502, { error: 'Could not reach the Word Pack AI service.' });
  }

  const raw = await resp.text();
  let data;
  try { data = JSON.parse(raw); }
  catch { data = null; }
  if (!resp.ok) {
    return json(resp.status >= 500 ? 502 : resp.status, { error: data?.error?.message || 'The Word Pack AI service returned an error.' });
  }

  const text = outputText(data);
  if (!text) return json(502, { error: 'The AI did not return a Word Pack.' });

  let wordPack;
  try { wordPack = JSON.parse(text); }
  catch { return json(502, { error: 'The AI returned a Word Pack in an unreadable format.' }); }

  wordPack.words = (wordPack.words || []).slice(0, 15).map((w) => ({
    word: String(w.word || '').trim(),
    meaningEn: String(w.meaningEn || '').trim(),
    meaningJa: String(w.meaningJa || '').trim(),
    example: String(w.example || '').trim(),
    phonicsFocus: String(w.phonicsFocus || '').trim(),
    pictureCue: String(w.pictureCue || '').trim()
  })).filter((w) => w.word);

  if (!wordPack.words.length) return json(422, { error: 'No spelling words could be identified in this PDF.' });
  return json(200, { wordPack, model });
};

export const config = { path: '/api/wordpack' };
