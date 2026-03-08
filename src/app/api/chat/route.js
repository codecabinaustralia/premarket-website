import { NextResponse } from 'next/server';
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
  radius: { type: 'number', description: 'Search radius in km (default 5)' },
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
- Upcoming to market: properties likely to sell or go to market soon, grouped by state/suburb

BUYER SENTIMENT INTERPRETATION:
When asked about "buyer sentiment" or "buyer mood", use the buyer score tool. Interpret the breakdown:
- Score 0-20: Very Low sentiment — minimal buyer interest, market is cold
- Score 21-40: Low sentiment — some interest but buyers are cautious
- Score 41-60: Moderate sentiment — healthy buyer interest, balanced market
- Score 61-80: High sentiment — strong buyer demand, competitive market
- Score 81-100: Very High sentiment — intense buyer demand, hot market
Key breakdown signals:
- High seriousBuyers ratio = confident, committed buyers (bullish sentiment)
- High passiveBuyers with low serious = window shoppers (cautious sentiment)
- High seriousnessScore = buyers are actively ready to transact
- High diversityRatio = broad market appeal (healthy sentiment)
- High fhbCount = first-home buyer driven demand
- High investorCount = investment-driven demand

SELLER SENTIMENT INTERPRETATION:
When asked about "seller sentiment" or "seller mood", use the seller score tool. Interpret the breakdown:
- High eagerSellers = sellers are motivated, possibly under pressure
- High goingToMarket30 = surge in upcoming supply
- High activeProperties = established seller confidence
- Low scores overall = sellers are holding, waiting for better conditions

IMPORTANT — Location handling:
When users mention ANY location (suburb, city, address, postcode, region), pass it as the "location" parameter exactly as they said it. The server will geocode it automatically via Mapbox.
Examples:
- "Bondi" → location: "Bondi, NSW, Australia"
- "Sydney CBD" → location: "Sydney CBD, NSW"
- "Melbourne inner east" → location: "Melbourne inner east, VIC"
- "2026" → location: "2026, Australia"
Do NOT try to split locations into separate suburb/state/postcode fields — just use the "location" parameter.

Present data in a clear, conversational way. Highlight key insights. Use numbers and percentages when relevant. If a score is low, explain what that means practically. If data is sparse, mention that results may be limited.

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
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
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

        // Execute each tool call and build results
        const toolResults = [];
        for (const toolUse of toolUseBlocks) {
          const endpoint = TOOL_TO_ENDPOINT[toolUse.name];
          if (!endpoint) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ error: 'Unknown tool' }),
            });
            continue;
          }

          try {
            const result = await callPremarketApi(endpoint, toolUse.input, userApiKey);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ error: 'API call failed' }),
              is_error: true,
            });
          }
        }

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
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
