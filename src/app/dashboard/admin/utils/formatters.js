// Re-export shared formatters so existing admin imports keep working
export {
  toDate,
  formatDate,
  formatDateWithTime,
  formatDuration,
  formatRelative,
  formatCurrency,
  formatPrice,
  formatPriceShort,
  parsePrice,
  getPropertyImage,
} from '../../../utils/formatters';

export function parseUserAgent(ua) {
  if (!ua) return null;
  let browser = 'Unknown';
  let os = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  return { browser, os };
}
