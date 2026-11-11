import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { z } from 'zod';

export const runtime = 'nodejs';

// Define tools for the Studio AI Agent
const tools = {
  getFinancialSummary: {
    description: 'Fetch real-time financial stats including total revenue, pending balances, overdue invoices, and top clients',
    parameters: z.object({}),
    execute: async () => {
      const db = getDatabase();
      const totalRevenue = db.payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalPending = db.invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
      const overdueInvoices = db.invoices.filter((i) => i.status === 'Overdue');
      const overdueAmount = overdueInvoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

      const clientMap: Record<string, number> = {};
      db.payments.forEach((p) => {
        clientMap[p.clientCompany || p.clientName] = (clientMap[p.clientCompany || p.clientName] || 0) + p.amount;
      });

      const topClients = Object.entries(clientMap)
        .map(([company, amount]) => ({ company, totalPaid: amount }))
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 3);

      return {
        totalRevenueEarned: `₹${totalRevenue.toLocaleString('en-IN')}`,
        totalPendingBalance: `₹${totalPending.toLocaleString('en-IN')}`,
        overdueCount: overdueInvoices.length,
        overdueAmount: `₹${overdueAmount.toLocaleString('en-IN')}`,
        topClients,
      };
    },
  },

  getClients: {
    description: 'Retrieve list of all studio clients with their IDs, companies, active status, and billing balances',
    parameters: z.object({
      filterStatus: z.enum(['Active', 'Inactive', 'All']).optional(),
    }),
    execute: async ({ filterStatus = 'All' }: { filterStatus?: 'Active' | 'Inactive' | 'All' }) => {
      const db = getDatabase();
      let list = db.clients;
      if (filterStatus !== 'All') {
        list = list.filter((c) => c.status === filterStatus);
      }
      return list.map((c) => {
        const clientInvoices = db.invoices.filter((i) => i.clientId === c.id);
        const billed = clientInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
        const paid = clientInvoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
        const balance = clientInvoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
        return {
          clientId: c.clientId,
          name: c.name,
          company: c.companyName,
          industry: c.industry,
          status: c.status,
          totalBilled: `₹${billed.toLocaleString('en-IN')}`,
          totalPaid: `₹${paid.toLocaleString('en-IN')}`,
          balanceDue: `₹${balance.toLocaleString('en-IN')}`,
        };
      });
    },
  },

  getProjects: {
    description: 'Retrieve creative projects, pipelines, deadlines, priorities, and revision usage',
    parameters: z.object({
      status: z.string().optional(),
      clientCompany: z.string().optional(),
    }),
    execute: async ({ status, clientCompany }: { status?: string; clientCompany?: string }) => {
      const db = getDatabase();
      let projs = db.projects;
      if (status) {
        projs = projs.filter((p) => p.status.toLowerCase().includes(status.toLowerCase()));
      }
      if (clientCompany) {
        projs = projs.filter((p) => p.clientCompany.toLowerCase().includes(clientCompany.toLowerCase()));
      }
      return projs.map((p) => ({
        id: p.id,
        title: p.title,
        client: p.clientCompany,
        type: p.type,
        status: p.status,
        priority: p.priority,
        deadline: p.deadline,
        revisionsUsed: `${p.revisionsUsed} of ${p.revisionsAllowed}`,
        budget: `₹${p.quotedAmount.toLocaleString('en-IN')}`,
      }));
    },
  },

  getInvoices: {
    description: 'Retrieve invoices and payment statuses',
    parameters: z.object({
      statusFilter: z.string().optional(),
    }),
    execute: async ({ statusFilter }: { statusFilter?: string }) => {
      const db = getDatabase();
      let invs = db.invoices;
      if (statusFilter) {
        invs = invs.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
      }
      return invs.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        client: i.clientCompany || i.clientName,
        total: `₹${i.total.toLocaleString('en-IN')}`,
        balanceDue: `₹${i.balanceDue.toLocaleString('en-IN')}`,
        status: i.status,
        dueDate: i.dueDate,
      }));
    },
  },

  generateCreativeBrief: {
    description: 'Generate an industry-standard creative brief for video editing, motion design, or visual branding',
    parameters: z.object({
      title: z.string(),
      projectType: z.string(),
      targetAudience: z.string().optional(),
      keyDeliverables: z.array(z.string()).optional(),
    }),
    execute: async ({ title, projectType, targetAudience = 'Tech enthusiasts & modern consumers', keyDeliverables = ['4K Master', '9:16 Social Cutdowns'] }) => {
      return {
        projectTitle: title,
        projectType,
        targetAudience,
        deliverables: keyDeliverables,
        creativeHook: `High-energy visual pacing, dynamic kinetic typography, and polished color grading tailored for ${targetAudience}.`,
        suggestedMilestones: [
          'Brief & Moodboard Alignment (Day 1-2)',
          'Assembly Edit & Audio Rough Cut (Day 3-5)',
          'Color Grade, Motion Graphics & Sound Design (Day 6-8)',
          'Client Review V1 via Review Studio (Day 9)',
          'Final Deliverable Handoff & High-res export (Day 10)',
        ],
      };
    },
  },
};

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { message, history = [] } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const lowerQuery = message.toLowerCase();
    const executedTools: { toolName: string; result: any }[] = [];

    // Check if user has an AI SDK model provider configured
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasGoogle = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);

    if (hasOpenAI || hasGoogle) {
      try {
        const { generateText, tool: aiTool } = await import('ai');
        let model: any;

        if (hasOpenAI) {
          const { openai } = await import('@ai-sdk/openai');
          model = openai('gpt-4o-mini');
        } else {
          const { google } = await import('@ai-sdk/google');
          model = google('gemini-1.5-flash');
        }

        // Convert our tools into AI SDK tools
        const aiSdkTools: Record<string, any> = {};
        for (const [name, def] of Object.entries(tools)) {
          aiSdkTools[name] = aiTool({
            description: def.description,
            inputSchema: def.parameters,
            execute: async (args: any) => {
              const res = await (def.execute as any)(args);
              executedTools.push({ toolName: name, result: res });
              return res;
            },
          });
        }

        const systemPrompt = `You are Vortex AI, the Senior Creative Director & Studio Operations AI Copilot for Vortex Creative Labs (led by Sourav Roy).
Your studio produces high-end graphic design, video editing, motion graphics, and 3D visual campaigns.
You have access to tools that query real CRM data for clients, projects, invoices, and financials.
Always provide crisp, executive, professional answers formatted in Markdown with bullet points, bold highlights, and Indian Rupee (₹) amounts.`;

        const result = await generateText({
          model,
          system: systemPrompt,
          prompt: message,
          tools: aiSdkTools,
        });

        return NextResponse.json({
          reply: result.text,
          executedTools,
          provider: hasOpenAI ? 'OpenAI GPT-4o' : 'Google Gemini',
        });
      } catch (aiErr: any) {
        console.warn('AI SDK provider call failed, falling back to smart studio engine', aiErr);
      }
    }

    // Built-in intelligent fallback agent engine: analyzes intent and executes tools directly
    let responseText = '';

    if (lowerQuery.includes('revenue') || lowerQuery.includes('financial') || lowerQuery.includes('pending') || lowerQuery.includes('earned') || lowerQuery.includes('money')) {
      const fin = await tools.getFinancialSummary.execute();
      executedTools.push({ toolName: 'getFinancialSummary', result: fin });

      responseText = `### 📊 Studio Financial Intelligence Report

- **Total Revenue Collected (All-Time):** **${fin.totalRevenueEarned}**
- **Pending Collections:** **${fin.totalPendingBalance}**
- **Overdue Invoices:** **${fin.overdueCount}** (${fin.overdueAmount} pending settlement)

**Top Revenue Producing Clients:**
${fin.topClients.map((c, i) => `${i + 1}. **${c.company}** — ₹${c.totalPaid.toLocaleString('en-IN')} collected`).join('\n')}

> 💡 **Recommendation:** Follow up on the **${fin.overdueCount} overdue invoices** via WhatsApp or direct portal reminders to unlock ${fin.overdueAmount} in pending cashflow.`;
    } else if (lowerQuery.includes('client') || lowerQuery.includes('who are') || lowerQuery.includes('customer')) {
      const clientList = await tools.getClients.execute({ filterStatus: 'All' });
      executedTools.push({ toolName: 'getClients', result: clientList });

      responseText = `### 👥 Verified Client Roster (${clientList.length} Accounts)

${clientList.map((c) => `- **${c.company}** (${c.name}) • \`${c.clientId}\`
  - Status: **${c.status}** | Billed: ${c.totalBilled} | Balance Due: **${c.balanceDue}**`).join('\n\n')}

