/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomerOrder, Product, PaymentStatus, SellerProfile } from "../types";
import { Printer, X, Sparkles, CheckCircle2, Clock, AlertTriangle, Palette, HelpCircle, Download, Image as ImageIcon, Send, Copy } from "lucide-react";
import { toPng } from "html-to-image";
import { generatePlainTelegramMessage } from "./TelegramIntegration";

export type InvoiceThemeId = 
  | "modern_clean" 
  | "classic_ivory" 
  | "royal_navy" 
  | "emerald_wave" 
  | "tech_dark"
  | "sweet_sakura"
  | "vintage_parchment"
  | "cyber_neon"
  | "sunset_glow"
  | "mint_breeze";

interface ThemePreset {
  id: InvoiceThemeId;
  nameKh: string;
  nameEn: string;
  themeColor: string; // Tailwind bg for buttons
}

const THEME_PRESETS: ThemePreset[] = [
  { id: "modern_clean", nameKh: "សាមញ្ញ ស្រឡះ", nameEn: "Modern Clean", themeColor: "bg-slate-400" },
  { id: "classic_ivory", nameKh: "បុរាណ មាស", nameEn: "Classic Gold", themeColor: "bg-[#C4A45A]" },
  { id: "royal_navy", nameKh: "រ៉ូយ៉ាល់ ខៀវ", nameEn: "Royal Navy", themeColor: "bg-indigo-900" },
  { id: "emerald_wave", nameKh: "ប្រណីត បៃតង", nameEn: "Emerald Wave", themeColor: "bg-emerald-600" },
  { id: "tech_dark", nameKh: "យីហោ ខ្មៅ", nameEn: "Tech Dark", themeColor: "bg-slate-900 border border-slate-700" },
  { id: "sweet_sakura", nameKh: "ផ្កាឈូក ផ្អែម", nameEn: "Sweet Sakura", themeColor: "bg-[#FAA0A0]" },
  { id: "vintage_parchment", nameKh: "សិល្បៈ បុរាណ", nameEn: "Vintage Kraft", themeColor: "bg-[#D2B48C]" },
  { id: "cyber_neon", nameKh: "ណេអុង ទំនើប", nameEn: "Cyber Neon", themeColor: "bg-fuchsia-600" },
  { id: "sunset_glow", nameKh: "ព្រះអាទិត្យ ភ្លឺ", nameEn: "Sunset Warmth", themeColor: "bg-amber-500" },
  { id: "mint_breeze", nameKh: "ជីអង្កាម ស្រស់", nameEn: "Mint Breeze", themeColor: "bg-emerald-400" },
];

