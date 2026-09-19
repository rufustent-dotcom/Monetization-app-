import React, { useEffect, useState } from "react";
import { ApiStatus, UserSession } from "../types";
import { X, Server, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Cpu, CreditCard, Search, Terminal, Lock, ExternalLink } from "lucide-react";

interface ApiIntegrationsModalProps {
  user: UserSession;
  onClose: () => void;
}

export default function ApiIntegrationsModal({ user, onClose }: ApiIntegrationsModalProps) {
  const [apis, setApis] = useState<ApiStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apis/status")
      .then((res) => res.json())
      .then((data) => {
        setApis(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load API status:", err);
        setLoading(false);
      });
  }, []);

  const getCategoryIcon = (category: ApiStatus["category"]) => {
    switch (category) {
      case "Special Paid AI":
        return <Cpu className="h-4 w-4 text-purple-400" />;
      case "Payment Processing":
        return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case "Search & Grounding":
        return <Search className="h-4 w-4 text-sky-400" />;
      case "Custom Enterprise":
        return <Terminal className="h-4 w-4 text-amber-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        id="api_integrations_modal"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-mono tracking-wider font-bold text-white uppercase">
              Connected APIs & Special Paid Services
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security & Secret Management Notice */}
        <div className="p-4 bg-indigo-950/30 border-b border-indigo-900/40 shrink-0">
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-white block">Server-Side Secret Key Security</span>
              <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                All API keys (Gemini, OpenAI, Anthropic, Stripe Secret, PayPal Secret, Custom) are protected server-side and never exposed to the client browser. To inject your paid API keys, open the project <strong className="text-indigo-300">Settings &gt; Secrets</strong> panel or configure them in your environment variables.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content List */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              Querying server API service registry...
            </div>
          ) : (
            apis.map((api) => (
              <div 
                key={api.id}
                className="bg-slate-950 border border-slate-800/90 rounded-lg p-3.5 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      {getCategoryIcon(api.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs">{api.name}</span>
                        {api.isPaid && (
                          <span className="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-900/60 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Paid Tier
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
                          {api.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans leading-snug">
                        {api.description}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    {api.isConfigured ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        Live Secret Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                        Ready for {api.envVar}
                      </span>
                    )}
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Env: <code className="text-slate-300 font-bold">{api.envVar}</code>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xxs font-mono text-slate-500 shrink-0">
          <div>
            Authorized Merchant Account: <strong className="text-white">{user.name}</strong> &bull; <strong className="text-emerald-400">{user.email}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-medium cursor-pointer transition self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
