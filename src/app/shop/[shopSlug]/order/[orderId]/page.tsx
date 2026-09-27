"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { clearActiveOrder, isTerminalCustomerOrder, writeActiveOrder } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { OrderStatus, OrderWithItems } from "@/types/database";

const STEPS: OrderStatus[] = ["NEW", "PREPARING", "READY", "COMPLETED"];

function stepIndex(status: OrderStatus) {
  if (status === "CANCELLED") return -1;
  return STEPS.indexOf(status);
}

export default function OrderTrackingPage() {
  const params = useParams<{ shopSlug: string; orderId: string }>();
  const { shopSlug, orderId } = params;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReadyDetails, setShowReadyDetails] = useState(false);

  async function load() {
    const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (!response.ok) {
      setError("Order not found.");
      return;
    }
    const payload = await response.json();
    setOrder(payload.order);
    if (isTerminalCustomerOrder(payload.order.order_status)) {
      clearActiveOrder(shopSlug);
    } else {
      writeActiveOrder(shopSlug, orderId);
    }
  }

  useEffect(() => {
    void load();

    if (!isSupabaseConfigured()) {
      const timer = setInterval(() => void load(), 4000);
      return () => clearInterval(timer);
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => {
          void load();
        },
      )
      .subscribe();

    const timer = setInterval(() => void load(), 8000);
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, shopSlug]);

  const current = useMemo(() => (order ? stepIndex(order.order_status) : 0), [order]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="font-semibold">{error}</p>
        <Link href={`/shop/${shopSlug}`} className="mt-4 inline-flex text-brand">
          Back to menu
        </Link>
      </main>
    );
  }

  if (!order) {
    return <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">Loading order…</main>;
  }

  if (order.order_status === "READY") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="display mt-4 text-4xl">Your order is ready!</h1>
        <p className="mt-3 text-lg font-semibold">Order #{order.order_number}</p>
        <p className="mt-2 text-muted">Please collect your order from the shop.</p>
        <button
          type="button"
          onClick={() => setShowReadyDetails((value) => !value)}
          className="mt-6 h-12 rounded-2xl bg-brand px-5 font-bold text-white"
        >
          {showReadyDetails ? "Hide order" : "View order"}
        </button>
        {showReadyDetails ? <OrderStatusCard order={order} current={current} shopSlug={shopSlug} /> : null}
      </main>
    );
  }

  if (order.order_status === "COMPLETED") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="display mt-4 text-4xl">Order completed</h1>
        <p className="mt-3 text-lg">Thank you, {order.customer_name}!</p>
        <p className="mt-1 text-muted">Order #{order.order_number}</p>
        <Link
          href={`/shop/${shopSlug}/receipt/${order.id}`}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-card font-semibold ring-1 ring-line"
        >
          View receipt
        </Link>
        <Link
          href={`/shop/${shopSlug}`}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-brand font-bold text-white"
        >
          Place new order
        </Link>
      </main>
    );
  }

  if (order.order_status === "CANCELLED") {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="display text-3xl">Order cancelled</h1>
        <p className="mt-2 text-muted">Please speak with the shop if you need help.</p>
        <Link href={`/shop/${shopSlug}`} className="mt-6 inline-flex font-semibold text-brand">
          Place new order
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-8">
      <p className="text-sm font-semibold text-brand">Order #{order.order_number}</p>
      <h1 className="display mt-2 text-3xl">Hi {order.customer_name}</h1>
      <p className="mt-2 text-muted">
        {order.payment_method === "ONLINE" && order.payment_status !== "PAID"
          ? "Waiting for payment confirmation."
          : "Your order is confirmed."}
      </p>
      <OrderStatusCard order={order} current={current} shopSlug={shopSlug} />
    </main>
  );
}

function OrderStatusCard({
  order,
  current,
  shopSlug,
}: {
  order: OrderWithItems;
  current: number;
  shopSlug: string;
}) {
  const labels: Record<string, string> = {
    NEW: "Order received",
    PREPARING: "Preparing",
    READY: "Ready",
    COMPLETED: "Completed",
  };

  return (
    <section id="status" className="mt-8 w-full max-w-md rounded-3xl bg-card p-5 ring-1 ring-line">
      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const done = current >= index;
          const active = current === index;
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-brand text-white" : done ? "bg-emerald-600 text-white" : "bg-orange-50 text-muted"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={`font-semibold ${active ? "text-brand" : done ? "text-foreground" : "text-muted"}`}>
                {labels[step]}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 border-t border-line pt-4 text-sm">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between py-1">
            <span>
              {item.quantity} × {item.product_name}
            </span>
            <span>{formatINR(item.line_total_paise)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatINR(order.total_paise)}</span>
        </div>
        <p className="mt-3 text-muted">
          Payment:{" "}
          {order.payment_method === "CASH"
            ? `Cash — ${order.payment_status === "PAID" ? "Paid" : "Pay at shop"}`
            : `Online — ${order.payment_status}`}
        </p>
      </div>

      {order.order_status === "COMPLETED" ? (
        <Link href={`/shop/${shopSlug}/receipt/${order.id}`} className="mt-4 block text-center font-semibold text-brand">
          View receipt
        </Link>
      ) : null}
    </section>
  );
}
