/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomerOrder, Product } from "../types";
import { 
  Send, 
  HelpCircle, 
  Check, 
  Copy, 
  ExternalLink,
  Settings,
  Users,
  Share2,
  BookmarkCheck,
  CheckCircle2,
  Link,
  MessageSquare,
  Sparkles
} from "lucide-react";

interface TelegramIntegrationProps {
  orders: CustomerOrder[];
  products: Product[];
  exchangeRate: number;
  telegramGroupLink: string;
  onUpdateTelegramGroupLink: (link: string) => void;
}

// Function to generate beautiful plain text Telegram Message
export const generatePlainTelegramMessage = (order: CustomerOrder, products: Product[], exchangeRate: number) => {
  const subtotal = order.items.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.productId);
    return sum + (p ? p.price : 0) * item.quantity;
  }, 0);

  const discountAmount =
    order.discountType === "percentage"
      ? (subtotal * order.discountValue) / 100
      : order.discountValue;

  const totalUSD = Math.max(0, subtotal - discountAmount);
  const totalKHR = Math.round(totalUSD * exchangeRate);

  const itemsDetail = order.items.map((item, index) => {
    const p = products.find(prod => prod.id === item.productId);
    const name = p ? p.name : "ផលិតផល";
    const priceStr = p ? `$${p.price.toFixed(2)}` : "";
    return `   ${index + 1}. ${name} (x${item.quantity}) ${priceStr ? `[${priceStr}]` : ""}`;
  }).join("\n");

  const dateFormatted = new Date(order.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" });

  let pStatusIcon = "⏳";
  let pStatusKhmer = "មិនទាន់បង់ប្រាក់";
  if (order.paymentStatus === "Paid") {
    pStatusIcon = "✅";
    pStatusKhmer = "បានទូទាត់រួច";
  } else if (order.paymentStatus === "COD") {
    pStatusIcon = "🛵";
    pStatusKhmer = "ដឹកជញ្ជូនថ្លៃដើម COD";
  }

  return `📦 ការបញ្ជាទិញថ្មី (New Customer Order)
--------------------------------------------
🆔 លេខវិក្កយបត្រ ID: ${order.id}
📅 កាលបរិច្ឆេទ: ${dateFormatted}
👤 អតិថិជន: ${order.customerName}
📞 លេខទូរស័ព្ទ: ${order.customerPhone}
📍 ទីតាំងដឹកជញ្ជូន: ${order.customerLocation}
--------------------------------------------
🛍️ ទំនិញលម្អិត (Items):
${itemsDetail}

💵 តម្លៃសរុប (Total USD): $${totalUSD.toFixed(2)} (≈ ${totalKHR.toLocaleString()} ៛)
${pStatusIcon} ស្ថានភាពទូទាត់: ${pStatusKhmer}
📝 សម្គាល់: ${order.notes || "គ្មាន"}
--------------------------------------------
សូមអរគុណ! (Thank You!) ✨`;
};

