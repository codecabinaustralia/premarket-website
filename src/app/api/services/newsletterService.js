import { adminDb } from '../../firebase/adminApp';
import { sendEmail } from './resendService';
import { Timestamp } from 'firebase-admin/firestore';

export async function fetchBuyersWithPreferences() {
  const usersSnapshot = await adminDb
    .collection('users')
    .where('buyer', '==', true)
    .where('buyerPreferences.notifyNewProperties', '==', true)
    .get();

  const buyers = [];
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.unsubscribed === true) return;
    buyers.push({
      id: doc.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      preferences: {
        locations: data.buyerPreferences?.locations || [],
        propertyType: data.buyerPreferences?.propertyType || null,
        minBedrooms: data.buyerPreferences?.minBedrooms || null,
        minBudget: data.buyerPreferences?.minBudget || null,
        maxBudget: data.buyerPreferences?.maxBudget || null,
      },
    });
  });
  return buyers;
}

export async function fetchNewestProperties(limit = 5) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const propertiesSnapshot = await adminDb
    .collection('properties')
    .where('active', '==', true)
    .where('visibility', '==', true)
    .where('created', '>=', Timestamp.fromDate(oneWeekAgo))
    .orderBy('created', 'desc')
    .limit(limit)
    .get();

  return propertiesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || 'Untitled Property',
      address: data.address || '',
      suburb: data.location?.suburb || '',
      showSuburbOnly: data.showSuburbOnly || false,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      carSpaces: data.carSpaces || null,
      price: data.price || null,
      imageUrl: data.imageUrls?.[0] || null,
      created: data.created?.toDate() || new Date(),
    };
  });
}

export async function fetchHottestProperties(limit = 5) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const offersSnapshot = await adminDb
    .collection('offers')
    .where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo))
    .get();

  const propertyOfferCounts = {};
  offersSnapshot.forEach((doc) => {
    const data = doc.data();
    const propertyId = data.propertyId;
    if (propertyId) {
      propertyOfferCounts[propertyId] = (propertyOfferCounts[propertyId] || 0) + 1;
    }
  });

  const sortedPropertyIds = Object.entries(propertyOfferCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([propertyId, count]) => ({ propertyId, count }));

  if (sortedPropertyIds.length === 0) return [];

  const properties = [];
  for (const { propertyId, count } of sortedPropertyIds) {
    const propertyDoc = await adminDb.collection('properties').doc(propertyId).get();
    if (propertyDoc.exists) {
      const data = propertyDoc.data();
      if (data.active && data.visibility) {
        properties.push({
          id: propertyDoc.id,
          title: data.title || 'Untitled Property',
          address: data.address || '',
          suburb: data.location?.suburb || '',
          showSuburbOnly: data.showSuburbOnly || false,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          carSpaces: data.carSpaces || null,
          price: data.price || null,
          imageUrl: data.imageUrls?.[0] || null,
          offerCount: count,
        });
      }
    }
  }
  return properties;
}

function parsePrice(price) {
  if (!price) return null;
  if (typeof price === 'number') return price;
  const cleaned = String(price).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || null;
}

