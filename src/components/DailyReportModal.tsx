/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomerOrder, Product, PaymentStatus, SellerProfile } from "../types";
import { 
  X, 
  Download, 
  Send, 
  Copy, 
  HelpCircle, 
  Image as ImageIcon, 
  Palette, 
  Sparkles, 
  CheckCircle2, 
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  ShoppingBag,
  ExternalLink,
  Phone,
  MapPin
} from "lucide-react";
import { toPng } from "html-to-image";

export type DailyReportThemeId = 
  | "classic_gold" 
  | "royal_navy" 
  | "emerald_wave" 
  | "tech_dark"
  | "sweet_sakura"
  | "sunset_glow"
  | "mint_breeze"
  | "modern_clean";

interface ThemePreset {
  id: DailyReportThemeId;
  nameKh: string;
  nameEn: string;
  themeColor: string;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: "modern_clean", nameKh: "សាមញ្ញ ស្រឡះ", nameEn: "Modern Clean", themeColor: "bg-slate-400" },
  { id: "classic_gold", nameKh: "បុរាណ មាស", nameEn: "Classic Gold", themeColor: "bg-[#C4A45A]" },
  { id: "royal_navy", nameKh: "រ៉ូយ៉ាល់ ខៀវ", nameEn: "Royal Navy", themeColor: "bg-indigo-900" },
  { id: "emerald_wave", nameKh: "ប្រណីត បៃតង", nameEn: "Emerald Wave", themeColor: "bg-emerald-600" },
  { id: "tech_dark", nameKh: "យីហោ ខ្មៅ", nameEn: "Tech Dark", themeColor: "bg-slate-900 border border-slate-700" },
  { id: "sweet_sakura", nameKh: "ផ្កាឈូក ផ្អែម", nameEn: "Sweet Sakura", themeColor: "bg-[#FAA0A0]" },
  { id: "sunset_glow", nameKh: "ព្រះអាទិត្យ ភ្លឺ", nameEn: "Sunset Warmth", themeColor: "bg-amber-500" },
  { id: "mint_breeze", nameKh: "ជីអង្កាម ស្រស់", nameEn: "Mint Breeze", themeColor: "bg-emerald-400" },
];

