/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PaymentStatus {
  PAID = "Paid",
  COD = "COD",
  UNPAID = "Unpaid"
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // URL, Base64, or placeholder emoji indicator
  description?: string;
  trackStock?: boolean;
  stockQuantity?: number; // Total = oldStock + newStock (derived or set directly)
  oldStock?: number;      // ស្តុកចាស់ — previous batch remaining
  newStock?: number;      // ស្តុកថ្មី  — newly arrived batch
  unit?: string;          // ឯកតាស្តុក (e.g. គ្រឿង, ដប, កេស, កំប៉ុង)
  createdAt: string;
}

export interface PurchasedProductItem {
  productId: string;
  quantity: number;
  overridePrice?: number; // In case price changed
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  items: PurchasedProductItem[];
  discountValue: number; // Discount amount
  discountType: 'percentage' | 'fixed'; // In percentage (%) or fixed ($) value
  paymentStatus: PaymentStatus;
  createdAt: string;
  notes?: string;
}

export interface SellerProfile {
  shopName: string;
  subtitle: string;
  addressAndContact: string;
  signatureLabel: string;
  logoEmoji: string;
  logoImage?: string;
  geminiApiKey?: string;
}

export interface User {
  id: string;
  username: string;
  role: "admin" | "seller";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}


