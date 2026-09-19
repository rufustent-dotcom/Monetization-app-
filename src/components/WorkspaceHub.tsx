import React, { useState, useEffect, useRef } from "react";
import { AgentSkill, UserSession, ExecutionRecord } from "../types";
import { SkillIcon } from "./AgentStore";
import { Play, Lock, Unlock, Clock, Sparkles, Terminal, Copy, Check, FileText, Cpu, AlertCircle } from "lucide-react";

interface WorkspaceHubProps {
  skills: AgentSkill[];
  user: UserSession;
  selectedSkillId: string;
  onSelectSkill: (skillId: string) => void;
  onOpenCheckout: (skill: AgentSkill) => void;
  onNewExecutionLogged: () => void; // Trigger parent to reload analytics
  onOpenApis?: () => void;
}

export default function WorkspaceHub({
  skills,
  user,
  selectedSkillId,
  onSelectSkill,
  onOpenCheckout,
  onNewExecutionLogged,
  onOpenApis
}: WorkspaceHubProps) {
  const [promptInput, setPromptInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [lastResult, setLastResult] = useState<ExecutionRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [runError, setRunError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "openai" | "anthropic" | "custom_paid">("gemini");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  // Auto-fill prompt input once user changes active skill
  useEffect(() => {
    if (selectedSkill) {
      setPromptInput("");
      setLastResult(null);
      setRunError("");
      setOfflineNotice(false);
    }
  }, [selectedSkillId]);

  // Loading timer animation for nice performance indicators
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleQuickFill = () => {
    setPromptInput(selectedSkill.placeholderPrompt);
    setRunError("");
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) {
      setRunError("Please enter a valid prompt command first.");
      return;
    }

    setIsRunning(true);
    setRunError("");
    setOfflineNotice(false);
    setLastResult(null);
    setElapsedMs(0);

    const engineNames = {
      gemini: "Gemini 3.5 Flash",
      openai: "OpenAI GPT-4o",
      anthropic: "Claude 3.5 Sonnet",
      custom_paid: "Custom Paid API"
    };

    const steps = [
      "Securing sandbox thread environment...",
      "Injecting SRE system directives metrics...",
      `Routing payload to ${engineNames[selectedEngine]} endpoint...`,
      "Analyzing generated syntax schemas..."
    ];

    let currentStepIdx = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % steps.length;
      setLoadingStep(steps[currentStepIdx]);
    }, 900);

    try {
      const response = await fetch("/api/run-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedSkill.id,
          prompt: promptInput,
          engine: selectedEngine
        })
      });

      clearInterval(interval);

      if (response.status === 402) {
        // Locked state
        const errJson = await response.json();
        setRunError(errJson.message || "License payment unlocked state is required.");
        setIsRunning(false);
        return;
      }

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Transient execution error occurred on Backend server.");
      }

      const resJson = await response.json();
      setLastResult(resJson.execution);
      setOfflineNotice(resJson.offlineSimulated);
      
      // Notify parent to aggregate stats
      onNewExecutionLogged();
    } catch (err: any) {
      setRunError(err?.message || "Failed to initialize standard connection.");
    } finally {
      setIsRunning(false);
      clearInterval(interval);
    }
  };

  const isUnlocked = selectedSkill.tier === "free" || user.purchasedSkills.includes(selectedSkill.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Sidebar Selection Grid */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
        <div>
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Available Agents</h4>
          <p className="text-xxs text-slate-500 mt-0.5">Toggle active modules inside the playground</p>
        </div>

        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {skills.map((skill) => {
            const unlocked = skill.tier === "free" || user.purchasedSkills.includes(skill.id);
            const active = skill.id === selectedSkillId;

            return (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                  active
                    ? "bg-indigo-950/70 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                    : "bg-slate-950/70 border-slate-850 hover:bg-slate-850 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-1.5 rounded transition-transform ${
                    active 
                      ? "bg-indigo-600 text-white" 
                      : unlocked 
                        ? "bg-slate-900 text-slate-400 group-hover:scale-105" 
                        : "bg-slate-900 text-amber-500 group-hover:scale-105"
                  }`}>
                    <SkillIcon name={skill.icon} className="h-4 w-4" />
                  </div>
                  
                  <div className="truncate text-xs">
                    <span className="font-semibold block truncate leading-tight group-hover:text-indigo-400 transition-colors">
                      {skill.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {skill.category}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {unlocked ? (
                    <Unlock className="h-3 w-3 text-emerald-500" title="Accessible" />
                  ) : (
                    <Lock className="h-3 w-3 text-amber-500" title="Premium Locked" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Play Interface and execution node */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between">
        
        {/* Selected Agent Header summary */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-3 items-center">
            <div className="p-2.5 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-900/40">
              <SkillIcon name={selectedSkill.icon} className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">{selectedSkill.name}</h5>
              <p className="text-xxs text-slate-500 tracking-wide font-mono mt-0.5 uppercase">
                Developer: <strong className="text-slate-300">{user?.name || "Rufus Tent"}</strong> &bull; <span className="text-indigo-400 font-mono">{user?.email || "rufustent@gmail.com"}</span>
              </p>
            </div>
          </div>

          <div>
            {!isUnlocked ? (
              <span className="inline-block bg-amber-950 text-amber-400 border border-amber-900/60 font-mono font-medium text-[10px] px-2.5 py-0.5 rounded uppercase">
                License Purchase Needed
              </span>
            ) : (
              <span className="inline-block bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-mono font-medium text-[10px] px-2.5 py-0.5 rounded uppercase">
                Licensed to {user?.name || "Rufus Tent"}
              </span>
            )}
          </div>
        </div>

        {/* Play interface workspace */}
        <div className="p-5 min-h-[300px] relative flex flex-col justify-between">
          {!isUnlocked && (
            // Gated barrier overlay UX
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-fade-in z-10">
              <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-xl shadow-amber-950/60 animate-bounce">
                <Lock className="h-5 w-5" />
              </div>
              <h5 className="text-base font-bold text-white">License Authentication Required</h5>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                The "{selectedSkill.name}" sandbox node requires a verified license. Authenticate payment with your credentials (<strong>{user?.name || "Rufus Tent"}</strong> &bull; <span className="text-indigo-400 font-mono">{user?.email || "rufustent@gmail.com"}</span>) to unlock lifetime access.
              </p>
              
              <button
                onClick={() => onOpenCheckout(selectedSkill)}
                className="mt-5 px-5 py-2 text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-500 hover:scale-[1.01] text-slate-950 rounded-lg transition shadow-lg shadow-amber-600/10 cursor-pointer"
              >
                Unlock Lifetime License (${selectedSkill.price.toFixed(2)})
              </button>
            </div>
          )}

          {/* Prompt Form */}
          <form onSubmit={handleExecute} className="space-y-4">
            {/* Template placeholder instruction */}
            <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg flex items-start gap-2.5 text-xxs text-slate-400 leading-relaxed">
              <Terminal className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-mono text-white block uppercase tracking-wider mb-0.5">Underlying SRE directives</span>
                {selectedSkill.systemInstruction}
              </div>
            </div>

            {/* Engine & Paid API Provider Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xxs font-mono">
                <label className="text-slate-400 font-bold uppercase tracking-wider block">Select Processing Engine / API</label>
                {onOpenApis && (
                  <button
                    type="button"
                    onClick={onOpenApis}
                    className="text-purple-400 hover:text-purple-300 font-semibold text-[10px] cursor-pointer underline underline-offset-2"
                  >
                    View Connected APIs & Status
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEngine("gemini")}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer font-mono ${
                    selectedEngine === "gemini"
                      ? "bg-indigo-950/80 border-indigo-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block">Gemini 3.5</span>
                    <span className="text-[9px] text-emerald-400 font-bold">Standard</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Google GenAI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEngine("openai")}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer font-mono ${
                    selectedEngine === "openai"
                      ? "bg-purple-950/80 border-purple-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block">OpenAI GPT-4o</span>
                    <span className="text-[9px] text-amber-400 font-bold uppercase">Paid API</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">OPENAI_API_KEY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEngine("anthropic")}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer font-mono ${
                    selectedEngine === "anthropic"
                      ? "bg-purple-950/80 border-purple-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block">Claude 3.5</span>
                    <span className="text-[9px] text-amber-400 font-bold uppercase">Paid API</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">ANTHROPIC_API_KEY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEngine("custom_paid")}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer font-mono ${
                    selectedEngine === "custom_paid"
                      ? "bg-amber-950/80 border-amber-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block">Custom API</span>
                    <span className="text-[9px] text-amber-400 font-bold uppercase">Special</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">CUSTOM_PAID_API_URL</span>
                </button>
              </div>
            </div>

            {/* Prompt input field text area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xxs font-mono">
                <label className="text-slate-400 font-bold uppercase tracking-wider block">Agent Playground Input</label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Load Template Query
                </button>
              </div>

              <textarea
                value={promptInput}
                onChange={(e) => { setPromptInput(e.target.value); setRunError(""); }}
                placeholder={`Prompt layout: "${selectedSkill.placeholderPrompt}"`}
                rows={4}
                className="w-full text-xs bg-slate-950 text-white placeholder-slate-700 p-3 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 font-mono"
                disabled={isRunning}
              />
            </div>

            {/* Error messaging inside sandbox */}
            {runError && (
              <div className="bg-red-950/60 border border-red-900/50 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{runError}</p>
              </div>
            )}

            {/* Execution action toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-850">
              <div className="text-xxs font-mono text-slate-500">
                {isRunning ? (
                  <span className="flex items-center gap-1.5 text-indigo-400 animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    Executing: {(elapsedMs / 1000).toFixed(2)}s
                  </span>
                ) : (
                  <span>Ready to dispatch compute payload</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isRunning || !promptInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-40 select-none cursor-pointer border border-indigo-400/20"
              >
                <Play className="h-3 w-3 fill-current" />
                DISPATCH TO {selectedEngine === "custom_paid" ? "CUSTOM API" : selectedEngine.toUpperCase()}
              </button>
            </div>
          </form>

          {/* Loader Stage block */}
          {isRunning && (
            <div className="mt-5 p-5 bg-slate-950 border border-indigo-900/40 rounded-lg flex flex-col items-center justify-center space-y-3.5 animate-pulse text-center">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div>
                <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase font-medium">{loadingStep}</p>
                <p className="text-xxs text-slate-500 font-sans mt-1">Elapsed duration: {(elapsedMs / 1000).toFixed(1)}s (API Thread Gate)</p>
              </div>
            </div>
          )}

          {/* AI Success output panel */}
          {lastResult && !isRunning && (
            <div className="mt-5 bg-slate-950 border border-slate-800/80 rounded-lg overflow-hidden animate-fade-in">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-850 flex flex-wrap justify-between items-center text-[10px] font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-400 font-semibold uppercase">API execution return</span>
                  {lastResult.engineUsed && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-semibold text-[9px]">
                      {lastResult.engineUsed}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {offlineNotice && (
                    <span className="text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-900/50 uppercase text-[9px] font-bold">
                      ⚠️ Sandbox Simulation
                    </span>
                  )}
                  <button
                    onClick={() => handleCopyCode(lastResult.response)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Renders output in raw readable text with styling */}
              <div className="p-4 leading-relaxed font-mono whitespace-pre-wrap text-xxs text-emerald-400/90 max-h-[300px] overflow-y-auto select-text bg-[#030712] selection:bg-slate-800">
                {lastResult.response}
              </div>

              <div className="px-3.5 py-2 border-t border-slate-850 bg-slate-950 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-[9px] font-mono text-slate-500 gap-1">
                <span>Calculated Volume: ~{lastResult.tokens} tokens &bull; Session: <strong className="text-slate-400">@{lastResult.username || "rufus_tent"}</strong></span>
                <span>Authorized License: <strong className="text-emerald-400">{user?.email || "rufustent@gmail.com"}</strong></span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
