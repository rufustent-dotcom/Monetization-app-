import React, { useState } from "react";
import { UserSession } from "../types";
import { X, ShieldCheck, Mail, User, Building, CreditCard, Check, AlertCircle, Sparkles, Key } from "lucide-react";

interface CredentialsModalProps {
  user: UserSession;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserSession) => void;
}

export default function CredentialsModal({ user, onClose, onUpdateUser }: CredentialsModalProps) {
  const [name, setName] = useState(user.name || "Rufus Tent");
  const [email, setEmail] = useState(user.email || "rufustent@gmail.com");
  const [merchantEmail, setMerchantEmail] = useState(user.merchantEmail || "rufustent@gmail.com");
  const [businessName, setBusinessName] = useState(user.businessName || "Rufus Tent AI Solutions");
  const [stripeAccountId, setStripeAccountId] = useState(user.stripeAccountId || "acct_rufus_tent_live_884");
  const [paypalMerchantId, setPaypalMerchantId] = useState(user.paypalMerchantId || "rufustent@gmail.com");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/user/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          merchantName: name,
          merchantEmail,
          businessName,
          stripeAccountId,
          paypalMerchantId
        })
      });

      if (!res.ok) {
        throw new Error("Failed to persist credentials to server database.");
      }

      const data = await res.json();
      onUpdateUser(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Error saving credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative"
        id="credentials_modal_container"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono tracking-wider font-bold text-white uppercase">
              Payment & Account Credentials
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Status Badge */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3.5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-300 block">Verified Active Credentials</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Your credentials (<strong className="text-white">{user.name}</strong> &bull; <strong className="text-emerald-400">{user.email}</strong>) are automatically stamped across all checkout forms, payment receipts, merchant payout ledger entries, and developer session telemetry.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                  <User className="h-3 w-3 text-indigo-400" />
                  Account Holder / Payee
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2.5 outline-none focus:border-indigo-500 text-xs"
                  placeholder="Rufus Tent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-indigo-400" />
                  Primary User Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2.5 outline-none focus:border-indigo-500 text-xs"
                  placeholder="rufustent@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                <Building className="h-3 w-3 text-indigo-400" />
                Storefront / Business Entity Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2.5 outline-none focus:border-indigo-500 text-xs"
                placeholder="Rufus Tent AI Solutions"
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block mb-3">
                Payment Receiver & Payout Routing
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-amber-400" />
                    Payout Email (PayPal / Stripe)
                  </label>
                  <input
                    type="email"
                    value={merchantEmail}
                    onChange={(e) => setMerchantEmail(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2.5 outline-none focus:border-indigo-500 text-xs"
                    placeholder="rufustent@gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Stripe Connect Account ID
                  </label>
                  <input
                    type="text"
                    value={stripeAccountId}
                    onChange={(e) => setStripeAccountId(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2.5 outline-none focus:border-indigo-500 text-xs"
                    placeholder="acct_rufus_tent_live_884"
                    required
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-950/60 border border-red-900/60 rounded p-2.5 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="bg-emerald-950/70 border border-emerald-900/70 rounded p-2.5 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>Credentials successfully synchronized across all payments & telemetry!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Apply & Update Everywhere"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
