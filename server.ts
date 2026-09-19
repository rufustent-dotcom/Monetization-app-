import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { AgentSkill, PurchaseRecord, UserSession, ExecutionRecord, AnalyticsData, ApiStatus } from "./src/types";

// Fallback user session - initialized with Rufus Tent credentials
let userDb: UserSession = {
  username: "rufus_tent",
  name: "Rufus Tent",
  email: "rufustent@gmail.com",
  merchantName: "Rufus Tent",
  merchantEmail: "rufustent@gmail.com",
  businessName: "Rufus Tent AI Solutions",
  stripeAccountId: "acct_rufus_tent_live_884",
  paypalMerchantId: "rufustent@gmail.com",
  isPremium: false,
  purchasedSkills: []
};

// Initial historical data for analytics display with Rufus Tent merchant credentials
let purchases: PurchaseRecord[] = [
  { id: "p-001", username: "dev_alpha", userName: "Dev Alpha", userEmail: "alpha@clouddev.io", skillId: "financial-forecaster", amount: 19.00, paymentMethod: "stripe", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-15T10:30:00Z" },
  { id: "p-002", username: "rufus_tent", userName: "Rufus Tent", userEmail: "rufustent@gmail.com", skillId: "copywriting-assistant", amount: 9.00, paymentMethod: "paypal", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-16T14:20:00Z" },
  { id: "p-003", username: "sql_master", userName: "SQL Master", userEmail: "sql@datapipe.org", skillId: "sql-wizard", amount: 15.00, paymentMethod: "stripe", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-17T09:15:00Z" },
  { id: "p-004", username: "saas_builder", userName: "SaaS Founder", userEmail: "founder@venture.co", skillId: "financial-forecaster", amount: 19.00, paymentMethod: "stripe", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-18T16:45:00Z" },
  { id: "p-005", username: "rufus_tent", userName: "Rufus Tent", userEmail: "rufustent@gmail.com", skillId: "seo-optimizer", amount: 12.00, paymentMethod: "paypal", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-19T11:05:00Z" },
  { id: "p-006", username: "growth_hacker", userName: "Growth Specialist", userEmail: "viral@growthhub.net", skillId: "sql-wizard", amount: 15.00, paymentMethod: "stripe", merchantName: "Rufus Tent", merchantEmail: "rufustent@gmail.com", payoutDestination: "rufustent@gmail.com", timestamp: "2026-05-20T13:22:00Z" }
];

let executions: ExecutionRecord[] = [
  { id: "e-001", username: "rufus_tent", skillId: "devops-architect", skillName: "Cloud DevOps Config Generator", prompt: "Create docker-compose with postgres and redis", response: "```yaml\nversion: '3.8'\nservices:\n  db:\n    image: postgres:15-alpine\n...", timestamp: "2026-05-15T11:00:00Z", tokens: 230 },
  { id: "e-002", username: "dev_alpha", skillId: "financial-forecaster", skillName: "Financial Health Forecaster", prompt: "Summarize Q1 SaaS revenue of $200k", response: "Based on our Q1 statement, the SaaS shows strong momentum...", timestamp: "2026-05-15T11:45:00Z", tokens: 410 },
  { id: "e-003", username: "rufus_tent", skillId: "growth-hacker", skillName: "Viral Post Hook Crafter", prompt: "Hooks about bootstrap financing", response: "1. 'Why your bank wants you to fail...' \n2. '0 to $1M on dry leaves...'", timestamp: "2026-05-16T15:10:00Z", tokens: 190 },
  { id: "e-004", username: "marketing_guru", skillId: "copywriting-assistant", skillName: "Persuasive Ad Copy Generator", prompt: "SaaS backup app", response: "Save yourself. Backup files automatically in 3 seconds...", timestamp: "2026-05-16T15:30:00Z", tokens: 320 },
  { id: "e-005", username: "rufus_tent", skillId: "sql-wizard", skillName: "Natural Language to SQL", prompt: "Users table with signups last month", response: "```sql\nSELECT COUNT(*), DATE(created_at) FROM users WHERE ...\n```", timestamp: "2026-05-17T10:00:00Z", tokens: 280 }
];

// Defined skills in application
const SKILLS: AgentSkill[] = [
  {
    id: "devops-architect",
    name: "Cloud DevOps Config Generator",
    description: "Generates robust, scalable Docker deployment recipes and production Kubernetes configurations instantly tailored to your architecture requirements.",
    price: 0,
    tier: "free",
    category: "development",
    icon: "Cpu",
    systemInstruction: "You are a senior Lead SRE DevOps Engineer. Provide production-ready, security-audited, highly efficient Dockerfiles, compose setups, or Kubernetes yaml configs with minimal explanations.",
    placeholderPrompt: "Write a high-performance Dockerfile and docker-compose.yml for a Node.js Express backend with PostgreSQL clustering."
  },
  {
    id: "growth-hacker",
    name: "Viral Post Hook Crafter",
    description: "Engineers high-conversion social content hooks and click-worthy copy utilizing psychographic triggers to drive maximum traffic.",
    price: 0,
    tier: "free",
    category: "marketing",
    icon: "Zap",
    systemInstruction: "You are an elite Growth Hacker and master copywriter. Craft 5 distinct, high-impact headline hooks tailored to social streams. Ensure high curiosity, visual phrasing, and precise psychological tension.",
    placeholderPrompt: "5 viral LinkedIn hooks about why traditional 9-to-5 corporate jobs are riskier than starting a solo SaaS business."
  },
  {
    id: "financial-forecaster",
    name: "Financial Health Forecaster",
    description: "Evaluates raw corporate revenue numbers, cost structures, and burn rates to output granular multi-scenario projections and runway telemetry.",
    price: 19.00,
    tier: "premium",
    category: "finance",
    icon: "TrendingUp",
    systemInstruction: "You are a professional CFO and Venture Financial Analyst. Take general financial metrics and generate a concise pro-forma analysis, highlighting runway, burn rate, breakdown of expenses, and 3-scenario projections (Conservative, Base, Aggressive). Keep the tone authoritative, quantitative, and elite.",
    placeholderPrompt: "Current runway: 8 months. Q1 SaaS MRR: $32,000, growing at 12% MoM. Monthly headcounts: $21,000. Server bills: $4,500. Compute premium forecasts.",
    popular: true
  },
  {
    id: "sql-wizard",
    name: "Natural Language to SQL",
    description: "Converts conversational requirements into ultra-optimized, clean, and indexed database queries matching strict relational schema mandates.",
    price: 15.00,
    tier: "premium",
    category: "development",
    icon: "Database",
    systemInstruction: "You are an expert Principal Database Administrator. Your job is to convert natural language descriptions of data requirements into beautiful, index-optimized, standard-compliant SQL queries. Provide query explanation and performance metrics placeholders as comments.",
    placeholderPrompt: "Show a recursive CTE query that finds all sub-departments and calculates their aggregated salaries from an employee hierarchy table."
  },
  {
    id: "copywriting-assistant",
    name: "Persuasive Ad Copy Writer",
    description: "Produces premium, brand-consistent marketing emails, search campaigns, and storefront copy optimized for conversion KPIs directly.",
    price: 9.00,
    tier: "premium",
    category: "marketing",
    icon: "Award",
    systemInstruction: "You are a legendary Conversion Copywriter. Output persuasive, storytelling-driven ad copy using classical direct response frameworks like AIDA (Attention, Interest, Desire, Action) or PAS (Problem, Agitate, Solve). Highlight emotional payoffs.",
    placeholderPrompt: "A Facebook Ad campaign focusing on saving 5 hours of manual scheduling time per week using our new AI Assistant tool."
  },
  {
    id: "seo-optimizer",
    name: "Semantic SEO Strategy Builder",
    description: "Discovers target content cluster plans, semantic entities, and LSI keyword patterns to systematically dominate search engine rankings.",
    price: 12.00,
    tier: "premium",
    category: "productivity",
    icon: "Search",
    systemInstruction: "You are a principal SEO strategist. Given a core seed keywords list, synthesize a multi-tier semantic topical cluster list. Identify search intent (informational, transactional, navigational), title patterns, and secondary keywords to include.",
    placeholderPrompt: "Core topic: 'Self-hosted AI chat interfaces'. Provide a semantic strategy and title recommendations."
  }
];

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function runServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  // USER Status
  app.get("/api/user", (req, res) => {
    res.json(userDb);
  });

  // Update user credentials
  app.put("/api/user/credentials", (req, res) => {
    const { name, email, username, merchantName, merchantEmail, businessName, stripeAccountId, paypalMerchantId } = req.body;
    if (name) userDb.name = name;
    if (email) userDb.email = email;
    if (username) userDb.username = username;
    if (merchantName) userDb.merchantName = merchantName;
    if (merchantEmail) userDb.merchantEmail = merchantEmail;
    if (businessName) userDb.businessName = businessName;
    if (stripeAccountId) userDb.stripeAccountId = stripeAccountId;
    if (paypalMerchantId) userDb.paypalMerchantId = paypalMerchantId;
    res.json({ success: true, user: userDb });
  });

  // Reset demo databases
  app.post("/api/user/reset", (req, res) => {
    userDb = {
      username: "rufus_tent",
      name: "Rufus Tent",
      email: "rufustent@gmail.com",
      merchantName: "Rufus Tent",
      merchantEmail: "rufustent@gmail.com",
      businessName: "Rufus Tent AI Solutions",
      stripeAccountId: "acct_rufus_tent_live_884",
      paypalMerchantId: "rufustent@gmail.com",
      isPremium: false,
      purchasedSkills: []
    };
    purchases = purchases.filter(p => !p.id.startsWith("demo-"));
    executions = executions.filter(e => !e.id.startsWith("demo-"));
    res.json({ success: true, message: "Demo workflow successfully reset." });
  });

  // PURCHASE Endpoints
  app.post("/api/purchase", (req, res) => {
    const { skillId, paymentMethod, amount, payerName, payerEmail } = req.body;
    
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) {
      return res.status(404).json({ error: "Agent skill not found" });
    }

    // Process purchase recording with Rufus Tent credentials & payout routing
    const purchaseId = `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newPurchase: PurchaseRecord = {
      id: purchaseId,
      username: userDb.username,
      userName: payerName || userDb.name,
      userEmail: payerEmail || userDb.email,
      skillId: skillId,
      amount: Number(amount) || skill.price,
      paymentMethod: paymentMethod === "paypal" ? "paypal" : "stripe",
      merchantName: userDb.merchantName,
      merchantEmail: userDb.merchantEmail,
      payoutDestination: userDb.merchantEmail,
      timestamp: new Date().toISOString()
    };

    purchases.push(newPurchase);

    // Apply skill access to state
    if (!userDb.purchasedSkills.includes(skillId)) {
      userDb.purchasedSkills.push(skillId);
    }
    userDb.isPremium = true;

    res.json({
      status: "success",
      message: `Skill ${skill.name} successfully unlocked!`,
      purchase: newPurchase,
      user: userDb
    });
  });

  // ANALYTICS Endpoint
  app.get("/api/analytics", (req, res) => {
    // Return rich metrics compiled on the fly based on current DB state
    
    // Group earnings over last few days (from 2026-05-15 onwards)
    const dates = ["05-15", "05-16", "05-17", "05-18", "05-19", "05-20", "05-21"];
    
    const revenueOverTime = dates.map(dt => {
      const matchText = `2026-${dt}`;
      const sum = purchases
        .filter(p => p.timestamp.startsWith(matchText))
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { date: dt, amount: Number(sum.toFixed(2)) };
    });

    // Purchases by Skill
    const purchasesBySkill = SKILLS.map(skill => {
      const skillPurchases = purchases.filter(p => p.skillId === skill.id);
      return {
        skillId: skill.id,
        skillName: skill.name,
        count: skillPurchases.length,
        revenue: Number(skillPurchases.reduce((sum, p) => sum + p.amount, 0).toFixed(2))
      };
    }).filter(s => s.count > 0 || s.revenue > 0);

    // Top dynamic usage counters
    const skillUsageCounts = SKILLS.map(skill => {
      const count = executions.filter(e => e.skillId === skill.id).length;
      return {
        skillId: skill.id,
        skillName: skill.name,
        count
      };
    });

    // Active simulated users breakdown (proportions)
    const activeUsersPremium = dates.map((dt, idx) => {
      // Scale slightly to make the dynamic dashboard graphs look active and attractive
      const premiumCount = purchases.filter(p => p.timestamp.includes(`-${dt}`)).length * 4 + 7;
      const freeCount = 45 + (idx * 5) - (premiumCount * 2);
      return {
        date: dt,
        premium: premiumCount,
        free: freeCount > 10 ? freeCount : 12
      };
    });

    const body: AnalyticsData = {
      revenueOverTime,
      purchasesBySkill,
      activeUsersPremium,
      skillUsageCounts,
      recentPurchases: [...purchases].reverse().slice(0, 10),
      recentExecutions: [...executions].reverse().slice(0, 10)
    };

    res.json(body);
  });

  // API INTEGRATIONS & SPECIAL PAID SERVICES STATUS Endpoint
  app.get("/api/apis/status", (req, res) => {
    const apis: ApiStatus[] = [
      {
        id: "gemini",
        name: "Google Gemini 3.8 Flash",
        category: "AI Models",
        isPaid: false,
        isConfigured: !!process.env.GEMINI_API_KEY,
        envVar: "GEMINI_API_KEY",
        description: "Standard primary server-side LLM engine with system instruction & sandboxing support."
      },
      {
        id: "openai",
        name: "OpenAI GPT-4o / Reasoning",
        category: "Special Paid AI",
        isPaid: true,
        isConfigured: !!process.env.OPENAI_API_KEY,
        envVar: "OPENAI_API_KEY",
        description: "Special paid AI model provider for high-complexity agent reasoning, coding, and analytics."
      },
      {
        id: "anthropic",
        name: "Anthropic Claude 3.5 Sonnet",
        category: "Special Paid AI",
        isPaid: true,
        isConfigured: !!process.env.ANTHROPIC_API_KEY,
        envVar: "ANTHROPIC_API_KEY",
        description: "Special paid AI model for advanced long-form copywriting, architecture design, and nuanced reasoning."
      },
      {
        id: "stripe_secret",
        name: "Stripe Production Secret Key",
        category: "Payment Processing",
        isPaid: true,
        isConfigured: !!process.env.STRIPE_SECRET_KEY,
        envVar: "STRIPE_SECRET_KEY",
        description: "Live production merchant secret key for automated webhook verification and bank payouts."
      },
      {
        id: "paypal_secret",
        name: "PayPal REST Client Secret",
        category: "Payment Processing",
        isPaid: true,
        isConfigured: !!process.env.PAYPAL_CLIENT_SECRET,
        envVar: "PAYPAL_CLIENT_SECRET",
        description: "Merchant secret key for authenticating live PayPal REST payouts and instant settlement captures."
      },
      {
        id: "serper",
        name: "Serper / Google Search API",
        category: "Search & Grounding",
        isPaid: true,
        isConfigured: !!process.env.SERPER_API_KEY,
        envVar: "SERPER_API_KEY",
        description: "Special paid live web search engine for agent grounding, SERP analysis, and real-time facts."
      },
      {
        id: "custom_paid",
        name: "Custom Enterprise Paid API",
        category: "Custom Enterprise",
        isPaid: true,
        isConfigured: !!(process.env.CUSTOM_PAID_API_KEY || process.env.CUSTOM_PAID_API_URL),
        envVar: "CUSTOM_PAID_API_KEY",
        description: "Dedicated private microservice endpoint configured for custom proprietary workflows."
      }
    ];

    res.json(apis);
  });

  // EXECUTE AGENCY SKILL (Gemini, OpenAI, Anthropic, or Custom Paid APIs)
  app.post("/api/run-skill", async (req, res) => {
    const { skillId, prompt, engine } = req.body;

    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) {
      return res.status(404).json({ error: "Requested agent skill does not exist" });
    }

    // Access check: Free vs Premium
    if (skill.tier === "premium") {
      const unlocked = userDb.purchasedSkills.includes(skillId);
      if (!unlocked) {
        return res.status(402).json({
          error: "PAYMENT_REQUIRED",
          message: `The '${skill.name}' is a Premium Agent Skill. Please authorize Stripe or PayPal checkout on the storefront to unlock execute rights.`
        });
      }
    }

    if (!prompt || String(prompt).trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required to run the agent skill." });
    }

    const selectedEngine = engine || "gemini";
    let responseText = "";
    let isMock = false;
    let engineUsed = "Google Gemini 3.5 Flash";

    // Route 1: OpenAI Special Paid API
    if (selectedEngine === "openai") {
      if (process.env.OPENAI_API_KEY) {
        try {
          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: skill.systemInstruction },
                { role: "user", content: prompt }
              ],
              temperature: 0.7
            })
          });
          const data: any = await resp.json();
          if (data?.choices?.[0]?.message?.content) {
            responseText = data.choices[0].message.content;
            engineUsed = "OpenAI GPT-4o (Special Paid API)";
          } else {
            throw new Error(data?.error?.message || "Invalid payload response from OpenAI API.");
          }
        } catch (err: any) {
          console.error("OpenAI Error:", err);
          responseText = `[OpenAI Paid API Notice: Request failed (${err?.message || err}). Falling back to local emulator.]\n\n` + getMockResponseForSkill(skill.id, prompt);
          isMock = true;
          engineUsed = "OpenAI GPT-4o (Emulated)";
        }
      } else {
        isMock = true;
        engineUsed = "OpenAI GPT-4o (Sandbox Mode)";
        responseText = `[Notice: OPENAI_API_KEY is not yet populated in Settings > Secrets. Executing in high-fidelity sandbox mode.]\n\n` + getMockResponseForSkill(skill.id, prompt);
      }
    }
    // Route 2: Anthropic Claude Special Paid API
    else if (selectedEngine === "anthropic") {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 1800,
              system: skill.systemInstruction,
              messages: [
                { role: "user", content: prompt }
              ]
            })
          });
          const data: any = await resp.json();
          if (data?.content?.[0]?.text) {
            responseText = data.content[0].text;
            engineUsed = "Claude 3.5 Sonnet (Special Paid API)";
          } else {
            throw new Error(data?.error?.message || "Invalid response structure from Anthropic API.");
          }
        } catch (err: any) {
          console.error("Anthropic Error:", err);
          responseText = `[Anthropic Paid API Notice: Request failed (${err?.message || err}). Falling back to local emulator.]\n\n` + getMockResponseForSkill(skill.id, prompt);
          isMock = true;
          engineUsed = "Claude 3.5 Sonnet (Emulated)";
        }
      } else {
        isMock = true;
        engineUsed = "Claude 3.5 Sonnet (Sandbox Mode)";
        responseText = `[Notice: ANTHROPIC_API_KEY is not yet populated in Settings > Secrets. Executing in high-fidelity sandbox mode.]\n\n` + getMockResponseForSkill(skill.id, prompt);
      }
    }
    // Route 3: Custom Enterprise Paid API
    else if (selectedEngine === "custom_paid") {
      if (process.env.CUSTOM_PAID_API_URL) {
        try {
          const resp = await fetch(process.env.CUSTOM_PAID_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.CUSTOM_PAID_API_KEY ? { "Authorization": `Bearer ${process.env.CUSTOM_PAID_API_KEY}` } : {})
            },
            body: JSON.stringify({
              skill: skill.id,
              systemInstruction: skill.systemInstruction,
              prompt: prompt,
              merchantEmail: userDb.merchantEmail
            })
          });
          const data: any = await resp.json();
          responseText = data?.output || data?.result || JSON.stringify(data, null, 2);
          engineUsed = "Custom Enterprise Paid API";
        } catch (err: any) {
          console.error("Custom Paid API Error:", err);
          responseText = `[Custom Paid API Notice: Request failed (${err?.message || err}). Falling back to local emulator.]\n\n` + getMockResponseForSkill(skill.id, prompt);
          isMock = true;
          engineUsed = "Custom Paid API (Emulated)";
        }
      } else {
        isMock = true;
        engineUsed = "Custom Paid API (Sandbox Mode)";
        responseText = `[Notice: CUSTOM_PAID_API_URL is not configured in Settings > Secrets. Executing in high-fidelity sandbox mode.]\n\n` + getMockResponseForSkill(skill.id, prompt);
      }
    }
    // Route 4: Default Gemini Model (gemini-3.8-flash with multi-tier fallback)
    else {
      const ai = getGeminiClient();
      if (ai) {
        // Attempt with gemini-3.8-flash, gemini-flash-latest, and gemini-3.1-flash-lite with backoff
        const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        let callSucceeded = false;

        for (const modelCandidate of modelsToTry) {
          // Try with quick retry backoff if 503 high demand spike occurs
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              if (attempt > 0) {
                // Short jitter delay before retry
                await new Promise(r => setTimeout(r, 600));
              }

              const result = await ai.models.generateContent({
                model: modelCandidate,
                contents: prompt,
                config: {
                  systemInstruction: skill.systemInstruction
                }
              });

              if (result.text) {
                responseText = result.text;
                engineUsed = `Google Gemini (${modelCandidate})`;
                callSucceeded = true;
                break;
              }
            } catch (err: any) {
              const errMsg = err?.message || String(err);
              const is503 = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
              if (!is503) {
                // If it's another type of error, log and move to next model
                console.warn(`Gemini attempt with ${modelCandidate} failed: ${errMsg}`);
                break;
              }
              // If it's a 503 on first attempt, retry once after backoff
              if (attempt === 0) {
                continue;
              }
            }
          }
          if (callSucceeded) {
            break;
          }
        }

        if (!callSucceeded) {
          // If all model tiers are currently undergoing temporary upstream capacity spikes,
          // safely fulfill request with the high-fidelity sandbox simulator so the application never breaks
          responseText = getMockResponseForSkill(skill.id, prompt);
          isMock = true;
          engineUsed = "Google Gemini (Sandbox Simulator - High Demand Spikes)";
        }
      } else {
        isMock = true;
        responseText = getMockResponseForSkill(skill.id, prompt);
        engineUsed = "Google Gemini 3.8 Flash (Offline Demo)";
      }
    }

    // Append to Execution database
    const execId = `exec-${Date.now()}`;
    const newExec: ExecutionRecord = {
      id: execId,
      username: userDb.username,
      skillId: skillId,
      skillName: skill.name,
      engineUsed: engineUsed,
      prompt: prompt,
      response: responseText,
      timestamp: new Date().toISOString(),
      tokens: Math.floor(prompt.length / 4) + Math.floor(responseText.length / 4)
    };

    executions.push(newExec);

    res.json({
      success: true,
      execution: newExec,
      offlineSimulated: isMock,
      engineUsed: engineUsed
    });
  });

  // Helper mock content generator
  function getMockResponseForSkill(skillId: string, prompt: string): string {
    const timestamp = new Date().toLocaleString();
    switch (skillId) {
      case "devops-architect":
        return `### 🛠️ DevOps Architect - Synthesized Recipe
Generated: \`${timestamp}\` (Environment: Sandbox Emulated Mode)

Based on your requirement: "${prompt}", here is a highly optimized configuration blueprint.

\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web_gateway:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app_node
    restart: always

  app_node:
    image: node:20-alpine
    environment:
      - NODE_ENV=production
      - MONGO_URL=mongodb://mongo_db:27017/prod_agent_db
    deploy:
      replicas: 3
    restart: unless-stopped

  mongo_db:
    image: mongo:6-jammy
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 1024M

volumes:
  mongo_data:
\`\`\`

#### Production Security Recommendations
1. Ensure you run this inside a secured virtual isolated private cloud (VPC).
2. Store environment credentials in GCP Secret Manager rather than raw '.env' bundles.
3. Configure resource scaling constraints explicitly in Orchestration telemetry.`;

      case "growth-hacker":
        return `### 📈 Growth Hacker - Click-Trigger Content Hooks
Generated: \`${timestamp}\` (Environment: Sandbox Emulated Mode)

Here are 5 psychologically primed content hooks matching your query: "${prompt}".

---

#### Hook #1: The Contrarian Reveal
> "**Most founders fail here... and it's because they read standard blog posts.** Here are 3 hard-learned lessons about bootstrapping that will save you 18 months of silent burn."
*   **Psychology Trigger:** Status threat & authority override.

#### Hook #2: The Hidden Arbitrage
> "I spent 40 hours auditing top agent monetization models. The secret isn't Stripe; it's how they structure standard tier gates on key API parameters. Here is the blueprint you can duplicate in 5 minutes."
*   **Psychology Trigger:** Calculated FOMO & actionable asset delivery.

#### Hook #3: The Analytical Case Study
> "0 to $32,000 MRR in exactly 87 days without raising seed capital. No hacks, no shortcuts. Just 1 dev, 1 key system, and systematic skill unlocks. Here is the complete post-mortem breakdown."
*   **Psychology Trigger:** Relatability & extreme empirical data proof.

#### Hook #4: The Paradoxical Prompt 
> "Stop telling users to 'input API keys'. You are introducing immediate trust tax. Here's how to build a fullstack lazy gateway instead."
*   **Psychology Trigger:** Identity disruption.

---

**Tip for Distribution:** Publish with high-contrast formatting on channels during peak active windows (8:00 AM - 10:30 AM EST).`;

      case "financial-forecaster":
        return `### 📊 Financial Pro-Forma & Runway Telemetry
Generated: \`${timestamp}\` (Unlocked via Premium License)

#### Executive Projections for: "${prompt}"

| Scenarios | Monthly Revenue (MRR) | Run Rate (ARR) | Runway remaining | Conversion Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **Conservative (8% MoM)** | $34,560 | $414,720 | 9.2 weeks | 1.8% |
| **Optimistic (15% MoM)** | $36,800 | $441,600 | 12.1 weeks | 2.5% |
| **Hyper-Growth (25% MoM)** | $40,000 | $480,000 | 15.6 weeks | 3.4% |

#### 💸 Comprehensive CFO Runway Audit
1.  **Immediate Burn Rate:** Operating costs average $25,500/mo.
2.  **Safety Margin:** Suggest transitioning 3 premium core offerings into continuous automated monthly tiers via Stripe Checkout pipelines in Q3.
3.  **Vulnerability Matrix:** Over-dependency on compute resource nodes. Recommend load-balancing across multi-region server arrays immediately.`;

      case "sql-wizard":
        return `### 🔮 SQL Wizard - Optimizations & Schema Pipeline
Generated: \`${timestamp}\` (Unlocked via Premium License)

Here is the customized PostgreSQL DDL query matching: "${prompt}".

\`\`\`sql
-- Efficient Recursive Hierarchical Calculation CTE
WITH RECURSIVE dept_hierarchy AS (
  -- Anchor Member
  SELECT 
    dept_id,
    parent_id,
    name,
    budget,
    1 AS depth
  FROM departments
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive Member
  SELECT 
    d.dept_id,
    d.parent_id,
    d.name,
    d.budget,
    dh.depth + 1
  FROM departments d
  INNER JOIN dept_hierarchy dh ON d.parent_id = dh.dept_id
)
SELECT 
  dept_id,
  parent_id,
  name,
  budget,
  depth,
  SUM(budget) OVER (PARTITION BY parent_id) as sibling_total_budget
FROM dept_hierarchy
ORDER BY depth, dept_id;
\`\`\`

#### ⚡ Execution Performance Telemetry
*   **Query Indexes Added:** \`CREATE INDEX idx_dept_parent ON departments(parent_id, budget);\`
*   **Performance Projection:** Executes in <12ms for databases scaling up to 150K records.`;

      case "copywriting-assistant":
        return `### ✍️ Premium Copywriting Suite
Generated: \`${timestamp}\` (Unlocked via Premium License)

Here is a highly persuasive, PAS formulation copy built around: "${prompt}".

---

#### 🎬 The Copywriting Angle: Problem - Agitate - Solve (PAS)

*   **Problem:** 
    You watch hours of analytical tutorials, yet your customer churn is spiking. Your team spends 15 hours every week manually calculating SaaS metrics. You are wasting precious focus on spreadsheets when you should be engineering code.
*   **Agitate:** 
    Every hour spent alignment-tracking is an hour of progress stolen. Your developers are frustrated, your pipelines are stalling, and manual sheets are plagued with human errors. One wrong formula can show your board a faulty cash runway.
*   **Solve:** 
    Enter the AI-Agent-Hub Automated Telemetry Suite. Setup in 3 minutes. Unlock professional CFO projections, instant Docker templates, and SEO structures automatically in one clicks.

#### 🎯 Call-To-Action (CTA) Headline
> "Stop wrestling spreadsheets. Start executing. Get AI-Agent-Hub for less than the cost of a coffee today."

---
*Recommended placement: Mid-funnel marketing email sequence or high-converting retargeting campaign.*`;

      case "seo-optimizer":
        return `### 🔍 Semantic SEO Strategy & Keyword Clustering
Generated: \`${timestamp}\` (Unlocked via Premium License)

Below is the optimized topical architecture addressing: "${prompt}".

#### 1. Core Topic Cluster: High-Intent Keyword Map

*   **Cluster Hub (Tier 1 Pillar Page):** "Complete Deployment Guide for Self-Hosted AI Chat Interfaces" (Search Volume: 8.4K, KD: 35%)
*   **Sub-topics (Tier 2 Semantic Satellites):**
    *   *Search Intent: Informational* → "Privacy implications of running Local LLM vs OpenAI API servers"
    *   *Search Intent: Transactional* → "Best Docker containers for hosting private AI dashboards in 2026"
    *   *Search Intent: Tutorial* → "How to optimize memory leak parameters on Node.js AI server runtimes"

#### 📊 SEO LSI Keyword Desirable Densities
*   "local chat UI" (1.4% density target)
*   "secure self-hosted analytics" (0.8% density target)
*   "GCP Cloud Run AI setup" (1.1% density target)

*Strategy Recommendation: Build out internal context connections linking the Node memory tutorial back to the central hub page to optimize page authority.*`;

      default:
        return `### 🔍 Emulated Agent Sandbox Respond\n\nPrompt received: "${prompt}"\n\nAgent status is healthy. Setup your custom prompt configurations to test detailed responses.`;
    }
  }

  // ----------------------------------------------------
  // Vite Integration for client loading
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI-Agent-Hub Full Stack server running at http://localhost:${PORT}`);
  });
}

runServer().catch(err => {
  console.error("FATAL: Applet dev server crashed on start.", err);
});
