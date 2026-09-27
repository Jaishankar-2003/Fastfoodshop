"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cartTotalPaise,
  clearCart,
  readCart,
  setCartQuantity,
  writeCart,
} from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { CartItem } from "@/types/database";

export default function CartPage() {
  const params = useParams<{ shopSlug: string }>();
  const router = useRouter();
  const shopSlug = params.shopSlug;
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart(shopSlug));
  }, [shopSlug]);

  function persist(next: CartItem[]) {
    setItems(next);
    writeCart(shopSlug, next);
  }

  const total = cartTotalPaise(items);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <Link href={`/shop/${shopSlug}`} className="text-sm font-semibold text-brand">
          ← Menu
        </Link>
        {items.length ? (
          <button
            type="button"
            onClick={() => {
              clearCart(shopSlug);
              setItems([]);
            }}
            className="text-sm font-semibold text-muted"
          >
            Clear cart
          </button>
        ) : null}
      </div>

      <h1 className="display mt-4 text-3xl">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-card px-5 py-10 text-center ring-1 ring-line">
          <p className="font-semibold">Cart is empty</p>
          <Link href={`/shop/${shopSlug}`} className="mt-4 inline-flex font-semibold text-brand">
            Browse menu
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="rounded-2xl bg-card p-4 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.quantity} × {formatINR(item.pricePaise)} ={" "}
                    <span className="font-semibold text-foreground">
                      {formatINR(item.pricePaise * item.quantity)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold uppercase text-muted"
                  onClick={() => persist(setCartQuantity(items, item.productId, 0))}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-brand"
                  onClick={() => persist(setCartQuantity(items, item.productId, item.quantity - 1))}
                >
                  −
                </button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
                  onClick={() => persist(setCartQuantity(items, item.productId, item.quantity + 1))}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length ? (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6">
          <div className="mb-3 flex items-center justify-between text-base font-bold">
            <span>Subtotal</span>
            <span>{formatINR(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/shop/${shopSlug}/checkout`)}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
          >
            Continue
          </button>
        </div>
      ) : null}
    </main>
  );
}
