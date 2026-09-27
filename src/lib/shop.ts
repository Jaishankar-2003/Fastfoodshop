import { createServiceClient } from "@/lib/supabase/admin";
import type { CartItem, Category, Order, OrderItem, Product, Shop } from "@/types/database";

export async function getShopBySlug(slug: string) {
  const supabase = createServiceClient();

  console.log("🔎 Looking for shop slug:", slug);

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  console.log("🏪 Shop result:", data);
  console.log("❌ Shop error:", error);

  if (error) throw error;

  return data as Shop | null;
}

export async function getShopByOwner(ownerId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Shop | null;
}

export async function getShopMenu(shopId: string) {
  const supabase = createServiceClient();
  const [{ data: categories, error: catError }, { data: products, error: prodError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("shop_id", shopId)
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopId)
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true }),
    ]);

  if (catError) throw catError;
  if (prodError) throw prodError;

  return {
    categories: (categories ?? []) as Category[],
    products: (products ?? []) as Product[],
  };
}

export async function getShopMenuAdmin(shopId: string) {
  const supabase = createServiceClient();
  const [{ data: categories, error: catError }, { data: products, error: prodError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("shop_id", shopId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopId)
        .order("name", { ascending: true }),
    ]);

  if (catError) throw catError;
  if (prodError) throw prodError;

  return {
    categories: (categories ?? []) as Category[],
    products: (products ?? []) as Product[],
  };
}

export type ValidatedCart = {
  items: Array<{
    product: Product;
    quantity: number;
    lineTotalPaise: number;
  }>;
  subtotalPaise: number;
};

export async function validateCartForCheckout(
  shop: Shop,
  cart: Array<Pick<CartItem, "productId" | "quantity">>,
): Promise<ValidatedCart> {
  if (!shop.is_active) {
    throw new CheckoutError("This shop is not available.");
  }
  if (!shop.is_open) {
    throw new CheckoutError("SHOP_CLOSED");
  }
  if (!cart.length) {
    throw new CheckoutError("Your cart is empty.");
  }

  const productIds = cart.map((item) => item.productId);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .in("id", productIds);

  if (error) throw error;
  const products = (data ?? []) as Product[];
  const byId = new Map(products.map((product) => [product.id, product]));

  const items: ValidatedCart["items"] = [];

  for (const line of cart) {
    if (line.quantity <= 0 || line.quantity > 50) {
      throw new CheckoutError("Invalid quantity.");
    }
    const product = byId.get(line.productId);
    if (!product) {
      throw new CheckoutError("A product in your cart is no longer available.");
    }
    if (!product.is_available) {
      throw new CheckoutError(`${product.name} is currently unavailable.`);
    }
    items.push({
      product,
      quantity: line.quantity,
      lineTotalPaise: product.price_paise * line.quantity,
    });
  }

  const subtotalPaise = items.reduce((sum, item) => sum + item.lineTotalPaise, 0);
  if (subtotalPaise <= 0) {
    throw new CheckoutError("Cart total is invalid.");
  }

  return { items, subtotalPaise };
}

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export async function getOrderWithItems(orderId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), shops(id, name, slug, logo_url)")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { shops, order_items, ...order } = data as Order & {
    order_items: OrderItem[];
    shops: { id: string; name: string; slug: string; logo_url: string | null } | null;
  };

  return {
    ...order,
    order_items: order_items ?? [],
    shop: shops ?? undefined,
  };
}
