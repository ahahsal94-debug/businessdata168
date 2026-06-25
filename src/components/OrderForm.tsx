/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, PaymentStatus, CustomerOrder, PurchasedProductItem } from "../types";
import { PlusCircle, MinusCircle, Trash2, Check, Percent, Tag, User, Phone, MapPin, Sparkles, MessageSquare, Calendar, Loader2, Image, Upload, X } from "lucide-react";

interface OrderFormProps {
  products: Product[];
  orders?: CustomerOrder[];
  onSaveOrder: (order: Omit<CustomerOrder, "id" | "createdAt"> & { createdAt?: string }) => void;
  onCancel: () => void;
  editingOrder?: CustomerOrder | null;
  preselectedDate?: string | null;
}

export default function OrderForm({ products, orders = [], onSaveOrder, onCancel, editingOrder, preselectedDate }: OrderFormProps) {
  // Input states
  const [customerName, setCustomerName] = useState(editingOrder?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(editingOrder?.customerPhone || "");
  const [customerLocation, setCustomerLocation] = useState(editingOrder?.customerLocation || "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(editingOrder?.paymentStatus || PaymentStatus.PAID);
  
  // Custom date selection states
  const initialDate = editingOrder?.createdAt 
    ? new Date(editingOrder.createdAt) 
    : (preselectedDate ? new Date(preselectedDate) : new Date());
  const [purchaseYear, setPurchaseYear] = useState<number>(initialDate.getFullYear());
  const [purchaseMonth, setPurchaseMonth] = useState<number>(initialDate.getMonth() + 1); // 1-indexed
  const [purchaseDay, setPurchaseDay] = useState<number>(initialDate.getDate());

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

  const handleMonthChange = (m: number) => {
    setPurchaseMonth(m);
    const maxDays = new Date(purchaseYear, m, 0).getDate();
    if (purchaseDay > maxDays) {
      setPurchaseDay(maxDays);
    }
  };

  const handleYearChange = (y: number) => {
    setPurchaseYear(y);
    const maxDays = new Date(y, purchaseMonth, 0).getDate();
    if (purchaseDay > maxDays) {
      setPurchaseDay(maxDays);
    }
  };
  
  // Selected items: mapping productId to quantity
  const [selectedItems, setSelectedItems] = useState<PurchasedProductItem[]>(
    editingOrder?.items || []
  );

  // Discount states
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    editingOrder?.discountType || "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    editingOrder?.discountValue || 0
  );
  
  const [notes, setNotes] = useState(editingOrder?.notes || "");

  // AI OCR scanning states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [highlightFields, setHighlightFields] = useState(false);

  // Read files and convert them to Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 2 - uploadedImages.length;
      const filesToProcess = filesArray.slice(0, remainingSlots);

      filesToProcess.forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === "string") {
            setUploadedImages((prev) => [...prev, reader.result as string].slice(0, 2));
          }
        };
        reader.readAsDataURL(file);
      });
      // Clear file input value to allow uploading same image file again
      e.target.value = "";
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerOcrScan = async () => {
    if (uploadedImages.length === 0) return;
    setIsAnalyzing(true);
    setStatusMessage("កំពុងបញ្ជូនរូបភាពទៅកាន់ AI (Sending images to AI)...");

    try {
      const statusTimer = setTimeout(() => {
        setStatusMessage("កំពុងស្កេន និងចាប់យកអក្សរ (Extracting and analyzing texts)...");
      }, 1800);

      const statusTimer2 = setTimeout(() => {
        setStatusMessage("កំពុងរៀបចំទិន្នន័យ (Structuring Name, Phone and Location)...");
      }, 3800);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("រកមិនឃើញព័ត៌មានគណនីរបស់អ្នកទេ! សូមសាកល្បងចាកចេញ រួចចូលម្តងទៀត។ (Session token not found! Please try logging out and logging back in.)");
      }
      const response = await fetch("/api/extract-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ images: uploadedImages }),
      });

      clearTimeout(statusTimer);
      clearTimeout(statusTimer2);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to scan images");
      }

      const result = await response.json();

      let populatedAny = false;
      if (result.customerName) {
        setCustomerName(result.customerName);
        populatedAny = true;
      }
      if (result.customerPhone) {
        setCustomerPhone(result.customerPhone);
        populatedAny = true;
      }
      if (result.customerLocation) {
        setCustomerLocation(result.customerLocation);
        populatedAny = true;
      }

      if (populatedAny) {
        setHighlightFields(true);
        setTimeout(() => setHighlightFields(false), 3000);
        // Clean up uploaded images upon successful extraction to keep workspace tidy
        setUploadedImages([]);
      } else {
        alert("មិនអាចរកឃើញព័ត៌មានអតិធិជនពីក្នុងរូបភាពនេះទេ (Could not find customer details in this image)");
      }
    } catch (err: any) {
      console.error(err);
      alert("បរាជ័យក្នុងការស្កេនព័ត៌មាន (Scan failed): " + (err.message || err));
    } finally {
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  // Quick discount options
  const discountPresets = [
    { label: "គ្មានបញ្ចុះតម្លៃ (0%)", value: 0, type: "percentage" as const },
    { label: "បញ្ចុះ ៥% (5%)", value: 5, type: "percentage" as const },
    { label: "បញ្ចុះ ១០% (10%)", value: 10, type: "percentage" as const },
    { label: "បញ្ចុះ ១៥% (15%)", value: 15, type: "percentage" as const },
    { label: "បញ្ចុះ ២០% (20%)", value: 20, type: "percentage" as const },
  ];

  // Locations preset in Cambodia
  const locationsList = [
    "ភ្នំពេញ (Phnom Penh)",
    "សៀមរាប (Siem Reap)",
    "បាត់ដំបង (Battambang)",
    "ព្រះសីហនុ (Sihanoukville)",
    "កំពត (Kampot)",
    "កំពង់ចាម (Kampong Cham)",
    "បន្ទាយមានជ័យ (Banteay Meanchey)",
  ];

  // Helper to compute available remaining stock for a product, taking today's orders into account
  const getAvailableRemaining = (p: Product): number => {
    if (!p.trackStock) return Infinity;
    const todayStr = new Date().toDateString();
    
    // Sum quantities of this product in today's orders (except our editingOrder if we are modifying it)
    const alreadySoldToday = (orders || [])
      .filter(o => new Date(o.createdAt).toDateString() === todayStr && o.id !== editingOrder?.id)
      .reduce((sum, o) => {
        const item = o.items.find(i => i.productId === p.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      
    return Math.max(0, (p.stockQuantity || 0) - alreadySoldToday);
  };

  // Handle adding product selection
  const toggleProductSelection = (product: Product) => {
    const existing = selectedItems.find(item => item.productId === product.id);
    if (existing) {
      // Remove if already selected
      setSelectedItems(selectedItems.filter(item => item.productId !== product.id));
    } else {
      // Check remaining stock limits
      if (product.trackStock) {
        const available = getAvailableRemaining(product);
        if (available <= 0) {
          const proceed = window.confirm(`ការព្រមាន៖ ទំនិញ "${product.name}" គឺអស់ពីស្តុកបច្ចុប្បន្នហើយ (0/Out Of Stock)! តើអ្នកចង់បន្តកុម្ម៉ង់លក់មុនដែរឬទេ? (Warning: Product out of stock. Proceed anyway?)`);
          if (!proceed) return;
        }
      }
      // Add with quantity 1
      setSelectedItems([...selectedItems, { productId: product.id, quantity: 1 }]);
    }
  };

  // Adjust item quantity
  const updateQuantity = (productId: string, delta: number) => {
    const p = products.find(prod => prod.id === productId);
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          
          if (p && p.trackStock && delta > 0) {
            const available = getAvailableRemaining(p);
            if (newQty > available) {
              alert(`មិនអាចកុម្ម៉ង់លើសពីស្តុកដែលមានទេ! ស្តុកនៅសល់៖ ${available} ${p.unit || "គ្រឿង"} (Order exceeds stock limit: max ${available})`);
              return item;
            }
          }
          
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Calculations
  const calculateTotalBeforeDiscount = () => {
    return selectedItems.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p ? p.price : 0) * item.quantity;
    }, 0);
  };

  const totalBeforeDiscount = calculateTotalBeforeDiscount();
  const calculatedDiscountAmount = discountType === 'percentage' 
    ? (totalBeforeDiscount * discountValue) / 100 
    : discountValue;
  const grandTotal = Math.max(0, totalBeforeDiscount - calculatedDiscountAmount);

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("សូមបញ្ចូលឈ្មោះអតិធិជន (Please enter customer name)");
      return;
    }
    if (!customerPhone.trim()) {
      alert("សូមបញ្ចូលលេខទូរស័ព្ទ (Please enter phone number)");
      return;
    }
    if (!customerLocation.trim()) {
      alert("សូមបញ្ចូលទីតាំង (Please enter customer location)");
      return;
    }
    if (selectedItems.length === 0) {
      alert("សូមជ្រើសរើសមុខទំនិញយ៉ាងតិចមួយ (Please select at least one item)");
      return;
    }

    // Build final ISO date using selected year, month, and day while preserving hour/minute of initialDate
    const finalDate = new Date(initialDate);
    finalDate.setFullYear(purchaseYear);
    finalDate.setMonth(purchaseMonth - 1);
    finalDate.setDate(purchaseDay);

    onSaveOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerLocation: customerLocation.trim(),
      items: selectedItems,
      discountValue,
      discountType,
      paymentStatus,
      notes: notes.trim(),
      createdAt: finalDate.toISOString()
    });
  };

  return (
    <form id="order-registration-form" onSubmit={handleSubmit} className="space-y-4 no-print select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Customer profile & Purchase criteria (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-150 pb-2">
              <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">👤</span>
              ១. ព័ត៌មានអតិធិជន (Customer Information)
            </h3>

            {/* AI Image OCR Scanner Container */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-150 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-indigo-100 text-indigo-700 rounded-lg animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 leading-none">
                      ស្កេនព័ត៌មានពី រូបភាព/វិក្កយបត្រ (AI OCR auto-fill details)
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 tracking-tight">
                      ដាក់រូបភាព ១ ឬ ២​ សន្លឹក (ឈ្មោះ លេខទូរស័ព្ទ​ ទីតាំង) ដើម្បីចាប់យកស្វ័យប្រវត្ត
                    </p>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={triggerOcrScan}
                    className="self-start sm:self-center px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer select-none"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    ចាប់ផ្តើមវិភាគស្កេន (Scan Now)
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-4 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <div>
                    <p className="text-[11px] font-bold text-indigo-700 animate-pulse">{statusMessage}</p>
                    <p className="text-[9px] text-slate-400">សូមរង់ចាំបន្តិច... (Please wait a brief moment)</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* Upload box */}
                  <div className="sm:col-span-6">
                    <label
                      className={`h-[72px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        uploadedImages.length >= 2
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-slate-500"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadedImages.length >= 2 || isAnalyzing}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Upload className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold">
                        {uploadedImages.length >= 2 ? "កំណត់ត្រឹមតែ ២ រូបភាពដំបូង (Max 2 reached)" : "ជ្រើសរើសរូបភាព (Add Labels / Receipts)"}
                      </span>
                      <span className="text-[8px] text-slate-400 font-sans mt-0.5">Click or drag & drop</span>
                    </label>
                  </div>

                  {/* Thumbnail Previews */}
                  <div className="sm:col-span-6">
                    {uploadedImages.length === 0 ? (
                      <div className="h-[72px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-3 text-center bg-white/50 text-slate-400">
                        <p className="text-[9px] leading-relaxed">
                          មិនទាន់មានរូបភាពជ្រើសរើស (No images selected yet). 
                          <br />
                          ដាក់រូបថត ឬរូបថតអេក្រង់ដែលមាន ឈ្មោះ លេខទូរស័ព្ទ និងទីតាំង។
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2 h-[72px] items-center p-1 bg-white border border-slate-200/70 rounded-xl overflow-x-auto">
                        {uploadedImages.map((img, index) => (
                          <div
                            key={index}
                            className="relative w-12 h-12 rounded-lg border border-slate-200 shadow-2xs group flex-shrink-0"
                          >
                            <img
                              src={img}
                              alt={`uploaded-${index}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(index)}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-md cursor-pointer transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                            <span className="absolute bottom-0 left-0 right-0 py-0.2 bg-slate-900/60 text-white text-[7px] text-center font-bold rounded-b-lg font-sans">
                              #{index + 1}
                            </span>
                          </div>
                        ))}

                        {uploadedImages.length < 2 && (
                          <div className="w-12 h-12 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50 text-[10px]">
                            +
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  ឈ្មោះអតិធិជន <span className="text-rose-500">*</span> (Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. សុខ ជា"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-2.5 py-1.5 focus:bg-white border text-xs font-bold outline-none rounded transition-all ${
                    highlightFields
                      ? "border-green-500 bg-green-50/70 ring-2 ring-green-400/20 animate-pulse text-indigo-950"
                      : "bg-slate-50 border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-slate-50/50"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  លេខទូរស័ព្ទ <span className="text-rose-500">*</span> (Phone)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. 012 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full px-2.5 py-1.5 focus:bg-white border text-xs font-bold outline-none rounded transition-all ${
                    highlightFields
                      ? "border-green-500 bg-green-50/70 ring-2 ring-green-400/20 animate-pulse text-indigo-950"
                      : "bg-slate-50 border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-slate-50/50"
                  }`}
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  ទីតាំងអតិធិជន <span className="text-rose-500">*</span> (Delivery Location)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. ផ្ទះលេខ ១២ ផ្លូវ ១២៣ ភ្នំពេញ..."
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className={`w-full px-2.5 py-1.5 focus:bg-white border text-xs font-bold outline-none rounded transition-all ${
                    highlightFields
                      ? "border-green-500 bg-green-50/70 ring-2 ring-green-400/20 animate-pulse text-indigo-950"
                      : "bg-slate-50 border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-slate-50/50"
                  }`}
                />
                
                {/* Location Quick Picks */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 self-center mr-1 font-bold uppercase tracking-tight">Quick Pick:</span>
                  {locationsList.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomerLocation(loc)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 rounded text-[10px] transition-all"
                    >
                      {loc.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Date Selector group */}
              <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 mt-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  កាលបរិច្ឆេទនៃការទិញ (Date of Purchase) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">ថ្ងៃទី (Day)</label>
                    <select
                      value={purchaseDay}
                      onChange={(e) => setPurchaseDay(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded font-mono font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      {Array.from({ length: new Date(purchaseYear, purchaseMonth, 0).getDate() }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d < 10 ? `0${d}` : d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">ខែ (Month)</label>
                    <select
                      value={purchaseMonth}
                      onChange={(e) => handleMonthChange(Number(e.target.value))}
                      className="w-full px-1.5 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      {KH_MONTHS.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {idx + 1} - {m.split(" ")[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">ឆ្នាំ (Year)</label>
                    <select
                      value={purchaseYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded font-mono font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  * ចំនួនថ្ងៃត្រូវបានកម្រិតដោយស្វ័យប្រវត្តិតាមជម្រើសខែនីមួយៗ (Days list adjusts dynamically depending on the selected month).
                </p>
              </div>
            </div>
          </div>

          {/* Selection List table of items bought */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-150 pb-2">
              <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">🛍️</span>
              ២. បញ្ជីផលិតផលដែលបានជ្រើសរើស (Selected Purchased Products)
            </h3>

            {selectedItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
                <p className="text-xs">សូមជ្រើសរើសទំនិញនៅផ្នែកខាងស្តាំ 👉</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Please pick products from the side panel catalog</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {selectedItems.map((item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  if (!p) return null;
                  return (
                    <div key={item.productId} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all bg-slate-50/70">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 rounded object-cover border border-slate-250"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-indigo-650 font-black font-mono">${p.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-0.5 rounded text-slate-505 hover:bg-slate-100 text-slate-500 hover:text-slate-850 transition-colors"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-[11px] font-bold font-mono text-slate-800">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-0.5 rounded text-slate-505 hover:bg-slate-100 text-slate-500 hover:text-slate-850 transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-[11px] font-bold font-mono text-slate-800 w-14 text-right">
                          ${(p.price * item.quantity).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discount Section (The "Button Discount" feature) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-150 pb-2">
              <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">🏷️</span>
              ៣. បញ្ចុះតម្លៃពិសេស (Special Button Discount)
            </h3>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              ចុចលើប៊ូតុងខាងក្រោមដើម្បីបញ្ចុះតម្លៃរហ័ស ឬបញ្ចូលតម្លៃផ្សេងៗ (Click buttons to apply rapid discount)
            </p>

            <div className="flex flex-wrap gap-1.5">
              {discountPresets.map((preset, idx) => {
                const isSelected = discountType === preset.type && discountValue === preset.value;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDiscountType(preset.type);
                      setDiscountValue(preset.value);
                    }}
                    className={`px-3 py-1 text-[10px] font-bold rounded border transition-all active:translate-y-0.5 ${
                      isSelected
                        ? "bg-indigo-900 text-white border-indigo-900 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-150 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  ប្រភេទនៃការបញ្ចុះតម្លៃ (Discount Mode)
                </label>
                <div className="flex bg-slate-100 rounded p-0.5 border border-slate-250">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percentage");
                      setDiscountValue(Math.min(100, discountValue));
                    }}
                    className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                      discountType === "percentage"
                        ? "bg-white text-indigo-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    ជាភាគរយ (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                      discountType === "fixed"
                        ? "bg-white text-indigo-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    ជាទឹកប្រាក់ ($)
                  </button>
                </div>
              </div>

              <div className="w-full sm:w-40">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  តម្លៃបញ្ចុះខ្លួនឯង (Custom Discount)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={discountType === "percentage" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-3 pr-8 py-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500 text-xs font-black outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono">
                    {discountType === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Conditions (3 required conditions) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 border-b border-slate-150 pb-2">
              <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">💳</span>
              ៤. លក្ខខណ្ឌទូទាត់ប្រាក់ <span className="text-rose-500">*</span> (Payment Conditions)
            </h3>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              ជ្រើសរើសលក្ខខណ្ឌវិក្កយបត្ររបស់អតិធិជនខាងក្រោម (Choose payment invoice status):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* PAID */}
              <label className={`relative border rounded p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatus === PaymentStatus.PAID
                  ? "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-400"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="payment_status"
                  value={PaymentStatus.PAID}
                  checked={paymentStatus === PaymentStatus.PAID}
                  onChange={() => setPaymentStatus(PaymentStatus.PAID)}
                  className="absolute right-2 top-2.5 accent-green-600"
                />
                <div>
                  <p className="text-xs font-bold">ទូទាត់រួច</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Paid Bill</p>
                </div>
                <span className="inline-block mt-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[9px] font-black self-start uppercase">
                  ទូទាត់រួចរាល់
                </span>
              </label>

              {/* COD */}
              <label className={`relative border rounded p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatus === PaymentStatus.COD
                  ? "border-amber-500 bg-amber-50 text-slate-900 ring-1 ring-amber-400"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="payment_status"
                  value={PaymentStatus.COD}
                  checked={paymentStatus === PaymentStatus.COD}
                  onChange={() => setPaymentStatus(PaymentStatus.COD)}
                  className="absolute right-2 top-2.5 accent-amber-600"
                />
                <div>
                  <p className="text-xs font-bold">COD=ចាំទូទាត់</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">COD At Arrival</p>
                </div>
                <span className="inline-block mt-2 px-1.5 py-0.5 bg-amber-100 text-amber-850 rounded text-[9px] font-black self-start uppercase">
                  ទូទាត់ពេលដឹកមកដល់
                </span>
              </label>

              {/* UNPAID */}
              <label className={`relative border rounded p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                paymentStatus === PaymentStatus.UNPAID
                  ? "border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-400"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}>
                <input
                  type="radio"
                  name="payment_status"
                  value={PaymentStatus.UNPAID}
                  checked={paymentStatus === PaymentStatus.UNPAID}
                  onChange={() => setPaymentStatus(PaymentStatus.UNPAID)}
                  className="absolute right-2 top-2.5 accent-rose-600"
                />
                <div>
                  <p className="text-xs font-bold">មិនទាន់ទូទាត់</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Unpaid Debt</p>
                </div>
                <span className="inline-block mt-2 px-1.5 py-0.5 bg-rose-100 text-rose-850 rounded text-[9px] font-black self-start uppercase">
                  កត់ត្រាជំពាក់
                </span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              សម្គាល់ផ្សេងៗ (Order Notes / Courier Info - Optional)
            </label>
            <textarea
              placeholder="កត់ត្រាបន្ថែម ដូចជាឈ្មោះតៃកុងឡានចម្លង ឬម៉ោងដឹកជញ្ជូន..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-350 border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 text-xs outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Product Selection Catalog Panel (5 cols) */}
        <div className="lg:col-span-5 h-fit lg:sticky lg:top-16 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col max-h-[85vh]">
            <div className="border-b border-slate-200 pb-2 mb-2">
              <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                <span className="p-1 bg-indigo-50 text-indigo-700 rounded text-[11px]">🛒</span>
                ចុចជ្រើសរើសមុខទំនិញ (Item Picking Panel)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                ងាយស្រួលក្នុងការបំពេញព័ត៌មានអតិធិជន គ្រាន់តែចុចជ្រើសរើសមុខទំនិញជាការស្រេច (Touch product to add instantly)
              </p>
            </div>

            {/* Catalog list inside form */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-72">
              {products.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs font-bold">គ្មានផលិតផលនៅក្នុងបញ្ជីទេ</p>
                  <p className="text-[10px] mt-0.5">Please create products first under the Catalog Tab</p>
                </div>
              ) : (
                products.map((p) => {
                  const isSelected = selectedItems.some(item => item.productId === p.id);
                  const selectedQty = selectedItems.find(item => item.productId === p.id)?.quantity || 0;
                  
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProductSelection(p)}
                      className={`w-full text-left p-2 rounded border flex items-center justify-between transition-all active:translate-y-0.5 select-none ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 object-cover rounded border border-slate-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=300";
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-indigo-600 font-extrabold font-mono">
                              ${p.price.toFixed(2)}
                            </span>
                            {p.trackStock ? (
                              (() => {
                                const remains = getAvailableRemaining(p);
                                return (
                                  <span className={`text-[8.2px] font-black px-1.2 py-0.2 rounded-[5px] ${
                                    remains <= 0 
                                      ? "bg-rose-50 text-rose-500 border border-rose-100" 
                                      : remains <= 5 
                                        ? "bg-amber-50 text-amber-600 border border-amber-100 font-bold"
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-110 border-emerald-100 font-bold"
                                  }`}>
                                    {remains <= 0 ? "🚫 ដាច់ស្តុក" : `📦 ស្តុក៖ ${remains}`}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-[8px] font-bold px-1.2 py-0.2 rounded bg-slate-50 text-slate-400 border border-slate-100 font-mono">
                                ♾️ គ្មានដែនកំណត់
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="px-1.5 py-0.5 bg-indigo-900 text-white font-mono text-[9px] font-bold rounded">
                            {selectedQty} មុខ
                          </span>
                        )}
                        <span className={`p-0.5 rounded border ${
                          isSelected 
                            ? "bg-indigo-900 border-indigo-900 text-white" 
                            : "border-slate-300 text-slate-400 bg-white"
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Calculations summaries inside picker */}
            <div className="border-t border-slate-200 pt-3 mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span className="font-bold">សរុបផលិតផល (Products):</span>
                <span className="font-bold font-mono text-slate-800">{selectedItems.length} មុខ</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span className="font-bold">តម្លៃមុនចុះ (Subtotal):</span>
                <span className="font-bold font-mono text-slate-800">${totalBeforeDiscount.toFixed(2)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-[11px] text-rose-500 font-bold">
                  <span>បញ្ចុះតម្លៃពិសេស (Discount):</span>
                  <span className="font-bold font-mono">-${calculatedDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs border-t border-slate-200 pt-2 text-slate-800 font-bold items-center">
                <span className="uppercase text-[11px] tracking-wide font-black">សរុបត្រូវបង់ (Grand Total):</span>
                <span className="text-md text-indigo-600 font-black font-mono">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-bold uppercase transition-all"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="flex-1 py-1.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold uppercase transition-all"
            >
              រក្សាទុកការកុម្ម៉ង់ (Save Order)
            </button>
          </div>
        </div>

      </div>
    </form>
  );
}
