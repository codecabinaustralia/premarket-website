import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../v1/middleware';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Shared location properties for tool schemas
const LOCATION_PROPERTIES = {
  location: {
    type: 'string',
    description:
      'Freeform location string that will be geocoded server-side, e.g. "Bondi Beach, NSW", "Sydney CBD", "Melbourne 3000", "2026". This is the preferred way to specify a location.',
  },
  suburb: { type: 'string', description: 'Suburb name — optional if location is provided' },
  state: { type: 'string', description: 'State abbreviation — optional if location is provided' },
  postcode: { type: 'string', description: 'Postcode — optional if location is provided' },
  lat: { type: 'number', description: 'Latitude — optional, overrides geocoding' },
  lng: { type: 'number', description: 'Longitude — optional, overrides geocoding' },
  radius: { type: 'number', description: 'Search radius in km (default 10)' },
};

const TOOLS = [
  {
    name: 'get_buyer_score',
    description:
      'Get the buyer intent/sentiment score (0-100) for a location. Measures buyer demand based on price opinions, serious buyers, likes, and buyer diversity. Use this for buyer sentiment questions too — the breakdown contains sentiment signals.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_seller_score',
    description:
      'Get the seller intent/sentiment score (0-100) for a location. Measures selling activity based on active properties, go-to-market timelines, and seller eagerness.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_market_forecast',
    description:
      'Get market forecast for a location. Shows how many properties are going to market next month, expected prices, and demand indicators.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_trending_areas',
    description:
      'Get the top trending areas ranked by growth in buyer activity. Compares last 30 days vs prior 30 days. Does not require a location.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of areas to return (max 50, default 10)' },
        country: { type: 'string', description: 'Country code (default "AU")' },
      },
    },
  },
  {
    name: 'get_historical_trends',
    description: 'Get historical buyer and seller score trends over past months for a location.',
    input_schema: {
      type: 'object',
      properties: {
        ...LOCATION_PROPERTIES,
        months: { type: 'number', description: 'Months of history (max 12, default 6)' },
      },
    },
  },
  {
    name: 'get_property_insights',
    description:
      'Get per-property insights for an area including views, opinions count, serious buyers, median opinion, and price vs opinion gap.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_national_overview',
    description:
      'Get Australia-wide market overview: average buyer and seller scores, total properties, total suburbs tracked, top buyer areas, top seller areas, and score distribution. No location needed.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_upcoming_to_market',
    description:
      'Get properties likely going to market or likely to sell soon. Shows upcoming listings grouped by state and suburb, with likelihood scores based on go-to-market dates, serious buyer registrations, price opinions, and engagement. No location needed.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_phi_scores',
    description:
      'Get all 8 PHI (Premarket Health Indicators) scores for a location. Returns: BDI (Buyer Demand Index), SMI (Seller Motivation Index), PVI (Price Validity Index), MHI (Market Heat Index), EVS (Engagement Velocity Score), BQI (Buyer Quality Index), FPI (Forward Pipeline Index), SDB (Supply-Demand Balance). Each score is 0-100.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_property_valuation',
    description:
      'Get per-property valuation analysis for a location. Shows which properties are overvalued, undervalued, or fairly priced based on buyer opinions vs listing prices. Sorted by price deviation.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_pipeline_forecast',
    description:
      'Get state-level pipeline forecast: how many properties are going to market in the next 30 days, grouped by state and suburb. Includes median prices, demand ratios, and confidence levels. Optionally filter by state.',
    input_schema: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Filter by state abbreviation (e.g. "NSW", "VIC"). Omit for national view.' },
      },
    },
  },
  {
    name: 'get_price_corrections',
    description:
      'Get properties most likely to drop their price. Shows overvalued properties where buyers consistently value below asking, sorted by severity. Includes price drop likelihood score and signals.',
    input_schema: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Filter by state abbreviation' },
        limit: { type: 'number', description: 'Max results (default 30, max 100)' },
        threshold: { type: 'number', description: 'Minimum deviation % to include (default -10, e.g. -15 for only severe)' },
      },
    },
  },
  {
    name: 'get_market_corrections',
    description:
      'Get suburbs showing market correction signals — overheated areas where prices may fall. Combines SDB, FPI, PVI, demand momentum, and seller pressure signals into a correction risk score.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 20, max 50)' },
      },
    },
  },
  {
    name: 'get_buyer_competition',
    description:
      'Get buyer competition report for a location. Shows how competitive it is to buy in an area: competition score, level (extreme/high/moderate/low), signals, and actionable recommendation.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_seller_timing',
    description:
      'Get seller timing report for a location. Recommends whether now is a good time to list: timing score, recommendation (list_now/favorable/neutral/wait), positive signals, and risks.',
    input_schema: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
    },
  },
  {
    name: 'get_investment_hotspots',
    description:
      'Get top investment opportunity areas. Finds suburbs with rising demand, buyer-friendly conditions, or undervalued properties. Supports strategy filter: "value", "growth", "yield", or "balanced" (default).',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 20, max 50)' },
        strategy: { type: 'string', description: 'Investment strategy: "value", "growth", "yield", or "balanced" (default)' },
      },
    },
  },
  {
    name: 'get_market_intelligence',
    description:
      'Get the full weekly market intelligence brief. National summary with market direction, top 5 heating/cooling suburbs, pipeline forecast by state, correction risks, pricing insights, and confidence metrics. This is the most comprehensive report available.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

const TOOL_TO_ENDPOINT = {
  get_buyer_score: 'buyer-score',
  get_seller_score: 'seller-score',
  get_market_forecast: 'market-forecast',
  get_trending_areas: 'trending-areas',
  get_historical_trends: 'historical-trends',
  get_property_insights: 'property-insights',
  get_national_overview: 'national-overview',
  get_upcoming_to_market: 'upcoming-to-market',
  get_phi_scores: 'phi-scores',
  get_property_valuation: 'property-valuation',
  get_pipeline_forecast: 'pipeline-forecast',
  get_price_corrections: 'price-corrections',
  get_market_corrections: 'market-corrections',
  get_buyer_competition: 'buyer-competition',
  get_seller_timing: 'seller-timing',
  get_investment_hotspots: 'investment-hotspots',
  get_market_intelligence: 'market-intelligence',
};

const SYSTEM_PROMPT = `You are Premarket's market intelligence assistant. You help users explore Australian property market data using the Premarket API.

You have access to tools that query real property data:
- Buyer scores & sentiment: how much buyer demand exists in an area
- Seller scores & sentiment: how much selling intent exists
- Market forecasts: upcoming listings and price expectations
- Trending areas: which suburbs are heating up
- Historical trends: how scores have changed over time
- Property insights: per-property engagement metrics
- National overview: Australia-wide aggregated market stats
- Upcoming to market: properties likely to sell or go to market soon
- PHI scores: all 8 Premarket Health Indicators for a location
- Property valuation: which properties are overvalued/undervalued
- Pipeline forecast: how many properties going to market by state (next 30 days)
- Price corrections: properties most likely to drop their price
- Market corrections: suburbs showing overheating/correction signals
- Buyer competition: how competitive it is to buy in an area
- Seller timing: whether now is a good time to list in an area
- Investment hotspots: top opportunity areas for investors (value/growth/yield strategies)
- Market intelligence brief: comprehensive weekly market roll-up

PHI (PREMARKET HEALTH INDICATORS):
PHI is our proprietary market intelligence framework with 8 metrics (all 0-100):
- PHI:BDI (Buyer Demand Index) — Real buyer demand from opinions, registrations, likes
- PHI:SMI (Seller Motivation Index) — How eager sellers are to transact
- PHI:PVI (Price Validity Index) — Whether properties are correctly priced (100=perfect pricing)
- PHI:MHI (Market Heat Index) — Composite market activity and momentum
- PHI:EVS (Engagement Velocity Score) — How fast properties attract interest
- PHI:BQI (Buyer Quality Index) — Financial readiness of the buyer pool
- PHI:FPI (Forward Pipeline Index) — Strength of upcoming supply
- PHI:SDB (Supply-Demand Balance) — >50 = seller's market, <50 = buyer's market, 50 = balanced

When discussing PHI scores, use the format "PHI:BDI 78" for individual metrics.
Use get_phi_scores for comprehensive area analysis, get_property_valuation for pricing analysis.

FORECAST REPORTS:
- Use get_pipeline_forecast when asked "how many properties are coming to market in [state]?" or about upcoming supply
- Use get_price_corrections when asked about overpriced properties, likely price drops, or which listings will reduce
- Use get_market_corrections when asked about overheated markets, bubbles, correction risks, or which areas will cool
- Use get_buyer_competition when asked "how competitive is it to buy in [area]?" or about buyer demand vs supply
- Use get_seller_timing when asked "should I sell now?" or "when is the best time to list in [area]?"
- Use get_investment_hotspots when asked "where should I invest?" or about opportunity areas — use the strategy param to match their goal
- Use get_market_intelligence for broad questions like "what's happening in the market?" or "give me the full picture"
These reports are Premarket's competitive edge over CoreLogic — they are forward-looking predictions based on real buyer behavior, not backward-looking sales data.

BUYER SENTIMENT INTERPRETATION:
When asked about "buyer sentiment" or "buyer mood", use the buyer score or PHI tools. Interpret:
- Score 0-20: Very Low — minimal buyer interest, market is cold
- Score 21-40: Low — some interest but buyers are cautious
- Score 41-60: Moderate — healthy buyer interest, balanced market
- Score 61-80: High — strong buyer demand, competitive market
- Score 81-100: Very High — intense buyer demand, hot market

SELLER SENTIMENT INTERPRETATION:
- High eagerSellers = sellers are motivated, possibly under pressure
- High goingToMarket30 = surge in upcoming supply
- High activeProperties = established seller confidence

PVI INTERPRETATION:
- PVI > 80: Area is well-priced — buyers and sellers broadly agree on values
- PVI 50-80: Some pricing misalignment — review individual properties
- PVI < 50: Significant mispricing — many properties overvalued or undervalued

DATA CONFIDENCE:
All PHI responses include a "confidence" field with level (low/medium/high), score (0-100), and warnings.
- High (60+): Sufficient data — scores are reliable.
- Medium (30-59): Some data — treat as directional.
- Low (<30): Limited data — always caveat when presenting.
When confidence is low, mention the limitation. Example: "Note: this area has limited data (3 properties, 2 opinions), so scores are preliminary."

IMPORTANT — Location handling:
When users mention ANY location, pass it as the "location" parameter exactly as they said it. The server will geocode it automatically via Mapbox.
Do NOT try to split locations into separate suburb/state/postcode fields — just use the "location" parameter.

Present data in a clear, conversational way. Highlight key insights. Use numbers and percentages. If data is sparse, mention that results may be limited.

When the API response includes a "resolvedPlace" field, mention it so the user can confirm the right location was matched.`;

async function callPremarketApi(endpoint, params, apiKey) {
  const url = new URL(`/api/v1/${endpoint}`, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': apiKey },
  });

  return res.json();
}

