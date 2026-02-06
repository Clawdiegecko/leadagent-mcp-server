#!/usr/bin/env node
/**
 * LeadAgent MCP Server
 * 
 * Exposes lead generation capabilities to AI agents via MCP protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

const API_BASE = 'http://localhost:3334';

class LeadAgentMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'leadagent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_leads',
          description: 'Generate qualified B2B leads for a specific industry and location. Returns real businesses with contact info and personalized outreach messages.',
          inputSchema: {
            type: 'object',
            properties: {
              industry: {
                type: 'string',
                description: 'Target industry (e.g., "Business Consulting", "Tax Offices", "Marketing Agencies")',
              },
              location: {
                type: 'string',
                description: 'Geographic location (e.g., "Bali", "Jakarta", "Singapore")',
              },
              count: {
                type: 'number',
                description: 'Number of leads to generate (1-10)',
                default: 5,
              },
              targetRole: {
                type: 'string',
                description: 'Target decision maker role (e.g., "Founder", "CEO", "Director")',
                default: 'Founder',
              },
              purpose: {
                type: 'string',
                description: 'Purpose of outreach (e.g., "business automation", "lead generation services")',
                default: 'partnership opportunity',
              },
              yourWebsite: {
                type: 'string',
                description: 'Your website URL for value prop extraction (optional)',
              },
            },
            required: ['industry', 'location'],
          },
        },
        {
          name: 'get_campaign_leads',
          description: 'Retrieve all leads from a previously created campaign by campaign ID.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: {
                type: 'string',
                description: 'Campaign ID from generate_leads response',
              },
            },
            required: ['campaignId'],
          },
        },
        {
          name: 'export_leads_csv',
          description: 'Export leads to CSV format for easy import into CRM, spreadsheets, or email tools.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: {
                type: 'string',
                description: 'Campaign ID to export leads from',
              },
              includeMessages: {
                type: 'boolean',
                description: 'Include personalized outreach messages in export',
                default: false,
              },
            },
            required: ['campaignId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_leads':
            return await this.generateLeads(args);
          case 'get_campaign_leads':
            return await this.getCampaignLeads(args);
          case 'export_leads_csv':
            return await this.exportLeadsCSV(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async generateLeads(args) {
    const {
      industry,
      location,
      count = 5,
      targetRole = 'Founder',
      purpose = 'partnership opportunity',
      yourWebsite,
    } = args;

    // Create campaign
    const campaignRes = await axios.post(`${API_BASE}/api/campaign/create`, {
      userId: 'mcp_agent',
      industry,
      targetRole,
      location,
      purpose,
      tone: 'professional',
      targetCount: count,
      website: yourWebsite,
    });

    const campaign = campaignRes.data.campaign;

    // Generate leads
    const leadsRes = await axios.post(
      `${API_BASE}/api/campaign/${campaign.id}/generate-leads`,
      { count }
    );

    const leads = leadsRes.data.leads;

    // Format response for agent consumption
    const formattedLeads = leads.map((lead) => ({
      company: lead.company,
      contactName: lead.name,
      role: lead.role,
      email: lead.email,
      phone: lead.phone,
      website: lead.companyWebsite,
      description: lead.companyDescription,
      score: lead.score,
      outreach: {
        whatsapp: lead.message.whatsapp,
        email: {
          subject: lead.message.email.subject,
          body: lead.message.email.body,
        },
      },
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              campaignId: campaign.id,
              industry,
              location,
              leadsGenerated: formattedLeads.length,
              leads: formattedLeads,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getCampaignLeads(args) {
    const { campaignId } = args;

    const res = await axios.get(`${API_BASE}/api/campaign/${campaignId}/leads`);
    const leads = res.data.leads;

    const formattedLeads = leads.map((lead) => ({
      company: lead.company,
      contactName: lead.name,
      role: lead.role,
      email: lead.email,
      phone: lead.phone,
      website: lead.companyWebsite,
      status: lead.status,
      sentVia: lead.sentVia,
      sentAt: lead.sentAt,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              campaignId,
              totalLeads: formattedLeads.length,
              leads: formattedLeads,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async exportLeadsCSV(args) {
    const { campaignId, includeMessages = false } = args;

    const res = await axios.get(`${API_BASE}/api/campaign/${campaignId}/leads`);
    const leads = res.data.leads;

    // CSV header
    let csv = includeMessages
      ? 'Company,Contact Name,Role,Email,Phone,Website,Description,Score,WhatsApp Message,Email Subject,Email Body\n'
      : 'Company,Contact Name,Role,Email,Phone,Website,Description,Score\n';

    // CSV rows
    leads.forEach((lead) => {
      const row = [
        this.csvEscape(lead.company),
        this.csvEscape(lead.name),
        this.csvEscape(lead.role),
        this.csvEscape(lead.email),
        this.csvEscape(lead.phone),
        this.csvEscape(lead.companyWebsite),
        this.csvEscape(lead.companyDescription),
        lead.score,
      ];

      if (includeMessages && lead.message) {
        row.push(
          this.csvEscape(lead.message.whatsapp),
          this.csvEscape(lead.message.email.subject),
          this.csvEscape(lead.message.email.body)
        );
      }

      csv += row.join(',') + '\n';
    });

    return {
      content: [
        {
          type: 'text',
          text: `CSV Export Ready (${leads.length} leads)\n\nSave this as leads.csv:\n\n${csv}`,
        },
      ],
    };
  }

  csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LeadAgent MCP server running on stdio');
  }
}

const server = new LeadAgentMCPServer();
server.run().catch(console.error);
