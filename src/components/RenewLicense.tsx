import React, { useState } from "react";
import { Key, Shield, LogOut, ArrowRight, Lock } from "lucide-react";

interface RenewLicenseProps {
  username: string;
  onRenewalSuccess: (newExpiry: string) => void;
  onLogout: () => void;
}

export default function RenewLicense({ username, onRenewalSuccess, onLogout }: RenewLicenseProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!licenseKey.trim()) {
      setError("សូមបញ្ចូលលេខកូដសិទ្ធិប្រើប្រាស់! (License Key is required)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          licenseKey: licenseKey.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ការបន្តសិទ្ធិដំណើរការបានបរាជ័យ (Renewal failed)");
      }

      setSuccess(true);
      setTimeout(() => {
        onRenewalSuccess(data.licenseExpiresAt);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ Server! (Failed to connect to server)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative z-10">
        
        {/* Lock Icon */}
        <div className="text-center mb-6 select-none">
          <span className="inline-flex w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 items-center justify-center text-rose-300 shadow-inner mb-3">
            <Lock className="w-8 h-8 animate-pulse" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            គណនីផុតកំណត់សិទ្ធិ!
          </h1>
          <p className="text-xs text-rose-200/80 font-medium tracking-wide mt-1">
            Subscription License Expired
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-lg mb-5 leading-relaxed text-center font-medium">
          សូមគោរព <strong>@{username}</strong> គណនីរបស់អ្នកបានផុតកំណត់សិទ្ធិប្រើប្រាស់ប្រចាំខែហើយ។ សូមបញ្ចូលលេខកូដសោរថ្មីដើម្បីបន្តដំណើរការ។
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] font-medium p-3 rounded-lg mb-5 flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <p className="leading-relaxed flex-1">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px] font-medium p-3 rounded-lg mb-5 flex items-start gap-2">
            <span className="text-sm">✅</span>
            <p className="leading-relaxed flex-1">បន្តសិទ្ធិបានជោគជ័យ! កំពុងបើកប្រព័ន្ធឡើងវិញ... (License renewed successfully! Rebooting...)</p>
          </div>
        )}

        {/* Renewal Form */}
        <form onSubmit={handleRenew} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5">
              លេខកូដសិទ្ធិថ្មី (New License Key)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-300">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="KEY-XXXX-XXXX-XXXX"
                className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-indigo-300/40 outline-none transition-all uppercase"
                disabled={success}
                required
              />
            </div>
            <p className="text-[9px] text-indigo-300/60 font-semibold mt-2 leading-relaxed">
              *ទំនាក់ទំនងមកកាន់អ្នកគ្រប់គ្រងដើម្បីទិញសោរថ្មី (Please contact the system administrator to buy a new key)
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg hover:shadow-indigo-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>បន្តសិទ្ធិប្រើប្រាស់ (Renew Now)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-slate-950/20 hover:bg-slate-950/40 border border-white/10 text-indigo-200 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញពីគណនី (Logout)</span>
            </button>
          </div>
        </form>

        {/* Footer info text */}
        <div className="text-center text-[9px] text-indigo-200/40 font-semibold mt-6 tracking-wide select-none">
          SYSTEM SECURED LEDGER • LICENSE MANAGER
        </div>
      </div>
    </div>
  );
}
