# WhatsApp Template Messages - Complete Guide

## Why Templates Are Required

WhatsApp Business API enforces a **24-hour messaging window** rule:
- You can only send free-form messages to users who messaged you in the last 24 hours
- For **cold outreach to new prospects**, you MUST use approved templates
- Once they reply to your template → 24-hour window opens → autonomous conversation begins

## How LeadAgent Uses Templates

```
COLD OUTREACH FLOW:
1. send_whatsapp_template() → Sends approved template to new lead
2. Lead replies → Opens 24-hour window
3. configure_conversation_handler() → Autonomous AI takes over
4. Lead gets qualified via BANT framework
5. Demo gets booked automatically
```

---

## Step 1: Create Template in Meta Business Manager

### Access Templates
1. Go to https://business.facebook.com/wa/manage/message-templates/
2. Select your WhatsApp Business Account
3. Click "Create Template"

### Template Structure

**Example: B2B Lead Generation Template**

```
Name: lead_gen_intro_v1
Category: UTILITY
Language: English

--- HEADER (optional) ---
None (keep simple for faster approval)

--- BODY (required) ---
Hi {{1}}, 

I came across {{2}} while researching {{3}}.

We help companies generate qualified B2B leads in seconds instead of spending days on manual prospecting.

Interested in learning more? Reply YES for details or STOP to opt out.

--- FOOTER (optional) ---
Powered by LeadAgent

--- BUTTONS (optional) ---
[Quick Reply] YES
[Quick Reply] Tell me more
[Quick Reply] STOP
```

**Parameters:**
- {{1}} = Contact first name
- {{2}} = Company name
- {{3}} = Their industry/pain point

### Meta Approval Guidelines

✅ **What Gets Approved:**
- Clear value proposition
- Opt-out instructions (STOP)
- Business utility (not promotional)
- Personalized but not spammy
- Professional tone

❌ **What Gets Rejected:**
- Promotional offers ("50% off!")
- Aggressive sales language
- Missing opt-out instructions
- Misleading content
- Shortened URLs
- Personal medical/financial advice

### Approval Time
- Usually 1-2 business days
- Can take up to 7 days for first template
- Faster once you have an approval history

---

## Step 2: Use Template in LeadAgent

Once approved, use the MCP tool:

```javascript
send_whatsapp_template({
  phoneNumberId: '885843791290064',
  accessToken: 'YOUR_TOKEN',
  to: '+31612345678',
  templateName: 'lead_gen_intro_v1',
  templateLanguage: 'en',
  parameters: [
    'John',              // {{1}} - First name
    'Acme Corp',         // {{2}} - Company
    'SaaS lead generation' // {{3}} - Industry/pain point
  ],
  campaignId: 'campaign_123',  // optional
  leadEmail: 'john@acme.com'   // optional
})
```

**Result:**
WhatsApp sends to John:
> "Hi John,
>
> I came across Acme Corp while researching SaaS lead generation.
>
> We help companies generate qualified B2B leads in seconds instead of spending days on manual prospecting.
>
> Interested in learning more? Reply YES for details or STOP to opt out."

---

## Step 3: Prospect Replies → Autonomous Conversation

Once John replies "YES":
1. 24-hour window opens
2. LeadAgent autonomous handler activates
3. AI qualifies John using BANT framework
4. Answers questions, handles objections
5. Books demo when qualified

**No human intervention needed** unless escalation triggers fire.

---

## Template Examples by Use Case

### Template 1: SaaS Product Demo
```
Name: saas_demo_offer
Category: UTILITY

Body:
Hi {{1}},

{{2}} looks like a great fit for {{3}}.

We've helped similar companies {{4}}.

Would you like a quick demo? Reply YES or STOP to opt out.
```

**Usage:**
```javascript
parameters: [
  'Sarah',
  'Your company (TechCorp)',
  'AI-powered lead generation',
  'increase qualified leads by 300%'
]
```

---

### Template 2: Partnership Inquiry
```
Name: partnership_inquiry
Category: UTILITY

Body:
Hi {{1}},

I noticed {{2}} serves {{3}}.

We're looking to partner with companies in your space to offer {{4}} to your clients.

Interested in exploring? Reply YES or STOP.
```

**Usage:**
```javascript
parameters: [
  'Michael',
  'your agency (GrowthCo)',
  'B2B SaaS companies',
  'white-label lead generation'
]
```

---

### Template 3: Industry Research
```
Name: industry_research
Category: UTILITY

Body:
Hi {{1}},

We're conducting research on {{2}} in the {{3}} industry.

Would you be open to a 10-minute conversation about your current {{4}} process?

Reply YES for more info or STOP to opt out.
```

**Usage:**
```javascript
parameters: [
  'Lisa',
  'lead generation challenges',
  'ecommerce',
  'customer acquisition'
]
```

---

## Template Best Practices

### 1. Keep It Short
- ≤ 1024 characters total
- 2-3 paragraphs max
- One clear CTA

