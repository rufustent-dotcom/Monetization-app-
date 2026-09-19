import React, { useState } from "react";
import { AgentSkill, UserSession } from "../types";
import { X, CreditCard, ShieldCheck, Loader2, Info, Check, User, Mail, Sparkles, Building } from "lucide-react";

interface CheckoutModalProps {
  skill: AgentSkill | null;
  user: UserSession;
  onClose: () => void;
  onPurchaseSuccess: (skillId: string, paymentMethod: "stripe" | "paypal", amount: number) => void;
}

export default function CheckoutModal({ skill, user, onClose, onPurchaseSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  
  // Pre-filled with user credentials: Rufus Tent & rufustent@gmail.com
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("414");
  const [cardName, setCardName] = useState(user?.name || "Rufus Tent");
  const [billingEmail, setBillingEmail] = useState(user?.email || "rufustent@gmail.com");
  
  const [paypalEmail, setPaypalEmail] = useState(user?.email || "rufustent@gmail.com");
  const [paypalPassword, setPaypalPassword] = useState("•••••••••••••••");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!skill) return null;

  // Auto-fill test payment values with Rufus Tent credentials
  const handleAutoFillStripe = () => {
    setCardNumber("4242 •••• •••• 4242");
    setCardExpiry("12/28");
    setCardCvc("414");
    setCardName(user?.name || "Rufus Tent");
    setBillingEmail(user?.email || "rufustent@gmail.com");
    setErrorMsg("");
  };

  const handleAutoFillPayPal = () => {
    setPaypalEmail(user?.email || "rufustent@gmail.com");
    setPaypalPassword("•••••••••••••••");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple validation guards
    if (paymentMethod === "stripe" && (!cardNumber || !cardExpiry || !cardCvc || !cardName || !billingEmail)) {
      setErrorMsg("Please fill out all credit card parameters, or select 'Quick Auto-Fill'.");
      return;
    }
    if (paymentMethod === "paypal" && (!paypalEmail || !paypalPassword)) {
      setErrorMsg("Please enter your PayPal email credentials or click 'Quick Auto-Fill'.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate real webhook authentication phases with user credentials
    try {
      setProcessingStep(`Contacting gateway for ${user?.name || "Rufus Tent"}...`);
      await new Promise(r => setTimeout(r, 650));
      
      setProcessingStep(
        paymentMethod === "stripe" 
          ? `Authorizing 3D-Secure Stripe checkout token for ${cardName}...` 
          : `Authorizing instant PayPal instant-settlement ticket for ${paypalEmail}...`
      );
      await new Promise(r => setTimeout(r, 850));

      setProcessingStep(`Routing payout to ${user?.merchantEmail || "rufustent@gmail.com"}...`);
      await new Promise(r => setTimeout(r, 600));

      // Execute purchase in endpoint
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skill.id,
          paymentMethod: paymentMethod,
          amount: skill.price,
          payerName: paymentMethod === "stripe" ? cardName : (user?.name || "Rufus Tent"),
          payerEmail: paymentMethod === "stripe" ? billingEmail : paypalEmail
        })
      });

      if (!response.ok) {
        throw new Error("Payment capture endpoint returned an error response.");
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative"
        id="checkout_modal_container"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-mono tracking-wider font-bold text-white uppercase">License Checkout Secure</span>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-5">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Product Info Segment */}
              <div className="bg-slate-950/90 rounded-lg p-3.5 border border-slate-800">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">License Object</span>
                <h4 className="text-white font-semibold text-sm mt-0.5">{skill.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{skill.description}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-400">Total charge:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">${skill.price.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Verified Merchant & Payout Destination Banner */}
              <div className="bg-slate-950 border border-indigo-900/50 rounded-lg p-2.5 flex items-center justify-between text-xxs font-mono">
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Merchant Recipient</span>
                    <span className="text-white font-semibold">{user?.merchantName || "Rufus Tent"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase">Direct Payout</span>
                  <span className="text-emerald-400 font-semibold">{user?.merchantEmail || "rufustent@gmail.com"}</span>
                </div>
              </div>

              {/* Gateway Channel Selector Tab */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("stripe"); setErrorMsg(""); }}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                    paymentMethod === "stripe" 
                      ? "bg-slate-850 text-white shadow border border-indigo-500/40" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Stripe Checkout
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("paypal"); setErrorMsg(""); }}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                    paymentMethod === "paypal" 
                      ? "bg-slate-850 text-white shadow border border-sky-500/40" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  PayPal Gateway
                </button>
              </div>

              {/* Form Input fields */}
              {paymentMethod === "stripe" ? (
                // STRIPE FIELDS (Pre-populated with Rufus Tent credentials)
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                      Credit Card Details
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillStripe}
                      className="text-[9px] font-mono text-indigo-400 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Auto-Fill Rufus Credentials
                    </button>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">Cardholder Name</label>
                    <input 
                      type="text" 
                      value={cardName}
                      placeholder="Rufus Tent"
                      onChange={(e) => setCardName(e.target.value)}
                      className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2 w-full font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Billing Email */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">Billing Email</label>
                    <input 
                      type="email" 
                      value={billingEmail}
                      placeholder="rufustent@gmail.com"
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2 w-full font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Card Number Input */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      placeholder="4242 •••• •••• 4242"
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2 w-full font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Expiry and CVC Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">Expiration</label>
                      <input 
                        type="text" 
                        value={cardExpiry}
                        placeholder="12/28"
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2 w-full font-mono text-center outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">CVC Code</label>
                      <input 
                        type="password" 
                        value={cardCvc}
                        placeholder="414"
                        maxLength={4}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2 w-full font-mono text-center outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // PAYPAL FIELDS (Pre-populated with Rufus Tent credentials)
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                      PayPal Account Credentials
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillPayPal}
                      className="text-[9px] font-mono text-sky-400 bg-sky-950/45 hover:bg-sky-950/80 border border-sky-900/50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Auto-Fill Rufus Account
                    </button>
                  </div>

                  {/* PayPal Email */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">PayPal ID / Email</label>
                    <input 
                      type="email" 
                      value={paypalEmail}
                      placeholder="rufustent@gmail.com"
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2.5 w-full font-mono outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* PayPal Password */}
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 mb-0.5 block uppercase">PayPal Password</label>
                    <input 
                      type="password" 
                      value={paypalPassword}
                      placeholder="Sandbox Password"
                      onChange={(e) => setPaypalPassword(e.target.value)}
                      className="bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg border border-slate-800 p-2.5 w-full font-mono outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="bg-sky-950/30 border border-sky-900/40 rounded p-2 text-xxs text-sky-300 font-mono">
                    Account: <strong>{user?.name || "Rufus Tent"}</strong> &bull; Receiver: <strong>{user?.merchantEmail || "rufustent@gmail.com"}</strong>
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
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                  <p className="text-xs text-slate-300 font-mono text-center animate-pulse">{processingStep}</p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 text-xs font-mono font-bold tracking-wider rounded-lg bg-amber-600 hover:bg-amber-500 hover:scale-[1.01] text-slate-950 shadow-lg shadow-amber-600/10 cursor-pointer text-center uppercase transition-all"
                >
                  Pay ${skill.price.toFixed(2)} USD as {paymentMethod === "stripe" ? cardName : (user?.name || "Rufus Tent")}
                </button>
              )}

              {/* Security & Credentials info disclaimer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>🛡️ PCI-DSS Authenticated</span>
                <span className="text-slate-400 font-semibold">{user?.email || "rufustent@gmail.com"}</span>
              </div>
            </form>
          ) : (
            // SUCCESSFUL TRANSACTION VIEW WITH RUFUS TENT CREDENTIALS
            <div className="text-center py-5 space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded px-2.5 py-0.5">
                  Payment Authorized
                </span>
                <h4 className="text-white font-bold text-base mt-2">Payment Captured Successfully!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Lifetime license keys for <strong>{skill.name}</strong> registered and confirmed.
                </p>
              </div>

              {/* Receipt with explicit credentials */}
              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 font-mono text-xxs text-slate-400 space-y-1.5 text-left max-w-sm mx-auto">
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span>License Holder:</span>
                  <span className="text-white font-semibold">{user?.name || "Rufus Tent"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span>Billing / Account:</span>
                  <span className="text-indigo-400 font-semibold">{user?.email || "rufustent@gmail.com"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span>Merchant Payee:</span>
                  <span className="text-white font-semibold">{user?.merchantName || "Rufus Tent"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span>Payout Destination:</span>
                  <span className="text-emerald-400 font-semibold">{user?.merchantEmail || "rufustent@gmail.com"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span>Gateway Method:</span>
                  <span className="text-slate-300 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Receipt Delivered To:</span>
                  <span className="text-emerald-400 truncate">{user?.email || "rufustent@gmail.com"}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onPurchaseSuccess(skill.id, paymentMethod, skill.price);
                  onClose();
                }}
                className="inline-block px-6 py-2.5 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition shadow-lg shadow-indigo-600/15"
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
