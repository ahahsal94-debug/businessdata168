/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomerOrder, Product, PaymentStatus } from "../types";
import { Users, Coins, CheckCircle, Clock, AlertCircle, ShoppingBag } from "lucide-react";

interface DashboardStatsProps {
  orders: CustomerOrder[];
  products: Product[];
  exchangeRate?: number; // USD to KHR swap rate (default 4000)
  filteredMonthLabel?: string;
  onSelectCODTab?: () => void;
  onUpdateExchangeRate?: (rate: number) => void;
}

export default function DashboardStats({ orders, products, exchangeRate = 4100, filteredMonthLabel, onSelectCODTab, onUpdateExchangeRate }: DashboardStatsProps) {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate.toString());
  // Helpers to calculate stats
  const totalCustomers = orders.length;

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.price : 0;
  };

  // Calculate order total price
  const calculateOrderTotal = (order: CustomerOrder) => {
    const subtotal = order.items.reduce((sum, item) => {
      const price = getProductPrice(item.productId);
      return sum + (price * item.quantity);
    }, 0);

    if (order.discountType === "percentage") {
      return Math.max(0, subtotal - (subtotal * order.discountValue / 100));
    } else {
      return Math.max(0, subtotal - order.discountValue);
    }
  };

  const totalRevenue = orders
    .filter(o => o.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, o) => sum + calculateOrderTotal(o), 0);

  const pendingRevenue = orders
    .filter(o => o.paymentStatus === PaymentStatus.UNPAID)
    .reduce((sum, o) => sum + calculateOrderTotal(o), 0);

  const codRevenue = orders
    .filter(o => o.paymentStatus === PaymentStatus.COD)
    .reduce((sum, o) => sum + calculateOrderTotal(o), 0);

  const paidCount = orders.filter(o => o.paymentStatus === PaymentStatus.PAID).length;
  const codCount = orders.filter(o => o.paymentStatus === PaymentStatus.COD).length;
  const unpaidCount = orders.filter(o => o.paymentStatus === PaymentStatus.UNPAID).length;

  const totalProductsSold = orders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Formatting helper
  const formatUSD = (val: number) => `$${val.toFixed(2)}`;
  const formatKHR = (val: number) => `${Math.round(val * exchangeRate).toLocaleString()} ៛`;

  return (
    <div className="space-y-3 mb-5 select-none no-print">
      {filteredMonthLabel && (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-indigo-150 w-fit shrink-0 shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>របាយការណ៍សរុបសម្រាប់ខែ៖ <span className="font-sans text-indigo-950 font-black">{filteredMonthLabel}</span> (Filtered by Calendar Month)</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Customers */}
        <div id="stat-customers" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-indigo-300 hover:shadow-xs transition-all duration-200">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">អតិធិជនសរុប (Total Customers)</p>
            <p className="text-xl font-black text-slate-850 mt-0.5">{totalCustomers} នាក់</p>
            <p className="text-[10px] text-slate-500">
              {filteredMonthLabel ? "ផ្អែកលើការទិញក្នុងខែនេះ" : "ផ្អែកលើការបញ្ជាទិញសរុប"}
            </p>
          </div>
        </div>

        {/* Metric 2: Revenue Received */}
        <div id="stat-revenue" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-indigo-300 hover:shadow-xs transition-all duration-200">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ប្រាក់ទទួលបានរួច (Paid Revenue)</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{formatUSD(totalRevenue)}</p>
            <p className="text-[10px] text-slate-500 font-mono">{formatKHR(totalRevenue)}</p>
          </div>
        </div>

        {/* Metric 3: COD & Outstanding */}
        <div 
          id="stat-pending" 
          onClick={onSelectCODTab}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-indigo-300 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 ${onSelectCODTab ? 'cursor-pointer select-none group' : ''}`}
          title="ចុចទីនេះដើម្បីបើកប្រព័ន្ធគ្រប់គ្រងបំណុល COD (Click to track COD)"
        >
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-700 transition-colors">ចាំទូទាត់ COD (COD Outstanding)</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{formatUSD(codRevenue)}</p>
            <p className="text-[10px] text-slate-500 font-mono">COD: {codCount}  | Unpaid: {unpaidCount}</p>
          </div>
        </div>

        {/* Metric 4: Total Products Sold */}
        <div id="stat-products" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-indigo-300 hover:shadow-xs transition-all duration-200">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShoppingBag className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ទំនិញលក់បានសរុប (Products Sold)</p>
            <p className="text-xl font-black text-indigo-900 mt-0.5">{totalProductsSold} មុខ</p>
            <p className="text-[10px] text-slate-500">
              {filteredMonthLabel ? "ចំនួនលក់ចេញក្នុងខែនេះ" : "ចំនួនលក់ចេញសរុបពីប្រព័ន្ឋ"}
            </p>
          </div>
        </div>

        {/* Visual Indicator of Order Conditions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-100/70 px-4 py-2.5 rounded-lg flex flex-wrap gap-5 items-center justify-between text-[11px] text-slate-600 border border-slate-200">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>ទូទាត់រួច (Paid): {paidCount} វិក្កយបត្រ</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            <span>COD ចាំទូទាត់ (COD): {codCount} វិក្កយបត្រ</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span>មិនទាន់ទូទាត់ (Unpaid): {unpaidCount} វិក្កយបត្រ</span>
          </div>
          <div className="text-slate-500 font-mono text-[10px] select-none">
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span>អត្រាប្តូរប្រាក់: $1 =</span>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-16 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const num = Number(tempRate);
                      if (num > 0) {
                        onUpdateExchangeRate?.(num);
                        setIsEditingRate(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsEditingRate(false);
                    }
                  }}
                  autoFocus
                />
                <span>៛</span>
                <button
                  onClick={() => {
                    const num = Number(tempRate);
                    if (num > 0) {
                      onUpdateExchangeRate?.(num);
                      setIsEditingRate(false);
                    }
                  }}
                  className="text-green-600 hover:text-green-800 text-[10px] font-bold px-1 cursor-pointer"
                >
                  ✔
                </button>
                <button
                  onClick={() => setIsEditingRate(false)}
                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold px-1 cursor-pointer"
                >
                  ✘
                </button>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:text-indigo-600 flex items-center gap-1 group transition-colors"
                onClick={() => {
                  setTempRate(exchangeRate.toString());
                  setIsEditingRate(true);
                }}
                title="ចុចទីនេះដើម្បីកែប្រែអត្រាប្តូរប្រាក់ (Click to edit exchange rate)"
              >
                អត្រាប្តូរប្រាក់ប៉ាន់ស្មាន: $1 = {exchangeRate.toLocaleString()} ៛
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-sans font-bold text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-200">កែប្រែ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
