/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CustomerOrder, Product, PaymentStatus } from "../types";
import { 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Check, 
  Package, 
  Clock, 
  AlertTriangle, 
  SlidersHorizontal,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface CODManagementProps {
  orders: CustomerOrder[];
  products: Product[];
  exchangeRate: number;
  onSaveOrder: (order: Omit<CustomerOrder, "id" | "createdAt"> & { createdAt?: string }) => void;
  onUpdateOrder: (updatedOrder: CustomerOrder) => void;
  onDeleteOrder: (id: string) => void;
  onAddProduct: (product: Omit<Product, "id" | "createdAt">) => void;
}

export default function CODManagement({
  orders,
  products,
  exchangeRate,
  onSaveOrder,
  onUpdateOrder,
  onDeleteOrder,
  onAddProduct,
}: CODManagementProps) {
  // Input form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [productName, setProductName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    // Default to today's date formatted as YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Table filters & searches
  const [codSearch, setCodSearch] = useState("");
  const [codStatusFilter, setCodStatusFilter] = useState<"ALL_COD" | "PENDING" | "PAID">("PENDING");

  // Success indicator
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Formatting helper
  const formatUSD = (val: number) => `$${val.toFixed(2)}`;
  const formatKHR = (val: number) => `${Math.round(val * exchangeRate).toLocaleString()} ៛`;

  // Determine order's total value helper
  const getOrderTotal = (order: CustomerOrder) => {
    const subtotal = order.items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p ? p.price : 0) * item.quantity;
    }, 0);

    const discountAmount =
      order.discountType === "percentage"
        ? (subtotal * order.discountValue) / 100
        : order.discountValue;

    return Math.max(0, subtotal - discountAmount);
  };

  // Identify product associated with this COD order
  const getOrderProductName = (order: CustomerOrder) => {
    if (order.items.length === 0) return "អីវ៉ាន់ COD";
    const firstItem = order.items[0];
    const p = products.find(prod => prod.id === firstItem.productId);
    return p ? p.name : "អីវ៉ាន់ COD";
  };

  // Check if an order is coded as COD or was paid but represents a COD order
  const allCodOrders = useMemo(() => {
    // We fetch any order with paymentStatus === COD, or any order that was registered as a COD tracker
    // To ensure users find their registered tracking items easily, we list orders with paymentStatus === COD or orders containing notes with "COD_TRACKING"
    return orders.filter(o => o.paymentStatus === PaymentStatus.COD || o.notes?.includes("COD_TRACK_LABEL"));
  }, [orders]);

  // Apply filters/searches on COD list
  const filteredCODOrders = useMemo(() => {
    return allCodOrders.filter(o => {
      const matchesSearch = 
        o.customerPhone.includes(codSearch) ||
        o.customerLocation.toLowerCase().includes(codSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(codSearch.toLowerCase()) ||
        getOrderProductName(o).toLowerCase().includes(codSearch.toLowerCase());

      const isPaid = o.paymentStatus === PaymentStatus.PAID;
      const isPending = o.paymentStatus === PaymentStatus.COD;

      if (codStatusFilter === "PENDING") {
        return matchesSearch && isPending;
      }
      if (codStatusFilter === "PAID") {
        return matchesSearch && isPaid;
      }
      return matchesSearch;
    });
  }, [allCodOrders, codSearch, codStatusFilter, products]);

  // Helper to calculate wait day counts from purchase day
  const calculateWaitDays = (createdAtStr: string) => {
    const placedDate = new Date(createdAtStr);
    const today = new Date();
    
    // Clear times to compare actual dates
    placedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - placedDate.getTime();
    // Calculate calendar days elapsed- starting at 1
    const elapsedDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
    return elapsedDays;
  };

  // Form Submission Handler
  const handleRegisterCOD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim() || !customerLocation.trim() || !itemPrice || isNaN(parseFloat(itemPrice))) {
      alert("សូមបំពេញលេខទូរស័ព្ទ អាសយដ្ឋាន និងតម្លៃអីវ៉ាន់ឱ្យបានត្រឹមត្រូវ! (Please fill phone, address, and valid price)");
      return;
    }

    const priceNum = Math.abs(parseFloat(itemPrice));
    const activeName = customerName.trim() || "អតិថិជន COD";
    const activeProdName = productName.trim() || "អីវ៉ាន់ COD";

    // 1. Create a virtual product for details referencing
    const newProdId = `prod-cod-${Date.now()}`;
    onAddProduct({
      name: activeProdName,
      price: priceNum,
      image: "📦",
      description: "ចុះឈ្មោះសរុបស្វ័យប្រវត្តិតាមរយៈប្រព័ន្ធ COD Tracker"
    });

    // 2. Draft complete CustomerOrder
    const isoDate = purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString();
    
    // We call save with our structured order props
    onSaveOrder({
      customerName: activeName,
      customerPhone: customerPhone.trim(),
      customerLocation: customerLocation.trim(),
      items: [{ productId: newProdId, quantity: 1 }],
      discountValue: 0,
      discountType: "percentage",
      paymentStatus: PaymentStatus.COD, // COD status default representing pending
      notes: "COD_TRACK_LABEL - បង្កើតដោយ COD Tracking System",
      createdAt: isoDate
    });

    // Reset input fields
    setCustomerName("");
    setCustomerPhone("");
    setCustomerLocation("");
    setProductName("");
    setItemPrice("");
    
    // Toast alert
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Change payment status for a quick toggle row
  const toggleCODStatus = (order: CustomerOrder, newStatus: PaymentStatus) => {
    onUpdateOrder({
      ...order,
      paymentStatus: newStatus
    });
  };

  return (
    <div id="cod-tracker-view" className="space-y-6">
      
      {/* Toast Alert */}
      {showSuccessToast && (
        <div className="fixed top-20 right-5 z-50 bg-emerald-600 text-white rounded-xl shadow-lg px-4 py-3 border border-emerald-500 animate-slide-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold font-sans">
            បានកត់ត្រា និងចុះឈ្មោះអីវ៉ាន់ COD ដោយជោគជ័យ!
          </span>
        </div>
      )}

      {/* Header Info Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-amber-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse-subtle" />
            ប្រព័ន្ធគ្រប់គ្រង និងតាមដានបំណុល COD (COD Tracker Dashboard)
          </h2>
          <p className="text-xs text-amber-900/80 leading-relaxed font-semibold">
            តាមដានអីវ៉ាន់ផ្ញើតាម COD, រាប់ចំនួនថ្ងៃរង់ចាំ (១ ដល់ ៣០ថ្ងៃ) និងបង្ហាញពណ៌ក្រហមសញ្ញាព្រមានខ្លាំងនៅពេលលើសពី ៧ថ្ងៃ។
          </p>
        </div>
        <div className="bg-amber-600 text-white px-3.5 py-1.5 rounded-xl font-black font-sans text-xs shadow-sm shadow-amber-500/20 select-none">
          COD Pending: {allCodOrders.filter(o => o.paymentStatus === PaymentStatus.COD).length} Items
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Register Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-500" />
              ចុះឈ្មោះអីវ៉ាន់ COD ថ្មី (Register COD Entry)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">បំពេញព័ត៌មានខាងក្រោមដើម្បីកត់ត្រាអីវ៉ាន់ COD ថ្មី</p>
          </div>

          <form onSubmit={handleRegisterCOD} className="space-y-3.5">
            {/* Phone Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                លេខទូរស័ព្ទអតិថិជន (Customer Phone) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ឧ. 012345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                អាសយដ្ឋាន/ទីតាំងផ្ញើ (Address) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ឧ. ភ្នំពេញ, ខណ្ឌចំការមន"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            {/* Date Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                កាលបរិច្ឆេទផ្ញើអីវ៉ាន់ (Placement Date) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            {/* Item Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                តម្លៃអីវ៉ាន់ (Price Value in USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="ឧ. 25.50"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs font-mono outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
              {itemPrice && !isNaN(parseFloat(itemPrice)) && (
                <p className="text-[10px] text-slate-400 font-mono mt-1 pr-1 text-right">
                  ~ {formatKHR(parseFloat(itemPrice))}
                </p>
              )}
            </div>

            {/* Item Name (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                ឈ្មោះអីវ៉ាន់/ផលិតផល (Item Name - Optional)
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ឧ. ស្បែកជើងកីឡា (លំនាំដើម៖ អីវ៉ាន់ COD)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Customer Name (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                ឈ្មោះអតិថិជន (Customer Name - Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ឧ. សុខ ម៉េង (លំនាំដើម៖ អតិថិជន COD)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:translate-y-0.5 transition-all select-none cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              រក្សាទុក & ចុះបញ្ជី COD (Save & Register COD)
            </button>
          </form>
        </div>

        {/* Right Side: List & Monitor Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                បញ្ជីអីវ៉ាន់ COD (COD Ledger Items)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">ស្វែងរក កត់ត្រាស្ថានភាពទូទាត់ និងពិនិត្យថ្ងៃរង់ចាំ</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCodStatusFilter("PENDING")}
                className={`flex-1 sm:flex-none px-3 py-1 font-bold text-[10px] rounded-lg border transition-all ${
                  codStatusFilter === "PENDING"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                }`}
              >
                កំពុងរង់ចាំ (Pending)
              </button>
              <button
                onClick={() => setCodStatusFilter("PAID")}
                className={`flex-1 sm:flex-none px-3 py-1 font-bold text-[10px] rounded-lg border transition-all ${
                  codStatusFilter === "PAID"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                }`}
              >
                ទូទាត់រួច (Paid)
              </button>
              <button
                onClick={() => setCodStatusFilter("ALL_COD")}
                className={`flex-1 sm:flex-none px-3 py-1 font-bold text-[10px] rounded-lg border transition-all ${
                  codStatusFilter === "ALL_COD"
                    ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                }`}
              >
                ទាំងអស់ (All)
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម លេខទូរស័ព្ទ ទីតាំង ឬឈ្មោះផលិតផល... (Search COD list)"
              value={codSearch}
              onChange={(e) => setCodSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-150 bg-slate-50/50 rounded-xl text-xs outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Records list */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] font-bold">
                  <th className="py-2.5 px-3">អតិធិជន & ទីតាំង (Customer & Place)</th>
                  <th className="py-2.5 px-3">អីវ៉ាន់ & តម្លៃ (Item & Price)</th>
                  <th className="py-2.5 px-3 text-center">រាប់ថ្ងៃ (Wait Days)</th>
                  <th className="py-2.5 px-3 text-center">ស្ថានភាព (Status Option)</th>
                  <th className="py-2.5 px-3 text-center">លុប (Del)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-755 font-medium">
                {filteredCODOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <span className="text-2xl">📦</span>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-bold">
                        មិនមានទិន្នន័យអីវ៉ាន់ COD ស្របតាមលក្ខខណ្ឌចម្រោះទេ!
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCODOrders.map((order) => {
                    const price = getOrderTotal(order);
                    const prodName = getOrderProductName(order);
                    const waitDays = calculateWaitDays(order.createdAt);
                    const isExceededLimit = waitDays > 7;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Customer details */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block text-xs leading-none">
                              {order.customerName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {order.customerPhone}
                            </span>
                            <span className="text-[10px] text-slate-400 line-clamp-1 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 inline text-slate-400 shrink-0" />
                              {order.customerLocation}
                            </span>
                          </div>
                        </td>

                        {/* Product info */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-indigo-950 block text-[11px] leading-none">
                              {prodName}
                            </span>
                            <span className="font-bold font-mono text-xs text-slate-800">
                              {formatUSD(price)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block leading-none">
                              ~ {formatKHR(price)}
                            </span>
                          </div>
                        </td>

                        {/* Day count tracker */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            {/* Days count: turning bright red if exceeds 7 days */}
                            <span className={`px-2 py-0.5 rounded font-black font-mono text-sm leading-none flex items-center gap-1 ${
                              isExceededLimit 
                                ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse-subtle" 
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                            }`}>
                              {isExceededLimit && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                              {waitDays} ថ្ងៃ
                            </span>
                            
                            <span className="text-[8px] text-slate-400 block mt-1 font-bold leading-none select-none">
                              ({order.createdAt.substring(0, 10)})
                            </span>
                          </div>
                        </td>

                        {/* Toggle state selector */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 w-full max-w-[170px] mx-auto">
                            <button
                              type="button"
                              onClick={() => toggleCODStatus(order, PaymentStatus.COD)}
                              className={`flex-1 px-2 py-1 font-bold text-[9px] rounded-md transition-all select-none ${
                                order.paymentStatus === PaymentStatus.COD
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              មិនទាន់ទូទាត់
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCODStatus(order, PaymentStatus.PAID)}
                              className={`flex-1 px-2 py-1 font-bold text-[9px] rounded-md transition-all select-none ${
                                order.paymentStatus === PaymentStatus.PAID
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              ទូទាត់រួច
                            </button>
                          </div>
                        </td>

                        {/* Quick delete */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`តើអ្នកពិតជាចង់លុបចោលអីវ៉ាន់ COD នេះមែនទេ? (Delete this COD item?)`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                            title="លុបចោល"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-semibold">បង្ហាញ៖ {filteredCODOrders.length} records</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 font-bold text-rose-600">
                <span className="w-2 h-2 bg-rose-550 bg-rose-500 rounded-full animate-pulse"></span>
                លើសពី ៧ថ្ងៃ (Warning Alert)
              </span>
              <span className="flex items-center gap-1 font-bold text-slate-500">
                <span className="w-2 h-2 bg-slate-350 bg-slate-400 rounded-full"></span>
                ក្រោម ៧ថ្ងៃ (Standard Waiting)
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