function formatPrice(price) {
  if (!price) return 'Price on Application';
  const num = parsePrice(price);
  if (!num) return 'Price on Application';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${num.toLocaleString()}`;
}

function getDisplayAddress(property) {
  if (property.showSuburbOnly) {
    return property.address?.split(',')[1]?.trim() || property.suburb || 'Australia';
  }
  return property.address || property.suburb || 'Australia';
}

export function matchPropertiesToBuyer(buyer, properties) {
  const { preferences } = buyer;
  return properties.filter((property) => {
    if (preferences.locations?.length > 0) {
      const propertySuburb = property.suburb?.toLowerCase();
      const matchesLocation = preferences.locations.some((loc) =>
        propertySuburb?.includes(loc.toLowerCase())
      );
      if (!matchesLocation) return false;
    }
    if (preferences.minBedrooms && property.bedrooms) {
      if (property.bedrooms < preferences.minBedrooms) return false;
    }
    const propertyPrice = parsePrice(property.price);
    if (propertyPrice) {
      if (preferences.minBudget && propertyPrice < preferences.minBudget) return false;
      if (preferences.maxBudget && propertyPrice > preferences.maxBudget) return false;
    }
    return true;
  });
}

export function generateNewsletterHTML(buyer, newestProperties, hottestProperties) {
  const baseUrl = 'https://premarket.homes';

  const propertyCardHTML = (property) => {
    const specs = [
      property.bedrooms ? `${property.bedrooms} Bed` : '',
      property.bathrooms ? `${property.bathrooms} Bath` : '',
      property.carSpaces ? `${property.carSpaces} Car` : '',
    ].filter(Boolean).join(' &bull; ');

    return `
    <tr><td style="padding: 0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <tr><td>${property.imageUrl ? `<img src="${property.imageUrl}" alt="${property.title}" width="100%" height="200" style="display: block; object-fit: cover; border-radius: 16px 16px 0 0;" />` : `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;"></div>`}</td></tr>
        <tr><td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td><h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1a1a2e;"><a href="${baseUrl}/find-property?propertyId=${property.id}" style="color: #1a1a2e; text-decoration: none;">${property.title}</a></h3></td></tr>
            <tr><td style="padding: 4px 0;"><p style="margin: 0; font-size: 14px; color: #6b7280;">${getDisplayAddress(property)}</p></td></tr>
            ${specs ? `<tr><td style="padding: 8px 0;"><p style="margin: 0; font-size: 13px; color: #9ca3af; letter-spacing: 0.5px;">${specs}</p></td></tr>` : ''}
            <tr><td style="padding-top: 12px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><span style="font-size: 20px; font-weight: 800; color: #f97316;">${formatPrice(property.price)}</span></td><td align="right"><a href="${baseUrl}/find-property?propertyId=${property.id}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">View Property</a></td></tr></table></td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`;
  };

  const newestCount = newestProperties.length;
  const hottestCount = hottestProperties.length;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Weekly Pre-Market Properties</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">${newestCount} new pre-market properties this week</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;"><tr><td align="center" style="padding: 40px 20px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
      <tr><td align="center" style="padding: 0 0 32px 0;"><img src="https://premarket.homes/assets/logo.png" alt="Premarket" width="200" style="display: block;" /></td></tr>
      <tr><td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border-radius: 24px 24px 0 0; padding: 48px 40px; text-align: center;">
        <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 800; color: #ffffff;">Hi ${buyer.firstName || 'there'}!</h1>
        <p style="margin: 0 0 8px 0; font-size: 18px; color: #94a3b8;">Your exclusive weekly preview of pre-market properties is here.</p>
        <p style="margin: 0 0 24px 0; font-size: 18px; color: #94a3b8;"><strong style="color: #f97316;">You're seeing them first!</strong></p>
      </td></tr>
      <tr><td style="background: #f1f5f9; padding: 40px 24px;">
        ${newestProperties.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom: 24px;"><h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a2e;">Fresh Listings</h2><p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Just added this week</p></td></tr>${newestProperties.map((p) => propertyCardHTML(p)).join('')}</table>` : ''}
        ${hottestProperties.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;"><tr><td style="padding-bottom: 24px;"><h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a2e;">Hottest This Week</h2><p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Getting the most buyer attention</p></td></tr>${hottestProperties.map((p) => propertyCardHTML(p)).join('')}</table>` : ''}
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;"><tr><td align="center"><a href="${baseUrl}/listings" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 700;">Browse All Properties</a></td></tr></table>
      </td></tr>
      <tr><td style="background: #1a1a2e; border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #94a3b8;">You're receiving this because you signed up for property alerts on Premarket.</p>
        <table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="padding: 0 12px;"><a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(buyer.email)}" style="color: #6b7280; font-size: 13px; text-decoration: none;">Unsubscribe</a></td><td style="color: #4b5563;">|</td><td style="padding: 0 12px;"><a href="${baseUrl}/privacy" style="color: #6b7280; font-size: 13px; text-decoration: none;">Privacy</a></td></tr></table>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #4b5563;">&copy; ${new Date().getFullYear()} Premarket Australia. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

async function sendNewsletterEmail(buyer, newestProperties, hottestProperties) {
  const html = generateNewsletterHTML(buyer, newestProperties, hottestProperties);
  const propertyCount = newestProperties.length + hottestProperties.length;
  return sendEmail({
    to: buyer.email,
    subject: `${propertyCount} Pre-Market Properties This Week`,
    html,
  });
}

export async function sendWeeklyBuyerNewsletters() {
  const [buyers, newestProperties, hottestProperties] = await Promise.all([
    fetchBuyersWithPreferences(),
    fetchNewestProperties(5),
    fetchHottestProperties(5),
  ]);

  if (newestProperties.length === 0 && hottestProperties.length === 0) {
    return { sent: 0, skipped: buyers.length, errors: 0 };
  }

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const buyer of buyers) {
    try {
      const matchedNewest = matchPropertiesToBuyer(buyer, newestProperties);
      const matchedHottest = matchPropertiesToBuyer(buyer, hottestProperties);
      const buyerNewest = matchedNewest.length > 0 ? matchedNewest : newestProperties;
      const buyerHottest = matchedHottest.length > 0 ? matchedHottest : hottestProperties;

      if (buyerNewest.length === 0 && buyerHottest.length === 0) {
        results.skipped++;
        continue;
      }

      await sendNewsletterEmail(buyer, buyerNewest, buyerHottest);
      results.sent++;
    } catch (error) {
      console.error(`Failed to send newsletter to ${buyer.email}:`, error);
      results.errors++;
    }
  }

  return results;
}
