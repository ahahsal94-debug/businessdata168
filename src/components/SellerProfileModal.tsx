/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { SellerProfile } from "../types";
import { X, Store, Info, PhoneCall, HelpCircle, Save, RotateCcw, Upload, Trash2, Image, Eye, EyeOff } from "lucide-react";

interface SellerProfileModalProps {
  isOpen: boolean;
  profile: SellerProfile;
  onSave: (updated: SellerProfile) => void;
  onClose: () => void;
}

export default function SellerProfileModal({
  isOpen,
  profile,
  onSave,
  onClose,
}: SellerProfileModalProps) {
  const [shopName, setShopName] = useState(profile.shopName);
  const [subtitle, setSubtitle] = useState(profile.subtitle);
  const [addressAndContact, setAddressAndContact] = useState(profile.addressAndContact);
  const [signatureLabel, setSignatureLabel] = useState(profile.signatureLabel);
  const [logoEmoji, setLogoEmoji] = useState(profile.logoEmoji || "🇰🇭");
  const [logoBase64, setLogoBase64] = useState<string | undefined>(profile.logoImage);
  const [geminiApiKey, setGeminiApiKey] = useState(profile.geminiApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"info" | "brand" | "api">("info");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync internal state with profile prop when modal is opened or profile changes
  useEffect(() => {
    if (isOpen) {
      setShopName(profile.shopName);
      setSubtitle(profile.subtitle);
      setAddressAndContact(profile.addressAndContact);
      setSignatureLabel(profile.signatureLabel);
      setLogoEmoji(profile.logoEmoji || "🇰🇭");
      setLogoBase64(profile.logoImage);
      setGeminiApiKey(profile.geminiApiKey || "");
      setValidationError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const defaultProfile: SellerProfile = {
    shopName: "ហាងអនឡាញម៉ូដថ្មី (NEW STYLE SHOP)",
    subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
    addressAndContact: "ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678",
    signatureLabel: "ហាង ម៉ូដថ្មី",
    logoEmoji: "🇰🇭",
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationError("ទំហំរូបភាពធំជាង 2MB មិនត្រូវបានអនុញ្ញាតទេ (Image size must be less than 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
        setValidationError(null);
      };
      reader.onerror = () => {
        setValidationError("ការអានរូបភាពបានបរាជ័យ (Failed to read image file)");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("តើអ្នកចង់កំណត់ព័ត៌មានប្រវត្តិរូបអ្នកលក់ទៅជាលំនាំដើមវិញមែនទេ? (Reset to default?)")) {
      setShopName(defaultProfile.shopName);
      setSubtitle(defaultProfile.subtitle);
      setAddressAndContact(defaultProfile.addressAndContact);
      setSignatureLabel(defaultProfile.signatureLabel);
      setLogoEmoji(defaultProfile.logoEmoji);
      setLogoBase64(undefined);
      setGeminiApiKey("");
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setValidationError("សូមបំពេញឈ្មោះហាង (Please enter shop name)");
      return;
    }
    if (!addressAndContact.trim()) {
      setValidationError("សូមបំពេញអាសយដ្ឋាន ឬព័ត៌មានទំនាក់ទំនង (Please enter location or contact info)");
      return;
    }

    onSave({
      shopName: shopName.trim(),
      subtitle: subtitle.trim(),
      addressAndContact: addressAndContact.trim(),
      signatureLabel: signatureLabel.trim() || shopName.trim().substring(0, 15),
      logoEmoji: logoEmoji.trim() || "🛍️",
      logoImage: logoBase64,
      geminiApiKey: geminiApiKey.trim(),
    });
    onClose();
  };

  const emojiPresets = ["🇰🇭", "🛍️", "👗", "👟", "👜", "📱", "🏠", "🍕", "💄", "☕", "🧸", "✨"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200/85 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-left font-sans text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Title with X Close Icon */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-md font-bold text-slate-800 leading-tight">
                កំណត់ព័ត៌មានអ្នកលក់ (Merchant Profile Setup)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                កំណត់ព័ត៌មានហាង ឬអាជីវកម្មរបស់អ្នកសម្រាប់បង្ហាញលើវិក្កយបត្រ (Invoice Receipt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors overlay alert banner */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold leading-none animate-bounce">
            ⚠️ {validationError}
          </div>
        )}

        {/* Tab Selection Navigation Bar */}
        <div className="flex border border-slate-200/60 p-0.5 rounded-xl bg-slate-50/80">
          <button
            type="button"
            onClick={() => setActiveSettingsTab("info")}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              activeSettingsTab === "info"
                ? "bg-white text-indigo-900 shadow-xs border border-slate-250/50"
                : "text-slate-500 hover:text-slate-855"
            }`}
          >
            🏪 ព័ត៌មានហាង (Shop Info)
          </button>
          <button
            type="button"
            onClick={() => setActiveSettingsTab("brand")}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              activeSettingsTab === "brand"
                ? "bg-white text-indigo-900 shadow-xs border border-slate-250/50"
                : "text-slate-500 hover:text-slate-855"
            }`}
          >
            🎨 អត្តសញ្ញាណ (Branding)
          </button>
          <button
            type="button"
            onClick={() => setActiveSettingsTab("api")}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              activeSettingsTab === "api"
                ? "bg-white text-indigo-900 shadow-xs border border-slate-250/50"
                : "text-slate-500 hover:text-slate-855"
            }`}
          >
            🔑 API Secrets
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* TAB 1: Shop Info */}
          {activeSettingsTab === "info" && (
            <div className="space-y-3 animate-fade-in">
              {/* Store Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                  ឈ្មោះអាជីវកម្ម ឬហាង (Store Name) *
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-slate-850 transition-all font-sans"
                  placeholder="ឧ. ហាងអនឡាញម៉ូដថ្មី (New Style Shop)"
                  required
                />
              </div>

              {/* Subtitle / Tagline Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                  ពាក្យស្លោក ឬការពិពណ៌នាខ្លី (Subtitle Tagline)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-slate-850 transition-all font-sans"
                  placeholder="ឧ. ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់"
                />
              </div>

              {/* Address & Contact Details */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                  អាសយដ្ឋាន និងលេខទូរស័ព្ទ (Contact & Address) *
                </label>
                <input
                  type="text"
                  value={addressAndContact}
                  onChange={(e) => {
                    setAddressAndContact(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-slate-850 transition-all font-sans"
                  placeholder="ឧ. ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678"
                  required
                />
                <p className="text-[9px] text-slate-400">
                  វាលនេះនឹងបង្ហាញនៅផ្នែកខាងលើនៃវិក្កយបត្រ (This line displays right at the top of the invoice)
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Identity & Brand */}
          {activeSettingsTab === "brand" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Column: Logo & Emoji */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                      រូបភាពឡូហ្គោហាង (Store Logo Image)
                    </label>
                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-2.5 bg-slate-50 relative group hover:bg-slate-100/30 transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {logoBase64 ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200/60 shadow-xs flex items-center justify-center bg-white group/thumb">
                          <img src={logoBase64} alt="Shop Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setLogoBase64(undefined)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity rounded-xl cursor-pointer"
                            title="Remove Logo image"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-450" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer w-full"
                        >
                          <Upload className="w-5 h-5 mb-0.5 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500">បញ្ចូលរូបភាព</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                      និមិត្តសញ្ញា Emoji (Fallback Emoji)
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        maxLength={5}
                        value={logoEmoji}
                        onChange={(e) => setLogoEmoji(e.target.value)}
                        className="w-full text-center py-1 border border-slate-200 rounded-xl font-bold text-md bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all"
                        placeholder="🇰🇭"
                      />
                      <div className="grid grid-cols-4 gap-0.5">
                        {emojiPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setLogoEmoji(preset)}
                            className={`text-md p-0.5 hover:bg-indigo-50 rounded-lg transition-all border ${
                              logoEmoji === preset ? "border-indigo-400 bg-indigo-50/50 shadow-xs scale-105" : "border-transparent"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Signature & Preview */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                      ឈ្មោះសម្រាប់ហត្ថលេខាអ្នកលក់ (Merchant Signature)
                    </label>
                    <input
                      type="text"
                      value={signatureLabel}
                      onChange={(e) => setSignatureLabel(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-slate-850 transition-all font-sans"
                      placeholder="ឧ. ហាង ម៉ូដថ្មី"
                    />
                    <p className="text-[9px] text-slate-400">
                      បង្ហាញនៅខាងក្រោមផ្នែកហត្ថលេខាអ្នកលក់ (Appears at the bottom of the invoice)
                    </p>
                  </div>

                  {/* Logo Preview box */}
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ឡូហ្គោហាងបច្ចុប្បន្ន (Logo Preview)</span>
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center text-2xl font-sans overflow-hidden">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Shop Logo Preview" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                      ) : (
                        logoEmoji || "🛍️"
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">{shopName || "ឈ្មោះហាង"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API Key Secrets */}
          {activeSettingsTab === "api" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wide">
                  Gemini API Key (សម្រាប់ស្កេនរូបភាព / OCR Scan)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-slate-855 transition-all"
                    placeholder="AIzaSy..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400">
                  ប្រសិនបើទុកទំនេរ វានឹងប្រើប្រាស់ Key លំនាំដើមរបស់ប្រព័ន្ធ (If left empty, system fallback key will be used)
                </p>
              </div>

              {/* Gemini info card */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2">
                <span className="text-sm">💡</span>
                <div className="space-y-0.5 text-slate-700">
                  <h4 className="text-[11px] font-bold text-indigo-900">តើត្រូវយក Gemini API Key ពីណា? (How to get Gemini Key)</h4>
                  <p className="text-[9px] leading-relaxed">
                    បងអាចបង្កើត Key នេះដោយឥតគិតថ្លៃនៅលើវេបសាយ <strong><a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-indigo-700 hover:text-indigo-900 transition-colors">Google AI Studio</a></strong>។
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Action Controls */}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-3">
            <button
              onClick={handleResetToDefault}
              type="button"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 hover:text-rose-600 font-bold text-[11px] rounded-xl text-slate-500 flex items-center gap-1 border border-slate-200 select-none transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              លំនាំដើម (Reset)
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-600 border border-slate-200 select-none transition-all cursor-pointer"
              >
                បិទចោល (Close)
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl text-white flex items-center gap-1.5 shadow-sm active:translate-y-0.5 tracking-wide select-none transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                រក្សារទុក (Save Settings)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
