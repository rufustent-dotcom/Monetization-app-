/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AgentSkill, UserSession, AnalyticsData } from "./types";
import AgentStore from "./components/AgentStore";
import WorkspaceHub from "./components/WorkspaceHub";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CheckoutModal from "./components/CheckoutModal";
import { 
  ShoppingBag, 
  PlayCircle, 
  BarChart3, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  Terminal,
  Activity,
  Layers
} from "lucide-react";

// Client-side definitions of Agent skills for rapid UI hydration
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"store" | "workspace" | "analytics">("store");
  const [user, setUser] = useState<UserSession | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState("financial-forecaster");
  
  const [checkoutSkill, setCheckoutSkill] = useState<AgentSkill | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile and analytics datasets synchronously
  async function loadSystemData() {
    try {
      const [uRes, aRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/analytics")
      ]);

      if (uRes.ok && aRes.ok) {
        const uData = await uRes.json();
        const aData = await aRes.json();
        setUser(uData);
        setAnalytics(aData);
      }
    } catch (err) {
      console.error("Failed to synchronise AI-Agent-Hub datasets.", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSystemData();
  }, []);

  const handleOpenCheckout = (skill: AgentSkill) => {
    setCheckoutSkill(skill);
  };

  const handlePurchaseSuccess = (skillId: string, paymentMethod: string, amount: number) => {
    // Re-load everything, update interface state
    loadSystemData();
    setSelectedSkillId(skillId);
    setActiveTab("workspace");
  };

  const handleSelectUseSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    setActiveTab("workspace");
  };

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/user/reset", { method: "POST" });
      if (response.ok) {
        await loadSystemData();
        setActiveTab("store");
      }
    } catch (err) {
      console.error("Server database reset failure.", err);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center space-y-4">
          <Layers className="h-10 w-10 text-blue-500 animate-bounce" />
          <p className="text-xs text-zinc-400 animate-pulse tracking-widest">HYDRATING AI-AGENT-HUB PORTAL...</p>
        </div>
      </div>
    );
  }

  const isUserPremium = user?.isPremium;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] selection:bg-blue-650/40">
      
      {/* Outer framing wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* TOP LEVEL NAVIGATION HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#27272a]">
          <div className="flex gap-3.5 items-center">
            {/* Visual Brand Logo */}
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20 border border-blue-400/20">
              <Cpu className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  AI-Agent-Hub <span className="text-blue-500">PRO</span>
                </h1>
                <span className="text-[10px] bg-zinc-900 font-mono text-blue-400 font-bold px-2 py-0.5 rounded border border-[#27272a]">
                  Starter v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Creator-focused storefront telemetry workspace with payment simulators.
              </p>
            </div>
          </div>

          {/* User Session telemetry pill */}
          <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2.5 rounded-xl border border-[#27272a]">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            
            <div className="text-xs">
              <span className="text-zinc-500 font-mono block text-[9px] uppercase tracking-wider">Session Key</span>
              <span className="font-mono text-zinc-300 font-semibold text-xxs">
                {user ? `@${user.username}` : "offline_guest"}
              </span>
            </div>

            <div className="h-6 w-px bg-[#27272a] mx-1" />

            <div className="text-xs">
              <span className="text-zinc-500 font-mono block text-[9px] uppercase tracking-wider">Telemetry State</span>
              {isUserPremium ? (
                <span className="font-mono text-amber-400 font-bold uppercase flex items-center gap-1 text-[10px]">
                  <Sparkles className="h-3 w-3 inline" />
                  Premium Pro
                </span>
              ) : (
                <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">
                  Standard Guest
                </span>
              )}
            </div>
          </div>
        </header>

        {/* REPOSITORY STATUS / METRIC CONTEXT BANNER */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex gap-3 items-start md:items-center">
            <Terminal className="h-5 w-5 text-blue-400 shrink-0 select-none" />
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
              💡 <strong className="text-white">Simulator Sandbox Active:</strong> This workspace simulates both Stripe & PayPal checkout routines. Switch tabs to purchase premium agent keys with dummy auth forms and review live traffic updates on the executive analytics charts.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-[10px] font-mono uppercase bg-zinc-900 text-blue-400 border border-[#27272a] rounded px-2.5 py-1.5 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Express Environment OK
            </span>
          </div>
        </div>

        {/* WORKSPACE VIEW NAVIGATION TABS */}
        <div className="flex border-b border-[#27272a] font-mono text-xs overflow-x-auto">
          {/* TAB: STORE */}
          <button
            onClick={() => setActiveTab("store")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-zinc-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "store"
                ? "border-blue-500 text-white bg-[#18181b]"
                : "border-transparent text-zinc-400"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Agent Market Store
          </button>

          {/* TAB: PLAYGROUND PLAY WORKSPACE */}
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-zinc-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "workspace"
                ? "border-blue-500 text-white bg-[#18181b]"
                : "border-transparent text-zinc-400"
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            Developer Sandbox Play
          </button>

          {/* TAB: ANALYTICS LEDGER */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-zinc-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "analytics"
                ? "border-blue-500 text-white bg-[#18181b]"
                : "border-transparent text-zinc-400"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Premium Skill Analytics
            {analytics && analytics.recentPurchases.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* WORKSPACE VIEW DISPLAY GATES */}
        <main className="min-h-[400px]">
          {activeTab === "store" && (
            <AgentStore
              skills={SKILLS}
              user={user || { username: "offline_user", isPremium: false, purchasedSkills: [] }}
              onOpenCheckout={handleOpenCheckout}
              onSelectUseSkill={handleSelectUseSkill}
            />
          )}

          {activeTab === "workspace" && (
            <WorkspaceHub
              skills={SKILLS}
              user={user || { username: "offline_user", isPremium: false, purchasedSkills: [] }}
              selectedSkillId={selectedSkillId}
              onSelectSkill={setSelectedSkillId}
              onOpenCheckout={handleOpenCheckout}
              onNewExecutionLogged={loadSystemData}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard
              data={analytics || {
                revenueOverTime: [],
                purchasesBySkill: [],
                activeUsersPremium: [],
                skillUsageCounts: [],
                recentPurchases: [],
                recentExecutions: []
              }}
              skills={SKILLS}
              onReset={handleResetWorkspace}
              isResetting={isResetting}
            />
          )}
        </main>

        {/* SECURE STRIPE / PAYPAL GATEWAY MODAL LIGHTBOX */}
        {checkoutSkill && (
          <CheckoutModal
            skill={checkoutSkill}
            onClose={() => setCheckoutSkill(null)}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        )}

      </div>

      {/* FOOTER */}
      <footer className="mt-20 py-8 bg-[#09090b] border-t border-[#27272a] text-zinc-500 text-center font-mono text-xxs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>&copy; 2026 AI-Agent-Hub LLC. Moneta-Portal Dashboard environment is healthy.</p>
          <p className="text-zinc-600 max-w-sm mx-auto">
            Authorized through secure Node APIs proxies. Sandboxed PCI-DSS telemetry.
          </p>
        </div>
      </footer>

    </div>
  );
}
