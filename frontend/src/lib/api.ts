import axios from "axios";
import { Food, InvoiceConfig, Order, OrderItem, OrderStatus, Paginated } from "@/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export function normalizeOrderId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function encodeOrderId(id: string): string {
  return encodeURIComponent(normalizeOrderId(id));
}

export interface CreateOrderPayload {
  store_id: string;
  customer_name?: string;
  items: OrderItem[];
  // total_amount is no longer sent - the backend computes it from each
  // food item's saved price.
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<{ data: Order }>("/orders", payload);
  return data.data;
}

export interface ListOrdersParams {
  store_id: string;
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export async function listOrders(params: ListOrdersParams): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>("/orders", { params });
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<{ data: Order }>(`/orders/${encodeOrderId(id)}`);
  return data.data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<{ data: Order }>(`/orders/${encodeOrderId(id)}/status`, { status });
  return data.data;
}

export interface OrdersPerDayRow {
  day: string;
  order_count: number;
}

export async function getOrdersPerDay(storeId?: string, days = 30): Promise<OrdersPerDayRow[]> {
  const { data } = await api.get<{ data: OrdersPerDayRow[] }>("/analytics/orders-per-day", {
    params: { store_id: storeId, days },
  });
  return data.data;
}

export interface RevenuePerStoreRow {
  store_id: string;
  total_revenue: string;
  order_count: number;
}

export async function getRevenuePerStore(): Promise<RevenuePerStoreRow[]> {
  const { data } = await api.get<{ data: RevenuePerStoreRow[] }>("/analytics/revenue-per-store");
  return data.data;
}

export interface TopItemRow {
  item_id: string;
  total_qty: number;
}

export async function getTopSellingItems(limit = 5, storeId?: string): Promise<TopItemRow[]> {
  const { data } = await api.get<{ data: TopItemRow[] }>("/analytics/top-items", {
    params: { limit, store_id: storeId },
  });
  return data.data;
}

export async function archiveOldOrders(): Promise<{ message: string; archived_count: number }> {
  const { data } = await api.post("/archive-old-orders");
  return data;
}

// ---- Invoice configuration ----

export interface InvoiceFormInput {
  restaurant_name: string;
  restaurant_address: string;
  gst_number: string;
  footer_note?: string;
  qr_image?: File | null;
}

export async function getInvoiceConfig(storeId: string): Promise<InvoiceConfig | null> {
  const { data } = await api.get<{ data: InvoiceConfig | null }>(`/invoice-configs/${storeId}`);
  return data.data;
}

function toInvoiceFormData(input: InvoiceFormInput): FormData {
  const form = new FormData();
  form.set("restaurant_name", input.restaurant_name);
  form.set("restaurant_address", input.restaurant_address);
  form.set("gst_number", input.gst_number);
  if (input.footer_note !== undefined) form.set("footer_note", input.footer_note);
  if (input.qr_image) form.set("qr_image", input.qr_image);
  return form;
}

export async function saveInvoiceConfig(storeId: string, input: InvoiceFormInput): Promise<InvoiceConfig> {
  const { data } = await api.put<{ data: InvoiceConfig }>(
    `/invoice-configs/${storeId}`,
    toInvoiceFormData(input),
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data.data;
}

// ---- Food catalog (Food Management) ----

export interface ListFoodsParams {
  category?: string;
}

export async function listFoods(params: ListFoodsParams = {}): Promise<Food[]> {
  const { data } = await api.get<{ data: Food[] }>("/foods", { params });
  return data.data;
}

export async function getFood(id: string): Promise<Food> {
  const { data } = await api.get<{ data: Food }>(`/foods/${id}`);
  return data.data;
}

export interface FoodFormInput {
  name: string;
  price: number;
  category?: string;
  image?: File | null;
  removeImage?: boolean;
}

function toFoodFormData(input: FoodFormInput): FormData {
  const form = new FormData();
  form.set("name", input.name);
  form.set("price", String(input.price));
  if (input.category) form.set("category", input.category);
  if (input.removeImage) form.set("remove_image", "true");
  if (input.image) form.set("image", input.image);
  return form;
}

export async function createFood(input: FoodFormInput): Promise<Food> {
  const { data } = await api.post<{ data: Food }>("/foods", toFoodFormData(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function updateFood(id: string, input: FoodFormInput): Promise<Food> {
  const { data } = await api.patch<{ data: Food }>(`/foods/${id}`, toFoodFormData(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function deleteFood(id: string): Promise<void> {
  await api.delete(`/foods/${id}`);
}
