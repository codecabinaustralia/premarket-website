import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../firebase/adminApp';
import { sendSms, smartTruncate } from './twilioService';
import { getOpenAI } from './openAiService';
import {
  scrapeRealEstateUrl,
  createPropertyFromScrape,
} from './propertyScrapeService';
import {
  searchPropertiesForUser,
  searchAllProperties,
  assertOwnership,
} from './userLookupService';
import { buildReport, gatherReport } from './reportService';
import { appendMessage, getRecentMessages } from './smsConversationService';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;
const MAX_TOOL_ITERATIONS = 6;
const MODEL = 'gpt-4o';

/**
 * Core orchestrator for inbound SMS. Called via `after(...)` from the
 * webhook route so the HTTP request returns to Twilio immediately while
 * the real work (Puppeteer scraping, OpenAI, PDF email) runs here.
 *
 * v2 — AI agent loop:
 *   1. Dedupe on MessageSid.
 *   2. Rate limit per user (10/hour).
 *   3. Load recent conversation history for this phone.
 *   4. Run an OpenAI tool-calling loop. Tools cover add/listing/report/link,
 *      plus superadmin-only platform-wide search.
 *   5. Persist every user + assistant + tool message back to Firestore so
 *      the next inbound text keeps short-term memory.
 *   6. Send final assistant reply via Twilio REST.
 *
 * Any failure (including tool errors) is sent back to the sender as an
 * SMS so they get real-time feedback while we iterate on the integration.
 */
export async function handleInboundSms({ sender, body, messageSid }) {
  const phone = sender?.smsPhone;
  const senderName = sender?.senderName || 'there';

  try {
    // --- Idempotency ------------------------------------------------------
    if (messageSid) {
      const sidRef = adminDb.collection('smsMessages').doc(messageSid);
      const existing = await sidRef.get();
      if (existing.exists) {
        console.log(`[sms] duplicate MessageSid ${messageSid}, skipping`);
        return;
      }
      await sidRef.set({
        userId: sender.uid,
        senderKind: sender.senderKind || 'user',
        processedAt: FieldValue.serverTimestamp(),
      });
    }

    // --- Rate limit -------------------------------------------------------
    if (!(await checkRateLimit(sender))) {
      await safeSend(
        phone,
        `Slow down ${senderName} — up to 10 SMS commands per hour. Try again shortly.`
      );
      return;
    }

    // --- Record the inbound user message for history ---------------------
    await appendMessage(phone, {
      role: 'user',
      content: body || '',
      messageSid: messageSid || null,
      userId: sender.uid,
      senderKind: sender.senderKind,
      senderName,
    });

    // --- Run the agent loop ----------------------------------------------
    const history = await getRecentMessages(phone, 12);
    const reply = await runAgent({ sender, body, history });

    // --- Persist assistant reply + send SMS ------------------------------
    await appendMessage(phone, {
      role: 'assistant',
      content: reply || '',
      userId: sender.uid,
      senderKind: sender.senderKind,
      senderName,
    });

    if (reply) {
      await safeSend(phone, smartTruncate(reply, 1500));
    }
  } catch (err) {
    console.error('[sms] handleInboundSms error:', err);
    const debug =
      err?.message ? `\n\n[debug] ${err.message}` : '';
    await safeSend(
      phone,
      smartTruncate(
        `Hey ${senderName}, something broke on our end processing your message.${debug}`,
        1500
      )
    ).catch(() => {});
  }
}

// -----------------------------------------------------------------------------
// Agent loop
// -----------------------------------------------------------------------------

/**
 * Runs an OpenAI tool-calling loop for up to MAX_TOOL_ITERATIONS turns. The
 * model can call the available tools to scrape URLs, find properties, build
 * reports, or send the full PDF via email. The final assistant message that
 * has no tool calls is returned as the SMS reply.
 */
