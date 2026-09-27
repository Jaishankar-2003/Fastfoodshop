// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useState } from "react";
// import { ProductCard } from "@/components/customer/ProductCard";
// import {
//   cartCount,
//   cartTotalPaise,
//   clearActiveOrder,
//   isTerminalCustomerOrder,
//   readActiveOrder,
//   readCart,
//   setCartQuantity,
//   upsertCartItem,
//   writeCart,
// } from "@/lib/cart";
// import { formatINR } from "@/lib/format";
// import type { Category, Product, Shop } from "@/types/database";

// type Props = {
//   shop: Shop;
//   categories: Category[];
//   products: Product[];
// };

// export function ShopMenu({ shop, categories, products }: Props) {
//   const [items, setItems] = useState(() => readCart(shop.slug));
//   const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");
//   const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

//   useEffect(() => {
//     setItems(readCart(shop.slug));
//     const ref = readActiveOrder(shop.slug);
//     if (!ref) return;

//     fetch(`/api/orders/${ref.orderId}`)
//       .then((res) => (res.ok ? res.json() : null))
//       .then((payload) => {
//         const status = payload?.order?.order_status;
//         if (!status || isTerminalCustomerOrder(status)) {
//           clearActiveOrder(shop.slug);
//           setActiveOrderId(null);
//           return;
//         }
//         setActiveOrderId(ref.orderId);
//       })
//       .catch(() => undefined);
//   }, [shop.slug]);

//   function persist(next: typeof items) {
//     setItems(next);
//     writeCart(shop.slug, next);
//   }

//   const qtyByProduct = useMemo(() => {
//     return Object.fromEntries(items.map((item) => [item.productId, item.quantity]));
//   }, [items]);

//   const visibleProducts = products.filter((product) => {
//     if (activeCategory === "all") return true;
//     return product.category_id === activeCategory;
//   });

//   const count = cartCount(items);
//   const total = cartTotalPaise(items);

//   return (
//     <div className="mx-auto min-h-dvh max-w-md pb-28">
//       <header className="relative overflow-hidden rounded-b-3xl bg-stone-900 text-white">
//         {shop.image_url ? (
//           // eslint-disable-next-line @next/next/no-img-element
//           <img src={shop.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
//         ) : null}
//         <div className="relative px-5 pb-6 pt-8">
//           <div className="flex items-center gap-3">
//             <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
//               {shop.logo_url ? (
//                 // eslint-disable-next-line @next/next/no-img-element
//                 <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center text-2xl">🍜</div>
//               )}
//             </div>
//             <div>
//               <h1 className="display text-2xl leading-tight">{shop.name}</h1>
//               {shop.description ? <p className="mt-1 text-sm text-white/80">{shop.description}</p> : null}
//             </div>
//           </div>
//         </div>
//       </header>

//       {!shop.is_open ? (
//         <div className="mx-4 mt-4 rounded-2xl bg-red-50 px-4 py-5 text-center ring-1 ring-red-100">
//           <p className="text-base font-bold text-red-700">Shop closed</p>
//           <p className="mt-1 text-sm text-red-700/80">We&apos;re currently not accepting orders. Please try again later.</p>
//         </div>
//       ) : null}

//       {activeOrderId ? (
//         <Link
//           href={`/shop/${shop.slug}/order/${activeOrderId}`}
//           className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100"
//         >
//           View your current order
//           <span aria-hidden>→</span>
//         </Link>
//       ) : null}

