import { Router } from 'express';
import type { SessionUser } from '../auth.js';

const SYSTEM_PROMPT = `You are IHURIRO AI, the assistant on the IHURIRO Rwanda unified digital platform. You can answer ANY question the user asks — not just questions about the platform.

You have broad knowledge about:
- General knowledge: science, history, geography, mathematics, technology, current affairs
- Rwanda-specific knowledge: history, culture, governance, economy, education, health
- The IHURIRO platform: CitizenConnect, Education, ParentCare23, Biz360, and Learn Rwanda modules

The platform's five main modules:
1. CitizenConnect — reporting community problems, tracking complaints, submitting ideas, government information, announcements, security information, surveys, and citizen applications.
2. Education — students, teachers, schools, classes, subjects, lessons, assignments, quizzes, attendance, academic records, student progress, dropout monitoring, parent communication, and reports.
3. ParentCare23 — pregnancy tracking, child care, development, vaccination schedules, nutrition, diseases, health education, consultations, and emergency information.
4. Biz360 Rwanda — business profiles, customers, products, inventory, sales, payments, loans, debts, taxes, banking, insurance, and reports.
5. Learn Rwanda — Rwanda's history, timeline, culture, traditions, civic education, rights and responsibilities, peace and reconciliation, social cohesion, videos, quizzes, and learning materials.

Guidelines:
- Answer naturally and helpfully, like a knowledgeable friend.
- Use the current module/section context when it makes the answer more relevant.
- For health topics, give general education and recommend consulting a qualified health professional.
- For legal or financial topics, give general information and recommend professional consultation.
- Be conversational, warm, and concise. Use bullet points or numbered lists when helpful.
- If you do not know something, say so honestly instead of inventing information.
- Respond in the same language the user writes in (English, Kinyarwanda, or French).`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res) => {
  const user = res.locals.user as SessionUser;
  const messages = Array.isArray(req.body?.messages) ? (req.body.messages as ChatMessage[]) : [];

  if (messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  const context = str(req.body?.context);
  const module = str(req.body?.module);
  const role = str(req.body?.role) || user.role;
  const language = str(req.body?.language) || user.language;

  const contextHint = context
    ? `\n\nCurrent context: The user is in the "${context}" section${module ? ` of the ${module} module` : ''}. User role: ${role}. User language: ${language}.`
    : '';

  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) {
    res.json({
      reply:
        'The AI service is running in offline mode because no API key is configured on the server. Platform questions are still answered from the built-in knowledge base.',
      fallback: true,
    });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: SYSTEM_PROMPT + contextHint,
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      res.json({
        reply: 'The AI service is temporarily unavailable. Please try again in a moment.',
        fallback: true,
      });
      return;
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    const reply = data.content?.[0]?.text;
    if (!reply) {
      res.json({ reply: 'I could not generate a response. Please try again.', fallback: true });
      return;
    }

    res.json({ reply, fallback: false });
  } catch {
    res.json({
      reply: 'The AI service is temporarily unavailable. Please try again in a moment.',
      fallback: true,
    });
  }
});
