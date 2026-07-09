import React, { useState } from "react";
import { AnalyticsData, PurchaseRecord, ExecutionRecord, AgentSkill } from "../types";
import { BarChart3, DollarSign, TrendingUp, Cpu, CreditCard, Activity, ArrowUpRight, ShieldCheck, RefreshCw, Layers } from "lucide-react";

interface AnalyticsProps {
  data: AnalyticsData;
  skills: AgentSkill[];
  onReset: () => void;
  isResetting: boolean;
}

export default function AnalyticsDashboard({ data, skills, onReset, isResetting }: AnalyticsProps) {
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
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-blue-500/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Gross Store Revenue</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                ${totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="bg-blue-950/40 text-blue-400 p-2.5 rounded-lg border border-blue-900/40 group-hover:scale-105 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Monetization gateway active</span>
          </div>
        </div>

        {/* KPI: License Purchases */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-amber-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Premium Licenses</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                {totalPurchasesCount}
              </h3>
            </div>
            <div className="bg-amber-950/45 text-amber-400 p-2.5 rounded-lg border border-amber-900/30 group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Simulated checkout live</span>
          </div>
        </div>

        {/* KPI: Total Compute Executions */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-emerald-500/45 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Agent API Calls</p>
              <h3 className="text-3xl font-bold font-sans text-white mt-1 tracking-tight">
                {totalExecutionsCount}
              </h3>
            </div>
            <div className="bg-emerald-950/40 text-emerald-400 p-2.5 rounded-lg border border-emerald-900/30 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini-3.5-flash online</span>
          </div>
        </div>

        {/* KPI: Star Performer */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-blue-500/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Top Agency Skill</p>
              <h3 className="text-lg font-bold font-sans text-white mt-2 truncate w-40 tracking-tight" title={topUsedAgent}>
                {topUsedAgent}
              </h3>
            </div>
            <div className="bg-blue-950/40 text-blue-400 p-2.5 rounded-lg border border-blue-900/30 group-hover:scale-105 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3.5 text-xs text-zinc-400">
            <Layers className="h-3.5 w-3.5 text-blue-450" />
            <span>Most executed model</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart Card #1: Revenue Growth Over Time */}
        <div className="p-5 bg-[#18181b] border border-[#27272a] rounded-xl relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Gross Store Sales Revenue</h4>
              <p className="text-xs text-zinc-400">Total monetization revenue over chronological trend</p>
            </div>
            <span className="text-xs font-mono bg-blue-950/40 text-blue-400 border border-blue-900/30 px-2 py-0.5 rounded">
              Stripe & PayPal Live
            </span>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center">
            {revenuePoints.length === 0 ? (
              <div className="text-xs text-zinc-500 font-mono">Waiting for first purchase simulation data...</div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
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
                        stroke="#27272a" 
                        strokeWidth="1" 
                        strokeDasharray="4,4" 
                      />
                      <text 
                        x={padding.left - 8} 
                        y={y + 4} 
                        fill="#a1a1aa" 
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
                      fill="#a1a1aa"
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
                  stroke="#3b82f6" 
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
                        fill={isHovered ? "#3b82f6" : "#172554"}
                        stroke="#60a5fa"
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
            <div className="absolute top-12 right-5 bg-zinc-950/95 border border-blue-500/30 rounded p-2.5 text-xs shadow-xl animate-fade-in pointer-events-none">
              <p className="font-mono text-blue-400">Date: 2026-{revenuePoints[hoveredPointIdx].date}</p>
              <p className="font-bold text-white mt-0.5">Sales Gross: ${revenuePoints[hoveredPointIdx].amount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Chart Card #2: Usage stats by Agent Skill */}
        <div className="p-5 bg-[#18181b] border border-[#27272a] rounded-xl relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Agent Execution Traffic</h4>
              <p className="text-xs text-zinc-400">Total API call volume processed per individual AI agent skill</p>
            </div>
            <span className="text-xs font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded">
              Compute Loads
            </span>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center">
            {usagePoints.length === 0 ? (
              <div className="text-xs text-zinc-500 font-mono">No api call execution records detected.</div>
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
                        stroke="#27272a" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={barChartLeftPadding - 8} 
                        y={y + 3} 
                        fill="#a1a1aa" 
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
                        fill="#a1a1aa"
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
            <div className="absolute top-12 right-5 bg-zinc-950/95 border border-emerald-500/30 rounded p-2.5 text-xs shadow-xl animate-fade-in pointer-events-none">
              <p className="font-semibold text-white">{usagePoints[hoveredBarIdx].skillName}</p>
              <p className="font-mono text-emerald-400 mt-1">Total Runs: {usagePoints[hoveredBarIdx].count} API calls</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Live Activity Audit Feed & Reset Option */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Live Purchase Logs */}
        <div className="xl:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Monetization Ledger</h4>
              <p className="text-xs text-zinc-400">Verified Stripe and PayPal payment authorizations received</p>
            </div>
            
            <button
              onClick={onReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#27272a] hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 rounded transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Workspace DB
            </button>
          </div>

          <div className="overflow-x-auto">
            {data.recentPurchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No purchases yet. Purchase a skill from the Store to test.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-350">
                <thead>
                  <tr className="border-b border-[#27272a] text-zinc-400 font-mono">
                    <th className="pb-2.5 font-normal">Reference ID</th>
                    <th className="pb-2.5 font-normal">License Holder</th>
                    <th className="pb-2.5 font-normal">Acquired Agent Skill</th>
                    <th className="pb-2.5 font-normal text-right">Price</th>
                    <th className="pb-2.5 font-normal text-right">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/50">
                  {data.recentPurchases.map((p) => {
                    const skill = skills.find(s => s.id === p.skillId);
                    return (
                      <tr key={p.id} className="hover:bg-[#09090b]/40 transition-colors">
                        <td className="py-2.5 font-mono text-zinc-500">{p.id}</td>
                        <td className="py-2.5 font-mono text-zinc-200">@{p.username}</td>
                        <td className="py-2.5 text-zinc-300 truncate max-w-xs">{skill ? skill.name : p.skillId}</td>
                        <td className="py-2.5 text-right font-medium text-emerald-400 font-mono">${p.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] tracking-wide uppercase ${
                            p.paymentMethod === 'stripe' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' : 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
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
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white">Agent Activity Feed</h4>
            <p className="text-xs text-zinc-400">Logs monitoring real-time AI compute</p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {data.recentExecutions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No executions processed yet. Trigger an unlocked skill in the Sandbox first.
              </div>
            ) : (
              data.recentExecutions.slice(0, 7).map((exec) => (
                <div key={exec.id} className="text-xs bg-[#09090b] rounded-lg p-3 border border-[#27272a]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-zinc-400 font-medium">@{exec.username}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(exec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-blue-400 font-medium mt-1.5 truncate">{exec.skillName}</p>
                  <p className="text-[#a1a1aa] italic mt-1 line-clamp-1">"{exec.prompt}"</p>
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-[#27272a]/70 text-[10px] font-mono text-zinc-500">
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