//       <div className="sticky top-0 z-10 mt-4 bg-background/95 px-4 py-2 backdrop-blur">
//         <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
//           <button
//             type="button"
//             onClick={() => setActiveCategory("all")}
//             className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
//               activeCategory === "all" ? "bg-stone-900 text-white" : "bg-card text-foreground ring-1 ring-line"
//             }`}
//           >
//             All
//           </button>
//           {categories.map((category) => (
//             <button
//               key={category.id}
//               type="button"
//               onClick={() => setActiveCategory(category.id)}
//               className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
//                 activeCategory === category.id ? "bg-stone-900 text-white" : "bg-card text-foreground ring-1 ring-line"
//               }`}
//             >
//               {category.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="mt-2 space-y-3 px-4">
//         {visibleProducts.length === 0 ? (
//           <p className="py-10 text-center text-sm text-muted">No items in this category yet.</p>
//         ) : (
//           visibleProducts.map((product) => (
//             <ProductCard
//               key={product.id}
//               product={product}
//               quantity={qtyByProduct[product.id] ?? 0}
//               onAdd={() =>
//                 persist(
//                   upsertCartItem(items, {
//                     productId: product.id,
//                     name: product.name,
//                     pricePaise: product.price_paise,
//                     quantity: 1,
//                     imageUrl: product.image_url,
//                   }),
//                 )
//               }
//               onIncrease={() => persist(setCartQuantity(items, product.id, (qtyByProduct[product.id] ?? 0) + 1))}
//               onDecrease={() => persist(setCartQuantity(items, product.id, (qtyByProduct[product.id] ?? 0) - 1))}
//             />
//           ))
//         )}
//       </div>

