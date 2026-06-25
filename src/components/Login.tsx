import React, { useState } from "react";
import { User, Lock, Shield, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { AuthResponse } from "../types";

interface LoginProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "seller">("seller");
  const [licenseKey, setLicenseKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError(
        isLogin
          ? "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងលេខកូដសម្ងាត់! (Username and Password are required)"
          : "សូមបំពេញព័ត៌មានឱ្យបានគ្រប់ជ្រុងជ្រោយ! (Please fill all fields)"
      );
      return;
    }

    if (!isLogin) {
      if (username.trim().length < 3) {
        setError("ឈ្មោះអ្នកប្រើប្រាស់ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ! (Username must be at least 3 characters)");
        return;
      }
      if (password.length < 4) {
        setError("លេខកូដសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ! (Password must be at least 4 characters)");
        return;
      }
      if (password !== confirmPassword) {
        setError("លេខកូដសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ! (Passwords do not match)");
        return;
      }
      if (username.trim().toLowerCase() !== "adminkosal2006" && !licenseKey.trim()) {
        setError("សូមបញ្ចូលលេខកូដសិទ្ធិប្រើប្រាស់! (License Key is required)");
        return;
      }
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { username: username.trim(), password }
      : { username: username.trim(), password, role, licenseKey: licenseKey.trim() };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ការតភ្ជាប់បានបរាជ័យ (Connection failed)");
      }

      // Success
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ Server! (Failed to connect to server)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative z-10 transition-all">
        
        {/* Logo and Header */}
        <div className="text-center mb-6 select-none">
          <span className="inline-flex w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 items-center justify-center text-3xl shadow-inner mb-3">
            🇰🇭
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            ប្រព័ន្ធគ្រប់គ្រងការលក់
          </h1>
          <p className="text-xs text-indigo-200/80 font-medium tracking-wide mt-1">
            Customer & Product Management System
          </p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="flex bg-slate-950/40 border border-white/5 p-1 rounded-xl mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isLogin
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-indigo-200/60 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ចូលគណនី (Login)
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isLogin
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-indigo-200/60 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            ចុះឈ្មោះ (Register)
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] font-medium p-3 rounded-lg mb-5 flex items-start gap-2 animate-bounce">
            <span className="text-sm">⚠️</span>
            <p className="leading-relaxed flex-1">{error}</p>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div>
            <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5">
              ឈ្មោះអ្នកប្រើប្រាស់ (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-300">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ឧ. Nana, ស្រីណា"
                className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-indigo-300/40 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5">
              លេខកូដសម្ងាត់ (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-300">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold text-white placeholder-indigo-300/40 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-indigo-300 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Register Only) */}
          {!isLogin && (
            <div className="animate-fadeIn">
              <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5 animate-fadeIn">
                បញ្ជាក់លេខកូដសម្ងាត់ (Confirm Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-300">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-indigo-300/40 outline-none transition-all"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* User Role Selector (Register Only) */}
          {!isLogin && (
            <div className="animate-fadeIn">
              <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5">
                តួនាទីគណនី (Account Role)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === "seller"
                      ? "bg-sky-600/35 border-sky-500 text-sky-200"
                      : "bg-slate-950/20 border-white/10 text-indigo-200/60 hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  បុគ្គលិកលក់ (Seller)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === "admin"
                      ? "bg-indigo-600/35 border-indigo-500 text-indigo-200"
                      : "bg-slate-950/20 border-white/10 text-indigo-200/60 hover:text-white"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  អ្នកគ្រប់គ្រង (Admin)
                </button>
              </div>
            </div>
          )}

          {/* License Key Field (Register Only, except for admin) */}
          {!isLogin && username.trim().toLowerCase() !== "adminkosal2006" && (
            <div className="animate-fadeIn">
              <label className="text-[11px] font-bold text-indigo-200 tracking-wider block mb-1.5">
                លេខកូដសិទ្ធិប្រើប្រាស់ (License Key)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-300">
                  <Shield className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="KEY-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-indigo-300/40 outline-none transition-all uppercase"
                  required={!isLogin && username.trim().toLowerCase() !== "adminkosal2006"}
                />
              </div>
              <p className="text-[9px] text-indigo-300/60 font-semibold mt-1.5 leading-relaxed">
                *សូមទាក់ទងមកយើងខ្ញុំ ដើម្បីទិញសោរប្រើប្រាស់ប្រចាំខែ (Contact us to purchase your monthly license key)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg hover:shadow-indigo-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                ចូលគណនីឥឡូវនេះ (Login Now)
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                បង្កើតគណនី (Register Account)
              </>
            )}
          </button>
        </form>

        {/* Footer info text */}
        <div className="text-center text-[9px] text-indigo-200/40 font-semibold mt-6 tracking-wide select-none">
          SECURED DATABASE CONNECTION • VERSION 2.0
        </div>
      </div>
    </div>
  );
}
