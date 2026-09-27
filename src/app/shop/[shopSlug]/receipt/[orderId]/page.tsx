"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import type { OrderWithItems } from "@/types/database";

export default function ReceiptPage() {
  const params = useParams<{ shopSlug: string; orderId: string }>();
  const { shopSlug, orderId } = params;
  const [order, setOrder] = useState<OrderWithItems | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setOrder(payload?.order ?? null))
      .catch(() => undefined);
  }, [orderId]);

  if (!order) {
    return <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">Loading receipt…</main>;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-8">
      <Link href={`/shop/${shopSlug}`} className="text-sm font-semibold text-brand">
        ← Menu
      </Link>
      <article className="mt-4 rounded-3xl bg-card p-5 ring-1 ring-line">
        <h1 className="display text-center text-2xl uppercase">{order.shop?.name ?? "Receipt"}</h1>
        <p className="mt-2 text-center font-semibold">Order #{order.order_number}</p>
        <p className="mt-4 text-sm">
          Customer: <span className="font-semibold">{order.customer_name}</span>
        </p>
        <p className="text-sm">
          Mobile: <span className="font-semibold">{order.customer_mobile}</span>
        </p>
        <hr className="my-4 border-line" />
        {order.order_items.map((item) => (
          <div key={item.id} className="mb-2 flex items-start justify-between text-sm">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-muted">
                {item.quantity} × {formatINR(item.unit_price_paise)}
              </p>
            </div>
            <p className="font-semibold">{formatINR(item.line_total_paise)}</p>
          </div>
        ))}
        <hr className="my-4 border-line" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatINR(order.total_paise)}</span>
        </div>
        <p className="mt-4 text-sm">Payment: {order.payment_method}</p>
        <p className="text-sm">Status: {order.order_status}</p>
        <p className="mt-6 text-center text-sm text-muted">Thank you!</p>
      </article>
    </main>
  );
}
