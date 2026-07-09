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
}

export default function WorkspaceHub({
  skills,
  user,
  selectedSkillId,
  onSelectSkill,
  onOpenCheckout,
  onNewExecutionLogged
}: WorkspaceHubProps) {
  const [promptInput, setPromptInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [lastResult, setLastResult] = useState<ExecutionRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [runError, setRunError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState(false);
  const [geminiErrorDetails, setGeminiErrorDetails] = useState<{
    message: string;
    apiDisabled: boolean;
    activationUrl: string;
    isDeniedAccess?: boolean;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  // Auto-fill prompt input once user changes active skill
  useEffect(() => {
    if (selectedSkill) {
      setPromptInput("");
      setLastResult(null);
      setRunError("");
      setOfflineNotice(false);
      setGeminiErrorDetails(null);
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
    setGeminiErrorDetails(null);
    setLastResult(null);
    setElapsedMs(0);

    const steps = [
      "Securing sandbox thread environment...",
      "Injecting SRE system directives metrics...",
      "Forwarding prompt contents to Gemini-3.5-flash node...",
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
          prompt: promptInput
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
      if (resJson.errDetails) {
        setGeminiErrorDetails(resJson.errDetails);
      }
      
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
      <div className="lg:col-span-4 bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3.5">
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Available Agents</h4>
          <p className="text-xxs text-zinc-500 mt-0.5">Toggle active modules inside the playground</p>
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
                    ? "bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-600/10"
                    : "bg-[#09090b] border-[#27272a] hover:bg-zinc-900 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-1.5 rounded transition-transform ${
                    active 
                      ? "bg-blue-600 text-white" 
                      : unlocked 
                        ? "bg-[#18181b] text-zinc-400 group-hover:scale-105" 
                        : "bg-[#18181b] text-amber-500 group-hover:scale-105"
                  }`}>
                    <SkillIcon name={skill.icon} className="h-4 w-4" />
                  </div>
                  
                  <div className="truncate text-xs">
                    <span className="font-semibold block truncate leading-tight group-hover:text-blue-400 transition-colors">
                      {skill.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
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
      <div className="lg:col-span-8 bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col justify-between">
        
        {/* Selected Agent Header summary */}
        <div className="p-5 border-b border-[#27272a] bg-[#09090b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-3 items-center">
            <div className="p-2.5 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-900/30">
              <SkillIcon name={selectedSkill.icon} className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">{selectedSkill.name}</h5>
              <p className="text-xxs text-zinc-500 tracking-wide font-mono mt-0.5 uppercase">
                Category: {selectedSkill.category} &bull; Tier: {selectedSkill.tier}
              </p>
            </div>
          </div>

          <div>
            {!isUnlocked && (
              <span className="inline-block bg-amber-950 text-amber-400 border border-amber-900/60 font-mono font-medium text-[10px] px-2.5 py-0.5 rounded uppercase">
                Premium License Needed
              </span>
            )}
          </div>
        </div>

        {/* Play interface workspace */}
        <div className="p-5 min-h-[300px] relative flex flex-col justify-between">
          {!isUnlocked && (
            // Gated barrier overlay UX
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-fade-in z-10">
              <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-xl shadow-amber-950/60 animate-bounce">
                <Lock className="h-5 w-5" />
              </div>
              <h5 className="text-base font-bold text-white">License Authentication Required</h5>
              <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                The "{selectedSkill.name}" sandbox node is locked behind core payment checkpoints. Authenticate Stripe checkout elements to unlock instantly.
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
            <div className="bg-[#09090b] border border-[#27272a] p-3 rounded-lg flex items-start gap-2.5 text-xxs text-zinc-400 leading-relaxed">
              <Terminal className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-mono text-white block uppercase tracking-wider mb-0.5">Underlying SRE directives</span>
                {selectedSkill.systemInstruction}
              </div>
            </div>

            {/* Prompt input field text area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xxs font-mono">
                <label className="text-zinc-400 font-bold uppercase tracking-wider block">Agent Playground Input</label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  Load Template Query
                </button>
              </div>

              <textarea
                value={promptInput}
                onChange={(e) => { setPromptInput(e.target.value); setRunError(""); }}
                placeholder={`Prompt layout: "${selectedSkill.placeholderPrompt}"`}
                rows={4}
                className="w-full text-xs bg-[#09090b] text-white placeholder-zinc-700 p-3 rounded-lg border border-[#27272a] outline-none focus:border-blue-500 font-mono"
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
            <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
              <div className="text-xxs font-mono text-zinc-500">
                {isRunning ? (
                  <span className="flex items-center gap-1.5 text-blue-400 animate-pulse">
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-40 select-none cursor-pointer border border-blue-400/20"
              >
                <Play className="h-3 w-3 fill-current" />
                DIPATCH TO GEMINI
              </button>
            </div>
          </form>

          {/* Loader Stage block */}
          {isRunning && (
            <div className="mt-5 p-5 bg-[#09090b] border border-blue-900/30 rounded-lg flex flex-col items-center justify-center space-y-3.5 animate-pulse text-center">
              <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <div>
                <p className="text-xs text-blue-400 font-mono tracking-widest uppercase font-medium">{loadingStep}</p>
                <p className="text-xxs text-zinc-500 font-sans mt-1">Elapsed duration: {(elapsedMs / 1000).toFixed(1)}s (API Thread Gate)</p>
              </div>
            </div>
          )}

          {/* Custom Gemini API activation warning banner */}
          {geminiErrorDetails && !isRunning && (
            <div className="mt-4 p-4 bg-amber-950/25 border border-amber-900/50 rounded-lg text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-start gap-2.5 text-amber-500">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h6 className="font-bold uppercase tracking-wider text-[10px] font-mono">
                    {geminiErrorDetails.isDeniedAccess ? "Gemini API Access Denied" : "Gemini API Activation Required"}
                  </h6>
                  <p className="text-zinc-300 leading-relaxed font-sans text-xxs">
                    {geminiErrorDetails.message}
                  </p>
                </div>
              </div>
              {geminiErrorDetails.apiDisabled && (
                <div className="pt-2 pl-7 border-t border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                  <span className="text-zinc-500 text-[10px]">
                    To enable, authorize Generative Language API in your GCP project.
                  </span>
                  <a
                    href={geminiErrorDetails.activationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[9px] px-3 py-1 rounded cursor-pointer transition uppercase"
                  >
                    Enable Gemini API ↗
                  </a>
                </div>
              )}
              {geminiErrorDetails.isDeniedAccess && (
                <div className="pt-2 pl-7 border-t border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                  <span className="text-zinc-500 text-[10px]">
                    Please verify your Gemini API key in {"Settings > Secrets"} or contact GCP support.
                  </span>
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                    Status: Blocked / Denied Access
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Success output panel */}
          {lastResult && !isRunning && (
            <div className="mt-5 bg-[#09090b] border border-[#27272a] rounded-lg overflow-hidden animate-fade-in">
              <div className="px-3 py-2 bg-[#09090b] border-b border-[#27272a] flex justify-between items-center text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-400 font-semibold uppercase">API execution return</span>
                </div>
                <div className="flex items-center gap-3">
                  {offlineNotice && (
                    <span className="text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-900/50 uppercase text-[9px] font-bold">
                      ⚠️ Sandbox Simulation
                    </span>
                  )}
                  <button
                    onClick={() => handleCopyCode(lastResult.response)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition cursor-pointer"
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
              <div className="p-4 leading-relaxed font-mono whitespace-pre-wrap text-xxs text-emerald-400/90 max-h-[300px] overflow-y-auto select-text bg-[#09090b] selection:bg-zinc-850">
                {lastResult.response}
              </div>

              <div className="px-3.5 py-2 border-t border-[#27272a] bg-[#09090b] flex justify-between items-center text-[9px] font-mono text-zinc-500">
                <span>Calculated Volume: ~{lastResult.tokens} tokens</span>
                <span>Node server success</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