async function runAgent({ sender, body, history }) {
  const openai = getOpenAI();

  const messages = [
    { role: 'system', content: systemPrompt(sender) },
    ...historyToOpenAI(history),
    { role: 'user', content: body || '' },
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions(sender),
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const choice = completion.choices?.[0];
    const msg = choice?.message;
    if (!msg) break;

    // Push the assistant turn (including any tool_calls) for the next round
    messages.push(msg);

    const toolCalls = msg.tool_calls || [];
    if (!toolCalls.length) {
      // Final reply
      return (msg.content || '').trim();
    }

    // Execute each tool call and append its result
    for (const call of toolCalls) {
      const name = call.function?.name;
      let args = {};
      try {
        args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
      } catch (e) {
        args = {};
      }

      let result;
      try {
        result = await runTool(name, args, sender);
      } catch (toolErr) {
        console.error(`[sms] tool ${name} failed:`, toolErr);
        result = { ok: false, error: toolErr?.message || String(toolErr) };
      }

      const resultJson = JSON.stringify(result).slice(0, 6000);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: resultJson,
      });

      // Persist tool output so future conversations have context
      await appendMessage(sender.smsPhone, {
        role: 'tool',
        content: resultJson,
        toolName: name,
        toolCallId: call.id,
        toolArgs: args,
      }).catch((e) => console.error('[sms] persist tool message failed:', e));
    }
  }

  return "Sorry — I couldn't put that together in time. Try again or reply HELP.";
}

// -----------------------------------------------------------------------------
// Prompts + tool definitions
// -----------------------------------------------------------------------------

function systemPrompt(sender) {
  const name = sender.senderName || 'there';
  const isSuperadmin = sender.superAdmin === true;
  const kind = sender.senderKind === 'agent' ? 'team member' : 'account owner';

  return [
    `You are the Premarket SMS concierge for real estate agents. You reply to text messages on behalf of the Premarket team.`,
    `The current sender is ${name} (${kind}${isSuperadmin ? ', SUPERADMIN' : ''}).`,
    `Always address them by first name.`,
    `Keep replies under 1500 characters. No emojis. Plain text, short sentences, line-breaks between sections.`,
    `You have tools for: scraping realestate.com.au URLs into new premarket listings, looking up the sender's properties, building engagement reports (which also emails the full PDF), and returning public share links.`,
    isSuperadmin
      ? `As a SUPERADMIN, you may also use findAnyProperty / getAnyReport to query the entire platform, not just this account.`
      : `You can ONLY access properties owned by this sender. Never reveal data from other accounts.`,
    `When the user sends a realestate.com.au URL with no other context, treat it as ADD_PROPERTY.`,
    `When they ask about a listing by name or "latest", call findMyProperty first, then use the returned propertyId for downstream tools.`,
    `When reporting, include: views, likes, number of serious opinions, median serious offer (and +/- vs list price), and the PVI score if available. End with the public link.`,
    `If a tool returns an error, explain what went wrong in one sentence and suggest a fix (don't show raw error traces).`,
    `Never make up property details — only report what the tools return.`,
  ].join('\n');
}

