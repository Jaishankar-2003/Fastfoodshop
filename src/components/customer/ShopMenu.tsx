"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/customer/ProductCard";
import {
  cartCount,
  cartTotalPaise,
  clearActiveOrder,
  isTerminalCustomerOrder,
  readActiveOrder,
  readCart,
  setCartQuantity,
  upsertCartItem,
  writeCart,
} from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { Category, Product, Shop } from "@/types/database";

type Props = {
  shop: Shop;
  categories: Category[];
  products: Product[];
};

export function ShopMenu({ shop, categories, products }: Props) {
  const [items, setItems] = useState(() => readCart(shop.slug));
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    setItems(readCart(shop.slug));
    const ref = readActiveOrder(shop.slug);
    if (!ref) return;

    fetch(`/api/orders/${ref.orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const status = payload?.order?.order_status;
        if (!status || isTerminalCustomerOrder(status)) {
          clearActiveOrder(shop.slug);
          setActiveOrderId(null);
          return;
        }
        setActiveOrderId(ref.orderId);
      })
      .catch(() => undefined);
  }, [shop.slug]);

  function persist(next: typeof items) {
    setItems(next);
    writeCart(shop.slug, next);
  }

  const qtyByProduct = useMemo(() => {
    return Object.fromEntries(items.map((item) => [item.productId, item.quantity]));
  }, [items]);

  const visibleProducts = products.filter((product) => {
    if (activeCategory === "all") return true;
    return product.category_id === activeCategory;
  });

  const count = cartCount(items);
  const total = cartTotalPaise(items);

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <header className="relative overflow-hidden rounded-b-3xl bg-stone-900 text-white">
        {shop.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        ) : null}
        <div className="relative px-5 pb-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍜</div>
              )}
            </div>
            <div>
              <h1 className="display text-2xl leading-tight">{shop.name}</h1>
              {shop.description ? <p className="mt-1 text-sm text-white/80">{shop.description}</p> : null}
            </div>
          </div>
        </div>
      </header>

      {!shop.is_open ? (
        <div className="mx-4 mt-4 rounded-2xl bg-red-50 px-4 py-5 text-center ring-1 ring-red-100">
          <p className="text-base font-bold text-red-700">Shop closed</p>
          <p className="mt-1 text-sm text-red-700/80">We&apos;re currently not accepting orders. Please try again later.</p>
        </div>
      ) : null}

      {activeOrderId ? (
        <Link
          href={`/shop/${shop.slug}/order/${activeOrderId}`}
          className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100"
        >
          View your current order
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <div className="sticky top-0 z-10 mt-4 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
              activeCategory === "all" ? "bg-stone-900 text-white" : "bg-card text-foreground ring-1 ring-line"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
                activeCategory === category.id ? "bg-stone-900 text-white" : "bg-card text-foreground ring-1 ring-line"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 space-y-3 px-4">
        {visibleProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No items in this category yet.</p>
        ) : (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={qtyByProduct[product.id] ?? 0}
              onAdd={() =>
                persist(
                  upsertCartItem(items, {
                    productId: product.id,
                    name: product.name,
                    pricePaise: product.price_paise,
                    quantity: 1,
                    imageUrl: product.image_url,
                  }),
                )
              }
              onIncrease={() => persist(setCartQuantity(items, product.id, (qtyByProduct[product.id] ?? 0) + 1))}
              onDecrease={() => persist(setCartQuantity(items, product.id, (qtyByProduct[product.id] ?? 0) - 1))}
            />
          ))
        )}
      </div>

      {count > 0 && shop.is_open ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-4">
          <Link
            href={`/shop/${shop.slug}/cart`}
            className="flex h-14 items-center justify-between rounded-2xl bg-brand px-5 text-white shadow-lg"
          >
            <span className="font-semibold">View cart · {count} item{count === 1 ? "" : "s"}</span>
            <span className="font-bold">{formatINR(total)}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
