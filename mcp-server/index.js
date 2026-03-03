#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = process.env.PREMARKET_API_URL || 'https://premarket.homes';
const API_KEY = process.env.PREMARKET_API_KEY;

if (!API_KEY) {
  console.error('PREMARKET_API_KEY environment variable is required');
  process.exit(1);
}

async function callApi(endpoint, params = {}) {
  const url = new URL(`/api/v1/${endpoint}`, API_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API returned ${res.status}`);
  }

  return res.json();
}

// Location parameters shared by most tools.
// `location` is a freeform string that the server geocodes via Mapbox.
// suburb/state/postcode/lat/lng are optional structured alternatives.
const locationParams = {
  location: z
    .string()
    .describe(
      'Freeform location string that will be geocoded, e.g. "Bondi Beach, NSW", "Sydney CBD", "Melbourne 3000". This is the preferred way to specify a location.'
    ),
  suburb: z.string().optional().describe('Suburb name (e.g. "Bondi") — optional if location is provided'),
  state: z.string().optional().describe('State abbreviation (e.g. "NSW") — optional if location is provided'),
  postcode: z.string().optional().describe('Postcode (e.g. "2026") — optional if location is provided'),
  lat: z.number().optional().describe('Latitude — optional, overrides geocoding'),
  lng: z.number().optional().describe('Longitude — optional, overrides geocoding'),
  radius: z.number().optional().default(5).describe('Search radius in km (default 5)'),
  country: z.string().optional().default('AU').describe('Country code (default "AU")'),
};

const server = new McpServer({
  name: 'premarket',
  version: '1.0.0',
});

// ─── Tools ──────────────────────────────────────────────────────────────────

server.tool(
  'get_buyer_score',
  'Get the buyer intent score (0-100) for a location. Measures buyer demand based on price opinions, serious buyers, likes, and buyer diversity. Pass any location string (e.g. "Bondi, NSW") and it will be geocoded automatically.',
  locationParams,
  async (params) => {
    const data = await callApi('buyer-score', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'get_seller_score',
  'Get the seller intent score (0-100) for a location. Measures selling activity based on active properties, go-to-market timelines, and seller eagerness. Pass any location string and it will be geocoded automatically.',
  locationParams,
  async (params) => {
    const data = await callApi('seller-score', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'get_market_forecast',
  'Get market forecast for a location. Shows how many properties are going to market next month, expected prices, and demand indicators. Pass any location string and it will be geocoded automatically.',
  locationParams,
  async (params) => {
    const data = await callApi('market-forecast', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'get_trending_areas',
  'Get the top trending areas ranked by growth in buyer activity. Compares last 30 days vs prior 30 days.',
  {
    limit: z.number().optional().default(10).describe('Number of areas to return (max 50)'),
    country: z.string().optional().default('AU').describe('Country code (default "AU")'),
  },
  async (params) => {
    const data = await callApi('trending-areas', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'get_historical_trends',
  'Get historical buyer and seller score trends over past months for a location. Pass any location string and it will be geocoded automatically.',
  {
    ...locationParams,
    months: z.number().optional().default(6).describe('Number of months of history (max 12)'),
  },
  async (params) => {
    const data = await callApi('historical-trends', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'get_property_insights',
  'Get per-property insights for an area including views, opinions count, serious buyers, median opinion, and price vs opinion gap. Pass any location string and it will be geocoded automatically.',
  locationParams,
  async (params) => {
    const data = await callApi('property-insights', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Start ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