All clients have active portal credentials and can review creative deliverables at \`/portal\`.`;
    } else if (lowerQuery.includes('project') || lowerQuery.includes('deadline') || lowerQuery.includes('pipeline') || lowerQuery.includes('work') || lowerQuery.includes('status')) {
      const projList = await tools.getProjects.execute({});
      executedTools.push({ toolName: 'getProjects', result: projList });

      responseText = `### 🎬 Studio Work & Project Pipelines (${projList.length} Active)

${projList.map((p) => `- **${p.title}** (${p.client})
  - **Category:** ${p.type} | **Stage:** \`${p.status}\` | **Priority:** ${p.priority}
  - **Deadline:** ${p.deadline} | **Revisions:** ${p.revisionsUsed} | **Budget:** ${p.budget}`).join('\n\n')}

> ⚡ **Deadline Watch:** Keep an eye on high-priority deliverables due this week in the Kanban board.`;
    } else if (lowerQuery.includes('brief') || lowerQuery.includes('script') || lowerQuery.includes('idea') || lowerQuery.includes('tiktok') || lowerQuery.includes('reel') || lowerQuery.includes('youtube')) {
      const brief = await tools.generateCreativeBrief.execute({
        title: message.slice(0, 50),
        projectType: lowerQuery.includes('reel') ? 'Reel / Shortform Video' : 'Commercial Creative Campaign',
      });
      executedTools.push({ toolName: 'generateCreativeBrief', result: brief });

      responseText = `### 📝 Automated Creative Brief: ${brief.projectTitle}

