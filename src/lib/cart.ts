import type { CartItem, OrderStatus } from "@/types/database";

const CART_PREFIX = "fastfood:cart:";
const CUSTOMER_PREFIX = "fastfood:customer:";
const ACTIVE_ORDER_PREFIX = "fastfood:active-order:";

export function cartStorageKey(shopSlug: string) {
  return `${CART_PREFIX}${shopSlug}`;
}

export function readCart(shopSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cartStorageKey(shopSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(shopSlug: string, items: CartItem[]) {
  localStorage.setItem(cartStorageKey(shopSlug), JSON.stringify(items));
}

export function clearCart(shopSlug: string) {
  localStorage.removeItem(cartStorageKey(shopSlug));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotalPaise(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
}

export type SavedCustomer = { name: string; mobile: string };

export function readCustomer(shopSlug: string): SavedCustomer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CUSTOMER_PREFIX}${shopSlug}`);
    return raw ? (JSON.parse(raw) as SavedCustomer) : null;
  } catch {
    return null;
  }
}

export function writeCustomer(shopSlug: string, customer: SavedCustomer) {
  localStorage.setItem(`${CUSTOMER_PREFIX}${shopSlug}`, JSON.stringify(customer));
}

export type ActiveOrderRef = { orderId: string; shopSlug: string };

export function readActiveOrder(shopSlug: string): ActiveOrderRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${ACTIVE_ORDER_PREFIX}${shopSlug}`);
    return raw ? (JSON.parse(raw) as ActiveOrderRef) : null;
  } catch {
    return null;
  }
}

export function writeActiveOrder(shopSlug: string, orderId: string) {
  localStorage.setItem(
    `${ACTIVE_ORDER_PREFIX}${shopSlug}`,
    JSON.stringify({ orderId, shopSlug } satisfies ActiveOrderRef),
  );
}

export function clearActiveOrder(shopSlug: string) {
  localStorage.removeItem(`${ACTIVE_ORDER_PREFIX}${shopSlug}`);
}

export function isTerminalCustomerOrder(status: OrderStatus) {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function upsertCartItem(items: CartItem[], next: CartItem): CartItem[] {
  const existing = items.find((item) => item.productId === next.productId);
  if (!existing) {
    return [...items, next];
  }
  return items.map((item) =>
    item.productId === next.productId
      ? { ...item, quantity: item.quantity + next.quantity, name: next.name, pricePaise: next.pricePaise }
      : item,
  );
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }
  return items.map((item) => (item.productId === productId ? { ...item, quantity } : item));
}