const getThemeClasses = (themeId: DailyReportThemeId) => {
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
        cardBg: "bg-[#FFFDFD] border border-[#FAA0A0]/20",
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
        cardBg: "bg-[#1f2937] border border-slate-800",
        isDark: true,
      };
    case "classic_gold":
      return {
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
        cardBg: "bg-[#FAFDF9] border border-[#C4A45A]/20",
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
        cardBg: "bg-slate-50 border border-slate-100",
        isDark: false,
      };
    case "emerald_wave":
      return {
        container: "bg-[#FAFBF9] border-l-[12px] border-emerald-800 text-slate-800 relative overflow-hidden font-sans",
        headerDivider: "border-b border-emerald-200 pb-5",
        divider: "border-t border-dashed border-emerald-200",
        textMuted: "text-emerald-700/60",
        textTitle: "text-emerald-950 font-black",
        textHeading: "text-emerald-900 font-bold text-sm",
        badge: "bg-emerald-50 border border-emerald-200 text-emerald-800",
        tableBorder: "border border-emerald-100 rounded-xl overflow-hidden",
        trHeader: "bg-emerald-800 text-white text-[10px] uppercase font-bold",
        trBody: "divide-y divide-emerald-50 text-slate-700 hover:bg-emerald-50/20",
        totalHighlight: "text-emerald-700 font-mono",
        notesBox: "bg-emerald-50/50 border border-emerald-100 text-emerald-800",
        signatureTitle: "uppercase font-bold text-emerald-800/80",
        signatureLine: "border-t border-dashed border-emerald-200 pt-1 text-emerald-950 font-semibold",
        cardBg: "bg-[#ffffff] border border-emerald-100",
        isDark: false,
      };
    case "sunset_glow":
      return {
        container: "bg-[#FFF9F2] border-t-[12px] border-amber-500 text-amber-950 relative overflow-hidden shadow-xl",
        headerDivider: "border-b border-amber-200 pb-4",
        divider: "border-t border-dashed border-amber-200",
        textMuted: "text-amber-800/60",
        textTitle: "text-amber-900 font-bold tracking-wide",
        textHeading: "text-amber-900 font-bold text-sm",
        badge: "bg-amber-50 border border-amber-200 text-amber-800",
        tableBorder: "border border-amber-200/60 rounded-xl overflow-hidden",
        trHeader: "bg-amber-100/70 border-b border-amber-200/50 text-amber-900 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-amber-100 text-amber-950 hover:bg-amber-50/50",
        totalHighlight: "text-amber-600 font-bold font-mono",
        notesBox: "bg-amber-50/40 border border-amber-100 text-amber-700",
        signatureTitle: "uppercase font-bold text-amber-800/80",
        signatureLine: "border-t border-amber-200 pt-1 text-amber-900 font-medium",
        cardBg: "bg-white border border-amber-150",
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
        cardBg: "bg-[#fcfdfd] border border-teal-100",
        isDark: false,
      };
    case "modern_clean":
    default:
      return {
        container: "bg-white border border-slate-100 text-slate-800 relative overflow-hidden shadow-xl",
        headerDivider: "border-b border-dashed border-slate-200 pb-5",
        divider: "border-t border-dashed border-slate-200",
        textMuted: "text-slate-400 font-medium",
        textTitle: "text-slate-900 font-bold tracking-wide",
        textHeading: "text-slate-700 font-bold text-sm",
        badge: "bg-slate-100 text-slate-600",
        tableBorder: "border border-slate-100 rounded-xl overflow-hidden",
        trHeader: "bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold",
        trBody: "divide-y divide-slate-100 text-slate-700 hover:bg-slate-50",
        totalHighlight: "text-[#4f46e5] font-mono font-bold",
        notesBox: "bg-slate-100/50 border border-slate-200/55 text-slate-500",
        signatureTitle: "uppercase font-bold text-slate-500",
        signatureLine: "border-t border-slate-200/60 pt-1 text-slate-800",
        cardBg: "bg-slate-50/40 border border-slate-100",
        isDark: false,
      };
  }
};

export const generateDailyTelegramMessage = (
  dateLabel: string,
  orders: CustomerOrder[],
  products: Product[],
  exchangeRate: number
) => {
  let totalUSD = 0;
  const itemsMap: Record<string, number> = {};
  
  orders.forEach(order => {
    const subtotal = order.items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p ? p.price : 0) * item.quantity;
    }, 0);

    const discountAmount =
      order.discountType === "percentage"
        ? (subtotal * order.discountValue) / 100
        : order.discountValue;

    const total = Math.max(0, subtotal - discountAmount);
    totalUSD += total;

    order.items.forEach(item => {
      itemsMap[item.productId] = (itemsMap[item.productId] || 0) + item.quantity;
    });
  });

  const totalKHR = Math.round(totalUSD * exchangeRate);

  const itemsText = Object.entries(itemsMap).map(([pid, qty], index) => {
    const p = products.find(prod => prod.id === pid);
    const name = p ? p.name : "ផលិតផល";
    return `   ${index + 1}. ${name} (x${qty})`;
  }).join("\n");

  const ordersText = orders.map((order, index) => {
    const subtotal = order.items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p ? p.price : 0) * item.quantity;
    }, 0);
    const discountAmount = order.discountType === "percentage" ? (subtotal * order.discountValue) / 100 : order.discountValue;
    const total = Math.max(0, subtotal - discountAmount);
    let pStatusIcon = "⏳";
    if (order.paymentStatus === "Paid") pStatusIcon = "✅";
    else if (order.paymentStatus === "COD") pStatusIcon = "🛵";
    
    let line = `   ${index + 1}. ${order.customerName} - $${total.toFixed(2)} (${pStatusIcon} ${order.paymentStatus})`;
    if (order.customerPhone) {
      line += `\n      📞 លេខទូរស័ព្ទ: ${order.customerPhone}`;
    }
    if (order.customerLocation) {
      line += `\n      📍 ទីតាំងដឹកជញ្ជូន: ${order.customerLocation}`;
    }
    return line;
  }).join("\n");

  return `📊 របាយការណ៍លក់ប្រចាំថ្ងៃ (Daily Sales Summary)
--------------------------------------------
📅 សម្រាប់កាលបរិច្ឆេទ: ${dateLabel}
👥 អតិថិជនសរុប (Total Orders): ${orders.length} នាក់
--------------------------------------------
🛍️ ទំនិញលក់បានសរុប (Product Aggregates):
${itemsText || "   - គ្មានទំនិញ"}

👥 បញ្ជីឈ្មោះអ្នកបញ្ជាទិញ (Customers):
${ordersText || "   - គ្មាន"}
--------------------------------------------
💵 ប្រាក់សរុបប្រចាំថ្ងៃ (Total Revenue):
   • USD Total: $${totalUSD.toFixed(2)}
   • KHR Total (≈): ${totalKHR.toLocaleString()} ៛`;
};

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: CustomerOrder[];
  products: Product[];
  exchangeRate?: number;
  sellerProfile?: SellerProfile;
  telegramGroupLink?: string;
  dateLabel: string;
}

