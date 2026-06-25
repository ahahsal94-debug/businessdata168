/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CustomerOrder, Product, PaymentStatus } from "../types";
import { ChevronLeft, ChevronRight, Calendar, Plus, Eye, Edit, Trash2, Phone, MapPin, Tag, Send } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface OrderCalendarProps {
  filteredOrders: CustomerOrder[];
  products: Product[];
  onEditOrder: (order: CustomerOrder) => void;
  onDeleteOrder: (id: string) => void;
  onViewReceipt: (order: CustomerOrder) => void;
  onAddOrderWithDate: (dateStr: string) => void;
  currentDate: Date;
  onCurrentDateChange: (date: Date) => void;
  onViewDailyReport?: (dateLabel: string, orders: CustomerOrder[]) => void;
}

export default function OrderCalendar({
  filteredOrders,
  products,
  onEditOrder,
  onDeleteOrder,
  onViewReceipt,
  onAddOrderWithDate,
  currentDate,
  onCurrentDateChange,
  onViewDailyReport,
}: OrderCalendarProps) {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const [selectedDayOrders, setSelectedDayOrders] = useState<CustomerOrder[] | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>("");
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);

  const KH_MONTH_NAMES_LONG = [
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

  const KH_DAY_NAMES = [
    "អាទិត្យ (Sun)",
    "ច័ន្ទ (Mon)",
    "អង្គារ (Tue)",
    "ពុធ (Wed)",
    "ព្រហស្បតិ៍ (Thu)",
    "សុក្រ (Fri)",
    "សៅរ៍ (Sat)"
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrev = () => {
    setSelectedDayOrders(null);
    if (viewMode === "month") {
      onCurrentDateChange(new Date(currentYear, currentMonth - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onCurrentDateChange(newDate);
    }
  };

  const handleNext = () => {
    setSelectedDayOrders(null);
    if (viewMode === "month") {
      onCurrentDateChange(new Date(currentYear, currentMonth + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onCurrentDateChange(newDate);
    }
  };

  const handleToday = () => {
    setSelectedDayOrders(null);
    onCurrentDateChange(new Date());
  };

  // Helper to get total price of an order
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

  // Status badge renderer for small nodes
  const renderStatusDot = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "bg-green-500";
      case PaymentStatus.COD:
        return "bg-yellow-500 animate-pulse";
      case PaymentStatus.UNPAID:
        return "bg-rose-500";
    }
  };

  // Generate calendar grid array
  const calendarCells = useMemo(() => {
    if (viewMode === "month") {
      const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
      const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthTotalDays = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

      const cells = [];

      // Prev Month days (greyed out)
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevMonthTotalDays - i;
        const tempDate = new Date(prevMonthYear, prevMonthIndex, d);
        cells.push({
          day: d,
          month: prevMonthIndex,
          year: prevMonthYear,
          isCurrentMonth: false,
          dateObj: tempDate,
          dateKey: `${prevMonthYear}-${String(prevMonthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        });
      }

      // Current Month days
      for (let d = 1; d <= totalDays; d++) {
        const tempDate = new Date(currentYear, currentMonth, d);
        cells.push({
          day: d,
          month: currentMonth,
          year: currentYear,
          isCurrentMonth: true,
          dateObj: tempDate,
          dateKey: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        });
      }

      // Next Month days to fill remaining grid spaces (multiples of 7 up to 42)
      const remaining = 42 - cells.length;
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
      
      for (let d = 1; d <= remaining; d++) {
        const tempDate = new Date(nextMonthYear, nextMonthIndex, d);
        cells.push({
          day: d,
          month: nextMonthIndex,
          year: nextMonthYear,
          isCurrentMonth: false,
          dateObj: tempDate,
          dateKey: `${nextMonthYear}-${String(nextMonthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        });
      }

      return cells;
    } else {
      // Week View
      // Start of week is Sunday of currentDate week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const cells = [];
      for (let i = 0; i < 7; i++) {
        const tempDate = new Date(startOfWeek);
        tempDate.setDate(startOfWeek.getDate() + i);
        const d = tempDate.getDate();
        const m = tempDate.getMonth();
        const y = tempDate.getFullYear();

        cells.push({
          day: d,
          month: m,
          year: y,
          isCurrentMonth: m === currentMonth,
          dateObj: tempDate,
          dateKey: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        });
      }
      return cells;
    }
  }, [viewMode, currentDate, currentYear, currentMonth]);

  // Map orders into calendar days keys for super fast lookup
  const ordersByDateMap = useMemo(() => {
    const map: Record<string, CustomerOrder[]> = {};
    filteredOrders.forEach((o) => {
      const keys = o.createdAt.split("T")[0]; // YYYY-MM-DD
      if (!map[keys]) {
        map[keys] = [];
      }
      map[keys].push(o);
    });
    return map;
  }, [filteredOrders]);

  // Display title text matching user screenshot design vibe
  const headerPeriodTitle = useMemo(() => {
    if (viewMode === "month") {
      return `${KH_MONTH_NAMES_LONG[currentMonth]} ${currentYear}`;
    } else {
      const first = calendarCells[0]?.dateObj;
      const last = calendarCells[6]?.dateObj;
      if (!first || !last) return "";
      
      const firstMonth = first.toLocaleString("en-US", { month: "short" });
      const lastMonth = last.toLocaleString("en-US", { month: "short" });
      const firstYear = first.getFullYear();
      const lastYear = last.getFullYear();

      const monthPart = firstMonth === lastMonth ? firstMonth : `${firstMonth} - ${lastMonth}`;
      const yearPart = firstYear === lastYear ? firstYear : `${firstYear} - ${lastYear}`;
      return `${monthPart} ${yearPart}`;
    }
  }, [viewMode, currentMonth, currentYear, calendarCells]);

  // Handle cell click
  const handleCellClick = (dateKey: string, dayNum: number, monthNum: number, yearNum: number) => {
    const dayOrders = ordersByDateMap[dateKey] || [];
    setSelectedDayOrders(dayOrders);
    
    const formattedLabel = `ថ្ងៃទី ${dayNum < 10 ? '0' + dayNum : dayNum} ខែ ${monthNum + 1 < 10 ? '0' + (monthNum + 1) : monthNum + 1} ឆ្នាំ ${yearNum}`;
    setSelectedDayLabel(formattedLabel);
  };

  const isToday = (dateObj: Date) => {
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* 2.1 Calendar Header Navigation bar (Matches image pattern: Week | Month < Today > May - Jun 2026) */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-xl gap-4">
        <div className="flex items-center gap-4">
          {/* Week / Month toggles */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/40 select-none">
            <button
              onClick={() => {
                setViewMode("week");
                setSelectedDayOrders(null);
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                viewMode === "week"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              សប្តាហ៍ (Week)
            </button>
            <button
              onClick={() => {
                setViewMode("month");
                setSelectedDayOrders(null);
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                viewMode === "month"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              ខែ (Month)
            </button>
          </div>

          {/* Nav arrows & Today */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-200 bg-white rounded-lg border border-slate-200 transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 hover:bg-slate-200 bg-white text-[11px] font-bold rounded-lg border border-slate-200 transition-all text-slate-700"
            >
              ថ្ងៃនេះ (Today)
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-200 bg-white rounded-lg border border-slate-200 transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Dynamic Period title */}
        <h3 className="font-extrabold text-slate-800 text-sm font-sans flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          {headerPeriodTitle}
        </h3>
      </div>

      {/* Grid view containing weekday labels & day numbers */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Week Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-2">
          {KH_DAY_NAMES.map((name, idx) => (
            <div
              key={idx}
              className={`text-[10px] font-bold uppercase tracking-wider ${
                idx === 0 ? "text-rose-500" : idx === 6 ? "text-slate-500" : "text-slate-600"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Days grid layout */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/50">
          {calendarCells.map((cell, idx) => {
            const hasOrders = ordersByDateMap[cell.dateKey] || [];
            const daySelectedToday = isToday(cell.dateObj);

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell.dateKey, cell.day, cell.month, cell.year)}
                className={`min-h-[90px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                  cell.isCurrentMonth ? "bg-white" : "bg-slate-50/50 text-slate-300"
                } ${
                  daySelectedToday
                    ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/20"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Day Header number */}
                <div className="flex justify-between items-center pointer-events-none">
                  <span
                    className={`text-xs font-bold font-mono px-1 rounded ${
                      daySelectedToday
                        ? "bg-indigo-600 text-white"
                        : cell.isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {hasOrders.length > 0 && (
                    <span className="text-[9px] font-black font-sans px-1.5 py-0.2 bg-teal-50 text-teal-600 border border-teal-150 rounded-full">
                      {hasOrders.length} ទិញ
                    </span>
                  )}
                </div>

                {/* mini summary inside the grid cell */}
                <div className="flex-1 mt-1.5 space-y-1 overflow-hidden max-h-[55px] font-sans">
                  {hasOrders.slice(0, 2).map((order) => {
                    const orderSum = getOrderTotal(order);
                    return (
                      <div
                        key={order.id}
                        className="text-[9px] px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-150/70 text-slate-700 flex items-center justify-between border border-slate-200/50 block truncate leading-tight transition-all font-medium"
                      >
                        <span className="truncate max-w-[60%]">{order.customerName}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${renderStatusDot(order.paymentStatus)}`}></span>
                          <span className="font-bold font-mono">${orderSum.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {hasOrders.length > 2 && (
                    <div className="text-[8px] text-center text-slate-400 leading-none py-0.5 font-bold">
                      +មាន {hasOrders.length - 2} នាក់ទៀត
                    </div>
                  )}
                </div>

                {/* Day Quick additions indicator bar */}
                <div className="mt-1 pt-1 opacity-0 hover:opacity-100 transition-all pointer-events-none md:pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddOrderWithDate(cell.dateKey);
                    }}
                    className="w-full text-center py-0.5 text-[8px] text-indigo-500 font-bold bg-indigo-50/50 hover:bg-indigo-100 rounded border border-indigo-150/40 flex items-center justify-center gap-0.5 transition-all select-none"
                  >
                    <Plus className="w-2 h-2" />
                    កត់ត្រាការទិញ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2.2 Selected Day Detailed Drawer display at bottom */}
      {selectedDayOrders !== null && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <div>
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-4 bg-indigo-500 rounded-sm"></span>
                ព័ត៌មានលម្អិតការលក់ ប្រចាំ {selectedDayLabel}
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                មានអតិថិជនចំនួន {selectedDayOrders.length} នាក់បានទិញទំនិញនៅថ្ងៃនេះ
              </p>
            </div>
            {/* Quick Record action button and send daily summary button */}
            <div className="flex items-center gap-2">
              {selectedDayOrders && selectedDayOrders.length > 0 && onViewDailyReport && (
                <button
                  onClick={() => onViewDailyReport(selectedDayLabel, selectedDayOrders)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[10.5px] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-all active:translate-y-0.5 select-none font-sans"
                >
                  <Send className="w-3 h-3 animate-pulse-subtle" />
                  របាយការណ៍រូបភាពសរុប (Daily Summary Image)
                </button>
              )}
              <button
                onClick={() => {
                  // Determine preselected date format
                  const parts = selectedDayLabel.match(/ថ្ងៃទី (\d+) ខែ (\d+) ឆ្នាំ (\d+)/);
                  if (parts) {
                    const day = parts[1];
                    const month = parts[2];
                    const year = parts[3];
                    onAddOrderWithDate(`${year}-${month}-${day}`);
                  } else {
                    onAddOrderWithDate(new Date().toISOString().split("T")[0]);
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-all active:translate-y-0.5 select-none"
              >
                <Plus className="w-3 h-3" />
                បន្ថែមការទិញសម្រាប់ថ្ងៃនេះ (New Order)
              </button>
            </div>
          </div>

          {selectedDayOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              😴 មិនទាន់មានការទិញទំនិញនៅថ្ងៃនេះឡើយ។ អ្នកអាចចុចប៊ូតុងខាងលើដើម្បីកត់ត្រាថ្មី!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayOrders.map((order) => {
                const totalSum = getOrderTotal(order);
                const itemNames = order.items.map((it) => {
                  const p = products.find(prod => prod.id === it.productId);
                  return `${p ? p.name.split(" ")[0] : "ទំនិញ"} x${it.quantity}`;
                }).join(", ");

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-xs block">{order.customerName}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          order.paymentStatus === PaymentStatus.PAID
                            ? "bg-green-50 text-green-700 border border-green-150"
                            : order.paymentStatus === PaymentStatus.COD
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-150"
                            : "bg-rose-50 text-rose-700 border border-rose-150"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1 font-mono">
                          <Phone className="w-2.5 h-2.5" /> {order.customerPhone}
                        </span>
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1 truncate font-medium">
                          <MapPin className="w-2.5 h-2.5" /> {order.customerLocation}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate font-semibold bg-slate-50 px-1 py-0.5 rounded mt-1">
                          📦 {itemNames || "គ្មាទំនិញ"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center mt-1">
                      <div className="text-[11px] font-black text-rose-600 font-mono">
                        ${totalSum.toFixed(2)}
                      </div>
                      
                      {/* Inner mini actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onViewReceipt(order)}
                          className="p-1 px-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-150 rounded text-[9px] font-bold transition-all flex items-center gap-0.5"
                        >
                          <Eye className="w-2.5 h-2.5" /> វិក្កយបត្រ
                        </button>
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1 bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-bold transition-all"
                        >
                          <Edit className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-150 rounded text-[9px] font-bold transition-all"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={orderToDelete !== null}
        title="លុបព័ត៌មានការទិញ (Delete Order)"
        message={orderToDelete ? `តើអ្នកចង់លុបការទិញរបស់អតិធិជន ${orderToDelete.customerName} មែនទេ? (Are you sure you want to delete this customer order?)` : ""}
        confirmLabel="លុបចោល (Delete)"
        cancelLabel="បោះបង់ (Cancel)"
        isDanger={true}
        onConfirm={() => {
          if (orderToDelete) {
            onDeleteOrder(orderToDelete.id);
            setSelectedDayOrders(prev => prev ? prev.filter(o => o.id !== orderToDelete.id) : null);
            setOrderToDelete(null);
          }
        }}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
}
