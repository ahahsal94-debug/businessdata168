/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Product, CustomerOrder, PaymentStatus, SellerProfile, User, AuthResponse } from "./types";
import { initialProducts, initialOrders } from "./sampleData";
import DashboardStats from "./components/DashboardStats";
import ProductSection from "./components/ProductSection";
import OrderForm from "./components/OrderForm";
import OrderList from "./components/OrderList";
import ReceiptView from "./components/ReceiptView";
import SellerProfileModal from "./components/SellerProfileModal";
import CODManagement from "./components/CODManagement";
import TelegramIntegration, { generatePlainTelegramMessage } from "./components/TelegramIntegration";
import DailyReportModal from "./components/DailyReportModal";
import Login from "./components/Login";
import RenewLicense from "./components/RenewLicense";
import LicenseManager from "./components/LicenseManager";
import { Plus, Compass, ShoppingBag, Users, AlertCircle, Check, Settings, Download, Upload, ClipboardCheck, Clock, Send, LogOut, Key, Shield, Image as ImageIcon } from "lucide-react";
import { toPng } from "html-to-image";

const KH_MONTHS = [
  "មករា (January)",
  "កុម្ភៈ (February)",
  "មីនា (March)",
  "មេសា (April)",
  "ឧសភា (May)",
  "មិថុនា (June)",
  "កក្កដា (July)",
  "សីហា (August)",
  "កញ្ញា (September)",
  "តុលា (October)",
  "វិច្ឆិកា (November)",
  "ធ្នូ (December)"
];

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isMigratingData, setIsMigratingData] = useState(false);
  const [migrationPrompt, setMigrationPrompt] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // State for products and orders
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  
  // App view settings
  const [activeTab, setActiveTab] = useState<"orders" | "catalog" | "cod" | "telegram" | "licenses">("orders");
  const [isRegisteringOrder, setIsRegisteringOrder] = useState(false);
  
  // Dropdown states for daily/monthly Excel options
  const [activeReportDropdown, setActiveReportDropdown] = useState<"daily" | "monthly" | null>(null);
  const [reportToImageConfig, setReportToImageConfig] = useState<{
    type: "daily" | "monthly";
    orders: CustomerOrder[];
    dateStr: string;
    currStart: Date;
    currEnd: Date;
    prevStart: Date;
    prevEnd: Date;
  } | null>(null);
  const [analysisReportToImageConfig, setAnalysisReportToImageConfig] = useState<{
    type: "daily" | "monthly";
    orders: CustomerOrder[];
    dateStr: string;
    currStart: Date;
    currEnd: Date;
    prevStart: Date;
    prevEnd: Date;
  } | null>(null);

  // Telegram Group-link configuration
  const [telegramGroupLink, setTelegramGroupLink] = useState<string>("");
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<CustomerOrder | null>(null);
  const [preselectedDateForNewOrder, setPreselectedDateForNewOrder] = useState<string | null>(null);

  // State for display mode and calendar active date (to allow filtering stats by calendar month)
  const [displayMode, setDisplayMode] = useState<"table" | "calendar">("table");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Daily Report state
  const [viewingDailyReport, setViewingDailyReport] = useState<{ dateLabel: string; orders: CustomerOrder[] } | null>(null);

  // Seller profile state
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    shopName: "ហាងអនឡាញម៉ូដថ្មី (NEW STYLE SHOP)",
    subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
    addressAndContact: "ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678",
    signatureLabel: "ហាង ម៉ូដថ្មី",
    logoEmoji: "🇰🇭",
  });
  const [isEditingSellerProfile, setIsEditingSellerProfile] = useState(false);

  // Exchange rate setting
  const [exchangeRate, setExchangeRate] = useState<number>(() => Number(localStorage.getItem("exchange_rate") || "4100"));

  const handleUpdateExchangeRate = (rate: number) => {
    setExchangeRate(rate);
    localStorage.setItem("exchange_rate", String(rate));
  };

  // Helper to fetch with authorization header and expiration checking
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = authToken || localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 403) {
      const data = await res.clone().json().catch(() => ({}));
      if (data.error === "expired") {
        setIsExpired(true);
      }
    }
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    
    return res.json();
  };

  // 1. Initial token authentication check on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchWithAuth("/api/auth/me")
        .then((data) => {
          setCurrentUser(data.user);
          setAuthToken(token);
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setCurrentUser(null);
          setAuthToken(null);
          setIsExpired(false);
        });
    }
  }, []);

  // 2. Fetch data from DB server whenever authToken changes
  useEffect(() => {
    if (!authToken) return;

    // Fetch Products
    fetchWithAuth("/api/products")
      .then((data) => {
        setProducts(data);
        checkMigrationNeed(data);
      })
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch Orders
    fetchWithAuth("/api/orders")
      .then((data) => {
        setOrders(data);
        if (data.length > 0) {
          const sorted = [...data].sort(
            (a: CustomerOrder, b: CustomerOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setCalendarDate(new Date(sorted[0].createdAt));
        }
      })
      .catch((err) => console.error("Error fetching orders:", err));

    // Fetch Seller Profile
    fetchWithAuth("/api/settings/profile")
      .then((data) => {
        if (data && data.shopName) {
          setSellerProfile(data);
        }
      })
      .catch((err) => console.error("Error fetching profile:", err));

    // Fetch Telegram Group Link
    fetchWithAuth("/api/settings/telegram")
      .then((data) => setTelegramGroupLink(data.telegramGroupLink || ""))
      .catch((err) => console.error("Error fetching telegram link:", err));
  }, [authToken]);

  // 3. Check if we need to migrate local data
  const checkMigrationNeed = (serverProducts: Product[]) => {
    const localProducts = localStorage.getItem("shop_products");
    const localOrders = localStorage.getItem("shop_orders");
    
    if (serverProducts.length === 0 && (localProducts || localOrders)) {
      try {
        const parsedProds = localProducts ? JSON.parse(localProducts) : [];
        const parsedOrds = localOrders ? JSON.parse(localOrders) : [];
        if (parsedProds.length > 0 || parsedOrds.length > 0) {
          setMigrationPrompt(true);
        }
      } catch (e) {}
    }
  };

  // 4. Handle migrating data from localStorage to Database server
  const handleMigrateLocalData = async () => {
    if (!authToken) return;
    setIsMigratingData(true);

    try {
      const localProducts = localStorage.getItem("shop_products");
      const localOrders = localStorage.getItem("shop_orders");
      const localProfile = localStorage.getItem("shop_seller_profile");
      const localTelegram = localStorage.getItem("telegram_group_link");

      if (localProducts) {
        const prods = JSON.parse(localProducts);
        await fetchWithAuth("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: prods })
        });
        setProducts(prods);
      }

      if (localOrders) {
        const ords = JSON.parse(localOrders);
        await fetchWithAuth("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders: ords })
        });
        setOrders(ords);
      }

      if (localProfile) {
        const prof = JSON.parse(localProfile);
        await fetchWithAuth("/api/settings/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: prof })
        });
        setSellerProfile(prof);
      }

      if (localTelegram) {
        await fetchWithAuth("/api/settings/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramGroupLink: localTelegram })
        });
        setTelegramGroupLink(localTelegram);
      }

      // Success, remove old local storage values so it won't prompt again
      localStorage.removeItem("shop_products");
      localStorage.removeItem("shop_orders");
      localStorage.removeItem("shop_seller_profile");
      localStorage.removeItem("telegram_group_link");
      
      alert("ការផ្ទេរទិន្នន័យចាស់បានជោគជ័យ! (Data migrated successfully!)");
    } catch (err) {
      console.error("Migration failed:", err);
      alert("ការផ្ទេរទិន្នន័យមានបញ្ហា! (Data migration failed)");
    } finally {
      setIsMigratingData(false);
      setMigrationPrompt(false);
    }
  };

  // API wrappers to save data to database server
  const saveProductsToStorage = (updatedList: Product[]) => {
    setProducts(updatedList);
    fetchWithAuth("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: updatedList })
    }).catch((err) => console.error("Error saving products to server:", err));
  };

  const saveOrdersToStorage = (updatedList: CustomerOrder[]) => {
    setOrders(updatedList);
    fetchWithAuth("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: updatedList })
    }).catch((err) => console.error("Error saving orders to server:", err));
  };

  const handleSaveSellerProfile = (updatedProfile: SellerProfile) => {
    setSellerProfile(updatedProfile);
    fetchWithAuth("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: updatedProfile })
    }).catch((err) => console.error("Error saving profile to server:", err));
  };

  const handleUpdateTelegramGroupLink = (link: string) => {
    setTelegramGroupLink(link);
    fetchWithAuth("/api/settings/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramGroupLink: link })
    }).catch((err) => console.error("Error saving telegram settings to server:", err));
  };

  const handleLoginSuccess = (authData: AuthResponse) => {
    localStorage.setItem("auth_token", authData.token);
    setCurrentUser(authData.user);
    setAuthToken(authData.token);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setAuthToken(null);
    setProducts([]);
    setOrders([]);
    setIsExpired(false);
  };

  // Products CRUD handlers
  const handleAddProduct = (newProd: Omit<Product, "id" | "createdAt">) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [product, ...products];
    saveProductsToStorage(updated);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    saveProductsToStorage(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveProductsToStorage(updated);
  };

  // Orders CRUD handlers
  const triggerTelegramNotification = async (order: CustomerOrder, actionLabel: string) => {
    const isBotEnabled = localStorage.getItem("telegram_bot_enabled") === "true";
    const botToken = localStorage.getItem("telegram_bot_token") || "";
    const chatId = localStorage.getItem("telegram_chat_id") || "";

    if (!isBotEnabled || !botToken || !chatId) {
      return;
    }

    try {
      const plainMessage = generatePlainTelegramMessage(order, products, exchangeRate);
      const actionPrefix = actionLabel === "ថ្មី (Created)"
        ? "🔔 <b>មានការបញ្ជាទិញថ្មី! (New Order Created)</b>"
        : actionLabel === "កែប្រែ (Updated)"
          ? "⚠️ <b>មានការកែសម្រួលវិក្កយបត្រ! (Order Updated)</b>"
          : "❌ <b>វិក្កយបត្រត្រូវបានលុប! (Order Deleted)</b>";

      const fullMessage = `${actionPrefix}\n\n${plainMessage}`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullMessage,
          parse_mode: "HTML",
        }),
      });
    } catch (error) {
      console.error("Failed to send automatic Telegram notification:", error);
    }
  };

  const handleSaveOrder = (formOrder: Omit<CustomerOrder, "id" | "createdAt"> & { createdAt?: string }) => {
    if (editingOrder) {
      // Update existing
      let updatedOrder: CustomerOrder | null = null;
      const updated = orders.map((o) => {
        if (o.id === editingOrder.id) {
          updatedOrder = { ...o, ...formOrder, createdAt: formOrder.createdAt || o.createdAt };
          return updatedOrder;
        }
        return o;
      });
      saveOrdersToStorage(updated);
      setEditingOrder(null);

      if (updatedOrder) {
        triggerTelegramNotification(updatedOrder, "កែប្រែ (Updated)");
      }
    } else {
      // Create new
      const newOrder: CustomerOrder = {
        ...formOrder,
        id: `ord-${Date.now()}`,
        createdAt: formOrder.createdAt || new Date().toISOString(),
      };
      const updated = [newOrder, ...orders];
      saveOrdersToStorage(updated);
      setIsRegisteringOrder(false);
      setPreselectedDateForNewOrder(null);

      triggerTelegramNotification(newOrder, "ថ្មី (Created)");
    }
  };

  const handleDeleteOrder = (id: string) => {
    const orderToDelete = orders.find((o) => o.id === id);
    if (orderToDelete) {
      triggerTelegramNotification(orderToDelete, "លុបចោល (Deleted)");
    }
    const updated = orders.filter((o) => o.id !== id);
    saveOrdersToStorage(updated);
  };

  // Backup handlers
  const getProductSalesForPeriod = (prodId: string, startDate: Date, endDate: Date) => {
    let total = 0;
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      if (d >= startDate && d <= endDate) {
        order.items.forEach(item => {
          if (item.productId === prodId) {
            total += item.quantity;
          }
        });
      }
    });
    return total;
  };

  const handleExportDailyData = () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
      return orderDate === todayStr;
    });

    // Define date ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    exportExcelReport(todayOrders, "daily", todayStr, todayStart, todayEnd, yesterdayStart, yesterdayEnd);
  };

  const handleExportMonthlyData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
    });

    const thisMonthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    exportExcelReport(monthlyOrders, "monthly", monthStr, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd);
  };

  const exportExcelReport = (
    reportOrders: CustomerOrder[], 
    type: "daily" | "monthly", 
    dateStr: string,
    currStart: Date,
    currEnd: Date,
    prevStart: Date,
    prevEnd: Date
  ) => {
    const now = new Date();
    let title = "";
    let reportDateLabel = "";
    let prevPeriodLabel = "";
    let currentPeriodLabel = "";
    let filename = "";

    if (type === "daily") {
      title = "របាយការណ៍ប្រចាំស្តុកប្រចាំថ្ងៃ";
      reportDateLabel = now.toLocaleDateString('km-KH');
      prevPeriodLabel = "ម្សិលមិញ";
      currentPeriodLabel = "សរុបថ្ងៃនេះ";
      filename = `Daily_Report_${dateStr}.xls`;
    } else {
      title = "របាយការណ៍ប្រចាំស្តុកប្រចាំខែ";
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      reportDateLabel = `${KH_MONTHS[currentMonth]} ${currentYear}`;
      prevPeriodLabel = "ខែមុន";
      currentPeriodLabel = "សរុបខែនេះ";
      filename = `Monthly_Report_${dateStr}.xls`;
    }

    // Build product headers and rows
    let productHeader1 = "";
    let productHeader2 = "";
    products.forEach(p => {
      const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
      productHeader1 += `<th colspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; text-align: center;">${p.name} (សល់: ${stockQty})</th>`;
      productHeader2 += `
        <th style="background-color: #10B981; color: white; border: 1px solid #D1D5DB; padding: 4px; font-size: 10px; text-align: center;">ចូល</th>
        <th style="background-color: #3B82F6; color: white; border: 1px solid #D1D5DB; padding: 4px; font-size: 10px; text-align: center;">ចេញ</th>
      `;
    });

    const totalColumns = 6 + (products.length * 2);

    let rowsHtml = '';
    if (reportOrders.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="${totalColumns}" style="border: 1px solid #D1D5DB; padding: 12px; text-align: center; color: #6B7280; font-style: italic;">
            គ្មានទិន្នន័យសម្រាប់ការលក់ឡើយ (No sales data available)
          </td>
        </tr>
      `;
    } else {
      reportOrders.forEach((order, idx) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('km-KH');
        const dateCell = idx === 0 && type === "daily"
          ? `<td rowspan="${reportOrders.length}" style="border: 1px solid #D1D5DB; text-align: center; vertical-align: middle; font-weight: bold; background-color: #F9FAFB;">${orderDate}</td>`
          : (type === "monthly" ? `<td style="border: 1px solid #D1D5DB; text-align: center; background-color: #F9FAFB;">${orderDate}</td>` : '');

        let productCells = "";
        products.forEach(p => {
          const item = order.items.find(i => i.productId === p.id);
          const qtySold = item ? item.quantity : 0;
          productCells += `
            <td style="border: 1px solid #D1D5DB; text-align: center; color: #9CA3AF;">0</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #EFF6FF; color: #1E40AF;">${qtySold}</td>
          `;
        });

        rowsHtml += `
          <tr>
            <td style="border: 1px solid #D1D5DB; text-align: center; background-color: #F9FAFB; font-weight: bold;">${idx + 1}</td>
            ${dateCell}
            <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px;">${order.customerName}</td>
            <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px;">${order.customerLocation}</td>
            <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px;">${order.customerPhone || ""}</td>
            ${productCells}
            <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px; color: #4B5563;">${order.notes || ""}</td>
          </tr>
        `;
      });
    }

    // Build bottom summary table
    let summaryRowsHtml = "";
    const colorPairs = [
      { prev: "#FEF08A", current: "#FDE047" }, // yellow/amber
      { prev: "#DBEAFE", current: "#BFDBFE" }, // blue
      { prev: "#FCE7F3", current: "#FBCFE8" }, // pink
      { prev: "#D1FAE5", current: "#A7F3D0" }  // emerald/green
    ];

    products.forEach((p, idx) => {
      const prevSold = getProductSalesForPeriod(p.id, prevStart, prevEnd);
      const currSold = getProductSalesForPeriod(p.id, currStart, currEnd);
      const colors = colorPairs[idx % colorPairs.length];
      const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
      const breakdownStr = `ចាស់: ${p.oldStock || 0} | ថ្មី: ${p.newStock || 0}`;

      if (idx === 0) {
        summaryRowsHtml += `
          <tr>
            <td rowspan="${products.length * 3}" style="background-color: #10B981; color: white; font-weight: bold; border: 1px solid #D1D5DB; text-align: center; vertical-align: middle; font-size: 12px; font-family: 'Khmer OS Muol Light', Arial; width: 80px;">Total</td>
            <td style="background-color: ${colors.prev}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; width: 180px;">${prevPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; width: 60px;">${prevSold}</td>
          </tr>
          <tr>
            <td style="background-color: ${colors.current}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${currentPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${currSold}</td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; color: #334155;">ស្តុកសល់-${p.name} (${breakdownStr})</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #F8FAFC; color: #0F172A;">${stockQty}</td>
          </tr>
        `;
      } else {
        summaryRowsHtml += `
          <tr>
            <td style="background-color: ${colors.prev}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${prevPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${prevSold}</td>
          </tr>
          <tr>
            <td style="background-color: ${colors.current}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${currentPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${currSold}</td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; color: #334155;">ស្តុកសល់-${p.name} (${breakdownStr})</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #F8FAFC; color: #0F172A;">${stockQty}</td>
          </tr>
        `;
      }
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${type === "daily" ? "Daily Stock Report" : "Monthly Stock Report"}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; margin: 10px; }
        th, td { font-family: 'Khmer OS Battambang', 'Segoe UI', Arial; font-size: 11px; }
      </style>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th colspan="${totalColumns}" style="background-color: #FDE047; font-size: 16px; font-weight: bold; border: 1px solid #D1D5DB; padding: 10px; text-align: center; font-family: 'Khmer OS Muol Light', Arial;">
                ${title} (${reportDateLabel})
              </th>
            </tr>
            <tr>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 40px; text-align: center;">ល.រ</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 100px; text-align: center;">ថ្ងៃ ខែ ឆ្នាំ</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 140px; text-align: center;">ឈ្មោះ</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 180px; text-align: center;">ទីតាំង</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 120px; text-align: center;">លេខទូរស័ព្ទ</th>
              ${productHeader1}
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 150px; text-align: center;">Remark</th>
            </tr>
            <tr>
              ${productHeader2}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <br/>
        
        <table border="1" style="border-collapse: collapse; margin-left: 20px;">
          <tbody>
            ${summaryRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isPhnomPenh = (location: string): boolean => {
    const loc = location.toLowerCase().trim();
    return loc.includes("ភ្នំពេញ") || loc.includes("phnom") || loc.includes("penh") || loc.includes("pp");
  };

  const getGroupSalesForProduct = (groupOrders: CustomerOrder[], prodId: string): number => {
    let total = 0;
    groupOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === prodId) {
          total += item.quantity;
        }
      });
    });
    return total;
  };

  const exportExcelAnalysisReport = (
    reportOrders: CustomerOrder[], 
    type: "daily" | "monthly", 
    dateStr: string,
    currStart: Date,
    currEnd: Date,
    prevStart: Date,
    prevEnd: Date
  ) => {
    const now = new Date();
    let title = "";
    let reportDateLabel = "";
    let prevPeriodLabel = "";
    let currentPeriodLabel = "";
    let filename = "";

    if (type === "daily") {
      title = "របាយការណ៍វិភាគស្តុកប្រចាំថ្ងៃ";
      reportDateLabel = now.toLocaleDateString('km-KH');
      prevPeriodLabel = "ម្សិលមិញ";
      currentPeriodLabel = "សរុបថ្ងៃនេះ";
      filename = `Daily_Stock_Analysis_${dateStr}.xls`;
    } else {
      title = "របាយការណ៍វិភាគស្តុកប្រចាំខែ";
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      reportDateLabel = `${KH_MONTHS[currentMonth]} ${currentYear}`;
      prevPeriodLabel = "ខែមុន";
      currentPeriodLabel = "សរុបខែនេះ";
      filename = `Monthly_Stock_Analysis_${dateStr}.xls`;
    }

    const phnomPenhOrders = reportOrders.filter(o => isPhnomPenh(o.customerLocation));
    const provinceOrders = reportOrders.filter(o => !isPhnomPenh(o.customerLocation));

    // Build product headers and rows
    let productHeader1 = "";
    let productHeader2 = "";
    products.forEach(p => {
      const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
      productHeader1 += `<th colspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; text-align: center;">${p.name} (សល់: ${stockQty})</th>`;
      productHeader2 += `
        <th style="background-color: #A7F3D0; border: 1px solid #D1D5DB; padding: 4px; font-size: 10px; text-align: center; color: #065f46;">ចូល</th>
        <th style="background-color: #3B82F6; color: white; border: 1px solid #D1D5DB; padding: 4px; font-size: 10px; text-align: center;">ចេញ</th>
      `;
    });

    const totalColumns = 4 + (products.length * 2);

    const formattedDate = now.toLocaleDateString('km-KH');
    const dateCell = `<td rowspan="2" style="border: 1px solid #D1D5DB; text-align: center; vertical-align: middle; font-weight: bold; background-color: #F9FAFB;">${type === "daily" ? formattedDate : reportDateLabel}</td>`;

    // Row 1: Provinces
    let provinceCells = "";
    products.forEach(p => {
      const qtySold = getGroupSalesForProduct(provinceOrders, p.id);
      provinceCells += `
        <td style="border: 1px solid #D1D5DB; text-align: center; color: #9CA3AF;">0</td>
        <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #EFF6FF; color: #1E40AF;">${qtySold}</td>
      `;
    });

    // Row 2: Phnom Penh
    let phnomPenhCells = "";
    products.forEach(p => {
      const qtySold = getGroupSalesForProduct(phnomPenhOrders, p.id);
      phnomPenhCells += `
        <td style="border: 1px solid #D1D5DB; text-align: center; color: #9CA3AF;">0</td>
        <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #EFF6FF; color: #1E40AF;">${qtySold}</td>
      `;
    });

    const rowsHtml = `
      <tr>
        <td style="border: 1px solid #D1D5DB; text-align: center; background-color: #F9FAFB; font-weight: bold;">1</td>
        ${dateCell}
        <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px; font-weight: bold; color: #4B5563;">លក់ចេញតាមខេត្ត</td>
        ${provinceCells}
        <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px; color: #4B5563;"></td>
      </tr>
      <tr>
        <td style="border: 1px solid #D1D5DB; text-align: center; background-color: #F9FAFB; font-weight: bold;">2</td>
        <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px; font-weight: bold; color: #4B5563;">អុីវ៉ាន់លក់នៅភ្នំពេញ</td>
        ${phnomPenhCells}
        <td style="border: 1px solid #D1D5DB; text-align: left; padding: 6px; padding-left: 8px; color: #4B5563;"></td>
      </tr>
    `;

    // Build bottom summary table
    let summaryRowsHtml = "";
    const colorPairs = [
      { prev: "#FEF08A", current: "#FDE047" }, // yellow/amber
      { prev: "#DBEAFE", current: "#BFDBFE" }, // blue
      { prev: "#FCE7F3", current: "#FBCFE8" }, // pink
      { prev: "#D1FAE5", current: "#A7F3D0" }  // emerald/green
    ];

    products.forEach((p, idx) => {
      const prevSold = getProductSalesForPeriod(p.id, prevStart, prevEnd);
      const currSold = getProductSalesForPeriod(p.id, currStart, currEnd);
      const colors = colorPairs[idx % colorPairs.length];
      const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
      const breakdownStr = `ចាស់: ${p.oldStock || 0} | ថ្មី: ${p.newStock || 0}`;

      if (idx === 0) {
        summaryRowsHtml += `
          <tr>
            <td rowspan="${products.length * 3}" style="background-color: #10B981; color: white; font-weight: bold; border: 1px solid #D1D5DB; text-align: center; vertical-align: middle; font-size: 12px; font-family: 'Khmer OS Muol Light', Arial; width: 80px;">Total</td>
            <td style="background-color: ${colors.prev}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; width: 180px;">${prevPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; width: 60px;">${prevSold}</td>
          </tr>
          <tr>
            <td style="background-color: ${colors.current}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${currentPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${currSold}</td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; color: #334155;">ស្តុកសល់-${p.name} (${breakdownStr})</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #F8FAFC; color: #0F172A;">${stockQty}</td>
          </tr>
        `;
      } else {
        summaryRowsHtml += `
          <tr>
            <td style="background-color: ${colors.prev}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${prevPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${prevSold}</td>
          </tr>
          <tr>
            <td style="background-color: ${colors.current}; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold;">${currentPeriodLabel}-${p.name}</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold;">${currSold}</td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; text-align: left; border: 1px solid #D1D5DB; padding: 6px; font-weight: bold; color: #334155;">ស្តុកសល់-${p.name} (${breakdownStr})</td>
            <td style="border: 1px solid #D1D5DB; text-align: center; font-weight: bold; background-color: #F8FAFC; color: #0F172A;">${stockQty}</td>
          </tr>
        `;
      }
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${type === "daily" ? "Daily Stock Analysis" : "Monthly Stock Analysis"}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; margin: 10px; }
        th, td { font-family: 'Khmer OS Battambang', 'Segoe UI', Arial; font-size: 11px; }
      </style>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th colspan="${totalColumns}" style="background-color: #FDE047; font-size: 16px; font-weight: bold; border: 1px solid #D1D5DB; padding: 10px; text-align: center; font-family: 'Khmer OS Muol Light', Arial;">
                ${title} (${reportDateLabel})
              </th>
            </tr>
            <tr>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 40px; text-align: center;">ល.រ</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 100px; text-align: center;">ថ្ងៃ ខែ ឆ្នាំ</th>
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 180px; text-align: center;">ទីតាំង</th>
              ${productHeader1}
              <th rowspan="2" style="background-color: #F3F4F6; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; width: 150px; text-align: center;">Remark</th>
            </tr>
            <tr>
              ${productHeader2}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <br/>
        
        <table border="1" style="border-collapse: collapse; margin-left: 20px;">
          <tbody>
            ${summaryRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportDailyAnalysisData = () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
      return orderDate === todayStr;
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    exportExcelAnalysisReport(todayOrders, "daily", todayStr, todayStart, todayEnd, yesterdayStart, yesterdayEnd);
  };

  const handleExportMonthlyAnalysisData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
    });

    const thisMonthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    exportExcelAnalysisReport(monthlyOrders, "monthly", monthStr, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd);
  };

  const triggerAnalysisImageExport = (type: "daily" | "monthly") => {
    const now = new Date();
    let reportOrders: CustomerOrder[] = [];
    let dateStr = "";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    if (type === "daily") {
      const todayStr = now.toLocaleDateString('en-CA');
      reportOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
        return orderDate === todayStr;
      });
      dateStr = todayStr;
      
      setAnalysisReportToImageConfig({
        type: "daily",
        orders: reportOrders,
        dateStr,
        currStart: todayStart,
        currEnd: todayEnd,
        prevStart: yesterdayStart,
        prevEnd: yesterdayEnd
      });
    } else {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      reportOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
      });
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      dateStr = monthStr;
      
      setAnalysisReportToImageConfig({
        type: "monthly",
        orders: reportOrders,
        dateStr,
        currStart: thisMonthStart,
        currEnd: thisMonthEnd,
        prevStart: lastMonthStart,
        prevEnd: lastMonthEnd
      });
    }
  };

  const triggerImageExport = (type: "daily" | "monthly") => {
    const now = new Date();
    let reportOrders: CustomerOrder[] = [];
    let dateStr = "";

    // Define date ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    if (type === "daily") {
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      reportOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
        return orderDate === todayStr;
      });
      dateStr = todayStr;
      
      setReportToImageConfig({
        type: "daily",
        orders: reportOrders,
        dateStr,
        currStart: todayStart,
        currEnd: todayEnd,
        prevStart: yesterdayStart,
        prevEnd: yesterdayEnd
      });
    } else {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      reportOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
      });
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      dateStr = monthStr;
      
      setReportToImageConfig({
        type: "monthly",
        orders: reportOrders,
        dateStr,
        currStart: thisMonthStart,
        currEnd: thisMonthEnd,
        prevStart: lastMonthStart,
        prevEnd: lastMonthEnd
      });
    }
  };

  useEffect(() => {
    if (!reportToImageConfig) return;

    const exportImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const el = document.getElementById("excel-report-image-target");
      if (!el) {
        setReportToImageConfig(null);
        return;
      }

      try {
        const dataUrl = await toPng(el, { 
          quality: 0.95,
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
        const link = document.createElement("a");
        const filename = reportToImageConfig.type === "daily" 
          ? `Daily_Report_${reportToImageConfig.dateStr}.png` 
          : `Monthly_Report_${reportToImageConfig.dateStr}.png`;
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to export Excel report image:", err);
        alert("ការទាញយករូបភាពរបាយការណ៍ត្រូវបានបរាជ័យ! (Image download failed)");
      } finally {
        setReportToImageConfig(null);
      }
    };

    exportImage();
  }, [reportToImageConfig]);

  const renderExcelReportMarkup = (config: NonNullable<typeof reportToImageConfig>) => {
    const { type, orders: reportOrders, dateStr, currStart, currEnd, prevStart, prevEnd } = config;
    const title = type === "daily" ? "របាយការណ៍ប្រចាំស្តុកប្រចាំថ្ងៃ" : "របាយការណ៍ប្រចាំស្តុកប្រចាំខែ";
    const reportDateLabel = type === "daily" 
      ? new Date().toLocaleDateString('km-KH') 
      : `${KH_MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const prevPeriodLabel = type === "daily" ? "ម្សិលមិញ" : "ខែមុន";
    const currentPeriodLabel = type === "daily" ? "សរុបថ្ងៃនេះ" : "សរុបខែនេះ";

    const colorPairs = [
      { prev: "bg-yellow-100", current: "bg-yellow-200" }, // yellow/amber
      { prev: "bg-blue-50", current: "bg-blue-100" }, // blue
      { prev: "bg-pink-50", current: "bg-pink-100" }, // pink
      { prev: "bg-emerald-50", current: "bg-emerald-100" }  // emerald/green
    ];

    return (
      <div className="flex flex-col gap-4 bg-white p-6 rounded" style={{ fontFamily: "'Khmer OS Battambang', 'Segoe UI', Arial" }}>
        {/* Main Excel Table */}
        <table className="border-collapse border border-slate-400 w-full text-center">
          <thead>
            {/* Title banner */}
            <tr>
              <th 
                colSpan={6 + products.length * 2} 
                className="bg-[#FFE600] text-black font-extrabold py-3 text-lg border border-slate-400 text-center font-sans tracking-wide"
                style={{ fontFamily: "'Khmer OS Muol Light', Arial" }}
              >
                {title} (${reportDateLabel})
              </th>
            </tr>
            {/* Main header row */}
            <tr className="bg-slate-100 text-xs font-bold text-slate-700">
              <th rowSpan={2} className="border border-slate-400 p-2 w-10">ល.រ</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-28">ថ្ងៃ ខែ ឆ្នាំ</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-36">ឈ្មោះ</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-48">ទីតាំង</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-32">លេខទូរស័ព្ទ</th>
              {products.map(p => {
                const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
                return (
                  <th key={p.id} colSpan={2} className="border border-slate-400 p-2 min-w-28 text-sm text-center">
                    {p.name} <span className="text-[10px] text-slate-500 font-normal block mt-0.5">(សល់: {stockQty})</span>
                  </th>
                );
              })}
              <th rowSpan={2} className="border border-slate-400 p-2 w-40">Remark</th>
            </tr>
            {/* Sub headers row (In/Out) */}
            <tr className="bg-slate-50 text-[10px] font-bold text-slate-600">
              {products.map(p => (
                <React.Fragment key={`sub-${p.id}`}>
                  <th className="border border-slate-400 p-1 bg-[#D1FAE5] text-[#065F46]">ចូល</th>
                  <th className="border border-slate-400 p-1 bg-[#DBEAFE] text-[#1E40AF]">ចេញ</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportOrders.length === 0 ? (
              <tr>
                <td colSpan={6 + products.length * 2} className="border border-slate-400 p-6 text-slate-400 italic">
                  គ្មានទិន្នន័យសម្រាប់ការលក់ឡើយ (No sales data available)
                </td>
              </tr>
            ) : (
              reportOrders.map((order, idx) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString('km-KH');
                return (
                  <tr key={order.id} className="text-xs text-slate-800 bg-white">
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">{idx + 1}</td>
                    
                    {/* Date cell - merge if daily and first row */}
                    {type === "daily" ? (
                      idx === 0 && (
                        <td 
                          rowSpan={reportOrders.length} 
                          className="border border-slate-400 p-2 font-bold bg-slate-50 align-middle"
                        >
                          {orderDate}
                        </td>
                      )
                    ) : (
                      <td className="border border-slate-400 p-2 bg-slate-50">{orderDate}</td>
                    )}
                    
                    <td className="border border-slate-400 p-2 text-left px-3">{order.customerName}</td>
                    <td className="border border-slate-400 p-2 text-left px-3">{order.customerLocation}</td>
                    <td className="border border-slate-400 p-2 text-left px-3">{order.customerPhone || ""}</td>
                    
                    {/* Products In/Out cells */}
                    {products.map(p => {
                      const item = order.items.find(i => i.productId === p.id);
                      const qtySold = item ? item.quantity : 0;
                      return (
                        <React.Fragment key={`cells-${order.id}-${p.id}`}>
                          <td className="border border-slate-400 p-2 text-slate-300">0</td>
                          <td className="border border-slate-400 p-2 font-bold bg-[#EFF6FF] text-[#1E40AF]">{qtySold}</td>
                        </React.Fragment>
                      );
                    })}
                    
                    <td className="border border-slate-400 p-2 text-left px-3 text-slate-500">{order.notes || ""}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Summary Table */}
        <div className="flex mt-6 justify-start pl-4">
          <table className="border-collapse border border-slate-400 text-xs">
            <tbody>
              {products.map((p, idx) => {
                const prevSold = getProductSalesForPeriod(p.id, prevStart, prevEnd);
                const currSold = getProductSalesForPeriod(p.id, currStart, currEnd);
                const colors = colorPairs[idx % colorPairs.length];

                const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
                const breakdownStr = `ចាស់: ${p.oldStock || 0} | ថ្មី: ${p.newStock || 0}`;

                return (
                  <React.Fragment key={`sum-row-${p.id}`}>
                    <tr>
                      {idx === 0 && (
                        <td 
                          rowSpan={products.length * 3} 
                          className="border border-slate-400 bg-[#10B981] text-white font-extrabold text-center align-middle px-6 text-sm"
                          style={{ fontFamily: "'Khmer OS Muol Light', Arial" }}
                        >
                          Total
                        </td>
                      )}
                      <td className={`border border-slate-400 px-4 py-1.5 text-left font-bold w-48 ${colors.prev}`}>
                        {prevPeriodLabel}-${p.name}
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center w-16 bg-white">
                        {prevSold}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-slate-400 px-4 py-1.5 text-left font-bold ${colors.current}`}>
                        {currentPeriodLabel}-${p.name}
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center bg-white">
                        {currSold}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 px-4 py-1.5 text-left font-bold bg-slate-100 text-slate-700">
                        ស្តុកសល់-${p.name} <span className="text-[10px] text-slate-500 font-normal">({breakdownStr})</span>
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center bg-slate-50 text-slate-900 bg-white">
                        {stockQty}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!analysisReportToImageConfig) return;

    const exportImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const el = document.getElementById("excel-analysis-report-image-target");
      if (!el) {
        setAnalysisReportToImageConfig(null);
        return;
      }

      try {
        const dataUrl = await toPng(el, { 
          quality: 0.95,
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
        const link = document.createElement("a");
        const filename = analysisReportToImageConfig.type === "daily" 
          ? `Daily_Stock_Analysis_${analysisReportToImageConfig.dateStr}.png` 
          : `Monthly_Stock_Analysis_${analysisReportToImageConfig.dateStr}.png`;
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to export Excel analysis report image:", err);
        alert("ការទាញយករូបភាពរបាយការណ៍វិភាគស្តុកត្រូវបានបរាជ័យ! (Analysis image download failed)");
      } finally {
        setAnalysisReportToImageConfig(null);
      }
    };

    exportImage();
  }, [analysisReportToImageConfig]);

  const renderExcelAnalysisReportMarkup = (config: NonNullable<typeof analysisReportToImageConfig>) => {
    const { type, orders: reportOrders, dateStr, currStart, currEnd, prevStart, prevEnd } = config;
    const title = type === "daily" ? "របាយការណ៍វិភាគស្តុកប្រចាំថ្ងៃ" : "របាយការណ៍វិភាគស្តុកប្រចាំខែ";
    const reportDateLabel = type === "daily" 
      ? new Date().toLocaleDateString('km-KH') 
      : `${KH_MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const prevPeriodLabel = type === "daily" ? "ម្សិលមិញ" : "ខែមុន";
    const currentPeriodLabel = type === "daily" ? "សរុបថ្ងៃនេះ" : "សរុបខែនេះ";

    const colorPairs = [
      { prev: "bg-yellow-100", current: "bg-yellow-200" }, // yellow/amber
      { prev: "bg-blue-50", current: "bg-blue-100" }, // blue
      { prev: "bg-pink-50", current: "bg-pink-100" }, // pink
      { prev: "bg-emerald-50", current: "bg-emerald-100" }  // emerald/green
    ];

    const phnomPenhOrders = reportOrders.filter(o => isPhnomPenh(o.customerLocation));
    const provinceOrders = reportOrders.filter(o => !isPhnomPenh(o.customerLocation));

    const getOutBgColorClass = (idx: number) => {
      const outBgClasses = [
        "bg-cyan-300 text-cyan-900", // product A - bright cyan
        "bg-blue-400 text-white",     // product B - blue
        "bg-blue-200 text-blue-900"   // product C - light lavender/blue
      ];
      return outBgClasses[idx % outBgClasses.length];
    };

    return (
      <div className="flex flex-col gap-4 bg-white p-6 rounded" style={{ fontFamily: "'Khmer OS Battambang', 'Segoe UI', Arial" }}>
        {/* Main Excel Table */}
        <table className="border-collapse border border-slate-400 w-full text-center">
          <thead>
            {/* Title banner */}
            <tr>
              <th 
                colSpan={4 + products.length * 2} 
                className="bg-[#FFE600] text-black font-extrabold py-3 text-lg border border-slate-400 text-center font-sans tracking-wide"
                style={{ fontFamily: "'Khmer OS Muol Light', Arial" }}
              >
                {title} (${reportDateLabel})
              </th>
            </tr>
            {/* Main header row */}
            <tr className="bg-slate-100 text-xs font-bold text-slate-700">
              <th rowSpan={2} className="border border-slate-400 p-2 w-10">ល.រ</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-28">ថ្ងៃ ខែ ឆ្នាំ</th>
              <th rowSpan={2} className="border border-slate-400 p-2 w-48">ទីតាំង</th>
              {products.map(p => {
                const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
                return (
                  <th key={p.id} colSpan={2} className="border border-slate-400 p-2 min-w-28 text-sm text-center">
                    {p.name} <span className="text-[10px] text-slate-500 font-normal block mt-0.5">(សល់: {stockQty})</span>
                  </th>
                );
              })}
              <th rowSpan={2} className="border border-slate-400 p-2 w-40">Remark</th>
            </tr>
            {/* Sub headers row (In/Out) */}
            <tr className="bg-slate-50 text-[10px] font-bold text-slate-600">
              {products.map((p, pIdx) => (
                <React.Fragment key={`sub-${p.id}`}>
                  <th className="border border-slate-400 p-1 bg-emerald-100 text-emerald-800">ចូល</th>
                  <th className={`border border-slate-400 p-1 ${getOutBgColorClass(pIdx)}`}>ចេញ</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Provinces */}
            <tr className="text-xs text-slate-800 bg-white">
              <td className="border border-slate-400 p-2 font-bold bg-slate-50">1</td>
              <td rowSpan={2} className="border border-slate-400 p-2 font-bold bg-slate-50 align-middle">
                {type === "daily" ? new Date().toLocaleDateString('km-KH') : reportDateLabel}
              </td>
              <td className="border border-slate-400 p-2 text-left px-3 font-bold text-slate-700">លក់ចេញតាមខេត្ត</td>
              {products.map(p => {
                const qtySold = getGroupSalesForProduct(provinceOrders, p.id);
                return (
                  <React.Fragment key={`prov-${p.id}`}>
                    <td className="border border-slate-400 p-2 text-slate-300">0</td>
                    <td className="border border-slate-400 p-2 font-bold bg-[#EFF6FF] text-[#1E40AF]">{qtySold}</td>
                  </React.Fragment>
                );
              })}
              <td className="border border-slate-400 p-2 text-left px-3 text-slate-500"></td>
            </tr>

            {/* Row 2: Phnom Penh */}
            <tr className="text-xs text-slate-800 bg-white">
              <td className="border border-slate-400 p-2 font-bold bg-slate-50">2</td>
              <td className="border border-slate-400 p-2 text-left px-3 font-bold text-slate-700">អុីវ៉ាន់លក់នៅភ្នំពេញ</td>
              {products.map(p => {
                const qtySold = getGroupSalesForProduct(phnomPenhOrders, p.id);
                return (
                  <React.Fragment key={`pp-${p.id}`}>
                    <td className="border border-slate-400 p-2 text-slate-300">0</td>
                    <td className="border border-slate-400 p-2 font-bold bg-[#EFF6FF] text-[#1E40AF]">{qtySold}</td>
                  </React.Fragment>
                );
              })}
              <td className="border border-slate-400 p-2 text-left px-3 text-slate-500"></td>
            </tr>
          </tbody>
        </table>

        {/* Summary Table */}
        <div className="flex mt-6 justify-start pl-4">
          <table className="border-collapse border border-slate-400 text-xs">
            <tbody>
              {products.map((p, idx) => {
                const prevSold = getProductSalesForPeriod(p.id, prevStart, prevEnd);
                const currSold = getProductSalesForPeriod(p.id, currStart, currEnd);
                const colors = colorPairs[idx % colorPairs.length];

                const stockQty = p.stockQuantity ?? ((p.oldStock || 0) + (p.newStock || 0));
                const breakdownStr = `ចាស់: ${p.oldStock || 0} | ថ្មី: ${p.newStock || 0}`;

                return (
                  <React.Fragment key={`sum-row-${p.id}`}>
                    <tr>
                      {idx === 0 && (
                        <td 
                          rowSpan={products.length * 3} 
                          className="border border-slate-400 bg-[#10B981] text-white font-extrabold text-center align-middle px-6 text-sm"
                          style={{ fontFamily: "'Khmer OS Muol Light', Arial" }}
                        >
                          Total
                        </td>
                      )}
                      <td className={`border border-slate-400 px-4 py-1.5 text-left font-bold w-48 ${colors.prev}`}>
                        {prevPeriodLabel}-${p.name}
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center w-16 bg-white">
                        {prevSold}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-slate-400 px-4 py-1.5 text-left font-bold ${colors.current}`}>
                        {currentPeriodLabel}-${p.name}
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center bg-white">
                        {currSold}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 px-4 py-1.5 text-left font-bold bg-slate-100 text-slate-700">
                        ស្តុកសល់-${p.name} <span className="text-[10px] text-slate-500 font-normal">({breakdownStr})</span>
                      </td>
                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-center bg-slate-50 text-slate-900 bg-white">
                        {stockQty}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.products && imported.orders) {
          const confirmMerge = window.confirm(
            "តើអ្នកចង់បញ្ជូលបន្ថែមទៅលើទិន្នន័យដែលមានស្រាប់ (ចុច OK) ឬជំនួសទាំងស្រុង (ចុច Cancel)?\n\n(Click OK to merge with existing data, Cancel to overwrite entirely)"
          );
          
          if (confirmMerge) {
            // Merge products by ID
            const mergedProducts = [...products];
            imported.products.forEach((p: any) => {
              const idx = mergedProducts.findIndex(existing => existing.id === p.id);
              if (idx > -1) {
                mergedProducts[idx] = p;
              } else {
                mergedProducts.push(p);
              }
            });
            
            // Merge orders by ID
            const mergedOrders = [...orders];
            imported.orders.forEach((o: any) => {
              const idx = mergedOrders.findIndex(existing => existing.id === o.id);
              if (idx > -1) {
                mergedOrders[idx] = o;
              } else {
                mergedOrders.push(o);
              }
            });
            
            saveProductsToStorage(mergedProducts);
            saveOrdersToStorage(mergedOrders);
            alert("ទិន្នន័យត្រូវបានបញ្ចូលបន្ថែមដោយជោគជ័យ! (Data merged successfully!)");
          } else {
            saveProductsToStorage(imported.products);
            saveOrdersToStorage(imported.orders);
            alert("ទិន្នន័យត្រូវបាននាំចូលដោយជោគជ័យ! (Data imported successfully!)");
          }
        } else {
          alert("ឯកសារមិនត្រឹមត្រូវ! (Invalid backup file structure)");
        }
      } catch (err) {
        alert("ការនាំចូលទិន្នន័យបានបរាជ័យ! (Failed to parse JSON backup)");
      }
    };
    reader.readAsText(file);
  };



  const statsProps = useMemo(() => {
    if (activeTab === "orders" && displayMode === "calendar") {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const filtered = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      return {
        orders: filtered,
        filteredMonthLabel: `${KH_MONTHS[month]} ${year}`
      };
    }
    return {
      orders: orders,
      filteredMonthLabel: undefined
    };
  }, [orders, activeTab, displayMode, calendarDate]);

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isExpired) {
    return (
      <RenewLicense
        username={currentUser.username}
        onRenewalSuccess={(newExpiry) => {
          setIsExpired(false);
          setCurrentUser({ ...currentUser, licenseExpiresAt: newExpiry });
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. Header Navigation Bar */}
      <nav id="app-navbar" className="bg-indigo-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div 
              onClick={() => setIsEditingSellerProfile(true)}
              className="flex items-center gap-3 cursor-pointer hover:bg-indigo-950/60 p-1.5 -ml-1.5 rounded-xl transition-all select-none group relative"
              title="កំណត់ប្រវត្តិរូបអ្នកលក់ (Configure Seller Profile)"
            >
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden select-none transition-transform group-hover:scale-105">
                {sellerProfile.logoImage ? (
                  <img src={sellerProfile.logoImage} alt="Shop Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white text-md flex items-center justify-center w-full h-full bg-indigo-500">{sellerProfile.logoEmoji || "🇰🇭"}</span>
                )}
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 leading-none group-hover:text-indigo-200 transition-colors">
                  {sellerProfile.shopName}
                </h1>
                <span className="text-[8px] sm:text-[9px] text-indigo-300 font-bold block mt-1 tracking-wider uppercase font-sans flex items-center gap-1">
                  {sellerProfile.subtitle || "Sales CRM & Customer Details"}
                  <span className="bg-indigo-800 text-indigo-200 px-1 py-0.2 rounded text-[7px] border border-indigo-700 font-sans font-normal opacity-0 group-hover:opacity-100 transition-all">កែសម្រួល (Edit)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dropdown Backdrop */}
              {activeReportDropdown && (
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setActiveReportDropdown(null)} 
                />
              )}

              {/* Export/Import Backup */}
              <div className="flex items-center gap-2 border-r border-indigo-800 pr-3 z-50">
                <div className="relative">
                  <button
                    onClick={() => setActiveReportDropdown(activeReportDropdown === "daily" ? null : "daily")}
                    className="p-1 px-2.5 rounded text-[10px] font-bold text-indigo-100 hover:text-white bg-indigo-800 hover:bg-indigo-700 border border-indigo-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    ទាញទិន្នន័យប្រចាំថ្ងៃ
                  </button>
                  {activeReportDropdown === "daily" && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border border-slate-200 py-1 z-50 min-w-[190px] animate-fade-in">
                      <button
                        onClick={() => {
                          handleExportDailyData();
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        ១. ទាញជា Excel (.xls)
                      </button>
                      <button
                        onClick={() => {
                          triggerImageExport("daily");
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        ២. ទាញតារាងជារូបភាព (.png)
                      </button>
                      <button
                        onClick={() => {
                          handleExportDailyAnalysisData();
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        ៣. វិភាគស្តុកជា Excel (.xls)
                      </button>
                      <button
                        onClick={() => {
                          triggerAnalysisImageExport("daily");
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        ៤. វិភាគស្តុកជារូបភាព (.png)
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveReportDropdown(activeReportDropdown === "monthly" ? null : "monthly")}
                    className="p-1 px-2.5 rounded text-[10px] font-bold text-indigo-100 hover:text-white bg-indigo-800 hover:bg-indigo-700 border border-indigo-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    ទាញទិន្នន័យប្រចាំខែ
                  </button>
                  {activeReportDropdown === "monthly" && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border border-slate-200 py-1 z-50 min-w-[190px] animate-fade-in">
                      <button
                        onClick={() => {
                          handleExportMonthlyData();
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        ១. ទាញជា Excel (.xls)
                      </button>
                      <button
                        onClick={() => {
                          triggerImageExport("monthly");
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        ២. ទាញតារាងជារូបភាព (.png)
                      </button>
                      <button
                        onClick={() => {
                          handleExportMonthlyAnalysisData();
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        ៣. វិភាគស្តុកជា Excel (.xls)
                      </button>
                      <button
                        onClick={() => {
                          triggerAnalysisImageExport("monthly");
                          setActiveReportDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        ៤. វិភាគស្តុកជារូបភាព (.png)
                      </button>
                    </div>
                  )}
                </div>
                <label 
                  className="p-1 px-1.5 rounded text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-900 hover:bg-indigo-800 border border-indigo-800 flex items-center gap-1 cursor-pointer transition-all"
                  title="នាំចូលទិន្នន័យពីឯកសារ JSON (Import Data JSON)"
                >
                  <Upload className="w-3 h-3" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action tabs */}
              <div className="flex bg-indigo-950 p-0.5 rounded border border-indigo-800">
                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setIsRegisteringOrder(false);
                    setEditingOrder(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                    activeTab === "orders" && !isRegisteringOrder && !editingOrder
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-indigo-300 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  បញ្ជីអតិធិជន (Customers)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("cod");
                    setIsRegisteringOrder(false);
                    setEditingOrder(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                    activeTab === "cod"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-indigo-300 hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  តាមដាន COD (COD Tracker)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("catalog");
                    setIsRegisteringOrder(false);
                    setEditingOrder(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                    activeTab === "catalog"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-indigo-300 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  គ្រប់គ្រងទំនិញ (Products DB)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("telegram");
                    setIsRegisteringOrder(false);
                    setEditingOrder(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                    activeTab === "telegram"
                      ? "bg-sky-650 text-white bg-sky-600 shadow-xs"
                      : "text-sky-300 hover:text-white hover:bg-indigo-950/40"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  តភ្ជាប់ Telegram (Direct Share)
                </button>
                {currentUser.username.toLowerCase() === "adminkosal2006" && (
                  <button
                    onClick={() => {
                      setActiveTab("licenses");
                      setIsRegisteringOrder(false);
                      setEditingOrder(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                      activeTab === "licenses"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-indigo-300 hover:text-white"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    គ្រប់គ្រងប្រព័ន្ធ (Admin Panel)
                  </button>
                )}
              </div>

              {/* Logged in User & Logout button */}
              <div className="flex items-center gap-2.5 bg-indigo-950/50 border border-indigo-800/80 p-1 px-2.5 rounded-lg text-[10px] font-bold">
                <span className="text-indigo-200">👤 {currentUser.username} ({currentUser.role === 'admin' ? 'Admin' : 'Seller'})</span>
                <button
                  onClick={handleLogout}
                  className="p-1 px-2 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 hover:text-white border border-rose-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="ចាកចេញពីគណនី (Logout)"
                >
                  <LogOut className="w-3 h-3" />
                  ចាកចេញ
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Migration Prompt Banner */}
        {migrationPrompt && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
            <div>
              <h3 className="text-xs font-black flex items-center gap-1.5">
                <span>📦</span> រកឃើញទិន្នន័យចាស់នៅក្នុង Browser នេះ! (Old Local Data Found)
              </h3>
              <p className="text-[10px] text-amber-700/90 font-semibold mt-1">
                តើអ្នកចង់ផ្ទេរទិន្នន័យចាស់ (ផលិតផល វិក្កយបត្រ ប្រវត្តិរូប) ចូលទៅក្នុង Database នៃគណនីថ្មីរបស់អ្នកដែរឬទេ? (Do you want to migrate your old products and orders to the server?)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMigrateLocalData}
                disabled={isMigratingData}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {isMigratingData ? (
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  "ផ្ទេរទិន្នន័យ (Migrate)"
                )}
              </button>
              <button
                onClick={() => setMigrationPrompt(false)}
                className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                រំលង (Skip)
              </button>
            </div>
          </div>
        )}

        {/* Banner with tips */}
        <div className="bg-indigo-50/70 text-indigo-900 p-3 rounded-lg border border-indigo-100/80 flex items-start gap-2.5 shadow-xs select-none">
          <span className="p-1 px-1.5 bg-indigo-100 rounded text-sm mt-0.5">💡</span>
          <p className="text-[11px] font-medium leading-relaxed">
            <strong>របៀបបំពេញងាយស្រួល</strong>៖ នៅពេលបំពេញព័ត៌មានអតិធិជន អ្នកគ្រាន់តែចុចលើរូបផលិតផលនៅប្រអប់ <strong>&apos;ចុចជ្រើសរើសមុខទំនិញ&apos;</strong> ជាការស្រេច ដោយប្រព័ន្ធនឹងគណនាថ្លៃស្វ័យប្រវត្តិ។ រួមទាំងមានប៊ូតុង <strong>&apos;បញ្ចុះតម្លៃ&apos;</strong> និងជ្រើសរើសលក្ខខណ្ឌចំណាយ <small>(ទូទាត់រួច, COD, មិនទាន់ទូទាត់)</small>។
          </p>
        </div>

        {/* Dashboard Stats Panel */}
        {activeTab === "orders" && (
          <DashboardStats 
            orders={statsProps.orders} 
            products={products} 
            exchangeRate={exchangeRate} 
            filteredMonthLabel={statsProps.filteredMonthLabel} 
            onSelectCODTab={() => {
              setActiveTab("cod");
              setIsRegisteringOrder(false);
              setEditingOrder(null);
            }}
            onUpdateExchangeRate={handleUpdateExchangeRate}
          />
        )}

        {/* CORE CONTAINER INTERACTION SWITCH */}
        {isRegisteringOrder || editingOrder ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative animate-slide-up">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-md font-bold text-slate-700 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded"></span>
                {editingOrder ? "កែសម្រួលព័ត៌មានការទិញ (Edit Customer Purchase)" : "ចុះឈ្មោះទិញទំនិញរបស់អតិធិជន (Register Customer Order)"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                បំពេញព័ត៌មានទំនាក់ទំនងជិតស្និទ្ធ ជ្រើសរើសផលិតផល ចំនួនផលិតផល និងបញ្ចុះតម្លៃតាមតម្រូវការ
              </p>
            </div>

            <OrderForm
              products={products}
              orders={orders}
              editingOrder={editingOrder}
              preselectedDate={preselectedDateForNewOrder}
              onSaveOrder={handleSaveOrder}
              onCancel={() => {
                setIsRegisteringOrder(false);
                setEditingOrder(null);
                setPreselectedDateForNewOrder(null);
                setActiveTab("orders");
              }}
            />
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-3.5 animate-fade-in">
            {/* Quick button to float order registration */}
            <div className="flex justify-between items-center bg-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500">ប្រព័ន្ធគ្រប់គ្រងការលក់ និងទំនាក់ទំនង (Sales & Analytics)</span>
              <button
                id="btn-register-order"
                onClick={() => {
                  setPreselectedDateForNewOrder(null);
                  setIsRegisteringOrder(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] flex items-center gap-1.5 shadow-sm active:translate-y-0.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                កត់ត្រាការទិញថ្មី (New Purchase)
              </button>
            </div>

            <OrderList
              orders={orders}
              products={products}
              onEditOrder={(order) => setEditingOrder(order)}
              onDeleteOrder={handleDeleteOrder}
              onViewReceipt={(order) => setViewingReceipt(order)}
              onAddOrderWithDate={(dateStr) => {
                setPreselectedDateForNewOrder(dateStr);
                setIsRegisteringOrder(true);
              }}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              calendarDate={calendarDate}
              onCalendarDateChange={setCalendarDate}
              onViewDailyReport={(dateLabel, orders) => setViewingDailyReport({ dateLabel, orders })}
            />
          </div>
        ) : activeTab === "cod" ? (
          <div className="animate-fade-in">
            <CODManagement
              orders={orders}
              products={products}
              exchangeRate={exchangeRate}
              onSaveOrder={handleSaveOrder}
              onUpdateOrder={(updatedOrder) => {
                const updated = orders.map((o) => o.id === updatedOrder.id ? updatedOrder : o);
                saveOrdersToStorage(updated);
              }}
              onDeleteOrder={handleDeleteOrder}
              onAddProduct={handleAddProduct}
            />
          </div>
        ) : activeTab === "telegram" ? (
          <div className="animate-fade-in">
            <TelegramIntegration
              orders={orders}
              products={products}
              exchangeRate={exchangeRate}
              telegramGroupLink={telegramGroupLink}
              onUpdateTelegramGroupLink={handleUpdateTelegramGroupLink}
            />
          </div>
        ) : activeTab === "licenses" ? (
          <div className="animate-fade-in">
            <LicenseManager authToken={authToken} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <ProductSection
              products={products}
              orders={orders}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-[10px] text-slate-400">
        <p className="font-semibold text-slate-500">ប្រព័ន្ធគ្រប់គ្រងការលក់ និងអតិធិជន (Sales CRM) © 2026 - ហាងអនឡាញ</p>
        <p className="text-[9px] mt-0.5 font-mono">High Density Interface - Off-line LocalStorage Data Ledger</p>
      </footer>

      {/* 4. Overlay Modals / Receipt View Invoice */}
      {viewingReceipt && (
        <ReceiptView
          order={viewingReceipt}
          products={products}
          onClose={() => setViewingReceipt(null)}
          exchangeRate={exchangeRate}
          sellerProfile={sellerProfile}
          telegramGroupLink={telegramGroupLink}
        />
      )}

      {/* 5. Seller Profile Configuration Modal */}
      <SellerProfileModal
        isOpen={isEditingSellerProfile}
        profile={sellerProfile}
        onSave={handleSaveSellerProfile}
        onClose={() => setIsEditingSellerProfile(false)}
      />

      {/* 6. Daily Sales Combined Report Modal */}
      {viewingDailyReport && (
        <DailyReportModal
          isOpen={true}
          orders={viewingDailyReport.orders}
          products={products}
          exchangeRate={exchangeRate}
          sellerProfile={sellerProfile}
          telegramGroupLink={telegramGroupLink}
          dateLabel={viewingDailyReport.dateLabel}
          onClose={() => setViewingDailyReport(null)}
        />
      )}

      {/* Hidden container for rendering Excel template into image */}
      {reportToImageConfig && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          <div id="excel-report-image-target" style={{ width: '900px' }}>
            {renderExcelReportMarkup(reportToImageConfig)}
          </div>
        </div>
      )}

      {/* Hidden container for rendering Excel Analysis template into image */}
      {analysisReportToImageConfig && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          <div id="excel-analysis-report-image-target" style={{ width: '900px' }}>
            {renderExcelAnalysisReportMarkup(analysisReportToImageConfig)}
          </div>
        </div>
      )}
    </div>
  );
}
