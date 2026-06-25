/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Product, CustomerOrder } from "../types";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Upload, 
  Check, 
  Package, 
  Warehouse, 
  Info 
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface ProductSectionProps {
  products: Product[];
  orders: CustomerOrder[];
  onAddProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductSection({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  // Form State for general Product addition/editing
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [trackStock, setTrackStock] = useState(false);
  const [oldStockForm, setOldStockForm] = useState<number | "">("");
  const [newStockForm, setNewStockForm] = useState<number | "">("");
  const [unit, setUnit] = useState("គ្រឿង");
  const [isUnitManuallyEdited, setIsUnitManuallyEdited] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const autoDetectUnit = (productName: string): string => {
    const n = productName.toLowerCase().trim();
    if (n.includes("ទឹកដោះគោ") || n.includes("milk") || n.includes("ទឹក") || n.includes("water") || n.includes("juice") || n.includes("ស្រាបៀរ") || n.includes("beer") || n.includes("ដប")) {
      return "ដប";
    }
    if (n.includes("កំប៉ុង") || n.includes("can")) {
      return "កំប៉ុង";
    }
    if (n.includes("ប្រអប់") || n.includes("box")) {
      return "ប្រអប់";
    }
    if (n.includes("កេស") || n.includes("case")) {
      return "កេស";
    }
    if (n.includes("កញ្ចប់") || n.includes("pack")) {
      return "កញ្ចប់";
    }
    return "គ្រឿង";
  };

  // State to hold unsaved stock modifications in the dedicated dashboard
  // Keyed by productId, stores { oldStock, newStock } edits
  const [editingStocks, setEditingStocks] = useState<Record<string, { old: number; new: number }>>({});
  // Feedback toast for inline stock updates
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-curated beautiful image suggestions
  const presetImages = [
    { name: "Coffee/Drink", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=300" },
    { name: "T-Shirt", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300" },
    { name: "Cosmetics", url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300" },
    { name: "Bags", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=300" },
    { name: "Electronics", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300" },
    { name: "Snacks/Food", url: "https://images.unsplash.com/photo-1599490659223-e1b981d53e39?q=80&w=300" },
  ];

  // Helper to calculate total quantity of a product sold TODAY
  const getSoldToday = (productId: string): number => {
    const todayStr = new Date().toDateString();
    return (orders || [])
      .filter((o) => new Date(o.createdAt).toDateString() === todayStr)
      .reduce((sum, o) => {
        const item = o.items.find((i) => i.productId === productId);
        return sum + (item ? item.quantity : 0);
      }, 0);
  };

  // Inline Stock Form Handlers — separate old/new stock fields
  const handleInlineStockChange = (productId: string, field: "old" | "new", val: string) => {
    const intVal = val === "" ? 0 : Math.max(0, parseInt(val, 10));
    setEditingStocks((prev) => {
      const existing = prev[productId] ?? {
        old: products.find(p => p.id === productId)?.oldStock ?? 0,
        new: products.find(p => p.id === productId)?.newStock ?? 0,
      };
      return { ...prev, [productId]: { ...existing, [field]: intVal } };
    });
  };

  const handleSaveInlineStock = (product: Product) => {
    const editing = editingStocks[product.id];
    const nextOld = editing ? editing.old : (product.oldStock ?? 0);
    const nextNew = editing ? editing.new : (product.newStock ?? 0);
    const nextTotal = nextOld + nextNew;

    const updatedProduct: Product = {
      ...product,
      trackStock: true,
      oldStock: nextOld,
      newStock: nextNew,
      stockQuantity: nextTotal,
    };

    onUpdateProduct(updatedProduct);

    // Filter out the key so the badge returns to default state
    const cleanEditing = { ...editingStocks };
    delete cleanEditing[product.id];
    setEditingStocks(cleanEditing);

    setSaveFeedback(`បានកែសម្រួលស្តុកទំនិញ "${product.name}" (ចាស់: ${nextOld} + ថ្មី: ${nextNew} = ${nextTotal} ${product.unit || "គ្រឿង"})`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleToggleInlineTracking = (product: Product, checked: boolean) => {
    onUpdateProduct({
      ...product,
      trackStock: checked,
      oldStock: checked ? (product.oldStock ?? 0) : undefined,
      newStock: checked ? (product.newStock ?? 0) : undefined,
      stockQuantity: checked ? ((product.oldStock ?? 0) + (product.newStock ?? 0)) : undefined,
    });

    setSaveFeedback(
      checked 
        ? `បានបើកការកាត់ស្តុកសម្រាប់ "${product.name}"` 
        : `បានបិទការកាត់ស្តុកសម្រាប់ "${product.name}"`
    );
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Base64 helper
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("សូមជ្រើសរើសតែរូបភាពប៉ុណ្ណោះ! (Please choose an image file only)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === "" || price < 0) {
      alert("សូមបំពេញឈ្មោះទំនិញ និងតម្លៃឱ្យបានត្រឹមត្រូវ (Please enter a valid product name and price)");
      return;
    }

    const finalImage = imageUrl.trim() || presetImages[0].url;
    const finalOld = trackStock ? Number(oldStockForm || 0) : undefined;
    const finalNew = trackStock ? Number(newStockForm || 0) : undefined;
    const finalTotal = trackStock ? (Number(oldStockForm || 0) + Number(newStockForm || 0)) : undefined;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name,
        price: Number(price),
        image: finalImage,
        description,
        trackStock,
        oldStock: finalOld,
        newStock: finalNew,
        stockQuantity: finalTotal,
        unit: unit || "គ្រឿង",
      });
      setEditingProduct(null);
    } else {
      onAddProduct({
        name,
        price: Number(price),
        image: finalImage,
        description,
        trackStock,
        oldStock: finalOld,
        newStock: finalNew,
        stockQuantity: finalTotal,
        unit: unit || "គ្រឿង",
      });
      setIsAddingNew(false);
    }

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setImageUrl("");
    setDescription("");
    setTrackStock(false);
    setOldStockForm("");
    setNewStockForm("");
    setUnit("គ្រឿង");
    setIsUnitManuallyEdited(false);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setImageUrl(product.image);
    setDescription(product.description || "");
    setTrackStock(!!product.trackStock);
    setOldStockForm(product.oldStock !== undefined ? product.oldStock : "");
    setNewStockForm(product.newStock !== undefined ? product.newStock : "");
    setUnit(product.unit || "គ្រឿង");
    setIsUnitManuallyEdited(true);
    setIsAddingNew(false);
  };

  const cancelForm = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    resetForm();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="product-management" className="space-y-6">
      {/* 1. Header Catalog Controller */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-slate-700 flex items-center gap-2">
            <span className="p-1 bg-indigo-50 text-indigo-700 rounded select-none">📦</span>
            គ្រប់គ្រងមុខទំនិញ និងទិន្នន័យស្តុក (Catalog & Inventory)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            បង្កើត កែប្រែ ឬលុបមុខទំនិញ និងគ្រប់គ្រងបរិមាណស្តុកទំនិញលក់ចេញប្រចាំថ្ងៃ (Add items, configure baseline stock, track sold ratios)
          </p>
        </div>

        {!isAddingNew && !editingProduct && (
          <button
            id="btn-add-product"
            onClick={() => setIsAddingNew(true)}
            className="w-full sm:w-auto px-4 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            បន្ថែមទំនិញថ្មី (Add Product)
          </button>
        )}
      </div>

      {/* 2. DEDICATED SEPARATE STOCK MANAGEMENT CARD (ប្រអប់កំណត់ស្តុកអីវ៉ាន់ដោយឡែក) */}
      {!isAddingNew && !editingProduct && (
        <div className="bg-white rounded-2xl border-2 border-indigo-600/20 shadow-md overflow-hidden animate-fade-in">
          {/* Header of Stock Box with Logo and Title */}
          <div className="bg-indigo-900/5 px-4 py-3.5 border-b border-indigo-150 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Warehouse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  ប្រអប់គ្រប់គ្រង និងកំណត់ស្តុកអីវ៉ាន់ដោយឡែក (Stock Levels & Dynamic Deductions)
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  កំណត់ចំនួនស្តុកដើមរបស់ទំនិញនីមួយៗ ហើយប្រព័ន្ធនឹងដកស្វ័យប្រវត្តិជាមួយចំនួនដែលលក់បានថ្ងៃនេះ
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-[9px] text-indigo-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking Connected
            </div>
          </div>

          <div className="p-4 space-y-3">
            {saveFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-[10.5px] font-bold flex items-center gap-1.5 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                {saveFeedback}
              </div>
            )}

            {/* List of Products for Inventory & Deduction Status */}
            {products.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                គ្មានទំនិញក្នុងប្រព័ន្ធសម្រាប់គ្រប់គ្រងស្តុកទេ! សូមបង្កើតទំនិញជាមុនសិន។
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 bg-slate-50 uppercase tracking-wider">
                      <th className="py-2 px-3 text-center w-12 select-none">ឡូហ្គោ</th>
                      <th className="py-2 px-3 select-none">ឈ្មោះទំនិញ (Product)</th>
                      <th className="py-2 px-3 select-none text-center">តម្លៃ</th>
                      <th className="py-2 px-3 select-none text-center w-20">កាត់ស្តុក</th>
                      <th className="py-2 px-3 select-none text-center bg-amber-50/70">
                        🗂️ ស្តុកចាស់
                      </th>
                      <th className="py-2 px-3 select-none text-center bg-emerald-50/70">
                        📦 ស្តុកថ្មី
                      </th>
                      <th className="py-2 px-3 select-none text-center bg-indigo-50/70">សរុបស្តុក</th>
                      <th className="py-2 px-3 select-none text-center">លក់ថ្ងៃនេះ</th>
                      <th className="py-2 px-3 select-none text-center">នៅសល់</th>
                      <th className="py-2 px-3 select-none text-center w-12">រក្សា</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.map((p) => {
                      const soldQty = getSoldToday(p.id);
                      const hasTrack = !!p.trackStock;

                      // Resolve editing values or fall back to saved values
                      const editing = editingStocks[p.id];
                      const currentOld = editing !== undefined ? editing.old : (p.oldStock ?? 0);
                      const currentNew = editing !== undefined ? editing.new : (p.newStock ?? 0);
                      const currentTotal = currentOld + currentNew;
                      const savedTotal = (p.oldStock ?? 0) + (p.newStock ?? 0);
                      const isModified = editing !== undefined && (editing.old !== (p.oldStock ?? 0) || editing.new !== (p.newStock ?? 0));

                      // Remaining = total stock - sold today
                      const remaining = hasTrack ? Math.max(0, (p.stockQuantity ?? savedTotal) - soldQty) : Infinity;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Logo */}
                          <td className="py-3 px-3 text-center">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 object-cover rounded-lg border border-slate-200 mx-auto"
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = presetImages[0].url; }}
                            />
                          </td>

                          {/* Product name */}
                          <td className="py-3 px-3 font-bold text-slate-800 leading-tight">
                            <div>{p.name}</div>
                            {p.description && (
                              <div className="text-[9px] text-slate-400 font-normal mt-0.5 line-clamp-1">{p.description}</div>
                            )}
                          </td>

                          {/* Unit price */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 text-center select-none">
                            ${p.price.toFixed(2)}
                          </td>

                          {/* Toggle */}
                          <td className="py-3 px-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer select-none mx-auto justify-center">
                              <input
                                type="checkbox"
                                checked={hasTrack}
                                onChange={(e) => handleToggleInlineTracking(p, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </td>

                          {/* Old Stock input */}
                          <td className="py-2 px-2 bg-amber-50/30">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasTrack}
                              value={hasTrack ? currentOld : ""}
                              placeholder={hasTrack ? "0" : "—"}
                              onChange={(e) => handleInlineStockChange(p.id, "old", e.target.value)}
                              className="w-16 px-1.5 py-1 text-center bg-white border border-amber-200 rounded-lg disabled:bg-slate-100 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 font-mono font-bold text-amber-800 text-xs mx-auto block"
                            />
                          </td>

                          {/* New Stock input */}
                          <td className="py-2 px-2 bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasTrack}
                              value={hasTrack ? currentNew : ""}
                              placeholder={hasTrack ? "0" : "—"}
                              onChange={(e) => handleInlineStockChange(p.id, "new", e.target.value)}
                              className="w-16 px-1.5 py-1 text-center bg-white border border-emerald-200 rounded-lg disabled:bg-slate-100 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 font-mono font-bold text-emerald-800 text-xs mx-auto block"
                            />
                          </td>

                          {/* Total Stock badge */}
                          <td className="py-3 px-3 text-center bg-indigo-50/20">
                            {hasTrack ? (
                              <span className="font-mono font-black text-indigo-700 text-xs">
                                {currentTotal}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Sold Today */}
                          <td className="py-3 px-3 text-center">
                            {soldQty > 0 ? (
                              <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-mono font-extrabold bg-rose-50 text-rose-600 border border-rose-100 select-none">
                                -{soldQty}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">0</span>
                            )}
                          </td>

                          {/* Remaining */}
                          <td className="py-3 px-3 text-center">
                            {hasTrack ? (
                              remaining <= 0 ? (
                                <span className="px-2 py-0.5 rounded-[6px] text-[8.5px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 inline-block select-none">
                                  🚫 អស់ស្តុក
                                </span>
                              ) : remaining <= 5 ? (
                                <span className="px-2 py-0.5 rounded-[6px] text-[8.5px] font-black bg-amber-50 text-amber-600 border border-amber-200 inline-block select-none">
                                  ⚠️ ជិតអស់: {remaining}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block select-none">
                                  📦 {remaining}
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-[6px] text-[8.5px] font-bold bg-slate-50 text-slate-400 border border-slate-100 inline-block select-none">
                                ♾️ Unlimited
                              </span>
                            )}
                          </td>

                          {/* Save button */}
                          <td className="py-3 px-2 text-center">
                            {hasTrack && isModified ? (
                              <button
                                onClick={() => handleSaveInlineStock(p)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9.5px] font-black cursor-pointer shadow-sm active:translate-y-0.5 transition-all flex items-center gap-0.5 mx-auto"
                                title="រក្សាទុកស្តុក"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="w-6 h-6 block mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Product Editor / Creation Form */}
      {(isAddingNew || editingProduct) && (
        <form 
          id="product-form" 
          onSubmit={handleSubmit} 
          className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs relative animate-fade-in"
        >
          <button
            type="button"
            onClick={cancelForm}
            className="absolute top-4.5 right-4.5 p-1.5 rounded-full hover:bg-slate-200 text-slate-450 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-[11px] font-black text-indigo-805 text-indigo-900 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2 flex items-center gap-1.5">
            {editingProduct ? "📝 កែប្រែព័ត៌មានទំនិញ (Edit Products)" : "➕ បន្ថែមព័ត៌មានទំនិញថ្មី (Add New Product Catalog)"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side: Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                  ឈ្មោះទំនិញ <span className="text-rose-550 text-rose-500">*</span> (Product Name)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isUnitManuallyEdited) {
                      setUnit(autoDetectUnit(e.target.value));
                    }
                  }}
                  placeholder="ឧ. កាហ្វេទឹកដោះគោទឹកកក..."
                  className="w-full px-3 py-1.8 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-xs outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                  តម្លៃទំនិញ $ <span className="text-rose-500">*</span> (Price USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="ឧ. 2.50"
                  className="w-full px-3 py-1.8 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-xs font-mono outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                  ការពិពណ៌នាខ្លីៗ (Brief Description - Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ព័ត៌មានបន្ថែំទាក់ទងនឹងទំនិញ..."
                  rows={2}
                  className="w-full px-3 py-1.8 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-xs outline-none transition-all resize-none"
                />
              </div>

              {/* Stock Inventory Section Inside Editor */}
              <div className="p-3.5 bg-indigo-50/40 border-2 border-dashed border-indigo-150 rounded-xl space-y-3">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trackStock}
                    onChange={(e) => setTrackStock(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-tight block">
                      បើកដំណើរការការកាត់ស្តុកអីវ៉ាន់ (Track Inventory Stock)
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
                      ប្រព័ន្ធនឹងកាត់ដកបរិមាណដែលលក់ចេញស្វ័យប្រវត្ត
                    </span>
                  </div>
                </label>
                {trackStock && (
                  <div className="mt-2 flex flex-col gap-3 pt-2 border-t border-indigo-100">
                    {/* Old Stock */}
                    <div>
                      <label className="block text-[10px] font-black text-amber-700 uppercase tracking-tight mb-1">
                        🗂️ ស្តុកចាស់ (Old Stock — Previous Batch)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={oldStockForm}
                        onChange={(e) => setOldStockForm(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value)))}
                        placeholder="ស្តុកចាស់ ឧ. 20"
                        className="w-full px-3 py-1.8 bg-white border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-400 focus:border-amber-400 text-xs font-mono font-bold text-amber-800 outline-none transition-all"
                      />
                    </div>
                    {/* New Stock */}
                    <div>
                      <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-tight mb-1">
                        📦 ស្តុកថ្មី (New Stock — Newly Arrived Batch)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newStockForm}
                        onChange={(e) => setNewStockForm(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value)))}
                        placeholder="ស្តុកថ្មី ឧ. 80"
                        className="w-full px-3 py-1.8 bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 text-xs font-mono font-bold text-emerald-800 outline-none transition-all"
                      />
                    </div>
                    {/* Total preview */}
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-indigo-700 font-bold">សរុបស្តុក (Total):</span>
                      <span className="font-mono font-black text-indigo-800 text-sm">
                        {Number(oldStockForm || 0) + Number(newStockForm || 0)}
                      </span>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => {
                          setUnit(e.target.value);
                          setIsUnitManuallyEdited(true);
                        }}
                        placeholder="គ្រឿង"
                        className="w-16 px-1.5 py-0.5 border border-indigo-200 rounded text-xs bg-white text-indigo-850 text-indigo-800 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: File Upload / presets */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                រូបភាពទំនិញ (Product Image Cover)
              </label>

              {/* Drag and Drop or click Upload */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : imageUrl
                    ? "border-slate-300 bg-white"
                    : "border-slate-250 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="flex flex-col items-center gap-1.8">
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-250 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-indigo-600 font-bold underline">ប្តូររូបភាពផ្សេង (Change image)</span>
                  </div>
                ) : (
                  <div className="text-center py-2 flex flex-col items-center">
                    <Upload className="w-8 h-8 text-indigo-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-705 text-slate-700">
                      អូស និងទម្លាក់រូបភាពនៅទីនេះ ឬ ចុចដើម្បីស្វែងរក
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Drag & drop or Click to upload cover photo
                    </p>
                  </div>
                )}
              </div>

              {/* Preset cover quick links */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold mb-1.5 flex items-center gap-1 uppercase tracking-tight">
                  <Sparkles className="w-3 h-3 text-amber-500" /> 
                  ឬជ្រើសរើសរូបភាពគំរូទូទៅ (Or select a curated photo):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presetImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-[9.5px] text-slate-600 font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-1.8 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="px-4 py-1.8 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer shadow-xs active:translate-y-0.2"
            >
              រក្សាទុក (Save Product)
            </button>
          </div>
        </form>
      )}

      {/* 4. General Product Catalog list grid */}
      <div id="product-list-container" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3.5">
        <h3 className="text-xs font-black text-slate-750 text-slate-755 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <span className="p-1 bg-indigo-50 text-indigo-700 rounded-lg">🏷️</span>
          បញ្ជីទំនិញនៅក្នុងហាងទាំងអស់ (All Products Grid)
        </h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="ស្វែងរកទំនិញ... (Search products...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.8 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-xs outline-none transition-all"
          />
        </div>

        {/* Catalog Table/Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 animate-pulse-subtle">
            <span className="text-xl">🔍</span>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              មិនរកឃើញមុខទំនិញណាដែលត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map((p) => {
              const remains = p.trackStock ? Math.max(0, (p.stockQuantity || 0) - getSoldToday(p.id)) : Infinity;

              return (
                <div
                  key={p.id}
                  className="group border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-405 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col bg-white relative"
                >
                  {/* Actions overlay panel */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 z-15 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-indigo-900/85 p-0.5 rounded-lg backdrop-blur-xs">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1 hover:bg-white/20 rounded-md text-white transition-colors cursor-pointer"
                      title="Edit product info"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDeleteId(p.id)}
                      className="p-1 hover:bg-rose-500/60 rounded-md text-red-100 hover:text-white transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Cover Photo with stock warning overlays */}
                  <div className="h-24 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = presetImages[0].url;
                      }}
                    />
                    
                    {p.trackStock && (
                      <div className="absolute bottom-1 right-1">
                        {remains <= 0 ? (
                          <span className="px-1 text-[8px] font-black uppercase text-white bg-rose-600 rounded">Out of Stock</span>
                        ) : remains <= 5 ? (
                          <span className="px-1 text-[8px] font-black uppercase text-slate-850 bg-amber-400 rounded">Low Stock</span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Info block */}
                  <div className="p-2 flex-1 flex flex-col justify-between space-y-1">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 line-clamp-1" title={p.name}>
                        {p.name}
                      </h4>
                      {p.description ? (
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 leading-relaxed h-3.5">
                          {p.description}
                        </p>
                      ) : (
                        <div className="h-3.5"></div>
                      )}

                      {/* Stock inline badges for each product item card */}
                      <div className="mt-1">
                        {p.trackStock ? (
                          remains <= 0 ? (
                            <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase bg-rose-50 text-rose-505 text-rose-600 border border-rose-100">
                              🚫 អស់ស្តុក
                            </span>
                          ) : remains <= 5 ? (
                            <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                              ⚠️ ជិតអស់: {remains}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              📦 នៅសល់: {remains}
                            </span>
                          )
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-medium bg-slate-50 text-slate-400 border border-slate-100">
                            ♾️ គ្មានដែនកំណត់
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-1.5 pt-1 border-t border-slate-100 select-none">
                      <span className="text-[9px] font-mono text-slate-400">Price</span>
                      <span className="text-xs font-black text-indigo-600 font-mono">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={productToDeleteId !== null}
        title="លុបមុខទំនិញ (Delete Product)"
        message="តើអ្នកពិតជាចង់លុបមុខទំនិញនេះមែនទេ? (Are you sure you want to delete this product?)"
        confirmLabel="លុបចោល (Delete)"
        cancelLabel="បោះបង់ (Cancel)"
        isDanger={true}
        onConfirm={() => {
          if (productToDeleteId) {
            onDeleteProduct(productToDeleteId);
            setProductToDeleteId(null);
          }
        }}
        onCancel={() => setProductToDeleteId(null)}
      />
    </div>
  );
}