export async function POST(request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Chat not configured' }, { status: 500 });
  }

  // Validate the user's API key
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const userApiKey = auth.user.apiAccess?.apiKey;

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Call Claude with tools — loop to handle tool use
    let currentMessages = [...messages];
    let finalResponse = null;

    for (let turn = 0; turn < 5; turn++) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: currentMessages,
        }),
      });

      if (!claudeRes.ok) {
        const err = await claudeRes.text();
        console.error('Claude API error:', err);
        return NextResponse.json({ error: 'AI service error' }, { status: 502 });
      }

      const claudeData = await claudeRes.json();

      if (claudeData.stop_reason === 'tool_use') {
        // Extract tool use blocks
        const toolUseBlocks = claudeData.content.filter((b) => b.type === 'tool_use');

        // Add assistant message with tool use
        currentMessages.push({ role: 'assistant', content: claudeData.content });

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (toolUse) => {
            const endpoint = TOOL_TO_ENDPOINT[toolUse.name];
            if (!endpoint) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({ error: 'Unknown tool' }),
              };
            }

            try {
              const result = await callPremarketApi(endpoint, toolUse.input, userApiKey);
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              };
            } catch (err) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({ error: 'API call failed' }),
                is_error: true,
              };
            }
          })
        );

        currentMessages.push({ role: 'user', content: toolResults });
      } else {
        // Final text response
        finalResponse = claudeData;
        break;
      }
    }

    if (!finalResponse) {
      return NextResponse.json({ error: 'Max tool turns exceeded' }, { status: 500 });
    }

    // Extract text content
    const text = finalResponse.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return NextResponse.json({ reply: text });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'chat' } });
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
