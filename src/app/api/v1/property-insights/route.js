import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  median,
  formatPrice,
} from '../helpers';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const location = await parseLocationParams(request);
    if (location.error) {
      return NextResponse.json({ error: location.error }, { status: 400 });
    }

    const { lat, lng, radius, resolvedPlace } = location;
    const properties = await getPropertiesInRadius(lat, lng, radius);
    const propertyIds = properties.map((p) => p.id);

    const [offers, likes] = await Promise.all([
      getOffersForProperties(propertyIds),
      getLikesForProperties(propertyIds),
    ]);

    const offersByProperty = {};
    for (const o of offers) {
      if (!offersByProperty[o.propertyId]) offersByProperty[o.propertyId] = [];
      offersByProperty[o.propertyId].push(o);
    }

    const likesByProperty = {};
    for (const l of likes) {
      if (!likesByProperty[l.propertyId]) likesByProperty[l.propertyId] = [];
      likesByProperty[l.propertyId].push(l);
    }

    const insights = properties.map((p) => {
      const propOffers = offersByProperty[p.id] || [];
      const propLikes = likesByProperty[p.id] || [];
      const opinions = propOffers.filter((o) => o.type === 'opinion');
      const seriousBuyers = opinions.filter((o) => o.serious === true);

      const offerAmounts = opinions
        .map((o) => parseFloat(o.offerAmount) || 0)
        .filter((a) => a > 0);
      const medianOpinion = median(offerAmounts);

      const listingPrice = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
      let priceVsOpinionGap = null;
      if (listingPrice > 0 && medianOpinion > 0) {
        priceVsOpinionGap = Math.round(((medianOpinion - listingPrice) / listingPrice) * 10000) / 100;
      }

      return {
        propertyId: p.id,
        address: p.formattedAddress || p.address || null,
        listingPrice: listingPrice || null,
        listingPriceFormatted: formatPrice(listingPrice),
        views: p.stats?.views || 0,
        totalOpinions: opinions.length,
        seriousBuyers: seriousBuyers.length,
        passiveBuyers: opinions.length - seriousBuyers.length,
        likes: propLikes.length,
        medianOpinion: medianOpinion || null,
        medianOpinionFormatted: formatPrice(medianOpinion),
        priceVsOpinionGapPercent: priceVsOpinionGap,
        isLive: p.visibility === true,
      };
    });

    insights.sort((a, b) => {
      const engA = a.totalOpinions + a.likes + a.views;
      const engB = b.totalOpinions + b.likes + b.views;
      return engB - engA;
    });

    return NextResponse.json({
      location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
      totalProperties: properties.length,
      insights,
    });
  } catch (err) {
    console.error('Property insights error:', err);
    return NextResponse.json({ error: 'Failed to generate property insights' }, { status: 500 });
  }
}