// Main Component
export default function TelegramIntegration({
  orders,
  products,
  exchangeRate,
  telegramGroupLink,
  onUpdateTelegramGroupLink,
}: TelegramIntegrationProps) {
  const [groupLinkInput, setGroupLinkInput] = useState(telegramGroupLink);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Bot configuration states
  const [botToken, setBotToken] = useState(() => localStorage.getItem("telegram_bot_token") || "");
  const [chatId, setChatId] = useState(() => localStorage.getItem("telegram_chat_id") || "");
  const [botEnabled, setBotEnabled] = useState(() => localStorage.getItem("telegram_bot_enabled") === "true");
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [testBotAlert, setTestBotAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSaveBotConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("telegram_bot_token", botToken.trim());
    localStorage.setItem("telegram_chat_id", chatId.trim());
    localStorage.setItem("telegram_bot_enabled", String(botEnabled));
    setTestBotAlert({ type: "success", message: "រក្សាទុកការកំណត់ Bot ជោគជ័យ! (Bot settings saved successfully!)" });
    setTimeout(() => setTestBotAlert(null), 4000);
  };

  const handleToggleBotEnabled = (val: boolean) => {
    setBotEnabled(val);
    localStorage.setItem("telegram_bot_enabled", String(val));
    setTestBotAlert({ type: "success", message: val ? "បានបើកដំណើរការបញ្ជូនស្វ័យប្រវត្តទៅកាន់ Telegram! (Auto-send Enabled)" : "បានបិទការបញ្ជូនព័ត៌មានស្វ័យប្រវត្តិ! (Auto-send Disabled)" });
    setTimeout(() => setTestBotAlert(null), 3500);
  };

  const handleTestBotConnection = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestBotAlert({ type: "error", message: "សូមបំពេញ Bot Token និង Chat ID ជាមុនសិន! (Please fill Bot Token and Chat ID first!)" });
      return;
    }

    setIsTestingBot(true);
    setTestBotAlert(null);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: "🔔 <b>ប្រព័ន្ធគ្រប់គ្រងការលក់ Sales CRM</b>\n--------------------------------------------\nការធ្វើតេស្តតភ្ជាប់គណនី Telegram Bot គឺទទួលបានជោគជ័យ! 🎉\n(Congratulations! Telegram Bot test message successful.)",
          parse_mode: "HTML",
        }),
      });

      const resData = await response.json();
      if (resData.ok) {
        setTestBotAlert({ type: "success", message: "ផ្ញើសារសាកល្បងបានជោគជ័យ! សូមពិនិត្យក្រុមតេឡេក្រាមរបស់អ្នក។ (Test message sent successfully!)" });
      } else {
        setTestBotAlert({ type: "error", message: `បរាជ័យពី Telegram API៖ ${resData.description || "Unknown Error"}` });
      }
    } catch (err: any) {
      setTestBotAlert({ type: "error", message: `កំហុសក្នុងការតភ្ជាប់៖ ${err.message || err}` });
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedLink = groupLinkInput.trim();
    // Auto prefix t.me/ if user typed custom alias without https://
    if (formattedLink && !formattedLink.startsWith("http://") && !formattedLink.startsWith("https://")) {
      if (formattedLink.startsWith("@")) {
        formattedLink = `https://t.me/${formattedLink.substring(1)}`;
      } else {
        formattedLink = `https://t.me/${formattedLink}`;
      }
    }
    onUpdateTelegramGroupLink(formattedLink);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleShareToTelegram = (order: CustomerOrder) => {
    const message = generatePlainTelegramMessage(order, products, exchangeRate);
    
    // Copy to clipboard auto as backup / easy paste
    navigator.clipboard.writeText(message).catch(err => {
      console.warn("Could not copy text to clipboard:", err);
    });

    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 3000);

    // Deep link text sharing url
    const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
    
    // Open share sheet in elegant wrapper
    window.open(shareUrl, "_blank");
  };

  const handleDirectOpenGroupAndCopy = (order: CustomerOrder) => {
    const message = generatePlainTelegramMessage(order, products, exchangeRate);
    
    // Copy to clipboard
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopiedOrderId(order.id);
        setTimeout(() => setCopiedOrderId(null), 3000);
        
        // Open group link directly
        const targetLink = telegramGroupLink || "https://t.me";
        window.open(targetLink, "_blank");
      })
      .catch(err => {
        alert("បរាជ័យក្នុងការចម្លងអត្ថបទ៖ " + err);
      });
  };

  return (
    <div id="telegram-group-link-dashboard" className="space-y-6">
      
      {/* Dynamic Navigation Title */}
      <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-sky-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500 animate-pulse-subtle" />
            ការតភ្ជាប់ ឬបញ្ជូនទៅកាន់ក្រុម Telegram (Direct Telegram Group Linker)
          </h2>
          <p className="text-xs text-sky-900/80 leading-relaxed font-semibold">
            មិនបាច់ដំឡើង Bot Telegram! ប្រព័ន្ធនឹងចម្លងព័ត៌មានវិក្កយបត្រស្វ័យប្រវត្តិ និងបើកទំព័រឆាត Telegram របស់លោកអ្នកដើម្បីផ្ញើចេញភ្លាមៗត្រឹមតែ ១ ឃ្លីក (One-click instant receipt forwarding).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-xl text-xs font-black select-none shadow-sm shadow-sky-500/20">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-ping"></span>
          រចនាប័ទ្ម៖ គ្មានបត (No Setup Required)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Helper Instructions Form (Left) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
            <HelpCircle className="w-4 h-4 text-sky-500" />
            របៀបប្រើសរុបប្រព័ន្ធ (Khmer Step-by-Step User Guide)
          </h3>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px]">1</span>
              <div>
                <p className="font-bold text-slate-850 text-[12px]">ភ្ជាប់តំណរក្រុមរបស់អ្នក (Link Your Group URL)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  បញ្ចូលតំណភ្ជាប់ (Link) ក្រុម Telegram, ឆាតផ្ទាល់ខ្លួន, ឬ Channel របស់លោកអ្នកនៅប្រអប់កំណត់ខាងស្តាំដៃ (ឧទាហរណ៍៖ <code>https://t.me/your_group_name</code> រឺ invite link) រួចចុចរក្សាទុក។
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px]">2</span>
              <div>
                <p className="font-bold text-slate-850 text-[12px]">ចុច "ផ្ញើទៅកាន់ Telegram" (Click Share to Telegram)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  នៅពេលមានការបញ្ជាទិញថ្មីមកដល់ លោកអ្នកគ្រាន់តែចុចប៊ូតុង <strong>"ផ្ញើទៅ Telegram"</strong>។ ប្រព័ន្ធនឹងចម្លងព័ត៌មានវិក្កយបត្រដោយស្វ័យប្រវត្តិទៅកាន់ក្តារចុច (System Clipboard) រួចបើកផ្ទាំងចែករំលែករបស់ប្រព័ន្ធ Telegram ភ្លាមៗ។
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px]">3</span>
              <div>
                <p className="font-bold text-slate-850 text-[12px]">ជ្រើសរើសក្រុម និងចុច ផ្ញើ (Single click to Select Group & Send)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  នៅពេល Telegram បើកមក សូមជ្រើសរើសក្រុមលក់ដូរដែលចង់ផ្ញើ រួចចុចប៊ូតុង <strong>Send</strong> ជាការស្រេច។ ប្រសិនបើប្រើប្រាស់ private group លោកអ្នកក៏អាចប្រើប៊ូតុង <strong>"ចម្លង &amp; បើកក្រុមផ្ទាល់"</strong> ដើម្បីចូលទៅក្នុងក្រុម រួចចុច Paste (ផ្ញើ) យ៉ាងរហ័សគ្មានឧបសគ្គ។
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
              <span className="mt-0.5 text-xs">✨</span>
              <div className="space-y-1">
                <p className="font-black">ហេតុអ្វីបានជាវិធីនេះប្រសើរជាងមុន?</p>
                <p className="font-medium opacity-90">មិនបាច់ប្រើ BotFather មិនបងបង់ថ្លៃសេវា មិនបារម្ភរឿង API Error និងដំណើរការបានលឿនបំផុតនៅលើឧបករណ៍ទូរស័ព្ទដៃ និងកុំព្យូទ័រគ្រប់ប្រភេទ!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Setup Form (Right) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Telegram automated bot configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-rose-100 pb-2.5 uppercase tracking-wider">
              <span className="p-1 bg-rose-50 text-rose-500 rounded-lg">🤖</span>
              ការតភ្ជាប់ភ្នាក់ងារ Telegram Bot ស្វ័យប្រវត្តិ
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <span className="text-[11px] font-bold text-slate-800 block">បញ្ជូនវិក្កយបត្រដោយស្វ័យប្រវត្ត</span>
                <span className="text-[9px] text-slate-400 font-semibold block">Auto-send invoices to Telegram group in real-time</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={botEnabled}
                  onChange={(e) => handleToggleBotEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <form onSubmit={handleSaveBotConfig} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  placeholder="ឧ. 123456789:ABCdefGhIJKlmNoPQ..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none transition-all focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Telegram Group / Chat ID
                </label>
                <input
                  type="text"
                  placeholder="ឧ. -1001234567890 ឬ @yourgroup_username"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none transition-all focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:translate-y-0.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  រក្សាទុកការកំណត់ Bot
                </button>

                <button
                  type="button"
                  onClick={handleTestBotConnection}
                  disabled={isTestingBot}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:translate-y-0.5 disabled:opacity-50"
                >
                  {isTestingBot ? "កំពុងសាកល្បង..." : "សាកល្បងតភ្ជាប់ (Test)"}
                </button>
              </div>
            </form>

            {testBotAlert && (
              <div className={`p-2.5 rounded-xl text-[10.5px] font-bold border ${
                testBotAlert.type === "success" 
                  ? "bg-emerald-50 border-emerald-150 text-emerald-800 animate-pulse-subtle" 
                  : "bg-rose-50 border-rose-150 text-rose-800"
              }`}>
                {testBotAlert.message}
              </div>
            )}

            <div className="p-3 bg-smokey-slate/30 border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed font-medium space-y-1">
              <span className="font-bold text-slate-600 block mb-0.5">💡 របៀបដំឡើងភ្នាក់ងារតេឡេក្រាម (Setup Instructions)៖</span>
              <p>១. ស្វែងរកគណនី <a href="https://t.me/BotFather" target="_blank" className="text-sky-600 hover:underline">@BotFather</a> លើ Telegram រួចវាយពាក្យ <code className="font-mono bg-slate-100 px-1 py-0.2 rounded font-bold">/newbot</code> ដើម្បីបង្កើត Bot និងទទួលបាន Token។</p>
              <p>២. បន្ថែំគណនី Bot ដែលទើបបង្កើតនោះ ចូលទៅក្នុងក្រុមលក់អីវ៉ាន់របស់លោកអ្នក។</p>
              <p>៣. បន្ថែមភ្នាក់ងារ <code className="font-mono text-indigo-600">@getmyid_bot</code> ក្នុងក្រុមដើម្បីទទួលបាន Chat ID (ដោយស្វែងរក ID ដែលផ្ដើមដោយ <code className="font-mono">-100</code>)។</p>
            </div>
          </div>

          {/* Telegram group link settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-sky-500" />
              ការកំណត់តំណភ្ជាប់ Telegram Group/Channel
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  តំណភ្ជាប់ក្រុម Telegram Group / Invite Link
                </label>
                <input
                  type="text"
                  placeholder="ឧទាហរណ៍: https://t.me/your_shop_orders"
                  value={groupLinkInput}
                  onChange={(e) => setGroupLinkInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 font-mono"
                  required
                />
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                  លោកអ្នកអាចប្រើ URL (t.me) ឬឈ្មោះ Username (@group)។
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:translate-y-0.5"
              >
                <Check className="w-3.5 h-3.5" />
                រក្សាទុកការកំណត់នេះ (Save Group Link)
              </button>
            </form>

            {showSuccessToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[11px] rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                បានរក្សាទុកតំណភ្ជាប់ Telegram យ៉ាងជោគជ័យ!
              </div>
            )}
          </div>

          {/* Connected state */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ព័ត៌មានក្រុមសកម្ម</span>
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-sky-100 rounded text-sky-700 font-sans font-bold text-xs">Linked</span>
              <a 
                href={telegramGroupLink || "https://t.me"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center gap-1 font-mono truncate"
              >
                {telegramGroupLink || "រង់ចាំការភ្ជាប់ក្រុម (Click Save above)"}
                {telegramGroupLink && <ExternalLink className="w-3 h-3" />}
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Manual Dispatch Center - Order List Row For Easy share */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-500" />
              បញ្ជូនវិក្កយបត្រអតិថិជនលឿន (Quick Dispatch Center)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ជ្រើសរើសវិក្កយបត្រដើម្បីចុះផ្សាយ ឬផ្ញើទៅកាន់ក្រុម Telegram ភ្លាមៗ (Dispatch bills to your staff/riders).
            </p>
          </div>
          <span className="text-xs font-black text-slate-500">
            ចំនួនវិក្កយបត្រសរុប ៖ {orders.length}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <span className="text-2xl">📝</span>
            <p className="text-xs text-slate-500 mt-1 font-bold">មិនទាន់មានវិក្កយបត្រអតិថិជនដើម្បីផ្ញើឡើយ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold text-[10px] uppercase">
                  <th className="py-2.5 px-3">លេខវិក្កយបត្រ</th>
                  <th className="py-2.5 px-3">ឈ្មោះអតិថិជន / ទូរស័ព្ទ</th>
                  <th className="py-2.5 px-3">ទីតាំង</th>
                  <th className="py-2.5 px-3 text-right">តម្លៃសរុប</th>
                  <th className="py-2.5 px-3 text-center">សកម្មភាពបញ្ជូនទៅ Telegram</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((order) => {
                  const subtotal = order.items.reduce((sum, item) => {
                    const p = products.find(prod => prod.id === item.productId);
                    return sum + (p ? p.price : 0) * item.quantity;
                  }, 0);
                  const discountAmount = order.discountType === "percentage" ? (subtotal * order.discountValue) / 100 : order.discountValue;
                  const totalUSD = Math.max(0, subtotal - discountAmount);
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">#{order.id.substring(0, 8)}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-800 text-[13px] block">{order.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{order.customerLocation}</td>
                      <td className="py-2 px-3 text-right font-black font-mono text-slate-900">${totalUSD.toFixed(2)}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Method 1: Share sheet prefilled */}
                          <button
                            onClick={() => handleShareToTelegram(order)}
                            className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-600 hover:text-white rounded-xl py-1 px-3 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Send className="w-3 h-3" />
                            ផ្ញើទៅ Telegram (Share)
                          </button>

                          {/* Method 2: Direct group clipboard trigger */}
                          <button
                            onClick={() => handleDirectOpenGroupAndCopy(order)}
                            title="ចម្លងអត្ថបទវិក្កយបត្រជាមុន រួចបើកក្រុម Telegram របស់លោកអ្នកស្វ័យប្រវត្តិ"
                            className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl py-1 px-3 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Copy className="w-3 h-3" />
                            ចម្លង &amp; បើកក្រុមផ្ទាល់
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {copiedOrderId && (
              <div className="mt-4 p-2.5 bg-sky-50 border border-sky-100 rounded-lg text-[11px] text-sky-700 font-bold flex items-center gap-1.5 animate-pulse-subtle">
                <BookmarkCheck className="w-4 h-4" />
                <span>បានចម្លងព័ត៌មានវិក្កយបត្រ (#{copiedOrderId.substring(0, 8)}) ទៅកាន់ក្តារចុច!</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
