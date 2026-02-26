import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Stricter rate limit for AI endpoints to control API costs
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute per IP
  message: { success: false, error: 'Too many AI requests, please slow down.' },
});

const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

const ALLOWED_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]);

/**
 * POST /api/ai/generate
 * Proxy for Gemini AI text generation.
 * Keeps the GEMINI_API_KEY on the server — never exposed to clients.
 *
 * Body:
 *   prompt           {string}  Required. User prompt text.
 *   model            {string}  Optional. Defaults to gemini-2.0-flash.
 *   systemInstruction{string}  Optional. System-level instruction.
 *   responseMimeType {string}  Optional. e.g. "application/json".
 */
router.post('/generate', aiLimiter, async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-2.0-flash',
      systemInstruction,
      responseMimeType,
    } = req.body;

    if (!ALLOWED_MODELS.has(model)) {
      return res
        .status(400)
        .json({ success: false, error: `Unsupported model. Allowed: ${[...ALLOWED_MODELS].join(', ')}` });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res
        .status(400)
        .json({ success: false, error: 'prompt is required and must be a string' });
    }

    if (prompt.length > 10_000) {
      return res
        .status(400)
        .json({ success: false, error: 'prompt exceeds maximum allowed length of 10,000 characters' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(503)
        .json({ success: false, error: 'AI service is not configured on this server' });
    }

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (responseMimeType) {
      requestBody.generationConfig = { responseMimeType };
    }

    const geminiRes = await fetch(
      `${GEMINI_BASE_URL}/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      console.error('Gemini API error:', geminiRes.status, errBody);
      return res.status(502).json({ success: false, error: 'AI upstream error' });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    res.json({ success: true, text });
  } catch (error) {
    console.error('AI proxy error:', error);
    res.status(500).json({ success: false, error: 'AI generation failed' });
  }
});

export default router;
