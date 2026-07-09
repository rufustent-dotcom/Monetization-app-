import React, { useState } from "react";
import { AgentSkill, UserSession } from "../types";
import { Cpu, Zap, TrendingUp, Database, Award, Search, Sparkles, Shield, ArrowRight, ShoppingCart } from "lucide-react";

// Helper component to dynamize Lucide icon names from DB configuration list
export function SkillIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case "Cpu":
      return <Cpu className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "Database":
      return <Database className={className} />;
    case "Award":
      return <Award className={className} />;
    case "Search":
      return <Search className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

interface AgentStoreProps {
  skills: AgentSkill[];
  user: UserSession;
  onOpenCheckout: (skill: AgentSkill) => void;
  onSelectUseSkill: (skillId: string) => void;
}

export default function AgentStore({ skills, user, onOpenCheckout, onSelectUseSkill }: AgentStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "development", "marketing", "finance", "productivity"];

  const filteredSkills = selectedCategory === "all" 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Search and Category filters row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18181b] border border-[#27272a] p-4 rounded-xl">
        <div>
          <h4 className="text-sm font-semibold text-white">Agency Skill Registry</h4>
          <p className="text-xs text-zinc-400">Discover or purchase high-performance AI agent modules</p>
        </div>

        {/* Category Pill selectors */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/15"
                  : "bg-[#09090b] text-zinc-400 border-[#27272a] hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => {
          const isUnlocked = skill.tier === "free" || user.purchasedSkills.includes(skill.id);
          const isPremium = skill.tier === "premium";

          return (
            <div
              key={skill.id}
              className={`bg-[#18181b] border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group  ${
                isUnlocked 
                  ? "border-[#27272a] hover:border-blue-500/50" 
                  : "border-[#27272a] hover:border-amber-500/35"
              }`}
            >
              {/* Popular indicator crown */}
              {skill.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] uppercase tracking-wider font-mono font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg shadow-blue-500/10">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  Popular Match
                </div>
              )}

              <div className="p-5">
                {/* Header Icon, Name & Tier tags */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    isUnlocked
                      ? "bg-blue-950/40 text-blue-400 border-blue-900/40 group-hover:scale-105"
                      : "bg-amber-950/55 text-amber-400 border-amber-900/40 group-hover:scale-105"
                  } transition-transform`}>
                    <SkillIcon name={skill.icon} className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors pr-20 truncate">
                      {skill.name}
                    </h5>
                    <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                      {skill.category}
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <p className="text-xs text-zinc-400 mt-4 leading-relaxed min-h-[50px]">
                  {skill.description}
                </p>

                {/* Price and Status row */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#27272a] font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Access Price</span>
                    {isPremium ? (
                      <span className="font-bold text-white text-base">
                        ${skill.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-400 text-base uppercase">
                        Free Standard
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider text-right">System Tier</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono leading-normal font-medium mt-0.5 ${
                      isUnlocked
                        ? "bg-emerald-950/70 text-emerald-400 border border-emerald-900/45"
                        : "bg-amber-950 text-amber-400 border border-amber-900/45"
                    }`}>
                      {isUnlocked ? "Fully Unlocked" : "Premium Gateway"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="p-4 bg-[#09090b] border-t border-[#27272a] flex item-center justify-end">
                {isUnlocked ? (
                  <button
                    onClick={() => onSelectUseSkill(skill.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm border border-blue-500/40 cursor-pointer"
                  >
                    Run Agent Sandbox
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenCheckout(skill)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 transition shadow-md hover:shadow-amber-600/10 cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Unlock Lifetime License
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational info panel about integration */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex gap-3.5 items-start">
          <div className="bg-blue-950/40 p-2.5 rounded-lg text-blue-400 border border-blue-900/30 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h5 className="text-sm font-semibold text-white">Production-Ready Payments Stack</h5>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl mt-0.5">
              This repository is fully configured with Stripe & PayPal checkout webhook handlers. Enable these production payment channels with live billing subscriptions by establishing your secret client payload keys inside your deployment workspace parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
