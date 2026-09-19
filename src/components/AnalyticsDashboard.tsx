import React, { useState } from "react";
import { AnalyticsData, PurchaseRecord, ExecutionRecord, AgentSkill, UserSession } from "../types";
import { BarChart3, DollarSign, TrendingUp, Cpu, CreditCard, Activity, ArrowUpRight, ShieldCheck, RefreshCw, Layers, Key, Building } from "lucide-react";

interface AnalyticsProps {
  data: AnalyticsData;
  skills: AgentSkill[];
  user?: UserSession;
  onReset: () => void;
  isResetting: boolean;
  onOpenCredentials?: () => void;
}

export default function AnalyticsDashboard({ data, skills, user, onReset, isResetting, onOpenCredentials }: AnalyticsProps) {
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  // Stats computation
  const totalRevenue = data.purchasesBySkill.reduce((sum, s) => sum + s.revenue, 0);
  const totalPurchasesCount = data.recentPurchases.length;
  const totalExecutionsCount = data.recentExecutions.length;
  
  // Find highest usage agent
  const topUsedAgentObj = [...data.skillUsageCounts].sort((a, b) => b.count - a.count)[0];
  const topUsedAgent = topUsedAgentObj ? topUsedAgentObj.skillName : "None";

  // SVG dimensions for charts
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = { top: 15, right: 15, bottom: 25, left: 40 };

  // 1. Line/Area Chart Math - Revenue over time
  const revenuePoints = data.revenueOverTime;
  const maxRevenueVal = Math.max(...revenuePoints.map(p => p.amount), 50);
  
  const getCoordinates = (index: number, amount: number) => {
    const x = padding.left + (index / (revenuePoints.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = chartHeight - padding.bottom - (amount / maxRevenueVal) * (chartHeight - padding.top - padding.bottom);
    return { x, y };
  };

  const linePath = revenuePoints.map((p, i) => {
    const { x, y } = getCoordinates(i, p.amount);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  const areaPath = revenuePoints.length > 0 ? `
    ${linePath} 
    L ${getCoordinates(revenuePoints.length - 1, 0).x} ${chartHeight - padding.bottom}
    L ${getCoordinates(0, 0).x} ${chartHeight - padding.bottom} 
    Z
  ` : "";

  // 2. Bar Chart Math - Usage by skill
  const usagePoints = data.skillUsageCounts;
  const maxUsageVal = Math.max(...usagePoints.map(u => u.count), 5);
  const barWidth = 35;
  const barGap = 20;
  const barChartLeftPadding = 50;

  return (
    <div className="space-y-6">
      {/* Dynamic Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Volume */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-indigo-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Gross Store Revenue</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                ${totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="bg-indigo-950/80 text-indigo-400 p-2.5 rounded-lg border border-indigo-900/60 group-hover:scale-105 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Monetization gateway active</span>
          </div>
        </div>

        {/* KPI: License Purchases */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-amber-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Premium Licenses</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                {totalPurchasesCount}
              </h3>
            </div>
            <div className="bg-amber-950/85 text-amber-400 p-2.5 rounded-lg border border-amber-900/60 group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Simulated checkout live</span>
          </div>
        </div>

        {/* KPI: Total Compute Executions */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-emerald-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Agent API Calls</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                {totalExecutionsCount}
              </h3>
            </div>
            <div className="bg-emerald-950/80 text-emerald-400 p-2.5 rounded-lg border border-emerald-900/60 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini-3.5-flash online</span>
          </div>
        </div>

        {/* KPI: Star Performer */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-sky-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Top Agency Skill</p>
              <h3 className="text-lg font-bold font-sans text-white mt-2 truncate w-40 tracking-tight" title={topUsedAgent}>
                {topUsedAgent}
              </h3>
            </div>
            <div className="bg-sky-950/80 text-sky-400 p-2.5 rounded-lg border border-sky-900/60 group-hover:scale-105 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-slate-400">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Most executed model</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart Card #1: Revenue Growth Over Time */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Gross Store Sales Revenue</h4>
              <p className="text-xs text-slate-400">Total monetization revenue over chronological trend</p>
            </div>
            <span className="text-xs font-mono bg-indigo-950 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded">
              Stripe & PayPal Live
            </span>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center">
            {revenuePoints.length === 0 ? (
              <div className="text-xs text-slate-500">Waiting for first purchase simulation data...</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const val = maxRevenueVal * p;
                  const y = chartHeight - padding.bottom - p * (chartHeight - padding.top - padding.bottom);
                  return (
                    <g key={idx} className="opacity-40">
                      <line 
                        x1={padding.left} 
                        y1={y} 
                        x2={chartWidth - padding.right} 
                        y2={y} 
                        stroke="#334155" 
                        strokeWidth="1" 
                        strokeDasharray="4,4" 
                      />
                      <text 
                        x={padding.left - 8} 
                        y={y + 4} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        ${val.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {revenuePoints.map((p, idx) => {
                  const { x } = getCoordinates(idx, p.amount);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartHeight - 6}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-80"
                    >
                      {p.date}
                    </text>
                  );
                })}

                {/* Area Gradient */}
                <path d={areaPath} fill="url(#areaGrad)" />

                {/* Primary Trend Line */}
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Active Hover Nodes */}
                {revenuePoints.map((p, idx) => {
                  const { x, y } = getCoordinates(idx, p.amount);
                  const isHovered = hoveredPointIdx === idx;
                  return (
                    <g key={idx}>
                      {/* Interactive hit region */}
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIdx(idx)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                      />
                      {/* Aesthetic circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? "6" : "3.5"}
                        fill={isHovered ? "#6366f1" : "#1e1b4b"}
                        stroke="#818cf8"
                        strokeWidth="2"
                        className="pointer-events-none transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Line Chart Active Tooltip */}
          {hoveredPointIdx !== null && revenuePoints[hoveredPointIdx] && (
            <div className="absolute top-12 right-5 bg-slate-950/95 border border-indigo-500/50 rounded p-2.5 text-xs shadow-xl animate-fade-in pointer-events-none">
              <p className="font-mono text-indigo-400">Date: 2026-{revenuePoints[hoveredPointIdx].date}</p>
              <p className="font-bold text-white mt-0.5">Sales Gross: ${revenuePoints[hoveredPointIdx].amount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Chart Card #2: Usage stats by Agent Skill */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Agent Execution Traffic</h4>
              <p className="text-xs text-slate-400">Total API call volume processed per individual AI agent skill</p>
            </div>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded">
              Compute Loads
            </span>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center">
            {usagePoints.length === 0 ? (
              <div className="text-xs text-slate-500">No api call execution records detected.</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                {/* Horizontal reference Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const val = Math.ceil(maxUsageVal * p);
                  const y = chartHeight - padding.bottom - p * (chartHeight - padding.top - padding.bottom);
                  return (
                    <g key={idx} className="opacity-40">
                      <line 
                        x1={barChartLeftPadding} 
                        y1={y} 
                        x2={chartWidth - padding.right} 
                        y2={y} 
                        stroke="#334155" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={barChartLeftPadding - 8} 
                        y={y + 3} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Map bars for each skill */}
                {usagePoints.map((u, idx) => {
                  const x = barChartLeftPadding + idx * (barWidth + barGap) + 15;
                  const ratio = u.count / maxUsageVal;
                  const barHeightVal = ratio * (chartHeight - padding.top - padding.bottom);
                  const y = chartHeight - padding.bottom - barHeightVal;
                  const isHovered = hoveredBarIdx === idx;

                  // Simple abbreviation for label
                  const shortName = u.skillName.split(" ").slice(0, 2).join(" ");

                  return (
                    <g key={idx}>
                      {/* Bar Rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeightVal, 2)}
                        rx="4"
                        fill={isHovered ? "#10b981" : "#0f766e"}
                        stroke={isHovered ? "#34d399" : "#0d9488"}
                        strokeWidth="1"
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                      />

                      {/* X label */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 8}
                        fill="#94a3b8"
                        fontSize="8.5"
                        textAnchor="middle"
                        className="opacity-90"
                      >
                        {shortName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Bar Chart Active Tooltip */}
          {hoveredBarIdx !== null && usagePoints[hoveredBarIdx] && (
            <div className="absolute top-12 right-5 bg-slate-950/95 border border-emerald-500/50 rounded p-2.5 text-xs shadow-xl animate-fade-in pointer-events-none">
              <p className="font-semibold text-white">{usagePoints[hoveredBarIdx].skillName}</p>
              <p className="font-mono text-emerald-400 mt-1">Total Runs: {usagePoints[hoveredBarIdx].count} API calls</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Live Activity Audit Feed & Reset Option */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Live Purchase Logs */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800/80 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Monetization Ledger</h4>
                <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded">
                  Merchant: {user?.name || "Rufus Tent"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified authorizations &bull; Payout target: <strong className="text-emerald-400 font-mono">{user?.merchantEmail || "rufustent@gmail.com"}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {onOpenCredentials && (
                <button
                  onClick={onOpenCredentials}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-300 rounded-lg transition cursor-pointer"
                >
                  <Key className="h-3 w-3 text-emerald-400" />
                  Credentials
                </button>
              )}
              <button
                onClick={onReset}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                Reset DB
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {data.recentPurchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No purchases yet. Purchase a skill from the Store to test.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-2.5 font-normal">Reference ID</th>
                    <th className="pb-2.5 font-normal">Payer / Customer</th>
                    <th className="pb-2.5 font-normal">Skill Licensed</th>
                    <th className="pb-2.5 font-normal">Payee Destination</th>
                    <th className="pb-2.5 font-normal text-right">Price</th>
                    <th className="pb-2.5 font-normal text-right">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.recentPurchases.map((p) => {
                    const skill = skills.find(s => s.id === p.skillId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 font-mono text-slate-500 text-xxs">{p.id}</td>
                        <td className="py-2.5">
                          <span className="font-mono text-slate-200 block text-xs">{p.userName || `@${p.username}`}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{p.userEmail || `${p.username}@mail.com`}</span>
                        </td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px]">{skill ? skill.name : p.skillId}</td>
                        <td className="py-2.5">
                          <span className="text-white font-mono text-xxs block font-semibold">{p.merchantName || user?.name || "Rufus Tent"}</span>
                          <span className="text-emerald-400 font-mono text-[10px] block">{p.payoutDestination || user?.merchantEmail || "rufustent@gmail.com"}</span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-emerald-400 font-mono">${p.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] tracking-wide uppercase ${
                            p.paymentMethod === 'stripe' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/40' : 'bg-sky-950/80 text-sky-400 border border-sky-900/40'
                          }`}>
                            {p.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live System Executions */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white">Agent Activity Feed</h4>
            <p className="text-xs text-slate-400">Logs monitoring real-time AI compute</p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {data.recentExecutions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No executions processed yet. Trigger an unlocked skill in the Sandbox first.
              </div>
            ) : (
              data.recentExecutions.slice(0, 7).map((exec) => (
                <div key={exec.id} className="text-xs bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-400 font-medium">@{exec.username}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(exec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-indigo-400 font-medium mt-1.5 truncate">{exec.skillName}</p>
                  <p className="text-slate-400 italic mt-1 line-clamp-1">"{exec.prompt}"</p>
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-800/55 text-[10px] font-mono text-slate-500">
                    <span>Compute Output Success</span>
                    <span>~{exec.tokens} tokens</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
