import React, { useState, useEffect } from "react";
import { AgentSkill } from "../types";
import { X, CreditCard, ShieldCheck, HelpCircle, Loader2, Info } from "lucide-react";

interface CheckoutModalProps {
  skill: AgentSkill | null;
  onClose: () => void;
  onPurchaseSuccess: (skillId: string, paymentMethod: "stripe" | "paypal", amount: number) => void;
}

export default function CheckoutModal({ skill, onClose, onPurchaseSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!skill) return null;

  // Auto-fill test payment values
  const handleAutoFillStripe = () => {
    setCardNumber("4242 •••• •••• 4242");
    setCardExpiry("12/28");
    setCardCvc("414");
    setCardName("Alex Developer");
    setErrorMsg("");
  };

  const handleAutoFillPayPal = () => {
    setPaypalEmail("test-sandbox-buyer@paypal.com");
    setPaypalPassword("•••••••••••••••");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple validation guards
    if (paymentMethod === "stripe" && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      setErrorMsg("Please fill out all credit card parameters, or select 'Quick Auto-Fill'.");
      return;
    }
    if (paymentMethod === "paypal" && (!paypalEmail || !paypalPassword)) {
      setErrorMsg("Please enter your sandbox PayPal email credentials or click 'Quick Auto-Fill'.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate real webhook authentication phases
    try {
      setProcessingStep("Contacting monetization gateway node...");
      await new Promise(r => setTimeout(r, 650));
      
      setProcessingStep(
        paymentMethod === "stripe" 
          ? "Authorizing 3D-Secure Stripe checkout token..." 
          : "Authorizing instant PayPal instant-settlement ticket..."
      );
      await new Promise(r => setTimeout(r, 850));

      setProcessingStep("Clearing transaction ledger on server state...");
      await new Promise(r => setTimeout(r, 600));

      // Execute purchase in sandbox endpoint
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skill.id,
          paymentMethod: paymentMethod,
          amount: skill.price
        })
      });

      if (!response.ok) {
        throw new Error("Sandbox payment capture endpoint returned an error response.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Transient server fault during payment handshakes.");
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-[#18181b] border border-[#27272a] rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative"
        id="checkout_modal_container"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-[#09090b] border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-mono tracking-wider font-bold text-white uppercase">License Checkout Secure</span>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-zinc-400 hover:text-zinc-200 transition p-1 rounded hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-5">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Product Info Segment */}
              <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a]">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">License Object</span>
                <h4 className="text-white font-semibold text-sm mt-0.5">{skill.name}</h4>
                <p className="text-xs text-zinc-400 mt-1 truncate">{skill.description}</p>
                <div className="mt-3.5 pt-3 border-t border-[#27272a] flex justify-between items-center">
                  <span className="text-xs font-mono text-zinc-400">Total charge:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">${skill.price.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Gateway Channel Selector Tab */}
              <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-1.5 rounded-lg border border-[#27272a]/80">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("stripe"); setErrorMsg(""); }}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                    paymentMethod === "stripe" 
                      ? "bg-[#18181b] text-white shadow border border-blue-500/50" 
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Stripe Form
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("paypal"); setErrorMsg(""); }}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                    paymentMethod === "paypal" 
                      ? "bg-[#18181b] text-white shadow border border-blue-500/50" 
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  PayPal Gateway
                </button>
              </div>

              {/* Form Input fields */}
              {paymentMethod === "stripe" ? (
                // STRIPE MOCK FIELDS
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">Credit Card Form</label>
                    <button
                      type="button"
                      onClick={handleAutoFillStripe}
                      className="text-[9px] font-mono text-blue-400 bg-blue-950/40 hover:bg-blue-950/80 border border-blue-900/30 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Quick Auto-Fill Test Card
                    </button>
                  </div>

                  {/* Card Number Input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cardNumber}
                      placeholder="4242 4242 4242 4242"
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Expiry and CVC Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input 
                        type="text" 
                        value={cardExpiry}
                        placeholder="MM / YY"
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono text-center outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        value={cardCvc}
                        placeholder="CVC"
                        maxLength={3}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono text-center outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <input 
                      type="text" 
                      value={cardName}
                      placeholder="Cardholder Name"
                      onChange={(e) => setCardName(e.target.value)}
                      className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                // PAYPAL MOCK FIELDS
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">PayPal Wallet Login</label>
                    <button
                      type="button"
                      onClick={handleAutoFillPayPal}
                      className="text-[9px] font-mono text-blue-450 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-900/20 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Quick Auto-Fill Account
                    </button>
                  </div>

                  {/* PayPal Email */}
                  <div>
                    <input 
                      type="email" 
                      value={paypalEmail}
                      placeholder="buyer-sandboxed-user@gmail.com"
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* PayPal Password */}
                  <div>
                    <input 
                      type="password" 
                      value={paypalPassword}
                      placeholder="Sandbox Password"
                      onChange={(e) => setPaypalPassword(e.target.value)}
                      className="bg-[#09090b] text-xs text-white placeholder-zinc-750 rounded-lg border border-[#27272a] p-2.5 w-full font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Error messages if any */}
              {errorMsg && (
                <div className="bg-red-950/60 border border-red-900/50 rounded-lg p-3 text-xs text-red-400 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Action Button */}
              {isProcessing ? (
                <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a] flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                  <p className="text-xs text-zinc-300 font-mono text-center animate-pulse">{processingStep}</p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 text-xs font-mono font-bold tracking-wider rounded-lg bg-amber-600 hover:bg-amber-500 hover:scale-[1.01] text-slate-950 shadow-lg shadow-amber-600/10 cursor-pointer text-center uppercase transition-all"
                >
                  Pay ${skill.price.toFixed(2)} USD and Unlock License
                </button>
              )}

              {/* Security info disclaimer */}
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-zinc-500 font-mono mt-2">
                <span>🛡️ PCI-DSS Compliant Developer Sandbox</span>
              </div>
            </form>
          ) : (
            // SUCCESSFUL TRANSACTION VIEW
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded px-2.5 py-0.5">
                  Sandbox Charge Authorized
                </span>
                <h4 className="text-white font-bold text-lg mt-3">Payment Captured Successfully!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  The persistent backend registry has been successfully updated with lifetime license keys for <strong>{skill.name}</strong>.
                </p>
              </div>

              <div className="bg-[#09090b] rounded-lg p-3 border border-[#27272a] font-mono text-xxs text-zinc-500 flex flex-col space-y-1 text-left max-w-xs mx-auto">
                <span className="flex justify-between"><span>Method:</span><span className="text-zinc-300 uppercase">{paymentMethod}</span></span>
                <span className="flex justify-between"><span>Reference:</span><span className="text-zinc-300 truncate">ch_{Math.floor(Math.random()*10000000)}</span></span>
                <span className="flex justify-between"><span>User state:</span><span className="text-emerald-400 font-semibold uppercase">premium unlocked</span></span>
              </div>

              <button
                onClick={() => {
                  onPurchaseSuccess(skill.id, paymentMethod, skill.price);
                  onClose();
                }}
                className="inline-block px-6 py-2.5 text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition shadow-lg shadow-blue-600/15"
              >
                Launch Skill in Sandbox
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
