/**
 * Shared formatting utilities for dates, prices, and Firestore timestamps.
 */

/** Convert any Firestore timestamp format to a JS Date */
export function toDate(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (ts._seconds) return new Date(ts._seconds * 1000);
  if (typeof ts === 'string') return new Date(ts);
  if (typeof ts === 'number') return new Date(ts);
  return null;
}

/** Format a date as "29 Mar 2026" */
export function formatDate(ts) {
  if (!ts) return '--';
  const d = toDate(ts);
  if (!d) return '--';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format a date as "29 Mar 2026, 02:30 PM" */
export function formatDateWithTime(ts) {
  if (!ts) return '--';
  const d = toDate(ts);
  if (!d) return '--';
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format relative time: "just now", "3m ago", "2h ago", "5d ago" */
export function formatRelative(date) {
  if (!date) return '--';
  const d = toDate(date);
  if (!d) return '--';
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/** Format seconds duration: "45s", "3m 12s", "2h 15m" */
export function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Parse a price string/number into a number, stripping non-numeric chars */
export function parsePrice(price) {
  if (!price) return null;
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

/** Format price as "$1,250,000" (full) */
export function formatPrice(price) {
  if (!price) return null;
  const num = parsePrice(price);
  if (!num) return null;
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

/** Format price abbreviated: "$1.2M", "$450K", "$999" */
export function formatPriceShort(price) {
  if (!price) return '--';
  const num = parsePrice(price);
  if (!num) return '--';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

/** Format as AUD currency: "$1,250,000" using Intl */
export function formatCurrency(amount) {
  if (amount == null) return '--';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/** Get the first image URL from a property object, handling all field variants */
export function getPropertyImage(property) {
  if (!property) return null;
  return property.imageUrls?.[0] || property.imageUrl || property.images?.[0] || null;
}
