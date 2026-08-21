import { API_URL } from "./api";
import { getAuthToken } from "./auth";

export interface ShopCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  products_count?: number;
}

export interface ShopProduct {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stock: number;
  image_url?: string | null;
  category_id: number;
  category?: ShopCategory;
  is_active: boolean;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export type PaymentMethod = "points" | "qr" | "cod";

export interface ShopOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: ShopProduct;
}

export interface ShopOrder {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  phone: string;
  note?: string | null;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "failed";
  payment_code?: string | null;
  paid_at?: string | null;
  items?: ShopOrderItem[];
}

export interface QrPayment {
  payment_code: string;
  amount_vnd: number;
  bank_name: string;
  bank_account: string;
  bank_account_holder: string;
  qr_url: string;
  instructions: string;
}

async function shopFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-From-Frontend": "true",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getAuthToken();
    if (!token) throw new Error("Not logged in");
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/v1.0${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${res.status})`);
  }

  return res.json();
}

export function getShopCategories(): Promise<ShopCategory[]> {
  return shopFetch<ShopCategory[]>("/shop/categories");
}

export function getShopProducts(params?: {
  category_id?: number;
  search?: string;
}): Promise<Paginated<ShopProduct>> {
  const query = new URLSearchParams();
  if (params?.category_id) query.set("category_id", String(params.category_id));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return shopFetch<Paginated<ShopProduct>>(`/shop/products${qs ? `?${qs}` : ""}`);
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
  shipping_address: string;
  phone: string;
  note?: string;
  payment_method: PaymentMethod;
}

export interface CreateOrderResponse {
  message: string;
  order: ShopOrder;
  payment?: QrPayment;
}

export function createShopOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  return shopFetch<CreateOrderResponse>(
    "/shop/orders",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    true
  );
}

export interface PaymentStatusResponse {
  order_id: number;
  status: string;
  payment_status: "pending" | "paid" | "failed";
  paid_at: string | null;
  payment?: QrPayment;
}

export function cancelShopOrder(orderId: number): Promise<{ message: string; order: ShopOrder }> {
  return shopFetch(`/shop/orders/${orderId}/cancel`, { method: "POST" }, true);
}

export function getOrderPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
  return shopFetch<PaymentStatusResponse>(`/shop/orders/${orderId}/payment-status`, {}, true);
}
