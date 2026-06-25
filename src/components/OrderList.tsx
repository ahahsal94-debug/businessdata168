/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomerOrder, Product, PaymentStatus } from "../types";
import { Search, Filter, Printer, Trash2, Edit, FileText, MapPin, Phone, User, Calendar, DollarSign, Tag } from "lucide-react";
import OrderCalendar from "./OrderCalendar";
import ConfirmModal from "./ConfirmModal";

interface OrderListProps {
  orders: CustomerOrder[];
  products: Product[];
  onEditOrder: (order: CustomerOrder) => void;
  onDeleteOrder: (id: string) => void;
  onViewReceipt: (order: CustomerOrder) => void;
  onAddOrderWithDate: (dateStr: string) => void;
  displayMode: "table" | "calendar";
  onDisplayModeChange: (mode: "table" | "calendar") => void;
  calendarDate: Date;
  onCalendarDateChange: (date: Date) => void;
  onViewDailyReport?: (dateLabel: string, orders: CustomerOrder[]) => void;
}

export default function OrderList({
  orders,
  products,
  onEditOrder,
  onDeleteOrder,
  onViewReceipt,
  onAddOrderWithDate,
  displayMode,
  onDisplayModeChange,
  calendarDate,
  onCalendarDateChange,
  onViewDailyReport,
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);

  // Get total price of an order helper
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

  const getOrderTotalQuantity = (order: CustomerOrder) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Filter calculations
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.customerLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || o.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Render Khmer status badges
  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            ទូទាត់រួច (Paid)
          </span>
        );
      case PaymentStatus.COD:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full animate-pulse-subtle">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
            COD (ចាំទូទាត់)
          </span>
        );
      case PaymentStatus.UNPAID:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            មិនទាន់ទូទាត់ (Unpaid)
          </span>
        );
    }
  };

  return (
    <div id="order-list-section" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">📋</span>
            បញ្ជីព័ត៌មានអតិធិជន & ការទិញ (Customer Purchase Ledger)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ស្វែងរក កែប្រែព័ត៌មានអតិធិជន ឬមើល និងបោះពុម្ពវិក្កយបត្រ (Track details, invoice states, receipt prints)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Display Switcher: Table List vs Calendar View */}
          <div className="flex bg-indigo-50 p-1 rounded-xl border border-indigo-100/80 w-full sm:w-auto">
            <button
              onClick={() => onDisplayModeChange("table")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all select-none ${
                displayMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100/45"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              បញ្ជីតារាង (Table View)
            </button>
            <button
              onClick={() => onDisplayModeChange("calendar")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all select-none ${
                displayMode === "calendar"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100/45"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              ប្លង់ប្រតិទិន (Calendar View)
            </button>
          </div>

          {/* Quick Filtering tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ទាំងអស់
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.PAID)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === PaymentStatus.PAID
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.COD)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === PaymentStatus.COD
                  ? "bg-yellow-500 text-yellow-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              COD
            </button>
            <button
              onClick={() => setStatusFilter(PaymentStatus.UNPAID)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === PaymentStatus.UNPAID
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Unpaid
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH AND GENERAL STATS BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ស្វែងរកតាម ឈ្មោះអតិធិជន លេខទូរស័ព្ទ ឬទីតាំង... (Search name, phone, address...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs outline-none transition-all"
          />
        </div>
      </div>

      {/* LEDGER RENDER CONTENT (Conditional: Table or Calendar) */}
      {displayMode === "calendar" ? (
        <OrderCalendar
          filteredOrders={filteredOrders}
          products={products}
          onEditOrder={onEditOrder}
          onDeleteOrder={onDeleteOrder}
          onViewReceipt={onViewReceipt}
          onAddOrderWithDate={onAddOrderWithDate}
          currentDate={calendarDate}
          onCurrentDateChange={onCalendarDateChange}
          onViewDailyReport={onViewDailyReport}
        />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <span className="text-3xl">📭</span>
          <h3 className="text-sm font-bold text-slate-700 mt-3">មិនឃើញមានទិន្នន័យអតិធិជនឡើយ (No records found)</h3>
          <p className="text-xs text-slate-400 mt-1">សូមបញ្ចូលការជម្រើសទិញ ឬកែតម្រូវលក្ខខណ្ឌការស្វែងរករបស់អ្នក</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[11px] font-bold">
                <th className="py-3 px-4">អតិធិជន (Customer Name & Contact)</th>
                <th className="py-3 px-4">ទីតាំង (Address Location)</th>
                <th className="py-3 px-4 text-center">ចំនួនទំនិញ (Products Bought)</th>
                <th className="py-3 px-4 text-right">តម្លៃបញ្ចុះ (Discount)</th>
                <th className="py-3 px-4 text-right">ប្រាក់សរុប (Grand Total)</th>
                <th className="py-3 px-4 text-center">ស្ថានភាព (Status)</th>
                <th className="py-3 px-4 text-center no-print">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredOrders.map((order) => {
                const totalQty = getOrderTotalQuantity(order);
                const grandTotal = getOrderTotal(order);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Customer Identity */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-sm block">{order.customerName}</span>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {order.customerPhone}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-150 rounded px-1.5 py-0.5 w-fit font-bold">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            ទិញថ្ងៃទី៖ {(() => {
                              const dateObj = new Date(order.createdAt);
                              const day = dateObj.getDate();
                              const month = dateObj.getMonth() + 1;
                              const year = dateObj.getFullYear();
                              return `ថ្ងៃទី ${day < 10 ? '0' + day : day} ខែ ${month < 10 ? '0' + month : month} ឆ្នាំ ${year}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Delivery Location */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-slate-600 line-clamp-1 flex items-center gap-1" title={order.customerLocation}>
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        {order.customerLocation}
                      </span>
                    </td>

                    {/* Qty count */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-slate-100 font-bold font-mono rounded text-slate-700">
                        {totalQty} មុខ
                      </span>
                    </td>

                    {/* Button Discount context */}
                    <td className="py-3 px-4 text-right">
                      {order.discountValue > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold rounded-lg font-mono">
                          <Tag className="w-2.5 h-2.5" />
                          {order.discountType === "percentage" ? `${order.discountValue}%` : `$${order.discountValue}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">0.00</span>
                      )}
                    </td>

                    {/* Price total */}
                    <td className="py-3 px-4 text-right text-slate-900">
                      <span className="font-black font-mono text-sm">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {renderStatusBadge(order.paymentStatus)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewReceipt(order)}
                          className="p-1 bg-emerald-55 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 hover:text-emerald-800 transition-all flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold"
                          title="View layout invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          វិក្កយបត្រ (Invoice)
                        </button>
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
                          title="Edit order info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded-lg text-rose-500 hover:text-rose-700 transition-all"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={orderToDelete !== null}
        title="លុបព័ត៌មានការទិញ (Delete Order)"
        message={orderToDelete ? `តើអ្នកពិតជាចង់លុបទិន្នន័យអតិធិជន ${orderToDelete.customerName} នេះចេញពីប្រព័ន្ធមែនទេ? (Are you sure you want to delete this customer order?)` : ""}
        confirmLabel="លុបចោល (Delete)"
        cancelLabel="បោះបង់ (Cancel)"
        isDanger={true}
        onConfirm={() => {
          if (orderToDelete) {
            onDeleteOrder(orderToDelete.id);
            setOrderToDelete(null);
          }
        }}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
}
