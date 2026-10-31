import { config } from '../config.js';

const LANGUAGE_NAMES = { en: 'English', rw: 'Kinyarwanda', fr: 'French' };

const TEMPLATES = {
  en: ({ student, className, date }) =>
    `IHURIRO: ${student} (${className}) was marked absent today, ${date}. Contact the school if this is unexpected.`,
  rw: ({ student, className, date }) =>
    `IHURIRO: ${student} wo mu ${className} ntiyaje ishuri kuri ${date}. Hamagara ishuri niba utabizi.`,
  fr: ({ student, className, date }) =>
    `IHURIRO: ${student} (${className}) absent le ${date}. Contactez l'école si ce n'est pas prévu.`,
};

const LEAVE_TEMPLATES = {
  en: ({ student, className, date, reason }) =>
    `IHURIRO: ${student} (${className}) left school early today, ${date}${reason ? ` (${reason})` : ''}. Contact the school if this is unexpected.`,
  rw: ({ student, className, date, reason }) =>
    `IHURIRO: ${student} wo mu ${className} yavuye mu ishuri kare kuri ${date}${reason ? ` (${reason})` : ''}. Hamagara ishuri niba utabizi.`,
  fr: ({ student, className, date, reason }) =>
    `IHURIRO: ${student} (${className}) a quitté l'école plus tôt le ${date}${reason ? ` (${reason})` : ''}. Contactez l'école si ce n'est pas prévu.`,
};

function cleanSms(text) {
  const single = String(text || '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return single.length > 320 ? `${single.slice(0, 317)}...` : single;
}

export function localAbsenceSms({ studentName, className, date, language }) {
  const template = TEMPLATES[language] || TEMPLATES.en;
  return template({ student: studentName, className, date });
}

export function localLeaveSms({ studentName, className, date, language, reason }) {
  const template = LEAVE_TEMPLATES[language] || LEAVE_TEMPLATES.en;
  return template({ student: studentName, className, date, reason });
}

export async function composeAbsenceSms({ studentName, className, date, language }) {
  const lang = TEMPLATES[language] ? language : 'en';
  const fallback = localAbsenceSms({ studentName, className, date, language: lang });

  if (!config.anthropicApiKey) {
    return { sms: fallback, source: 'local' };
  }

  const prompt = `Write ONE short SMS that a school sends to a parent when their child is absent.
Facts: student "${studentName}", class "${className}", date ${date}, platform IHURIRO.
Rules:
- Write in ${LANGUAGE_NAMES[lang]}.
- Maximum 160 characters, one sentence or two, plain text, no emojis, no markdown.
- State that the student was marked absent, and ask the parent to contact the school if this is unexpected.
- Reply with the SMS text only.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.aiModel,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(config.aiTimeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Anthropic ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();

    if (!text) throw new Error('Anthropic returned an empty SMS.');
    return { sms: cleanSms(text), source: 'anthropic' };
  } catch (error) {
    console.error('[sms] AI SMS generation failed, using the built-in template:', error.message);
    return { sms: fallback, source: 'local-fallback' };
  }
}
