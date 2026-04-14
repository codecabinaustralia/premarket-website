import { adminDb } from '../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { phoneKey as toPhoneKey } from '../../utils/phone';

/**
 * Conversation history for the inbound SMS webhook.
 *
 * Storage shape:
 *   smsConversations/{phoneKey}
 *     - phone:       <E.164, e.g. "+61412345678">
 *     - lastMessageAt: serverTimestamp
 *     - messageCount: number
 *     - userId, senderKind, senderName    (denormalized for fast reads)
 *
 *   smsConversations/{phoneKey}/messages/{autoId}
 *     - role:     'user' | 'assistant' | 'tool'
 *     - content:  string
 *     - toolName, toolCallId, toolArgs?   (when role === 'tool')
 *     - createdAt: serverTimestamp
 *     - messageSid?:  Twilio inbound SID (for dedupe + debug)
 *
 * The phone number is normalized to digits-only (no `+`) so it's a safe
 * Firestore document id and a bare phone like "0412…" always maps to the
 * same bucket as "+61412…".
 */

const DEFAULT_HISTORY_LIMIT = 12; // ~6 turns of back-and-forth

function keyFor(phone) {
  return toPhoneKey(phone);
}

function convoRef(phone) {
  const key = keyFor(phone);
  if (!key) return null;
  return adminDb.collection('smsConversations').doc(key);
}

/**
 * Append a message to the sender's conversation log and bump the parent
 * doc's counters. Safe to call from either the webhook or the handler.
 */
export async function appendMessage(phone, message) {
  const ref = convoRef(phone);
  if (!ref) return;

  const payload = {
    role: message.role,
    content: message.content ?? '',
    createdAt: FieldValue.serverTimestamp(),
  };
  if (message.toolName) payload.toolName = message.toolName;
  if (message.toolCallId) payload.toolCallId = message.toolCallId;
  if (message.toolArgs !== undefined) payload.toolArgs = message.toolArgs;
  if (message.messageSid) payload.messageSid = message.messageSid;

  await ref.collection('messages').add(payload);

  await ref.set(
    {
      phone,
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      ...(message.userId ? { userId: message.userId } : {}),
      ...(message.senderKind ? { senderKind: message.senderKind } : {}),
      ...(message.senderName ? { senderName: message.senderName } : {}),
    },
    { merge: true }
  );
}

/**
 * Load the most recent messages for a phone, in chronological order
 * (oldest → newest). Used to give the AI short-term memory. Returns an
 * empty array if the conversation doesn't exist yet.
 */
export async function getRecentMessages(phone, limit = DEFAULT_HISTORY_LIMIT) {
  const ref = convoRef(phone);
  if (!ref) return [];

  const snap = await ref
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  if (snap.empty) return [];

  const rows = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      role: data.role,
      content: data.content || '',
      toolName: data.toolName || null,
      toolCallId: data.toolCallId || null,
      toolArgs: data.toolArgs || null,
    };
  });

  // Firestore gave us newest-first; flip to chronological for OpenAI.
  return rows.reverse();
}

/**
 * Returns the denormalized parent doc (useful for debugging or admin UIs).
 */
export async function getConversationMeta(phone) {
  const ref = convoRef(phone);
  if (!ref) return null;
  const doc = await ref.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
