export type PaymentMethod = "CASH" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type OrderStatus = "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type Shop = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  image_url: string | null;
  description: string | null;
  contact_mobile: string | null;
  address: string | null;
  is_active: boolean;
  is_open: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  shop_id: string;
  name: string;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_paise: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  shop_id: string;
  order_number: number;
  customer_name: string;
  customer_mobile: string;
  subtotal_paise: number;
  total_paise: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  idempotency_key: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  provider_event_id: string | null;
  amount_paise: number;
  currency: string;
  status: "CREATED" | "PENDING" | "PAID" | "FAILED";
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
  shop?: Pick<Shop, "id" | "name" | "slug" | "logo_url">;
};

export type CartItem = {
  productId: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl: string | null;
};
