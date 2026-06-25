/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "យល់ព្រម",
  cancelLabel = "បោះបង់",
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200/85 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status/Warning Icon */}
        <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${
          isDanger ? "bg-rose-50 border border-rose-150 text-rose-500" : "bg-indigo-50 border border-indigo-150 text-indigo-505"
        }`}>
          {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        {/* Information Heading */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
            {message}
          </p>
        </div>

        {/* Action Button Controls */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 select-none transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 select-none transition-all cursor-pointer ${
              isDanger 
                ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800" 
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