//       {count > 0 && shop.is_open ? (
//         <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-4">
//           <Link
//             href={`/shop/${shop.slug}/cart`}
//             className="flex h-14 items-center justify-between rounded-2xl bg-brand px-5 text-white shadow-lg"
//           >
//             <span className="font-semibold">View cart · {count} item{count === 1 ? "" : "s"}</span>
//             <span className="font-bold">{formatINR(total)}</span>
//           </Link>
//         </div>
//       ) : null}
//     </div>
//   );
// }


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
  const [items, setItems] = useState<ReturnType<typeof readCart>>([]);
  const [activeCategory, setActiveCategory] = useState("all");
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
    return Object.fromEntries(
      items.map((item) => [item.productId, item.quantity]),
    );
  }, [items]);

  const visibleProducts = products.filter((product) => {
    if (activeCategory === "all") return true;
    return product.category_id === activeCategory;
  });

  const featuredProducts = products.filter(
    (product) => product.is_featured && product.is_available,
  );

  const count = cartCount(items);
  const total = cartTotalPaise(items);

  return (
    <main className="min-h-dvh bg-[#FFF8F0] pb-28 text-[#17130F]">
      <div className="mx-auto w-full max-w-md">
        {/* -------------------------------------------------
            SHOP HERO
        ------------------------------------------------- */}
        <header className="relative overflow-hidden rounded-b-[30px] bg-[#17130F]">
          {shop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/85" />

          <div className="relative px-5 pb-7 pt-6">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
                  {shop.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🍜
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">
                    Welcome to
                  </p>

                  <h1 className="display truncate text-[23px] leading-tight text-white">
                    {shop.name}
                  </h1>
                </div>
              </div>

              {shop.is_open ? (
                <span className="shrink-0 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[11px] font-bold text-white">
                  ● Open
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-red-500/90 px-3 py-1.5 text-[11px] font-bold text-white">
                  Closed
                </span>
              )}
            </div>

            {/* Hero message */}
            <div className="mt-10 max-w-[290px]">
              <p className="text-sm font-semibold text-white/75">
                Freshly made. Hot & crispy.
              </p>

              <h2 className="display mt-1 text-[34px] leading-[1.05] text-white">
                What are you
                <br />
                craving today?
              </h2>

              {shop.description ? (
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/75">
                  {shop.description}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {/* -------------------------------------------------
            CLOSED SHOP
        ------------------------------------------------- */}
        {!shop.is_open ? (
          <div className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
            <p className="text-sm font-extrabold text-red-700">
              We&apos;re closed right now
            </p>
            <p className="mt-1 text-xs leading-5 text-red-700/75">
              You can browse the menu, but new orders are currently paused.
            </p>
          </div>
        ) : null}

        {/* -------------------------------------------------
            ACTIVE ORDER
        ------------------------------------------------- */}
        {activeOrderId ? (
          <Link
            href={`/shop/${shop.slug}/order/${activeOrderId}`}
            className="mx-4 mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-emerald-50 px-4 ring-1 ring-emerald-100 active:scale-[0.99]"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-700/70">
                You have an active order
              </p>
              <p className="mt-0.5 text-sm font-bold text-emerald-800">
                Track your order
              </p>
            </div>

            <span className="text-lg text-emerald-700" aria-hidden>
              →
            </span>
          </Link>
        ) : null}

        {/* -------------------------------------------------
            CATEGORY NAV
        ------------------------------------------------- */}
        <div className="sticky top-0 z-30 mt-3 border-b border-black/5 bg-[#FFF8F0]/95 px-4 py-3 backdrop-blur-xl">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`h-10 shrink-0 rounded-full px-5 text-sm font-bold transition ${activeCategory === "all"
                  ? "bg-[#E85D04] text-white shadow-sm"
                  : "bg-white text-[#5F564E] ring-1 ring-black/5"
                }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`h-10 shrink-0 rounded-full px-5 text-sm font-bold transition ${activeCategory === category.id
                    ? "bg-[#E85D04] text-white shadow-sm"
                    : "bg-white text-[#5F564E] ring-1 ring-black/5"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------
            POPULAR
        ------------------------------------------------- */}
        {activeCategory === "all" && featuredProducts.length > 0 ? (
          <section className="mt-6">
            <div className="px-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#E85D04]">
                Customer favourites
              </p>

              <h2 className="display mt-1 text-[27px] leading-tight">
                Popular right now
              </h2>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
              {featuredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={!shop.is_open}
                  onClick={() =>
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
                  className="w-[190px] shrink-0 overflow-hidden rounded-[22px] bg-white text-left shadow-[0_4px_20px_rgba(35,20,10,0.07)] ring-1 ring-black/5 active:scale-[0.98] disabled:opacity-60"
                >
                  <div className="relative h-[145px] overflow-hidden bg-orange-50">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        🥟
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#E85D04] shadow-sm">
                      Popular
                    </span>
                  </div>

                  <div className="p-3.5">
                    <p className="truncate text-[15px] font-extrabold">
                      {product.name}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-base font-extrabold">
                        {formatINR(product.price_paise)}
                      </span>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E85D04] text-lg font-bold text-white">
                        +
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* -------------------------------------------------
            MENU
        ------------------------------------------------- */}
        <section className="mt-8 px-4">
          <div className="mb-4 px-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#E85D04]">
              Menu
            </p>

            <h2 className="display mt-1 text-[28px] leading-tight">
              {activeCategory === "all"
                ? "Pick your favourites"
                : categories.find((category) => category.id === activeCategory)
                  ?.name ?? "Menu"}
            </h2>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-12 text-center ring-1 ring-black/5">
              <div className="text-4xl">🍽️</div>
              <p className="mt-3 text-sm font-bold">
                Nothing here yet
              </p>
              <p className="mt-1 text-xs text-[#786F67]">
                Try another category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={qtyByProduct[product.id] ?? 0}
                  disabled={!shop.is_open}
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
                  onIncrease={() =>
                    persist(
                      setCartQuantity(
                        items,
                        product.id,
                        (qtyByProduct[product.id] ?? 0) + 1,
                      ),
                    )
                  }
                  onDecrease={() =>
                    persist(
                      setCartQuantity(
                        items,
                        product.id,
                        (qtyByProduct[product.id] ?? 0) - 1,
                      ),
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* -------------------------------------------------
          STICKY CART
      ------------------------------------------------- */}
      {count > 0 && shop.is_open ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <Link
            href={`/shop/${shop.slug}/cart`}
            className="flex min-h-[60px] items-center justify-between rounded-[20px] bg-[#E85D04] px-5 text-white shadow-[0_8px_30px_rgba(232,93,4,0.30)] active:scale-[0.985]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">
                🛒
              </span>

              <div>
                <p className="text-[11px] font-semibold text-white/75">
                  Your order
                </p>

                <p className="text-sm font-extrabold">
                  {count} item{count === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">
                {formatINR(total)}
              </span>

              <span className="text-xl" aria-hidden>
                →
              </span>
            </div>
          </Link>
        </div>
      ) : null}
    </main>
  );
}