- **Format:** ${brief.projectType}
- **Target Audience:** ${brief.targetAudience}
- **Creative Direction:** ${brief.creativeHook}

#### Standard Deliverable Scope:
${brief.deliverables.map((d) => `- ${d}`).join('\n')}

#### Proposed Production Milestones:
${brief.suggestedMilestones.map((m) => `- ${m}`).join('\n')}

*Ready to link this brief to a new project in the Studio Command Center.*`;
    } else {
      // General studio copilot response
      const fin = await tools.getFinancialSummary.execute();
      executedTools.push({ toolName: 'getFinancialSummary', result: fin });

      responseText = `### ⚡ Vortex Studio AI Copilot Active

I can help you manage studio operations, analyze client accounts, and generate creative ideas. Here is your current studio snapshot:

- **Active Revenue:** ${fin.totalRevenueEarned} earned | **Pending:** ${fin.totalPendingBalance}
- **Overdue Invoices:** ${fin.overdueCount} requiring action

**What would you like me to do?**
1. *"Show me upcoming project deadlines and active stages"*
2. *"List all clients with outstanding balances"*
3. *"Draft a 30-second video reel creative brief"*
4. *"Summarize overdue invoices and payment reminders"*`;
    }

    return NextResponse.json({
      reply: responseText,
      executedTools,
      provider: 'Vortex AI SDK Studio Engine (Local Tool Execution)',
    });
  } catch (error: any) {
    console.error('Error in AI agent route:', error);
    return NextResponse.json({ error: error.message || 'AI agent execution failed' }, { status: 500 });
  }
}