function toolDefinitions(sender) {
  const base = [
    {
      type: 'function',
      function: {
        name: 'scrapeAndCreateListing',
        description:
          'Scrape a realestate.com.au property URL and create a premarket draft listing under the sender\'s account. Returns the new propertyId, title, public URL and dashboard edit URL.',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'A full realestate.com.au property URL.',
            },
          },
          required: ['url'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'findMyProperty',
        description:
          'Search the sender\'s own properties. Pass an address (full or partial — even just street name + suburb), title, or "latest" to get the newest one. Partial addresses are geocoded via Mapbox to find the closest match by location. Returns propertyId, address, title, and listing status if found.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Free-text query: address, street name, suburb, title, or "latest".',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getReport',
        description:
          'Build an engagement report for one of the sender\'s properties. Also triggers the full PDF report to be emailed to the account owner. Returns summary stats (views, likes, opinions, median offers, PHI scores) and the public share URL.',
        parameters: {
          type: 'object',
          properties: {
            propertyId: { type: 'string', description: 'The Firestore document id of the property.' },
          },
          required: ['propertyId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getPublicLink',
        description: 'Return the public premarket share URL for a property.',
        parameters: {
          type: 'object',
          properties: {
            propertyId: { type: 'string' },
          },
          required: ['propertyId'],
        },
      },
    },
  ];

  if (sender.superAdmin === true) {
    base.push(
      {
        type: 'function',
        function: {
          name: 'findAnyProperty',
          description:
            'SUPERADMIN ONLY. Search ALL properties across the platform (not just the sender\'s). Supports partial addresses — geocoded via Mapbox if needed. Use for admin queries like "latest across all vendors" or "42 pacific ave bondi".',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getAnyReport',
          description:
            'SUPERADMIN ONLY. Build a report for ANY property on the platform regardless of owner. Emails the PDF to the superadmin.',
          parameters: {
            type: 'object',
            properties: {
              propertyId: { type: 'string' },
            },
            required: ['propertyId'],
          },
        },
      }
    );
  }

  return base;
}

// -----------------------------------------------------------------------------
// Tool implementations
// -----------------------------------------------------------------------------

async function runTool(name, args, sender) {
  switch (name) {
    case 'scrapeAndCreateListing':
      return toolScrapeAndCreateListing(args, sender);
    case 'findMyProperty':
      return toolFindMyProperty(args, sender);
    case 'getReport':
      return toolGetReport(args, sender, { allowAny: false });
    case 'getPublicLink':
      return toolGetPublicLink(args, sender, { allowAny: false });
    case 'findAnyProperty':
      if (!sender.superAdmin) return { ok: false, error: 'Not authorized.' };
      return toolFindAnyProperty(args);
    case 'getAnyReport':
      if (!sender.superAdmin) return { ok: false, error: 'Not authorized.' };
      return toolGetReport(args, sender, { allowAny: true });
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

async function toolScrapeAndCreateListing({ url }, sender) {
  if (!url) return { ok: false, error: 'Missing URL.' };

  const scraped = await scrapeRealEstateUrl(url);
  const created = await createPropertyFromScrape(sender, scraped);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premarket.homes';

  return {
    ok: true,
    propertyId: created.propertyId,
    title: created.title,
    editUrl: created.editUrl,
    publicUrl: `${baseUrl}/find-property?propertyId=${created.propertyId}`,
    address: scraped.address || scraped.formattedAddress || null,
    beds: scraped.bedrooms || null,
    baths: scraped.bathrooms || null,
    price: scraped.price || null,
    imageCount: created.imageCount ?? null,
  };
}

async function toolFindMyProperty({ query }, sender) {
  const property = await searchPropertiesForUser(sender, query || '');
  if (!property) return { ok: false, error: 'No matching listing found in your account.' };
  return {
    ok: true,
    propertyId: property.id,
    title: property.title || null,
    address: property.formattedAddress || property.address || null,
    listingStatus: property.listingStatus || null,
  };
}

async function toolFindAnyProperty({ query }) {
  const property = await searchAllProperties(query || '');
  if (!property) return { ok: false, error: 'No matching listing found across the platform.' };
  return {
    ok: true,
    propertyId: property.id,
    title: property.title || null,
    address: property.formattedAddress || property.address || null,
    listingStatus: property.listingStatus || null,
    ownerUserId: property.userId || null,
  };
}

async function toolGetReport({ propertyId }, sender, { allowAny }) {
  if (!propertyId) return { ok: false, error: 'Missing propertyId.' };

  // Load + authorize
  const doc = await adminDb.collection('properties').doc(propertyId).get();
  if (!doc.exists) return { ok: false, error: 'Property not found.' };
  const property = { id: doc.id, ...doc.data() };

  if (!allowAny && !assertOwnership(sender, property)) {
    return { ok: false, error: 'You do not own this property.' };
  }

  const report = await buildReport(propertyId);

  // Fire the full PDF email (non-fatal)
  if (sender.email) {
    const name = [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() || null;
    gatherReport(sender.email, propertyId, name).catch((err) => {
      console.error('[sms] gatherReport failed:', err);
    });
  }

  // Pull cached PHI snapshot if available
  let phi = null;
  try {
    const psSnap = await adminDb.collection('propertyScores').doc(propertyId).get();
    if (psSnap.exists) {
      const ps = psSnap.data();
      phi = {
        pvi: ps?.pvi?.score != null ? Math.round(ps.pvi.score) : null,
        bdi: ps?.bdi?.score != null ? Math.round(ps.bdi.score) : null,
        smi: ps?.smi?.score != null ? Math.round(ps.smi.score) : null,
      };
    }
  } catch (err) {
    console.warn('[sms] propertyScores lookup failed:', err?.message);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premarket.homes';

  return {
    ok: true,
    propertyId,
    address:
      report.property?.formattedAddress ||
      report.property?.address ||
      report.property?.title ||
      'Your property',
    views: report.property?.stats?.views || 0,
    likes: report.likesCount || 0,
    opinions: (report.seriousCount || 0) + (report.passiveCount || 0),
    seriousCount: report.seriousCount || 0,
    medianSerious: report.seriousMedian || null,
    medianCombined: report.combinedMedian || null,
    listingVsMedianPct: report.listingVsMedianPct ?? null,
    listingPrice: report.property?.price ?? null,
    phi,
    publicUrl: `${baseUrl}/find-property?propertyId=${propertyId}`,
    emailedTo: sender.email || null,
  };
}

async function toolGetPublicLink({ propertyId }, sender, { allowAny }) {
  if (!propertyId) return { ok: false, error: 'Missing propertyId.' };

  const doc = await adminDb.collection('properties').doc(propertyId).get();
  if (!doc.exists) return { ok: false, error: 'Property not found.' };
  const property = { id: doc.id, ...doc.data() };

  if (!allowAny && !assertOwnership(sender, property)) {
    return { ok: false, error: 'You do not own this property.' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premarket.homes';
  return {
    ok: true,
    propertyId,
    address: property.formattedAddress || property.address || property.title || null,
    publicUrl: `${baseUrl}/find-property?propertyId=${propertyId}`,
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Convert stored history rows into the shape OpenAI expects. Tool rows are
 * collapsed into plain-text turns since we've already discarded their
 * tool_call_id — re-hydrating the full tool_call chain across webhook
 * invocations would require storing the assistant tool_calls too, which
 * we don't right now. This is good enough for short-term memory.
 */
function historyToOpenAI(rows) {
  const out = [];
  for (const r of rows) {
    if (r.role === 'user') {
      out.push({ role: 'user', content: r.content || '' });
    } else if (r.role === 'assistant') {
      // Strip any prior tool_calls — we only carry the text forward
      out.push({ role: 'assistant', content: r.content || '' });
    } else if (r.role === 'tool') {
      out.push({
        role: 'assistant',
        content: `(tool ${r.toolName || ''} result: ${String(r.content || '').slice(0, 400)})`,
      });
    }
  }
  return out;
}

async function checkRateLimit(user) {
  const ref = adminDb.collection('users').doc(user.uid);
  const now = Date.now();

  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const windowStart = data.smsWindowStart?.toMillis?.() ?? data.smsWindowStart ?? 0;
      let count = data.smsRequestCount || 0;

      if (!windowStart || now - windowStart > RATE_LIMIT_WINDOW_MS) {
        tx.update(ref, {
          smsWindowStart: FieldValue.serverTimestamp(),
          smsRequestCount: 1,
          smsLastRequestAt: FieldValue.serverTimestamp(),
        });
        return true;
      }

      if (count >= RATE_LIMIT_MAX) return false;

      tx.update(ref, {
        smsRequestCount: FieldValue.increment(1),
        smsLastRequestAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
  } catch (err) {
    console.error('[sms] rate limit check failed, allowing request:', err);
    return true;
  }
}

async function safeSend(phone, text) {
  if (!phone) return;
  try {
    await sendSms(phone, text);
  } catch (err) {
    console.error('[sms] sendSms failed:', err);
  }
}
