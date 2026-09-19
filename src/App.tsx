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
import CredentialsModal from "./components/CredentialsModal";
import ApiIntegrationsModal from "./components/ApiIntegrationsModal";
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
  Layers,
  Key,
  CreditCard,
  UserCheck,
  Server
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
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
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
      <div className="min-h-screen bg-[#07090E] text-[#E2E8F0] flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center space-y-4">
          <Layers className="h-10 w-10 text-indigo-500 animate-bounce" />
          <p className="text-xs text-slate-400 animate-pulse tracking-widest">HYDRATING AI-AGENT-HUB PORTAL...</p>
        </div>
      </div>
    );
  }

  const isUserPremium = user?.isPremium;

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E2E8F0] selection:bg-indigo-650/40">
      
      {/* Outer framing wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* TOP LEVEL NAVIGATION HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-850">
          <div className="flex gap-3.5 items-center">
            {/* Visual Brand Logo */}
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/20">
              <Cpu className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  AI-Agent-Hub Moneta-Portal
                </h1>
                <span className="text-[10px] bg-slate-950 font-mono text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-900/50">
                  Starter v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Creator-focused storefront telemetry workspace with payment simulators.
              </p>
            </div>
          </div>

          {/* User Session and Payment Credentials Header Block */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCredentialsModal(true)}
              className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 px-3.5 py-2 rounded-xl border border-indigo-500/40 text-left transition cursor-pointer shadow-sm group"
              title="Click to view or edit payment and merchant credentials"
            >
              <div className="bg-indigo-950 p-1.5 rounded-lg text-indigo-400 group-hover:scale-105 transition-transform border border-indigo-900/50">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Payment Credentials</span>
                <span className="text-white text-xs font-semibold block leading-tight">
                  {user?.name || "Rufus Tent"}
                </span>
                <span className="text-emerald-400 text-[10px] block leading-tight truncate max-w-[140px]">
                  {user?.merchantEmail || "rufustent@gmail.com"}
                </span>
              </div>
            </button>

            {/* Connected APIs & Paid Services button */}
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 px-3.5 py-2 rounded-xl border border-purple-500/40 text-left transition cursor-pointer shadow-sm group"
              title="Click to view connected APIs & special paid services"
            >
              <div className="bg-purple-950 p-1.5 rounded-lg text-purple-400 group-hover:scale-105 transition-transform border border-purple-900/50">
                <Server className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Special APIs</span>
                <span className="text-white text-xs font-semibold block leading-tight">
                  Paid & LLM APIs
                </span>
                <span className="text-purple-400 text-[10px] block leading-tight">
                  7 Services &bull; Active
                </span>
              </div>
            </button>

            {/* User Session telemetry pill */}
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              
              <div className="text-xs">
                <span className="text-slate-500 font-mono block text-[9px] uppercase tracking-wider">Account</span>
                <span className="font-mono text-slate-300 font-semibold text-xxs">
                  @{user?.username || "rufus_tent"}
                </span>
              </div>

              <div className="h-6 w-px bg-slate-850 mx-1" />

              <div className="text-xs">
                <span className="text-slate-500 font-mono block text-[9px] uppercase tracking-wider">Status</span>
                {isUserPremium ? (
                  <span className="font-mono text-amber-400 font-bold uppercase flex items-center gap-1 text-[10px]">
                    <Sparkles className="h-3 w-3 inline" />
                    Premium Pro
                  </span>
                ) : (
                  <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* REPOSITORY STATUS / METRIC CONTEXT BANNER */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex gap-3 items-start md:items-center">
            <Terminal className="h-5 w-5 text-indigo-400 shrink-0 select-none" />
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              💡 <strong className="text-white">Simulator Sandbox Active:</strong> This workspace simulates both Stripe & PayPal checkout routines. Switch tabs to purchase premium agent keys with dummy auth forms and review live traffic updates on the executive analytics charts.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-400 border border-indigo-900/40 rounded px-2.5 py-1.5 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Express Environment OK
            </span>
          </div>
        </div>

        {/* WORKSPACE VIEW NAVIGATION TABS */}
        <div className="flex border-b border-slate-850 font-mono text-xs overflow-x-auto">
          {/* TAB: STORE */}
          <button
            onClick={() => setActiveTab("store")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-slate-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "store"
                ? "border-indigo-500 text-white bg-indigo-950/20"
                : "border-transparent text-slate-400"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Agent Market Store
          </button>

          {/* TAB: PLAYGROUND PLAY WORKSPACE */}
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-slate-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "workspace"
                ? "border-indigo-500 text-white bg-indigo-950/20"
                : "border-transparent text-slate-400"
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            Developer Sandbox Play
          </button>

          {/* TAB: ANALYTICS LEDGER */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-3 hover:text-slate-100 transition-all font-medium border-b-2 cursor-pointer ${
              activeTab === "analytics"
                ? "border-indigo-500 text-white bg-indigo-950/20"
                : "border-transparent text-slate-400"
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
              onOpenApis={() => setShowApiModal(true)}
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
              user={user || undefined}
              onReset={handleResetWorkspace}
              isResetting={isResetting}
              onOpenCredentials={() => setShowCredentialsModal(true)}
            />
          )}
        </main>

        {/* SECURE STRIPE / PAYPAL GATEWAY MODAL LIGHTBOX */}
        {checkoutSkill && (
          <CheckoutModal
            skill={checkoutSkill}
            user={user || {
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
            }}
            onClose={() => setCheckoutSkill(null)}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        )}

        {/* PAYMENT & ACCOUNT CREDENTIALS MODAL */}
        {showCredentialsModal && user && (
          <CredentialsModal
            user={user}
            onClose={() => setShowCredentialsModal(false)}
            onUpdateUser={(updated) => {
              setUser(updated);
              loadSystemData();
            }}
          />
        )}

        {/* CONNECTED APIS & SPECIAL PAID SERVICES MODAL */}
        {showApiModal && user && (
          <ApiIntegrationsModal
            user={user}
            onClose={() => setShowApiModal(false)}
          />
        )}

      </div>

      {/* FOOTER WITH RUFUS TENT CREDENTIALS */}
      <footer className="mt-20 py-8 bg-slate-950 border-t border-slate-900 text-slate-500 text-center font-mono text-xxs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400">
            <span>Merchant Account: <strong className="text-white">{user?.name || "Rufus Tent"}</strong></span>
            <span>&bull;</span>
            <span>Payee: <strong className="text-emerald-400">{user?.merchantEmail || "rufustent@gmail.com"}</strong></span>
            <span>&bull;</span>
            <span>Stripe: <strong className="text-indigo-400">{user?.stripeAccountId || "acct_rufus_tent_live_884"}</strong></span>
            <span>&bull;</span>
            <span>Entity: <strong className="text-white">{user?.businessName || "Rufus Tent AI Solutions"}</strong></span>
          </div>
          <p className="text-slate-600 max-w-md mx-auto">
            All customer purchases & subscription payouts are routed directly to Rufus Tent. Sandboxed PCI-DSS telemetry.
          </p>
        </div>
      </footer>

    </div>
  );
}
