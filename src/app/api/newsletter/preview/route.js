import { NextResponse } from 'next/server';
import {
  fetchBuyersWithPreferences,
  fetchNewestProperties,
  fetchHottestProperties,
  matchPropertiesToBuyer,
  generateNewsletterHTML,
} from '../../services/newsletterService';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    const [buyers, newestProperties, hottestProperties] = await Promise.all([
      fetchBuyersWithPreferences(),
      fetchNewestProperties(5),
      fetchHottestProperties(5),
    ]);

    let buyer = email ? buyers.find((b) => b.email === email) : buyers[0];

    if (!buyer) {
      buyer = {
        email: email || 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        preferences: {},
      };
    }

    const matchedNewest = matchPropertiesToBuyer(buyer, newestProperties);
    const matchedHottest = matchPropertiesToBuyer(buyer, hottestProperties);
    const buyerNewest = matchedNewest.length > 0 ? matchedNewest : newestProperties;
    const buyerHottest = matchedHottest.length > 0 ? matchedHottest : hottestProperties;

    const html = generateNewsletterHTML(buyer, buyerNewest, buyerHottest);
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('Error previewing newsletter:', err);
    return NextResponse.json({ error: 'Failed to preview newsletter', details: err.message }, { status: 500 });
  }
}
