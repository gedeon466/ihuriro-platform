import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { audit } from '../lib/audit.js';
import { asyncHandler, parseBody } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many assistant requests. Please wait a moment and try again.' },
});

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Ask a question.').max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(12)
    .optional()
    .default([]),
  module: z.string().trim().max(40).optional().default('home'),
});

const INTEGRATION_NOTE =
  'IHURIRO does not yet hold approved live connections to government registries. Until those integrations are authorized, official applications and payments must be completed through the responsible institution or its official channel.';

const topics = [
  {
    keywords: ['report', 'complaint', 'problem', 'issue', 'grievance', 'road', 'water'],
    reply: `To report a community issue in CitizenConnect:

1. Open CitizenConnect and choose "Report a Problem".
2. Pick a category, describe what happened, and add the location.
3. Submit the report. It is stored as "pending".
4. Track it from the same module. A government officer can move it to "in-review" and then "resolved".

Include clear landmarks and dates so the responsible office can act quickly. Only you and authorized officers can see the full complaint.`,
  },
  {
    keywords: ['track', 'status', 'reference', 'progress'],
    reply: `You can follow your submissions in CitizenConnect:

• "Pending" means the report was received and is waiting for an officer.
• "In review" means an office has taken it up.
• "Resolved" means the issue was closed.

The list on the CitizenConnect page is always loaded from your account, so it reflects the current status. If a complaint stays pending for a long time, contact the sector office directly and quote its title and date.`,
  },
  {
    keywords: ['attendance', 'student', 'school', 'education', 'class', 'teacher', 'performance'],
    reply: `The Education module brings student records together:

• Teachers and administrators can add students and teachers, then review attendance and performance.
• At-risk students are flagged when attendance or performance falls behind.
• Parents and students should contact the school office to correct a record; changes require an authorized staff account.

Open Education from the sidebar to see the live class summary. The figures shown are the records stored for this school workspace, not a national registry.`,
  },
  {
    keywords: ['stock', 'inventory', 'product', 'sales', 'sell', 'loan', 'business', 'revenue'],
    reply: `Biz360 is the business workspace:

• Add products with stock and unit price. Stock status updates automatically: in stock, low stock (8 units or fewer), or out of stock.
• Record a sale and inventory is reduced in the same step.
• The summary shows revenue, units sold, inventory value, and products that need restocking.
• Financing requests can be submitted from the loans section and are tracked as "submitted".

Inventory and sales are stored in IHURIRO's own database. Bank, tax, and RRA integrations remain pending authorized access, so do not treat these records as official filings.`,
  },
  {
    keywords: ['vaccin', 'pregnancy', 'prenatal', 'health', 'clinic', 'child', 'nutrition', 'sick'],
    reply: `ParentCare23 offers general health education: pregnancy week by week, the Rwanda immunization schedule, nutrition, and child development.

For anything urgent — danger signs in pregnancy, a fever that will not settle, breathing difficulty, or a child who cannot feed — go to the nearest health center immediately. This assistant provides general information only and cannot diagnose or prescribe.

Your vaccination reminder in Notifications is a prompt to visit a health center; it is not a medical record.`,
  },
  {
    keywords: ['register', 'account', 'sign up', 'signup', 'login', 'password'],
    reply: `To use IHURIRO:

1. Choose "Create account" on the sign-in screen.
2. Enter your name, email, phone number, preferred language, and a password of at least 8 characters.
3. Pick the role that matches how you will use the platform (citizen, student, parent, business, health, and so on).

You can update your name, phone, and language in Profile, and change your password there too. If you forget your password, ask an administrator to reset it; self-service email recovery is not connected yet.`,
  },
  {
    keywords: ['role', 'permission', 'admin', 'access', 'government'],
    reply: `IHURIRO uses role-based access:

• Citizens and parents report issues and follow their own records.
• Teachers manage education records; business accounts manage inventory and sales.
• Government officers review complaints and publish announcements.
• Administrators manage users, roles, and audit history.

If a menu item is missing or an action is refused, your account does not hold that permission. An administrator can adjust your role; role changes are recorded in the audit log.`,
  },
  {
    keywords: ['notification', 'sms', 'email', 'alert', 'reminder'],
    reply: `Notifications appear in the bell menu and the Notifications page. They are grouped by type: government, school, health, business, and system.

Open a notification to mark it read, or use "Mark all read". Delivery by SMS or email requires an approved gateway and is not active yet; messages currently appear in-app only. Contact details on file are used to identify your account, not to send automatic SMS.`,
  },
  {
    keywords: ['tax', 'rra', 'registration', 'licence', 'license', 'official', 'certificate', 'irembo'],
    reply: `Official registration, tax filing, and certificate requests must go through the responsible institution's authorized channel, such as RRA or Irembo. ${INTEGRATION_NOTE}

IHURIRO can help you prepare and keep internal records, but it does not submit filings on your behalf. When an integration is approved, it will run from the server with your explicit authorization, audit logging, and the institution's credentials — never from the browser.`,
  },
  {
    keywords: ['privacy', 'secure', 'security', 'data', 'password safe'],
    reply: `Account security in IHURIRO:

• Passwords are stored as bcrypt hashes, never as readable text.
• Sessions use signed tokens that expire; signing out discards the token on your device.
• Each module checks your role on the server before returning or changing records.
• Sensitive actions are written to an audit log that administrators can review.

Do not share your password, and sign out on shared devices. IHURIRO will never ask for your password or a one-time code in a chat.`,
  },
  {
    keywords: ['umuganda', 'girinka', 'rwanda', 'culture', 'history', 'kinyarwanda'],
    reply: `Rwanda's civic life includes Umuganda, the monthly community work held on the last Saturday of the month, and Girinka, the one-cow-per-poor-family programme started in 2006.

Learn Rwanda on this platform covers the historical timeline, civic education, culture, and quizzes. Content is educational; it is not an official government publication. For authoritative information, consult the relevant ministry or district office.`,
  },
  {
    keywords: ['what can you do', 'help', 'services', 'platform', 'ihuriro'],
    reply: `I can help you with IHURIRO's workspaces:

• CitizenConnect — report and track community issues, read announcements.
• Education — students, teachers, attendance, and performance.
• ParentCare23 — pregnancy, vaccination, and child health education.
• Biz360 — inventory, sales, and financing requests.
• Learn Rwanda — history, civics, culture, and quizzes.
• Admin — users, roles, announcements, and audit history (administrators only).

Ask about any of these, or about your account. I will not invent live government data or claim an official filing has been completed.`,
  },
  {
    keywords: ['hello', 'hi ', 'hey', 'muraho', 'bonjour'],
    reply: `Muraho! I'm the IHURIRO assistant. I can explain how to report a community issue, follow a complaint, use the education and business workspaces, or find health information. What would you like to do?`,
  },
];