### 2. Personalize
- Use recipient name ({{1}})
- Reference their company ({{2}})
- Mention specific pain point ({{3}})

### 3. Provide Value First
- ❌ "Buy our product now!"
- ✅ "We've helped companies like yours solve X"

### 4. Always Include Opt-Out
- "Reply STOP to opt out"
- Required for compliance
- Shows respect for recipient

### 5. Test Parameters
- Before bulk sending, test with 1-2 contacts
- Verify parameter order matches template
- Check message renders correctly

---

## Common Errors & Solutions

### Error: "Template not found"
**Cause:** Template name misspelled or not approved yet
**Fix:** Check exact name in Meta Business Manager

### Error: "Invalid parameter count"
**Cause:** Wrong number of parameters
**Fix:** Match parameter count to {{1}}, {{2}}, {{3}} in template

### Error: "Template language mismatch"
**Cause:** Template created in different language
**Fix:** Use correct language code (en, en_US, id, nl, etc.)

### Error: "Cannot send to this phone number"
**Cause:** Number not on WhatsApp or blocked you
**Fix:** Verify number is active WhatsApp user

### Error: "Access token expired"
**Cause:** Token needs refresh
**Fix:** Generate new token in Meta Business settings

---

## Advanced: Multiple Languages

Create same template in multiple languages:

```javascript
// English version
send_whatsapp_template({
  templateName: 'lead_gen_intro_v1',
  templateLanguage: 'en',
  parameters: ['John', 'Acme Corp', 'B2B leads']
})

// Dutch version
send_whatsapp_template({
  templateName: 'lead_gen_intro_v1',
  templateLanguage: 'nl',
  parameters: ['John', 'Acme Corp', 'B2B leads']
})

// Indonesian version
send_whatsapp_template({
  templateName: 'lead_gen_intro_v1',
  templateLanguage: 'id',
  parameters: ['John', 'Acme Corp', 'B2B leads']
})
```

Meta will deliver in recipient's preferred language if available.

---

## Compliance & Best Practices

### Do's:
✅ Get explicit consent before first message (use website opt-in)
✅ Honor opt-outs immediately
✅ Keep messages relevant and valuable
✅ Track response rates and adjust
✅ Use templates that got approved before

### Don'ts:
❌ Buy phone number lists (high spam rate)
❌ Send multiple templates to same person in 24h
❌ Use templates for promotional spam
❌ Ignore opt-out requests
❌ Share templates between different businesses

### Quality Rating
WhatsApp tracks your account quality:
- **High quality:** Can send more messages
- **Medium quality:** Some limits apply
- **Low quality:** Severe restrictions
- **Flagged:** Account may be banned

Maintain high quality by:
- Only messaging interested prospects
- Quick opt-out compliance
- Relevant, valuable content
- Low block/report rates

---

## Workflow Integration

### Complete LeadAgent + WhatsApp Flow

```javascript
// 1. Generate leads
const leads = await generate_leads({
  industry: 'SaaS',
  location: 'Netherlands',
  count: 50
});

// 2. Prioritize (get hot leads)
const prioritized = await prioritize_leads({
  campaignId: leads.campaignId,
  sortBy: 'priority',
  limit: 20
});

// 3. Send template to top 20
for (const lead of prioritized.topLeads) {
  await send_whatsapp_template({
    phoneNumberId: 'YOUR_PHONE_ID',
    accessToken: 'YOUR_TOKEN',
    to: lead.phone,
    templateName: 'lead_gen_intro_v1',
    templateLanguage: 'en',
    parameters: [
      lead.contactName,
      lead.company,
      lead.industry
    ],
    campaignId: leads.campaignId,
    leadEmail: lead.email
  });
  
  // Wait 2-3 seconds between sends (rate limiting)
  await sleep(2000);
}

// 4. Autonomous handler takes over when they reply
// No additional code needed - just replies automatically!
```

---

## Cost Considerations

**WhatsApp Business Pricing:**
- Template messages: ~$0.005 - $0.02 per message (varies by country)
- Conversation initiated by business: ~$0.05 per conversation
- Conversation initiated by user: FREE

**LeadAgent ROI:**
- Traditional: $1-5 per lead (manual outreach)
- LeadAgent + WhatsApp templates: $0.02 + automation = ~$0.10 total per qualified lead
- **50x cost reduction**

---

## Monitoring & Optimization

### Track These Metrics:
- Template delivery rate (aim for >95%)
- Reply rate (good = >10%)
- Opt-out rate (keep <2%)
- Conversation-to-demo conversion (aim for >20%)

### A/B Test:
- Different value propositions
- Various CTAs (YES vs "Tell me more")
- Personalization levels
- Send timing (morning vs afternoon)

### Iterate:
- Create new templates based on winners
- Retire low-performing templates
- Keep improving based on data

---

**With templates + LeadAgent, you have the ONLY fully automated, compliant WhatsApp cold outreach system.** 🚀
