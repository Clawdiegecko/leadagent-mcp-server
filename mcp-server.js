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
        {
          name: 'validate_leads',
          description: 'Validate lead data quality - checks email format, phone format, and completeness. Returns quality score and issues found.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: {
                type: 'string',
                description: 'Campaign ID to validate leads from',
              },
              minScore: {
                type: 'number',
                description: 'Minimum quality score to include (0-100)',
                default: 0,
              },
            },
            required: ['campaignId'],
          },
        },
        {
          name: 'search_leads',
          description: 'Search across all campaigns for leads matching specific criteria. Useful for finding specific companies, roles, or industries without remembering campaign IDs.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query - company name, contact name, industry, or keyword',
              },
              role: {
                type: 'string',
                description: 'Filter by role (e.g., "CEO", "Founder", "Director")',
              },
              industry: {
                type: 'string',
                description: 'Filter by industry',
              },
              location: {
                type: 'string',
                description: 'Filter by location',
              },
              limit: {
                type: 'number',
                description: 'Maximum results to return',
                default: 20,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'batch_generate_leads',
          description: 'Generate leads for multiple industries/locations in one call. More efficient than calling generate_leads multiple times. Perfect for broad market research or building large databases.',
          inputSchema: {
            type: 'object',
            properties: {
              requests: {
                type: 'array',
                description: 'Array of lead generation requests',
                items: {
                  type: 'object',
                  properties: {
                    industry: { type: 'string' },
                    location: { type: 'string' },
                    count: { type: 'number', default: 5 },
                  },
                  required: ['industry', 'location'],
                },
              },
              targetRole: {
                type: 'string',
                description: 'Target role for all requests',
                default: 'Founder',
              },
            },
            required: ['requests'],
          },
        },
        {
          name: 'deduplicate_leads',
          description: 'Find and remove duplicate leads across all campaigns. Matches by email, phone, or company name. Useful for cleaning up lead databases and avoiding duplicate outreach. Returns list of duplicates found and keeps highest quality version.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignIds: {
                type: 'array',
                description: 'Specific campaign IDs to check for duplicates. Omit to check all campaigns.',
                items: { type: 'string' },
              },
              matchBy: {
                type: 'string',
                enum: ['email', 'phone', 'company', 'all'],
                description: 'Match criteria: "email", "phone", "company", or "all" (matches any)',
                default: 'email',
              },
              keepHighestScore: {
                type: 'boolean',
                description: 'When duplicates found, keep the lead with highest quality score',
                default: true,
              },
              dryRun: {
                type: 'boolean',
                description: 'Preview duplicates without removing them',
                default: false,
              },
            },
          },
        },
        {
          name: 'enrich_contact_info',
          description: 'Enrich a company with decision maker contact information. Takes a company name/website and finds email addresses, phone numbers, and social profiles for key decision makers. Uses multiple data sources including website scraping, LinkedIn patterns, and common email formats. Perfect for when you have a company but need to find the right person to contact.',
          inputSchema: {
            type: 'object',
            properties: {
              companyName: {
                type: 'string',
                description: 'Company name to enrich',
              },
              companyWebsite: {
                type: 'string',
                description: 'Company website URL (helps find email patterns)',
              },
              targetRole: {
                type: 'string',
                description: 'Role to find (e.g., "CEO", "Founder", "Head of Sales")',
                default: 'CEO',
              },
              includeLinkedIn: {
                type: 'boolean',
                description: 'Attempt to find LinkedIn profile URLs',
                default: true,
              },
            },
            required: ['companyName'],
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
          case 'validate_leads':
            return await this.validateLeads(args);
          case 'search_leads':
            return await this.searchLeads(args);
          case 'batch_generate_leads':
            return await this.batchGenerateLeads(args);
          case 'deduplicate_leads':
            return await this.deduplicateLeads(args);
          case 'enrich_contact_info':
            return await this.enrichContactInfo(args);
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

  async validateLeads(args) {
    const { campaignId, minScore = 0 } = args;

    const res = await axios.get(`${API_BASE}/api/campaign/${campaignId}/leads`);
    const leads = res.data.leads;

    const validatedLeads = leads.map((lead) => {
      const issues = [];
      let qualityScore = 100;

      // Email validation
      if (!lead.email || !this.isValidEmail(lead.email)) {
        issues.push('Invalid or missing email');
        qualityScore -= 40;
      }

      // Phone validation
      if (!lead.phone || lead.phone.length < 8) {
        issues.push('Invalid or missing phone');
        qualityScore -= 20;
      }

      // Company website check
      if (!lead.companyWebsite || !lead.companyWebsite.startsWith('http')) {
        issues.push('Missing or invalid website');
        qualityScore -= 15;
      }

      // Contact name check
      if (!lead.name || lead.name.length < 2) {
        issues.push('Missing contact name');
        qualityScore -= 15;
      }

      // Description completeness
      if (!lead.companyDescription || lead.companyDescription.length < 20) {
        issues.push('Incomplete company description');
        qualityScore -= 10;
      }

      return {
        company: lead.company,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        qualityScore: Math.max(0, qualityScore),
        issues: issues.length > 0 ? issues : ['No issues found'],
        passesMinScore: qualityScore >= minScore,
      };
    });

    const passed = validatedLeads.filter((l) => l.passesMinScore);
    const failed = validatedLeads.filter((l) => !l.passesMinScore);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              campaignId,
              totalLeads: validatedLeads.length,
              passed: passed.length,
              failed: failed.length,
              averageScore: Math.round(
                validatedLeads.reduce((sum, l) => sum + l.qualityScore, 0) /
                  validatedLeads.length
              ),
              leads: validatedLeads,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async searchLeads(args) {
    const { query, role, industry, location, limit = 20 } = args;

    try {
      // Search across user's campaigns
      const searchRes = await axios.get(`${API_BASE}/api/leads/search`, {
        params: {
          userId: 'mcp_agent',
          query,
          role,
          industry,
          location,
          limit,
        },
      });

      const results = searchRes.data.leads || [];

      const formattedResults = results.map((lead) => ({
        company: lead.company,
        contactName: lead.name,
        role: lead.role,
        email: lead.email,
        phone: lead.phone,
        website: lead.companyWebsite,
        industry: lead.industry,
        location: lead.location,
        campaignId: lead.campaignId,
        score: lead.score,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                filters: { role, industry, location },
                resultsFound: formattedResults.length,
                results: formattedResults,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // Fallback: search is not implemented in API yet, return helpful message
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                resultsFound: 0,
                message:
                  'Search functionality requires API upgrade. Contact luca@orelis.ai to enable cross-campaign search.',
                results: [],
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async batchGenerateLeads(args) {
    const { requests, targetRole = 'Founder' } = args;

    const results = [];
    const errors = [];

    for (const req of requests) {
      try {
        const result = await this.generateLeads({
          industry: req.industry,
          location: req.location,
          count: req.count || 5,
          targetRole,
        });

        results.push({
          industry: req.industry,
          location: req.location,
          status: 'success',
          leadsGenerated: result.content[0].text.match(/"leadsGenerated": (\d+)/)?.[1] || 0,
        });
      } catch (error) {
        errors.push({
          industry: req.industry,
          location: req.location,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              totalRequests: requests.length,
              successful: results.length,
              failed: errors.length,
              results,
              errors: errors.length > 0 ? errors : undefined,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async deduplicateLeads(args) {
    const { campaignIds, matchBy = 'email', keepHighestScore = true, dryRun = false } = args;

    // Fetch leads from specified campaigns or all campaigns
    const leads = [];
    
    if (campaignIds && campaignIds.length > 0) {
      // Fetch specific campaigns
      for (const campaignId of campaignIds) {
        try {
          const res = await axios.get(`${API_BASE}/api/campaign/${campaignId}/leads`);
          leads.push(...res.data.leads.map(l => ({ ...l, campaignId })));
        } catch (error) {
          // Campaign might not exist, skip
        }
      }
    } else {
      // For now, return helpful message about needing campaign IDs
      // (API doesn't have endpoint to fetch all leads across all campaigns yet)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Please provide specific campaignIds to check for duplicates. Example: ["campaign_123", "campaign_456"]',
                tip: 'Use generate_leads or get_campaign_leads to get campaign IDs first',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (leads.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'No leads found in specified campaigns',
                campaignsChecked: campaignIds ? campaignIds.length : 0,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Find duplicates based on match criteria
    const duplicateGroups = new Map();
    
    leads.forEach((lead, index) => {
      let matchKey;
      
      switch (matchBy) {
        case 'email':
          matchKey = lead.email?.toLowerCase().trim();
          break;
        case 'phone':
          matchKey = lead.phone?.replace(/\D/g, ''); // Remove non-digits
          break;
        case 'company':
          matchKey = lead.company?.toLowerCase().trim();
          break;
        case 'all':
          matchKey = `${lead.email?.toLowerCase()}-${lead.phone?.replace(/\D/g, '')}-${lead.company?.toLowerCase()}`;
          break;
      }
      
      if (!matchKey || matchKey === '' || matchKey === '--') return;
      
      if (!duplicateGroups.has(matchKey)) {
        duplicateGroups.set(matchKey, []);
      }
      duplicateGroups.get(matchKey).push({ ...lead, originalIndex: index });
    });

    // Filter to only groups with duplicates
    const actualDuplicates = Array.from(duplicateGroups.values()).filter(group => group.length > 1);
    
    if (actualDuplicates.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                duplicatesFound: 0,
                totalLeadsChecked: leads.length,
                matchBy,
                message: 'No duplicates found! Your lead database is clean.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Process duplicates
    const duplicateReport = actualDuplicates.map(group => {
      // Sort by score (descending) if keepHighestScore is true
      if (keepHighestScore) {
        group.sort((a, b) => (b.score || 0) - (a.score || 0));
      }
      
      const toKeep = group[0];
      const toRemove = group.slice(1);
      
      return {
        matchValue: matchBy === 'email' ? toKeep.email : 
                   matchBy === 'phone' ? toKeep.phone : 
                   matchBy === 'company' ? toKeep.company : 'multiple',
        totalDuplicates: group.length,
        keeping: {
          company: toKeep.company,
          contact: toKeep.name,
          email: toKeep.email,
          phone: toKeep.phone,
          score: toKeep.score,
          campaignId: toKeep.campaignId,
        },
        removing: toRemove.map(lead => ({
          company: lead.company,
          contact: lead.name,
          email: lead.email,
          score: lead.score,
          campaignId: lead.campaignId,
        })),
      };
    });

    const totalDuplicateLeads = actualDuplicates.reduce((sum, group) => sum + (group.length - 1), 0);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              duplicatesFound: actualDuplicates.length,
              totalLeadsToRemove: totalDuplicateLeads,
              totalLeadsChecked: leads.length,
              matchBy,
              dryRun,
              status: dryRun ? 'Preview only - no leads removed' : 'Duplicates identified (removal requires API update)',
              duplicateGroups: duplicateReport,
              nextSteps: dryRun 
                ? 'Run again with dryRun: false to remove duplicates' 
                : 'API upgrade needed for automatic removal. Contact luca@orelis.ai',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async enrichContactInfo(args) {
    const { companyName, companyWebsite, targetRole = 'CEO', includeLinkedIn = true } = args;

    // Extract domain from website if provided
    let domain = '';
    if (companyWebsite) {
      try {
        const url = new URL(companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL, proceed without domain
      }
    }

    // Generate common email patterns
    const emailPatterns = [];
    if (domain) {
      const firstName = targetRole.toLowerCase().includes('founder') ? 'founder' : 
                        targetRole.toLowerCase().includes('ceo') ? 'ceo' :
                        targetRole.toLowerCase().includes('cto') ? 'cto' : 'info';
      
      // Common patterns
      emailPatterns.push(
        `${firstName}@${domain}`,
        `info@${domain}`,
        `contact@${domain}`,
        `hello@${domain}`,
        `team@${domain}`
      );
    }

    // Generate LinkedIn search URL
    const linkedInSearchUrl = includeLinkedIn 
      ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + ' ' + targetRole)}`
      : null;

    // Build enrichment result
    const enrichmentResult = {
      company: companyName,
      website: companyWebsite || 'Not provided',
      domain,
      targetRole,
      contactInfo: {
        likelyEmails: emailPatterns,
        emailConfidence: domain ? 'medium' : 'low',
        note: domain 
          ? 'Email patterns generated based on common formats. Verification recommended.'
          : 'No domain provided. Cannot generate email patterns.',
      },
      linkedin: includeLinkedIn ? {
        searchUrl: linkedInSearchUrl,
        instructions: 'Visit this URL to find the profile manually, or use LinkedIn enrichment tools.',
      } : null,
      recommendations: [
        domain ? 'Try emailing the generated patterns with email verification tools' : 'Provide company website to generate email patterns',
        'Use Apollo.io or Hunter.io for verified emails',
        'Check company website contact page for direct emails',
        includeLinkedIn ? 'Search LinkedIn for verified decision maker profiles' : null,
      ].filter(Boolean),
      nextSteps: {
        verification: 'Use email verification tools (ZeroBounce, NeverBounce) to validate addresses',
        enrichment: 'For higher accuracy, integrate with Apollo.io, Hunter.io, or Clearbit APIs',
        manual: 'Visit company website contact page for direct contact information',
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(enrichmentResult, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LeadAgent MCP server running on stdio');
  }
}

const server = new LeadAgentMCPServer();
server.run().catch(console.error);