function localAnswer(message, user, module) {
  const q = ` ${message.toLowerCase()} `;
  const match = topics.find((topic) => topic.keywords.some((keyword) => q.includes(keyword)));

  if (match) {
    return `${match.reply}\n\nSigned in as ${user.name} (${user.role}) · workspace: ${module}.`;
  }

  return `I can help with that once I understand a little more. Right now I'm answering from IHURIRO's built-in guidance, not a live external model.

Try asking about:
• Reporting or tracking a community issue
• Attendance, students, or school records
• Stock, sales, or business summaries
• Vaccination, pregnancy, or child health information
• Your account, role, or password
• Official registration or tax services

${INTEGRATION_NOTE}`;
}

function sanitizeHistory(history) {
  const trimmed = history.slice(-8);
  const cleaned = [];
  for (const item of trimmed) {
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === item.role) {
      last.content = `${last.content}\n${item.content}`;
    } else {
      cleaned.push({ role: item.role, content: item.content });
    }
  }
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned;
}

async function askAnthropic(message, history, user, module) {
  const system = `You are IHURIRO AI, a concise, practical assistant inside IHURIRO Rwanda, a civic services platform. The signed-in user is ${user.name}, role: ${user.role}, current workspace: ${module}.

Rules:
- Be warm and direct. Use short paragraphs and bullets. Keep answers under 250 words unless the question truly needs more.
- Never claim live access to government records, and never say a filing, payment, or official registration has been completed. Official services require the responsible institution's authorized channel; integrations in IHURIRO are pending until credentials and approval are in place.
- Do not request passwords, PINs, national ID numbers, or other sensitive credentials.
- For health, legal, or financial questions, give general education and recommend a qualified professional.
- If asked about platform data, explain what the workspace stores and where the user can see it. Do not invent figures.
- Answer in the user's language when the question is clearly in Kinyarwanda or French; otherwise use English.`;

  const messages = [...sanitizeHistory(history), { role: 'user', content: message }];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 700,
      system,
      messages,
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
    .join('\n')
    .trim();

  if (!text) throw new Error('Anthropic returned an empty response.');
  return text;
}

router.post(
  '/chat',
  limiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = parseBody(chatSchema, req.body);

    if (config.anthropicApiKey) {
      try {
        const reply = await askAnthropic(data.message, data.history, req.user, data.module);
        audit(req, 'ai.chat', 'assistant', null, { provider: 'anthropic', length: data.message.length });
        return res.json({ reply, source: 'anthropic', model: config.aiModel });
      } catch (error) {
        console.error('[ai] external provider failed:', error.message);
        audit(req, 'ai.chat', 'assistant', null, { provider: 'local-fallback' });
        return res.json({
          reply: `${localAnswer(data.message, req.user, data.module)}\n\nThe external AI provider is unavailable right now, so this answer comes from IHURIRO's built-in guidance.`,
          source: 'local-fallback',
        });
      }
    }

    audit(req, 'ai.chat', 'assistant', null, { provider: 'local', length: data.message.length });
    return res.json({
      reply: localAnswer(data.message, req.user, data.module),
      source: 'local',
    });
  })
);

router.get('/status', (_req, res) => {
  res.json({
    provider: config.anthropicApiKey ? 'anthropic' : 'local',
    model: config.anthropicApiKey ? config.aiModel : null,
    externalProviderConfigured: Boolean(config.anthropicApiKey),
  });
});

export default router;
