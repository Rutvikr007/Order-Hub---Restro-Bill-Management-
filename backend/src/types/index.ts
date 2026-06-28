export type OrderStatus = "PLACED" | "PREPARING" | "COMPLETED";

export interface OrderItem {
  item_id: string; // references foods.id
  qty: number;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string | null;
  items: OrderItem[];
  total_amount: string; // numeric comes back from pg as string
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  price: string; // numeric comes back from pg as string
  category: string | null;
  image_path: string | null; // e.g. /uploads/xyz.png, null = use default-food.png
  created_at: string;
  updated_at: string;
}

export interface InvoiceConfig {
  store_id: string;
  restaurant_name: string;
  restaurant_address: string;
  gst_number: string;
  qr_image_path: string | null;
  footer_note: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
