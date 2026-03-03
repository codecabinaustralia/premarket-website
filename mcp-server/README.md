# Premarket MCP Server

An MCP (Model Context Protocol) server that provides conversational access to Premarket's Market Intelligence API.

## Setup

```bash
cd mcp-server
npm install
```

## Environment Variables

| Variable | Description |
|---|---|
| `PREMARKET_API_URL` | Base URL (default: `https://premarket.homes`) |
| `PREMARKET_API_KEY` | Your Premarket API key (required) |

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "premarket": {
      "command": "node",
      "args": ["/path/to/premarket-website/mcp-server/index.js"],
      "env": {
        "PREMARKET_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|---|---|
| `get_buyer_score` | Buyer intent score (0-100) for a location |
| `get_seller_score` | Seller intent score (0-100) for a location |
| `get_market_forecast` | Properties going to market, expected prices |
| `get_trending_areas` | Top trending areas by buyer activity |
| `get_historical_trends` | Buyer/seller score trends over time |
| `get_property_insights` | Per-property views, opinions, likes |

## Example Queries

- "What is the buyer score for Bondi, NSW?"
- "What are the trending areas in Australia?"
- "How many homes are going to market next month in Sydney?"
- "Show me property insights for Melbourne CBD"
