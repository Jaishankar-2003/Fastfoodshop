import { createServiceClient } from "@/lib/supabase/admin";
import { CheckoutError, type ValidatedCart } from "@/lib/shop";
import { isValidIndianMobile, normalizeMobile } from "@/lib/format";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/database";

export function validateCustomer(name: string, mobile: string) {
  const trimmedName = name.trim();
  const normalizedMobile = normalizeMobile(mobile);

  if (trimmedName.length < 2 || trimmedName.length > 60) {
    throw new CheckoutError("Please enter your name.");
  }
  if (!isValidIndianMobile(normalizedMobile)) {
    throw new CheckoutError("Enter a valid 10-digit Indian mobile number.");
  }

  return { name: trimmedName, mobile: normalizedMobile };
}

export async function insertOrder(params: {
  shopId: string;
  customerName: string;
  customerMobile: string;
  cart: ValidatedCart;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  idempotencyKey?: string;
}) {
  const supabase = createServiceClient();

  if (params.idempotencyKey) {
    const { data: existing } = await supabase
      .from("orders")
      .select("*")
      .eq("idempotency_key", params.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return existing as Order;
    }
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      shop_id: params.shopId,
      customer_name: params.customerName,
      customer_mobile: params.customerMobile,
      subtotal_paise: params.cart.subtotalPaise,
      total_paise: params.cart.subtotalPaise,
      payment_method: params.paymentMethod,
      payment_status: params.paymentStatus,
      order_status: params.orderStatus,
      idempotency_key: params.idempotencyKey ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505" && params.idempotencyKey) {
      const { data: existing } = await supabase
        .from("orders")
        .select("*")
        .eq("idempotency_key", params.idempotencyKey)
        .single();
      return existing as Order;
    }
    throw error;
  }

  const rows = params.cart.items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    unit_price_paise: item.product.price_paise,
    quantity: item.quantity,
    line_total_paise: item.lineTotalPaise,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(rows);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }

  return order as Order;
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  NEW: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

export function nextOrderStatus(status: OrderStatus) {
  return NEXT_STATUS[status];
}

export function statusActionLabel(status: OrderStatus) {
  switch (status) {
    case "NEW":
      return "Start preparing";
    case "PREPARING":
      return "Mark ready";
    case "READY":
      return "Complete";
    default:
      return null;
  }
}

export async function markOrderPaid(orderId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: "PAID" })
    .eq("id", orderId)
    .neq("payment_status", "PAID")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export function isVisibleToAdminKitchen(order: Pick<Order, "payment_method" | "payment_status" | "order_status">) {
  if (order.order_status === "COMPLETED" || order.order_status === "CANCELLED") {
    return false;
  }
  if (order.payment_method === "ONLINE" && order.payment_status !== "PAID") {
    return false;
  }
  return true;
}