export default function DailyReportModal({
  isOpen,
  onClose,
  orders,
  products,
  exchangeRate = 4100,
  sellerProfile = {
    shopName: "ហាងអនឡាញម៉ូដថ្មី (NEW STYLE SHOP)",
    subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
    addressAndContact: "ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678",
    logoEmoji: "🛍️",
    signatureLabel: "NEW STYLE SHOP"
  },
  telegramGroupLink,
  dateLabel,
}: DailyReportModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<DailyReportThemeId>("modern_clean");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">(orders.length > 5 ? "list" : "grid");
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTextCopied, setIsTextCopied] = useState(false);

  if (!isOpen) return null;

  let totalUSD = 0;
  let paidCount = 0;
  let paidUSD = 0;
  let codCount = 0;
  let codUSD = 0;
  let unpaidCount = 0;
  let unpaidUSD = 0;
  const productAggregates: Record<string, number> = {};

  orders.forEach((o) => {
    // Calculate total price for order
    const subtotal = o.items.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return sum + (p ? p.price : 0) * item.quantity;
    }, 0);

    const discountAmount =
      o.discountType === "percentage"
        ? (subtotal * o.discountValue) / 100
        : o.discountValue;

    const netTotal = Math.max(0, subtotal - discountAmount);
    totalUSD += netTotal;

    // payment status breakdowns
    if (o.paymentStatus === PaymentStatus.PAID) {
      paidCount++;
      paidUSD += netTotal;
    } else if (o.paymentStatus === PaymentStatus.COD) {
      codCount++;
      codUSD += netTotal;
    } else {
      unpaidCount++;
      unpaidUSD += netTotal;
    }

    // item aggregates
    o.items.forEach((item) => {
      productAggregates[item.productId] = (productAggregates[item.productId] || 0) + item.quantity;
    });
  });

  const totalKHR = Math.round(totalUSD * exchangeRate);

  const themeClasses = getThemeClasses(selectedTheme);

  const handleExportDailyImage = () => {
    const element = document.getElementById("daily-sales-report-render-target");
    if (!element) return;

    setIsExporting(true);

    // Save and temporarily reset the scroll of the scrollable parent container
    // so html-to-image is forced to render elements off the viewport.
    const parent = element.parentElement;
    const originalScrollTop = parent ? parent.scrollTop : 0;
    const originalScrollLeft = parent ? parent.scrollLeft : 0;

    if (parent) {
      parent.scrollTop = 0;
      parent.scrollLeft = 0;
    }

    const scrollWidth = element.scrollWidth || 800;
    const scrollHeight = element.scrollHeight || 1000;

    toPng(element, {
      cacheBust: true,
      backgroundColor: themeClasses.isDark ? "#111827" : "#FFFFFF",
      width: scrollWidth,
      height: scrollHeight,
      pixelRatio: 3.5, // Crisp pixel density
      style: {
        maxHeight: "none",
        overflow: "visible",
        height: `${scrollHeight}px`,
        width: `${scrollWidth}px`,
      }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        const formattedDate = dateLabel.replace(/\s+/g, "_");
        link.download = `Daily_Sales_Record_${formattedDate}.png`;
        link.href = dataUrl;
        link.click();

        // Restore parent scrolls
        if (parent) {
          parent.scrollTop = originalScrollTop;
          parent.scrollLeft = originalScrollLeft;
        }
        setIsExporting(false);
      })
      .catch((err) => {
        console.error("Could not render sales summary image:", err);
        // Robust fallback just in case
        if (parent) {
          parent.scrollTop = originalScrollTop;
          parent.scrollLeft = originalScrollLeft;
        }
        alert("បរាជ័យក្នុងការទាញយកបន្ទះរបាយការណ៍ជារូបភាព!");
        setIsExporting(false);
      });
  };

  const handleShareToTelegram = () => {
    const textMsg = generateDailyTelegramMessage(dateLabel, orders, products, exchangeRate);
    navigator.clipboard.writeText(textMsg)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        if (telegramGroupLink) {
          window.open(telegramGroupLink, "_blank");
        } else {
          window.open("https://t.me/share/url?url=" + encodeURIComponent(""), "_blank");
        }
      })
      .catch((err) => {
        console.error("Could not copy daily sales report to clipboard:", err);
      });
  };

  const handleCopyReportData = () => {
    const textMsg = generateDailyTelegramMessage(dateLabel, orders, products, exchangeRate);
    navigator.clipboard.writeText(textMsg)
      .then(() => {
        setIsTextCopied(true);
        setTimeout(() => setIsTextCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Could not copy daily sales report text:", err);
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full border border-slate-100 shadow-2xl flex flex-col lg:flex-row h-[90vh] max-h-[850px] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Live visual rendering and theme selector */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50 border-r border-slate-150">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5 mt-2 md:mt-0">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">ប្លង់រូបភាពរបាយការណ៍សរុប</span>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase font-sans">
                <Palette className="w-4 h-4 text-rose-500" />
                សម្រិតសម្រាំងស្ទីលរូបភាព (Invoice Themes)
              </h3>
            </div>
            
            {/* Quick close button */}
            <button 
              onClick={onClose}
              className="p-1 px-2.5 bg-slate-200/75 hover:bg-slate-300/80 rounded-xl text-slate-500 hover:text-slate-800 transition-all text-xs font-bold font-sans"
            >
              បិទ (Close)
            </button>
          </div>

          {/* Theme Selector Pill buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-4 select-none font-sans">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedTheme(preset.id)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-black text-left flex items-center gap-1.5 transition-all outline-none border cursor-pointer ${
                  selectedTheme === preset.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${preset.themeColor} shrink-0`} />
                <span className="truncate">{preset.nameKh}</span>
              </button>
            ))}
          </div>

          {/* Segmented Layout Mode Selector */}
          <div className="mb-5 bg-slate-200/60 p-1 rounded-2xl flex gap-1 select-none font-sans border border-slate-300/40">
            <button
              onClick={() => setLayoutMode("grid")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer outline-none ${
                layoutMode === "grid"
                  ? "bg-white text-slate-800 shadow-xs border-slate-200"
                  : "text-slate-500 hover:text-slate-700 border-transparent"
              }`}
            >
              <span>📊</span>
              <span>ប្លង់ក្រឡា (Grid Layout)</span>
            </button>
            <button
              onClick={() => setLayoutMode("list")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer outline-none ${
                layoutMode === "list"
                  ? "bg-white text-slate-800 shadow-xs border-slate-200"
                  : "text-slate-500 hover:text-slate-700 border-transparent"
              }`}
            >
              <span>📜</span>
              <span>ប្លង់វែងបញ្ឈរ (Vertical List Layout)</span>
              {orders.length > 5 && (
                <span className="bg-indigo-600 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full animate-pulse ml-1 shrink-0">
                  ណែនាំ
                </span>
              )}
            </button>
          </div>

          {/* Sizing Container wrapper for standard Aspect print preview */}
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 flex justify-center p-4 bg-slate-300/40 select-text">
            
            {/* ACTUAL RENDER CARD TARGET (Strict 800px for beautiful side-by-side card sharing) */}
            <div 
              id="daily-sales-report-render-target" 
              className={`w-[800px] shrink-0 p-8 rounded-2xl ${themeClasses.container}`}
            >
              
              {/* Header shop details */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {sellerProfile.logoImage ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200/50 p-0.5 bg-white flex items-center justify-center">
                        <img src={sellerProfile.logoImage} alt="Shop Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <span className="text-2xl">{sellerProfile.logoEmoji}</span>
                    )}
                    <h1 className={`text-base font-black uppercase tracking-wider ${themeClasses.textTitle}`}>
                      {sellerProfile.shopName}
                    </h1>
                  </div>
                  <p className={`text-[10px] leading-relaxed font-bold ${themeClasses.textMuted}`}>
                     {sellerProfile.subtitle}
                  </p>
                  <p className={`text-[10px] leading-relaxed font-semibold ${themeClasses.textMuted}`}>
                    📍 {sellerProfile.addressAndContact}
                  </p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest rounded-lg inline-block uppercase ${themeClasses.badge}`}>
                    DAILY REPORT
                  </span>
                  <p className={`text-[9.5px] font-mono font-bold block ${themeClasses.textMuted}`}>
                    {dateLabel}
                  </p>
                </div>
              </div>

              <div className={`my-5 ${themeClasses.divider}`} />

              {/* Aggregated Sales summary KPIs cards block */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                <div className={`p-3 rounded-xl ${themeClasses.cardBg} space-y-1`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">អតិថិជនសរុប</span>
                  <span className={`text-base font-black font-mono block ${themeClasses.textTitle}`}>
                    {orders.length}
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 block font-sans"> orders total</span>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.cardBg} space-y-1`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">បានទូទាត់ Paid</span>
                  <span className="text-base font-black font-mono text-green-500 block">
                    {paidCount}
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 block font-mono"> ${paidUSD.toFixed(1)}</span>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.cardBg} space-y-1`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">រង់ចាំបង់ COD</span>
                  <span className="text-base font-black font-mono text-yellow-500 block">
                    {codCount}
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 block font-mono"> ${codUSD.toFixed(1)}</span>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.cardBg} space-y-1`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">មិនទាន់បង់ Unpaid</span>
                  <span className="text-base font-black font-mono text-rose-500 block">
                    {unpaidCount}
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 block font-mono"> ${unpaidUSD.toFixed(1)}</span>
                </div>
              </div>

              {/* Sales product items aggregates Table */}
              <div className="space-y-2.5 mb-5">
                <h3 className={`text-xs font-extrabold flex items-center gap-1.5 ${themeClasses.textTitle}`}>
                  🛍️ មុខទំនិញលក់ដាច់បំផុតប្រចាំថ្ងៃ (Sold Product Aggregates)
                </h3>
                
                <div className={themeClasses.tableBorder}>
                  <table className="w-full text-left font-sans text-[11px] border-collapse">
                    <thead>
                      <tr className={themeClasses.trHeader}>
                        <th className="py-2.5 px-3">ឈ្មោះទំនិញ (Product Name)</th>
                        <th className="py-2.5 px-3 text-center">ចំនួនលក់សរុប (Quantity Sold)</th>
                        <th className="py-2.5 px-3 text-right">តម្លៃរាយ (Unit Price)</th>
                        <th className="py-2.5 px-3 text-right">សរុបជាដុល្លារ (Subtotal)</th>
                      </tr>
                    </thead>
                    <tbody className={themeClasses.trBody}>
                      {Object.keys(productAggregates).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 font-bold">
                            គ្មានទិន្នន័យទំនិញ
                          </td>
                        </tr>
                      ) : (
                        Object.entries(productAggregates).map(([pid, qty]) => {
                          const p = products.find((prod) => prod.id === pid);
                          const name = p ? p.name : "ផលិតផល";
                          const price = p ? p.price : 0;
                          return (
                            <tr key={pid}>
                              <td className="py-2 px-3 font-bold">{name}</td>
                              <td className="py-2 px-3 text-center font-black font-mono">{qty}</td>
                              <td className="py-2 px-3 text-right font-semibold font-mono">${price.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-black font-mono">${(price * qty).toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Sales Cards Layout (Dynamic between 3-columns and full-width list) */}
              <div className="space-y-2.5 mb-5">
                <h3 className={`text-xs font-extrabold flex items-center gap-1.5 ${themeClasses.textTitle}`}>
                  👥 បញ្ជីការបញ្ជាទិញលម្អិតរបស់អតិថិជន (Customer Sales Breakdown)
                </h3>

                {orders.length === 0 ? (
                  <div className={`py-8 text-center font-bold text-xs rounded-xl border border-dashed border-slate-200 ${themeClasses.textMuted}`}>
                    គ្មានអតិថិជនទិញទំនិញនៅឡើយទេ
                  </div>
                ) : layoutMode === "list" ? (
                  /* Elegant Vertical List Layout (Tall/Long theme shape for easy viewing with many items) */
                  <div className="flex flex-col gap-3 select-text text-left">
                    {orders.map((order) => {
                      const subtotal = order.items.reduce((sum, item) => {
                        const p = products.find(prod => prod.id === item.productId);
                        return sum + (p ? p.price : 0) * item.quantity;
                      }, 0);
                      const discountAmount = order.discountType === "percentage" ? (subtotal * order.discountValue) / 100 : order.discountValue;
                      const finalTotal = Math.max(0, subtotal - discountAmount);

                      let pStatusText = "Unpaid";
                      let pStatusColor = "text-rose-600 bg-rose-50/70 border-rose-200/50";
                      if (order.paymentStatus === "Paid") {
                        pStatusText = "Paid";
                        pStatusColor = "text-green-600 bg-green-50/50 border-green-200/55";
                      } else if (order.paymentStatus === "COD") {
                        pStatusText = "COD";
                        pStatusColor = "text-yellow-600 bg-yellow-50/50 border-yellow-200/55";
                      }

                      return (
                        <div 
                          key={order.id} 
                          className={`p-4 rounded-xl flex items-center justify-between gap-4 border ${themeClasses.cardBg}`}
                        >
                          {/* Left column: Customer Details */}
                          <div className="w-[30%] shrink-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`text-[11.5px] font-black truncate max-w-[140px] tracking-wide ${themeClasses.textTitle}`}>
                                {order.customerName}
                              </h4>
                              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-black tracking-wider uppercase border shrink-0 ${pStatusColor}`}>
                                {pStatusText}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-[9.5px] text-slate-400 font-medium">
                              {order.customerPhone && (
                                <p className="flex items-center gap-1 text-slate-500 font-bold font-mono">
                                  <span>📞</span> {order.customerPhone}
                                </p>
                              )}
                              {order.customerLocation && (
                                <p className="flex items-start gap-1 leading-tight text-slate-500 font-semibold w-full">
                                  <span className="shrink-0 text-[8.5px]">📍</span> 
                                  <span className="line-clamp-2 max-w-[170px] break-words">{order.customerLocation}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Center Column: Purchased Products list (flexible inline format) */}
                          <div className="flex-1 flex flex-wrap gap-1.5 items-center justify-start">
                            {order.items.map((item, idx) => {
                              const p = products.find(prod => prod.id === item.productId);
                              const name = p ? p.name : "ផលិតផល";
                              return (
                                <div 
                                  key={idx} 
                                  className={`px-2.5 py-1 rounded-lg flex items-center gap-2 text-[10px] border shrink-0 ${
                                    themeClasses.isDark 
                                      ? "bg-slate-900/40 border-slate-800 text-slate-300" 
                                      : "bg-[#F3F4F6]/50 border-slate-100 text-slate-700"
                                  }`}
                                >
                                  <span className="font-bold">📦 {name}</span>
                                  <span className={`font-black font-mono rounded-md px-1.5 py-0.5 text-[8.5px] ${
                                    themeClasses.isDark 
                                      ? "bg-slate-800 text-slate-400" 
                                      : "bg-slate-200/50 text-slate-500"
                                  }`}>
                                    x{item.quantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Right column: Final Total */}
                          <div className="w-[18%] text-right shrink-0 space-y-0.5">
                            <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider block">សរុប (Net Total)</span>
                            <span className="text-sm font-black text-rose-500 font-mono block">
                              ${finalTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Original 3-Columns Grid layout */
                  <div className="grid grid-cols-3 gap-3 select-text text-left">
                    {orders.map((order) => {
                      const subtotal = order.items.reduce((sum, item) => {
                        const p = products.find(prod => prod.id === item.productId);
                        return sum + (p ? p.price : 0) * item.quantity;
                      }, 0);
                      const discountAmount = order.discountType === "percentage" ? (subtotal * order.discountValue) / 100 : order.discountValue;
                      const finalTotal = Math.max(0, subtotal - discountAmount);

                      let pStatusText = "Unpaid";
                      let pStatusColor = "text-rose-600 bg-rose-50/70 border-rose-200/50";
                      if (order.paymentStatus === "Paid") {
                        pStatusText = "Paid";
                        pStatusColor = "text-green-600 bg-green-50/70 border-green-200/50";
                      } else if (order.paymentStatus === "COD") {
                        pStatusText = "COD";
                        pStatusColor = "text-yellow-600 bg-yellow-50/70 border-yellow-200/50";
                      }

                      return (
                        <div 
                          key={order.id} 
                          className={`p-3.5 rounded-xl flex flex-col justify-between border ${themeClasses.cardBg}`}
                        >
                          <div className="space-y-1.5">
                            {/* Card Header: Client Name & Payment Badge */}
                            <div className="flex justify-between items-start gap-1">
                              <h4 className={`text-[11px] font-black truncate max-w-[140px] tracking-wide ${themeClasses.textTitle}`}>
                                {order.customerName}
                              </h4>
                              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-black tracking-wider uppercase border shrink-0 ${pStatusColor}`}>
                                {pStatusText}
                              </span>
                            </div>

                            {/* Card Content Indicators (Phone and address) */}
                            <div className="space-y-0.5 text-[9px] text-slate-400 font-medium">
                              {order.customerPhone && (
                                <p className="flex items-center gap-1 text-slate-500 font-bold font-mono">
                                  <span>📞</span> {order.customerPhone}
                                </p>
                              )}
                              {order.customerLocation && (
                                <p className="flex items-start gap-1 leading-tight">
                                  <span className="shrink-0 text-[8.5px]">📍</span> 
                                  <span className="line-clamp-2 max-w-[170px] break-words">{order.customerLocation}</span>
                                </p>
                              )}
                            </div>

                            {/* Order Products List inside the Card */}
                            <div className="space-y-1 mt-1">
                              {order.items.map((item, idx) => {
                                const p = products.find(prod => prod.id === item.productId);
                                const name = p ? p.name : "ផលិតផល";
                                return (
                                  <div 
                                    key={idx} 
                                    className={`px-2 py-1 rounded-lg flex justify-between items-center text-[9px] border ${
                                      themeClasses.isDark 
                                        ? "bg-slate-900/40 border-slate-800 text-slate-300" 
                                        : "bg-[#F3F4F6]/50 border-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <span className="font-bold truncate max-w-[120px]">
                                      📦 {name}
                                    </span>
                                    <span className={`font-black font-mono rounded-md px-1 py-0.5 text-[8px] shrink-0 ${
                                      themeClasses.isDark 
                                        ? "bg-slate-800 text-slate-400" 
                                        : "bg-slate-200/50 text-slate-500"
                                    }`}>
                                      x{item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Card Footer: Final net price */}
                          <div className="mt-2 pt-2 border-t border-slate-150/45 dark:border-slate-800/45 flex justify-between items-center">
                            <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">សរុប (Net)</span>
                            <span className="text-xs font-black text-rose-500 font-mono">
                              ${finalTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`my-5 ${themeClasses.divider}`} />

              {/* Bottom Totals */}
              <div className="flex justify-end">
                <div className="w-[280px] text-xs font-sans space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className={themeClasses.textMuted}>ប្រាក់ដុល្លារសរុប (USD Total):</span>
                    <span className={`text-base font-black font-mono ${themeClasses.totalHighlight}`}>
                      ${totalUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold font-sans">
                    <span className={themeClasses.textMuted}>ប្រាក់រៀលប្រហាក់ប្រហែល (≈ KHR):</span>
                    <span className="text-sm font-black font-mono text-slate-500">
                      {totalKHR.toLocaleString()} ៛
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                {sellerProfile.signatureLabel} • របាយការណ៍លក់ប្រចាំថ្ងៃស្វ័យប្រវត្ត
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Fast integration settings & Share actions guide */}
        <div className="w-full lg:w-[350px] p-6 overflow-y-auto flex flex-col justify-between bg-white text-slate-700">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">ប្លង់គ្រប់គ្រងការចែករំលែក</span>
              <h2 className="text-md font-black text-slate-800 flex items-center gap-1 font-sans">
                <Send className="w-4 h-4 text-indigo-500" />
                បញ្ជូនទៅ Telegram ភ្លាមៗ (Quick Telegram Share)
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                លោកអ្នកអាចបង្កើតរូបភាពរបាយការណ៍រួមគ្នា (Single Image Summary) តែមួយគត់សម្រាប់អតិថិជនទាំងអស់នៅថ្ងៃនេះ ហើយផ្ញើទិន្នន័យនោះទៅក្នុង Telegram យ៉ាងងាយស្រួល។
              </p>
            </div>

            {/* Step instructions */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-[11px] leading-relaxed">
              <h4 className="font-black text-slate-800 flex items-center gap-1 uppercase tracking-wider text-[10px] font-sans">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                ជំហានអនុវត្តការផ្ញើចេញ ៖
              </h4>
              <div className="space-y-3 font-medium text-slate-600">
                <div className="flex gap-2">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">1</span>
                  <p>ជ្រើសរើសស្ទីលវិក្កយបត្រ (Invoice Theme) ដែលពេញចិត្តនៅខាងឆ្វេងដៃ។</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">2</span>
                  <p>ចុចប៊ូតុង <strong>"រក្សាទុករូបភាពរបាយការណ៍"</strong> ដើម្បីដោនឡូដរូបភាព PNG ដ៏ស្រស់ស្អាតតែមួយទុក។</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">3</span>
                  <p>ចុចប៊ូតុង <strong>"ផ្ញើទិន្នន័យទៅ Telegram"</strong>។ ប្រព័ន្ធនឹងចម្លងសេចក្តីសង្ខេបរាយការណ៍ជាអក្សរទៅកាន់ក្តារចុច (System Clipboard) រួចបើកផ្ទាំង Share របស់តេឡេក្រាម ដើម្បីបិទភ្ជាប់ (Paste) រូបភាព និងអត្ថបទផ្ញើក្នុងពេលតែមួយ។</p>
                </div>
              </div>
            </div>

            {/* Output destination highlight */}
            <div className="bg-sky-50 border border-sky-150 rounded-xl p-3 text-[11.5px] text-sky-850 flex items-start gap-1.5">
              <span>✈️</span>
              <div className="space-y-0.5">
                <span className="font-bold text-sky-950 block font-sans">ក្រុមលក់ដូរដែលបានភ្ជាប់ ៖</span>
                <span className="font-mono text-[10.5px] truncate block font-bold max-w-[280px]">
                  {telegramGroupLink ? (
                    <a href={telegramGroupLink} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline flex items-center gap-1">
                      {telegramGroupLink}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ) : (
                    "មិនទាន់ភ្ជាប់ក្រុម (No group configured)"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-2 mt-6">
            {/* 1. Download image action */}
            <button
              onClick={handleExportDailyImage}
              disabled={isExporting}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer select-none font-sans"
            >
              {isExporting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                  កំពុងបង្កើតរូបភាព... (Generating PNG)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  រក្សាទុករូបភាពរបាយការណ៍ (Save PNG File)
                </>
              )}
            </button>

            {/* 1.5 Copy report text data action */}
            <button
              onClick={handleCopyReportData}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer select-none font-sans"
            >
              <Copy className="w-4 h-4" />
              <span>{isTextCopied ? "បានចម្លងអត្ថបទជោគជ័យ! (Report Copied)" : "ចម្លងទិន្នន័យរបាយការណ៍ (Copy Report Data)"}</span>
            </button>

            {/* 2. Share to Telegram action */}
            <button
              onClick={handleShareToTelegram}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer select-none font-sans"
            >
              <Send className="w-4 h-4" />
              <span>{isCopied ? "បានចម្លងអក្សរ! ចែករំលែក..." : "ផ្ញើទិន្នន័យទៅ Telegram"}</span>
            </button>
            <p className="text-[9px] text-slate-400 text-center font-semibold mt-1">
              *ប្រព័ន្ធនឹងចម្លងរបាយការណ៍សង្ខេបជាអក្សរទៅក្តារចុច (System Clipboard) ស្វ័យប្រវត្តិ។
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