const getThemeClasses = (themeId: InvoiceThemeId) => {
  switch (themeId) {
    case "sweet_sakura":
      return {
        container: "bg-[#FFF5F5] border-[6px] border-[#FAA0A0]/45 text-[#5D3A3A] relative overflow-hidden shadow-2xl",
        headerDivider: "border-b border-[#FAA0A0]/30 pb-4",
        divider: "border-t border-dashed border-[#FAA0A0]/35",
        textMuted: "text-[#AF8282]",
        textTitle: "text-[#7C4040] font-black tracking-wide",
        textHeading: "text-[#7C4040] font-bold text-sm",
        badge: "bg-[#FFE3E3] border border-[#FAA0A0]/30 text-[#8C4646]",
        tableBorder: "border border-[#FAA0A0]/20 rounded-xl overflow-hidden",
        trHeader: "bg-[#FFD3D3] border-b border-[#FAA0A0]/25 text-[#7C4040] text-[10px] uppercase font-bold",
        trBody: "divide-y divide-[#FAA0A0]/15 text-[#5D3A3A] hover:bg-[#FFEBEB]/40",
        totalHighlight: "text-[#C05050] font-mono",
        notesBox: "bg-[#FFF0F0]/60 border border-[#FAA0A0]/15 text-[#865B5B]",
        signatureTitle: "uppercase font-bold text-[#AF8282]",
        signatureLine: "border-t border-[#FAA0A0]/30 pt-1 text-[#5D3A3A] font-medium",
        isDark: false,
      };
    case "vintage_parchment":
      return {
        container: "bg-[#F5E6CD] border-[3px] border-[#8B7355]/60 text-[#3E2723] relative overflow-hidden shadow-2xl font-serif",
        headerDivider: "border-b border-double border-[#8B7355]/40 pb-4",
        divider: "border-t border-double border-[#8B7355]/40",
        textMuted: "text-[#6D4C41] font-serif",
        textTitle: "text-[#2E1A17] font-black tracking-wider uppercase font-serif",
        textHeading: "text-[#3E2723] font-bold text-sm font-serif",
        badge: "bg-[#E6D4BA] border border-[#8B7355]/30 text-[#4E342E]",
        tableBorder: "border border-[#8B7355]/30 rounded-lg overflow-hidden",
        trHeader: "bg-[#DECBAA] border-b border-[#8B7355]/30 text-[#3E2723] text-[10px] uppercase font-bold",
        trBody: "divide-y divide-[#8B7355]/20 text-[#3E2723] hover:bg-[#EEDCBE]",
        totalHighlight: "text-[#5D4037] font-serif font-bold",
        notesBox: "bg-[#ECD9BA]/35 border border-[#8B7355]/20 text-[#5D4037]",
        signatureTitle: "uppercase font-bold text-[#6D4C41]",
        signatureLine: "border-t border-[#8B7355]/40 pt-1 text-[#3E2723] font-medium",
        isDark: false,
      };
    case "cyber_neon":
      return {
        container: "bg-[#0F0A1A] text-[#D8B4FE] border-2 border-fuchsia-500/65 relative overflow-hidden shadow-2xl shadow-fuchsia-500/10 font-mono",
        headerDivider: "border-b border-fuchsia-500/30 pb-4",
        divider: "border-t border-dashed border-fuchsia-500/30",
        textMuted: "text-[#8B5CF6]",
        textTitle: "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-extrabold tracking-widest uppercase",
        textHeading: "text-cyan-400 font-black text-sm",
        badge: "bg-[#1D122D] border border-fuchsia-500/40 text-fuchsia-400",
        tableBorder: "border border-fuchsia-500/25 rounded-md overflow-hidden",
        trHeader: "bg-[#23153A] text-cyan-300 border-b border-fuchsia-500/20 text-[10px] uppercase font-mono font-black",
        trBody: "divide-y divide-fuchsia-500/15 text-[#E9D5FF] hover:bg-[#25183E]/60",
        totalHighlight: "text-fuchsia-400 font-mono drop-shadow-[0_0_4px_rgba(236,72,153,0.3)] font-black",
        notesBox: "bg-[#170C2A] border border-fuchsia-500/15 text-[#C084FC]",
        signatureTitle: "uppercase font-bold text-[#8B5CF6] text-[9px]",
        signatureLine: "border-t border-fuchsia-500/30 pt-1 text-white font-medium",
        isDark: true,
      };
    case "sunset_glow":
      return {
        container: "bg-[#FFF9F2] border-t-[12px] border-amber-500 text-amber-950 relative overflow-hidden shadow-xl",
        headerDivider: "border-b border-amber-200 pb-4",
        divider: "border-t border-dashed border-amber-200",
        textMuted: "text-amber-800/60",
        textTitle: "text-amber-900 font-bold tracking-wide",
        textHeading: "text-amber-900 font-bold text-sm",
        badge: "bg-amber-50 border border-amber-150 text-amber-800",
        tableBorder: "border border-amber-200/60 rounded-xl overflow-hidden",
        trHeader: "bg-amber-100/70 border-b border-amber-200/50 text-amber-900 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-amber-100 text-amber-950 hover:bg-amber-50/50",
        totalHighlight: "text-amber-600 font-bold font-mono",
        notesBox: "bg-amber-50/40 border border-amber-100 text-amber-700",
        signatureTitle: "uppercase font-bold text-amber-800/80",
        signatureLine: "border-t border-amber-200 pt-1 text-amber-900 font-medium",
        isDark: false,
      };
    case "mint_breeze":
      return {
        container: "bg-[#F0FDF4] border-t-[12px] border-emerald-400 border-b-[6px] border-teal-500 text-teal-950 relative overflow-hidden shadow-xl",
        headerDivider: "border-b border-teal-200 pb-4",
        divider: "border-t border-dashed border-teal-200",
        textMuted: "text-teal-700/70",
        textTitle: "text-teal-900 font-extrabold tracking-wide",
        textHeading: "text-teal-900 font-bold text-sm",
        badge: "bg-teal-50 border border-teal-150 text-teal-800",
        tableBorder: "border border-teal-150 rounded-xl overflow-hidden",
        trHeader: "bg-teal-100/60 text-teal-900 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-teal-50 text-teal-950 hover:bg-teal-50/30",
        totalHighlight: "text-teal-600 font-mono font-bold",
        notesBox: "bg-teal-50/30 border border-teal-100 text-teal-700",
        signatureTitle: "uppercase font-bold text-teal-800/80",
        signatureLine: "border-t border-teal-200 pt-1 text-teal-950 font-medium",
        isDark: false,
      };
    case "classic_ivory":
      return {
        // Double ornate gold-bronze vintage border, warm antique cream paper background
        container: "bg-[#FAFAF3] border-[10px] border-double border-[#C4A45A] text-[#4A3B2B] relative overflow-hidden",
        headerDivider: "border-b border-[#C4A45A]/40 pb-4",
        divider: "border-t border-dashed border-[#C4A45A]/40",
        textMuted: "text-[#8C765C]",
        textTitle: "text-[#2A1E12] font-black tracking-wide font-serif",
        textHeading: "text-[#3D2C1C] font-bold text-sm",
        badge: "bg-[#F3EDE2] border border-[#C4A45A]/35 text-[#5C4524]",
        tableBorder: "border border-[#C4A45A]/25 rounded-xl overflow-hidden",
        trHeader: "bg-[#ECE4D0] border-b border-[#C4A45A]/30 text-[#4A3B2B] text-[10px] uppercase font-bold",
        trBody: "divide-y divide-[#C4A45A]/15 text-[#5C4524] hover:bg-[#FCEFD9]/30",
        totalHighlight: "text-[#8B651B] font-mono",
        notesBox: "bg-[#EFEADB]/50 border border-[#C4A45A]/15 text-[#6B523A]",
        signatureTitle: "uppercase font-bold text-[#8C765C]",
        signatureLine: "border-t border-[#C4A45A]/40 pt-1 text-[#2A1E12] font-bold",
        isDark: false,
      };
    case "royal_navy":
      return {
        container: "bg-white border-t-[14px] border-indigo-950 border-b-[14px] border-[#C4A45A] text-slate-800 relative overflow-hidden shadow-2xl",
        headerDivider: "border-b-2 border-slate-200 pb-4",
        divider: "border-t-2 border-dashed border-slate-200",
        textMuted: "text-slate-400 font-medium",
        textTitle: "text-indigo-950 font-black tracking-wide",
        textHeading: "text-indigo-900 font-bold text-sm",
        badge: "bg-indigo-50 border border-indigo-100 text-indigo-950",
        tableBorder: "border border-slate-200 rounded-lg overflow-hidden",
        trHeader: "bg-indigo-950 text-white text-[10px] uppercase font-bold",
        trBody: "divide-y divide-slate-100 text-slate-700 hover:bg-slate-50",
        totalHighlight: "text-indigo-700 font-mono",
        notesBox: "bg-slate-50 border border-slate-200 text-slate-600",
        signatureTitle: "uppercase font-bold text-indigo-900",
        signatureLine: "border-t-2 border-slate-200 pt-1 text-slate-800 font-semibold",
        isDark: false,
      };
    case "emerald_wave":
      return {
        container: "bg-[#FAFBF9] border-l-[12px] border-emerald-800 text-slate-800 relative overflow-hidden",
        headerDivider: "border-b border-emerald-150 pb-5",
        divider: "border-t border-dashed border-emerald-200",
        textMuted: "text-emerald-700/60",
        textTitle: "text-emerald-950 font-black",
        textHeading: "text-emerald-900 font-bold text-sm",
        badge: "bg-emerald-50 border border-emerald-150 text-emerald-800",
        tableBorder: "border border-emerald-100 rounded-xl overflow-hidden",
        trHeader: "bg-emerald-850 text-white text-[10px] uppercase font-bold",
        trBody: "divide-y divide-emerald-50 text-slate-700 hover:bg-emerald-50/20",
        totalHighlight: "text-emerald-700 font-mono",
        notesBox: "bg-emerald-50/50 border border-emerald-100 text-emerald-800",
        signatureTitle: "uppercase font-bold text-emerald-800/80",
        signatureLine: "border-t border-dashed border-emerald-200 pt-1 text-emerald-950 font-semibold",
        isDark: false,
      };
    case "tech_dark":
      return {
        container: "bg-[#111827] text-slate-200 border-[3px] border-slate-800 relative overflow-hidden shadow-2xl",
        headerDivider: "border-b border-slate-800 pb-4",
        divider: "border-t border-dashed border-slate-800",
        textMuted: "text-slate-400",
        textTitle: "text-white font-extrabold tracking-wide",
        textHeading: "text-indigo-300 font-black text-sm",
        badge: "bg-slate-900 border border-indigo-500/20 text-indigo-400",
        tableBorder: "border border-slate-800 rounded-xl overflow-hidden",
        trHeader: "bg-slate-950 text-indigo-300 border-b border-slate-800 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-slate-800/50 text-slate-300 hover:bg-slate-800/20",
        totalHighlight: "text-cyan-400 font-mono",
        notesBox: "bg-slate-950 border border-slate-800 text-slate-400",
        signatureTitle: "uppercase font-bold text-slate-400",
        signatureLine: "border-t border-slate-800 pt-1 text-slate-200 font-medium",
        isDark: true,
      };
    case "modern_clean":
    default:
      return {
        container: "bg-white border border-slate-100 text-slate-800 relative overflow-hidden shadow-xl",
        headerDivider: "border-b border-dashed border-slate-200 pb-5",
        divider: "border-t border-dashed border-slate-200",
        textMuted: "text-slate-400",
        textTitle: "text-slate-900 font-bold tracking-wide",
        textHeading: "text-slate-700 font-bold text-sm",
        badge: "bg-slate-100 text-slate-600",
        tableBorder: "border border-slate-100 rounded-xl overflow-hidden",
        trHeader: "bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-slate-100 text-slate-700 hover:bg-slate-50",
        totalHighlight: "text-emerald-600 font-mono",
        notesBox: "bg-slate-100/50 border border-slate-200/55 text-slate-500",
        signatureTitle: "uppercase font-bold text-slate-500",
        signatureLine: "border-t border-slate-200/60 pt-1 text-slate-800",
        isDark: false,
      };
  }
};

