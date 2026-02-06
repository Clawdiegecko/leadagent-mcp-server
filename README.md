# LeadAgent MCP Server

> **The first agent-native lead generation API** - Built for AI agents, not humans.

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 💰 Launch Special: $49/month

**50% OFF - First 10 customers only**

- 500 leads/month (10x more than "free" tier)
- All features unlocked
- Priority setup assistance
- Cancel anytime

**Email luca@orelis.ai to start TODAY.**

Normal price: $99/month. Launch special ends when 10 slots fill.

---

## What It Does

Turn any industry + location into a qualified lead list with contact info and personalized outreach messages.

**Agent query:** "Find 10 tax consultants in Jakarta"  
**LeadAgent returns:** Real businesses with emails, phones, and ready-to-send messages. JSON. No HTML. No truncation.

## Why Agent-Native?

✅ **MCP-Compatible** - Works with Claude, OpenClaw, any MCP agent  
✅ **Pure JSON** - No HTML parsing needed  
✅ **Full Structured Data** - Every field typed, no truncation  
✅ **Real Contact Info** - Emails, phones from Google Places  
✅ **Pre-Generated Messages** - Personalized outreach included

## Quick Start

### Install

```bash
npm install -g leadagent-mcp-server
```

### Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "leadagent": {
      "command": "leadagent-mcp",
      "env": {
        "LEADAGENT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Get API Key

**Free Tier (Beta):**
Email [luca@orelis.ai](mailto:luca@orelis.ai) with:
- Your project name
- What you're building
- Expected usage

**Response:** Within 24 hours

## Usage Example

```
You: "Find me 10 marketing agencies in Singapore"

Claude: [calls generate_leads tool]

LeadAgent: {
  "leads": [
    {
      "company": "Singapore Marketing Solutions",
      "email": "contact@sms.sg",
      "phone": "+65 1234 5678",
      "message": {
        "email": {
          "subject": "Partnership opportunity",
          "body": "Hi there,\n\nI came across Singapore Marketing Solutions..."
        }
      }
    },
    ...
  ]
}

Claude: "I found 10 marketing agencies. Here's the first one:
        Singapore Marketing Solutions - contact@sms.sg
        I've prepared a personalized email. Want me to send it?"
```

## API

### Tools

#### `generate_leads`

Generate qualified B2B leads for a specific industry and location.

**Parameters:**
- `industry` (string, required) - e.g., "Business Consulting"
- `location` (string, required) - e.g., "Bali"
- `count` (number) - 1-10, default: 5
- `targetRole` (string) - e.g., "Founder", default: "Founder"
- `purpose` (string) - e.g., "business automation"
- `yourWebsite` (string) - For value prop extraction

**Returns:** Campaign ID + array of leads

#### `get_campaign_leads`

Retrieve leads from a previous campaign.

**Parameters:**
- `campaignId` (string, required)

**Returns:** Array of leads with status

## Use Cases

### Autonomous Business Development
```
Agent: "Find 20 potential customers and email them our pitch"
LeadAgent: *generates leads + messages*
Agent: *reviews and sends*
```

### Market Research
```
Agent: "Who are the top fintech companies in Indonesia?"
LeadAgent: *returns structured data*
```

### Partnership Discovery
```
Agent: "Find reseller partners in Southeast Asia"
LeadAgent: *identifies + enriches targets*
```

## Pricing

| Plan | Leads/Month | Price | Best For |
|------|-------------|-------|----------|
| **Free (Beta)** | 50 | $0 | Testing, small projects |
| **Starter** | 1,000 | $99 | Solo developers |
| **Pro** | 5,000 | $299 | Production agents |
| **Enterprise** | Unlimited | Custom | Large-scale |

[Full pricing details](PRICING.md)

## REST API

Don't use MCP? Access via REST API:

```bash
# Create campaign
curl -X POST https://api.leadagent.io/campaign/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"industry": "Tax Consulting", "location": "Jakarta"}'

# Generate leads
curl -X POST https://api.leadagent.io/campaign/{id}/generate-leads \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"count": 10}'
```

**API Base:** `http://157.173.103.136:3334/api` (temporary)  
**Production:** Coming soon

## Technical Details

- **Data Source:** Google Places API
- **Message Generation:** AI-powered personalization
- **Response Time:** 2-10s per lead
- **Rate Limits:** 60 req/min (Free tier)
- **Transport:** MCP stdio + REST

## Comparison

| Task | Manual | LeadAgent |
|------|--------|-----------|
| Find 50 leads | 4 hours | 2 minutes |
| Extract contact info | Manual scraping | Automated |
| Write messages | 10 min/lead | Instant |
| **Total** | **12+ hours** | **< 5 minutes** |

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/orelsai/leadagent-mcp-server)

## Support

- **Email:** luca@orelis.ai
- **Issues:** GitHub Issues
- **MCP Discord:** [Join](https://discord.gg/mcp)

## License

MIT

---

**Built by [Orelis.ai](https://orelis.ai)**  
Making agent development accessible. 🦎