interface ReceiptViewProps {
  order: CustomerOrder;
  products: Product[];
  onClose: () => void;
  exchangeRate?: number;
  sellerProfile?: SellerProfile;
  telegramGroupLink?: string;
}

export default function ReceiptView({
  order,
  products,
  onClose,
  exchangeRate = 4100,
  sellerProfile = {
    shopName: "ហាងអនឡាញម៉ូដថ្មី (NEW STYLE SHOP)",
    subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
    addressAndContact: "ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678",
    signatureLabel: "ហាង ម៉ូដថ្មី",
    logoEmoji: "🇰🇭",
  },
  telegramGroupLink = "",
}: ReceiptViewProps) {
  // Theme state selector
  const [selectedTheme, setSelectedTheme] = useState<InvoiceThemeId>(() => {
    return (localStorage.getItem("invoice_background_theme") as InvoiceThemeId) || "modern_clean";
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isCopiedTelegram, setIsCopiedTelegram] = useState(false);

  const handleShareTelegram = () => {
    const message = generatePlainTelegramMessage(order, products, exchangeRate);
    
    // Auto-copy text description to keyboard clipboard
    navigator.clipboard.writeText(message)
      .then(() => {
        setIsCopiedTelegram(true);
        setTimeout(() => setIsCopiedTelegram(false), 2500);
      })
      .catch((err) => {
        console.warn("Could not copy invoice text automatically:", err);
      });

    // If they have a direct group link and want to open it immediately
    const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, "_blank");
  };

  const handleThemeChange = (newTheme: InvoiceThemeId) => {
    setSelectedTheme(newTheme);
    localStorage.setItem("invoice_background_theme", newTheme);
  };

  const theme = getThemeClasses(selectedTheme);

  // Find product by ID
  const getProduct = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  // Subtotal calculation
  const subtotal = order.items.reduce((sum, item) => {
    const p = getProduct(item.productId);
    const price = p ? p.price : 0;
    return sum + price * item.quantity;
  }, 0);

  // Discount calculation
  const discountAmount =
    order.discountType === "percentage"
      ? (subtotal * order.discountValue) / 100
      : order.discountValue;

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const rielValue = Math.round(totalAmount * exchangeRate);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export as high-resolution PNG Image
  const handleExportImage = async () => {
    const node = document.getElementById("invoice-capture-area");
    if (!node) return;

    setIsExporting(true);
    try {
      // 1. Give browser time to lay out any dynamic render changes
      await new Promise((resolve) => setTimeout(resolve, 150));

      const originalWidth = node.offsetWidth || 480;
      const originalHeight = node.offsetHeight || 640;

      // 2. Generate PNG data URL using raw style overrides
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: selectedTheme === "tech_dark" ? "#111827" : "#ffffff",
        pixelRatio: 2.5, // Ultra-sharp density for clear readable typography in messaging apps
        width: originalWidth,
        height: originalHeight,
        style: {
          margin: "0",
          borderRadius: "0",
          boxShadow: "none",
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
          transform: "scale(1)",
          transformOrigin: "top left",
          overflow: "visible",
        }
      });

      // 3. Initiate browser file download
      const link = document.createElement("a");
      const cleanCustomerName = order.customerName.trim().replace(/[\s\W]+/g, "_") || "customer";
      const cleanShopName = sellerProfile.shopName.trim().replace(/[\s\W]+/g, "_") || "shop";
      link.download = `Invoice_${cleanShopName}_${cleanCustomerName}_${order.id.substring(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image backup:", error);
      alert("ការដោនឡូដជារូបភាពបានបរាជ័យ! (Image download failed)");
    } finally {
      setIsExporting(false);
    }
  };

  // Status badges
  const getStatusBanner = () => {
    switch (order.paymentStatus) {
      case PaymentStatus.PAID:
        return (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            ទូទាត់រួចហើយ (PAID) - អរគុណសម្រាប់ការគាំទ្រ!
          </div>
        );
      case PaymentStatus.COD:
        return (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold">
            <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
            COD - ចាំទូទាត់ពេលទទួលអីវ៉ាន់ (CASH ON DELIVERY)
          </div>
        );
      case PaymentStatus.UNPAID:
        return (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            មិនទាន់បានទូទាត់ (UNPAID)
          </div>
        );
    }
  };

  return (
    <div id="receipt-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div id="receipt-container" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col my-8 max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header toolbar - hidden when printing */}
        <div className="px-5 py-4 bg-slate-50 border-b border-secondary/20 flex flex-col gap-3.5 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Palette className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">វិក្កយបត្រផ្លូវការ (Invoice Theme options)</h3>
                <p className="text-[10px] text-slate-400">អត្តសញ្ញាណប័ណ្ណ៖ {order.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareTelegram}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer select-none"
                title="ផ្ញើទៅ Telegram (Share with one click)"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isCopiedTelegram ? "បានចម្លងរួចរាល់! (Copied)" : "ផ្ញើទៅ Telegram"}</span>
              </button>
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer select-none"
                title="ទាញយកវិក្កយបត្រជារូបភាព (Save as Image)"
              >
                {isExporting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>រក្សាទុករូបភាព (Image)</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer select-none"
              >
                <Printer className="w-3.5 h-3.5" />
                បោះពុម្ព (Print)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Theme custom selector strip of buttons */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/85 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                រចនាប័ទ្មវិក្កយបត្រ (Invoice Background View)
              </span>
              <span className="text-[8px] bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.5 rounded-full uppercase">
                {THEME_PRESETS.length} design options
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleThemeChange(preset.id)}
                  title={`${preset.nameKh} (${preset.nameEn})`}
                  className={`py-2 px-1 rounded-lg text-[9px] font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer select-none ${
                    selectedTheme === preset.id
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/10"
                      : "bg-slate-50/70 hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-850"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${preset.themeColor} shadow-2xs shrink-0`} />
                  <span className="truncate max-w-full text-center tracking-tighter leading-tight">{preset.nameKh}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable container wrapper for interactive UI */}
        <div className="overflow-y-auto flex-1 no-scrollbar print:overflow-visible">
          {/* Target Capture Area with high resolution rendering */}
          <div id="invoice-capture-area" className={`p-6 md:p-8 font-sans space-y-6 relative print:p-0 ${theme.container}`}>
          
          {/* Dynamic SVG theme backgrounds rendering and watermarks */}
          {selectedTheme === "classic_ivory" && (
            <>
              {/* Gold floral decorative frames */}
              <div className="absolute top-2.5 left-2.5 w-12 h-12 border-t-2 border-l-2 border-[#C4A45A]/40 pointer-events-none"></div>
              <div className="absolute top-2.5 right-2.5 w-12 h-12 border-t-2 border-r-2 border-[#C4A45A]/40 pointer-events-none"></div>
              <div className="absolute bottom-2.5 left-2.5 w-12 h-12 border-b-2 border-l-2 border-[#C4A45A]/40 pointer-events-none"></div>
              <div className="absolute bottom-2.5 right-2.5 w-12 h-12 border-b-2 border-r-2 border-[#C4A45A]/40 pointer-events-none"></div>
              
              {/* Center watermark seal */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#C4A45A]/10 rounded-full flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-56 h-56 border border-dashed border-[#C4A45A]/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#C4A45A]/15" />
                </div>
              </div>
            </>
          )}

          {selectedTheme === "royal_navy" && (
            <>
              {/* Top premium color block ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-950 via-amber-500 to-indigo-950 pointer-events-none"></div>
              {/* Clean corner seal */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-950/[0.03] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/[0.03] rounded-full pointer-events-none"></div>
            </>
          )}

          {selectedTheme === "emerald_wave" && (
            <>
              {/* Premium wavy circular elements inside background corners */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-800/5 rounded-full pointer-events-none blur-xl"></div>
              <div className="absolute bottom-1/3 -left-16 w-32 h-32 bg-lime-700/5 rounded-full pointer-events-none blur-lg"></div>
              <div className="absolute -bottom-16 -right-10 w-44 h-44 bg-emerald-700/5 rounded-full pointer-events-none blur-2xl"></div>
            </>
          )}

          {selectedTheme === "tech_dark" && (
            <>
              {/* Grid matrices details */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none"></div>
              {/* Cyber light leak spheres */}
              <div className="absolute -top-28 -left-28 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-28 -right-28 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
            </>
          )}

          {selectedTheme === "sweet_sakura" && (
            <>
              {/* Soft pink corner gradients and cherry blossom design aura */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300/15 rounded-full pointer-events-none blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300/10 rounded-full pointer-events-none blur-3xl"></div>
              <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#FAA0A0]/45 pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#FAA0A0]/45 pointer-events-none"></div>
            </>
          )}

          {selectedTheme === "vintage_parchment" && (
            <>
              {/* Antique classic ornate borders */}
              <div className="absolute inset-2 border border-[#8B7355]/20 pointer-events-none"></div>
              <div className="absolute inset-2.5 border border-dashed border-[#8B7355]/15 pointer-events-none"></div>
              <div className="absolute top-3 left-3 w-8 h-8 border-t border-l border-[#8B7355]/30 pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-[#8B7355]/30 pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-[#8B7355]/30 pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r border-[#8B7355]/30 pointer-events-none"></div>
            </>
          )}

          {selectedTheme === "cyber_neon" && (
            <>
              {/* Grid matrix patterns */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              {/* Tech corner crosshairs */}
              <div className="absolute top-3 left-3 text-fuchsia-500/50 text-[8px] font-mono select-none pointer-events-none">[x_SYS]</div>
              <div className="absolute bottom-3 right-3 text-cyan-400/50 text-[8px] font-mono select-none pointer-events-none">[SYS_o]</div>
            </>
          )}

          {selectedTheme === "sunset_glow" && (
            <>
              {/* Golden warmth radial watermarks */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-amber-400/15 via-orange-300/10 to-transparent rounded-full pointer-events-none blur-xl"></div>
              <div className="absolute -bottom-20 -right-12 w-64 h-64 bg-amber-500/[0.04] rounded-full pointer-events-none"></div>
            </>
          )}

          {selectedTheme === "mint_breeze" && (
            <>
              {/* Cool mint and fresh green gradient overlays */}
              <div className="absolute -top-10 left-1/3 w-48 h-24 bg-emerald-300/10 rounded-full pointer-events-none blur-3xl"></div>
              <div className="absolute bottom-10 right-4 w-32 h-32 bg-teal-400/5 rounded-full pointer-events-none blur-2xl"></div>
            </>
          )}

          {/* Shop Header card structure */}
          <div className={`text-center space-y-2 pb-5 ${theme.headerDivider}`}>
            {sellerProfile.logoImage ? (
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200/50 p-1 bg-white shadow-xs flex items-center justify-center">
                  <img src={sellerProfile.logoImage} alt="Shop Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : null}
            <h1 className={`text-xl font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
              {!sellerProfile.logoImage && sellerProfile.logoEmoji && <span className="text-xl select-none">{sellerProfile.logoEmoji}</span>}
              {sellerProfile.shopName}
            </h1>
            {sellerProfile.subtitle && <p className={`text-xs font-semibold ${theme.textMuted}`}>{sellerProfile.subtitle}</p>}
            <p className={`text-[10px] ${theme.textMuted}`}>ទីតាំង និងលេខទំនាក់ទំនង៖ {sellerProfile.addressAndContact}</p>
            <div className="pt-2">
              <span className={`text-[11px] px-4 py-1.5 rounded-full font-mono font-bold tracking-wider uppercase border ${theme.badge}`}>
                វិក្កយបត្រ (INVOICE)
              </span>
            </div>
          </div>

          {/* Customer Metadata Info Grid */}
          <div className={`grid grid-cols-2 gap-x-4 gap-y-2 text-xs pb-4 ${theme.headerDivider}`}>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">ឈ្មោះអតិធិជន (Customer)</span>
              <span className={`font-semibold text-sm mt-0.5 block ${theme.isDark ? 'text-white' : 'text-slate-850'}`}>{order.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">លេខទូរស័ព្ទ (Phone Number)</span>
              <span className={`font-semibold text-sm mt-0.5 block font-mono ${theme.isDark ? 'text-cyan-400' : 'text-slate-850'}`}>{order.customerPhone}</span>
            </div>
            <div className="col-span-2 mt-2">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">អាសយដ្ឋានដឹកជញ្ជូន (Delivery Location)</span>
              <span className={`font-medium block mt-0.5 ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>{order.customerLocation}</span>
            </div>
            <div className="col-span-2 mt-2">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">កាលបរិច្ឆេទនៃការទិញ (Date of Purchase)</span>
              <span className={`font-bold block mt-0.5 ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {(() => {
                  const dateObj = new Date(order.createdAt);
                  const day = dateObj.getDate();
                  const month = dateObj.getMonth() + 1;
                  const year = dateObj.getFullYear();
                  return `ថ្ងៃទី ${day < 10 ? '0' + day : day} ខែ ${month < 10 ? '0' + month : month} ឆ្នាំ ${year}`;
                })()}
              </span>
            </div>
          </div>

          {/* Invoice Table list */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
              ព័ត៌មានទំនិញបញ្ជាទិញ (Order Items Details)
            </h4>
            <div className={theme.tableBorder}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={theme.trHeader}>
                    <th className="py-3 px-3">មុខទំនិញ (Item)</th>
                    <th className="py-3 px-3 text-center">ចំនួន (Qty)</th>
                    <th className="py-3 px-3 text-right">តម្លៃរាយ (Price)</th>
                    <th className="py-3 px-3 text-right">សរុប (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => {
                    const p = getProduct(item.productId);
                    const name = p ? p.name : "មុខទំនិញដែលបានលុប";
                    const price = p ? p.price : 0;
                    return (
                      <tr key={idx} className={theme.isDark ? "hover:bg-slate-800/10 border-b border-slate-800/45" : "hover:bg-slate-50"}>
                        <td className={`py-3 px-3 font-semibold ${theme.isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                          {name}
                        </td>
                        <td className={`py-3 px-3 text-center font-mono ${theme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.quantity}</td>
                        <td className={`py-3 px-3 text-right font-mono ${theme.isDark ? 'text-slate-350' : 'text-slate-600'}`}>${price.toFixed(2)}</td>
                        <td className={`py-3 px-3 text-right font-bold font-mono ${theme.isDark ? 'text-cyan-400' : 'text-slate-850'}`}>
                          ${(price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Calculations Sheet */}
          <div className={`space-y-2.5 pt-4 text-xs font-semibold ${theme.divider}`}>
            {/* Subtotal */}
            <div className={`flex justify-between ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>តម្លៃសរុបទំនិញ (Subtotal):</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>

            {/* Discount preset */}
            {order.discountValue > 0 && (
              <div className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border text-[11px] ${theme.isDark ? 'bg-slate-950 border-rose-500/20 text-rose-400' : 'bg-rose-50/50 border-rose-150 text-rose-700'}`}>
                <span className="flex items-center gap-1">
                  🏷️ បញ្ចុះតម្លៃ (Discount):
                  <span className={theme.isDark ? "text-rose-500 font-mono" : "text-rose-600 font-mono"}>
                    {order.discountType === "percentage" ? `(${order.discountValue}%)` : `(-$${order.discountValue.toFixed(2)})`}
                  </span>
                </span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Grand Total section */}
            <div className={`flex justify-between items-baseline pt-2 border-t font-extrabold ${theme.isDark ? 'border-slate-850' : 'border-slate-150'}`}>
              <span className={theme.isDark ? 'text-slate-200' : 'text-slate-800'}>តម្លៃសរុបចុងក្រោយ (Grand Total USD):</span>
              <span className={`text-xl font-black font-mono tracking-wider ${theme.totalHighlight}`}>
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Riel exchange value */}
            <div className={`flex justify-between items-baseline font-normal ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-[10px]">ប្រាក់រៀលសរុប (Riel Equivalent):</span>
              <span className={`text-xs font-bold font-mono ${theme.isDark ? 'text-slate-350' : 'text-slate-600'}`}>
                {formatRiel(rielValue)}
              </span>
            </div>
          </div>

          {/* Banner Status bar */}
          <div className="pt-1 no-print">
            {getStatusBanner()}
          </div>

          {/* Optional order notes */}
          {order.notes && (
            <div className={`p-3 rounded-xl text-[11px] ${theme.notesBox}`}>
              <span className={`font-bold ${theme.isDark ? 'text-slate-300' : 'text-slate-650'}`}>ចំណាំ (Order Notes):</span> {order.notes}
            </div>
          )}

          {/* Signatures & Footer lines */}
          <div className={`pt-6 grid grid-cols-2 text-center text-[10px] text-slate-400 gap-6 ${theme.divider}`}>
            <div>
              <p className={theme.signatureTitle}>ហត្ថលេខាអ្នកលក់ (Merchant Signature)</p>
              <div className="h-12"></div>
              <p className={theme.signatureLine}>{sellerProfile.signatureLabel}</p>
            </div>
            <div>
              <p className={theme.signatureTitle}>ហត្ថលេខាអ្នកទិញ (Customer Signature)</p>
              <div className="h-12"></div>
              <p className={theme.signatureLine}>{order.customerName}</p>
            </div>
          </div>

          {/* Print only footer */}
          <div className="hidden print-only text-center text-[9px] text-slate-400 pt-8 border-t border-dashed border-slate-300">
            សូមអរគុណសម្រាប់ការទិញទំនិញជាមួយយើងខ្ញុំ! វិក្កយបត្រនេះជាឯកសារផ្លូវការចេញពីប្រព័ន្ធកុំព្យូទ័រ។
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

// Format Riel function helper
function formatRiel(amount: number): string {
  return `${amount.toLocaleString()} ៛`;
}
