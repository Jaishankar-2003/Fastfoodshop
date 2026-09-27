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

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("momo")) return "🥟";
  if (lower.includes("fries")) return "🍟";
  if (lower.includes("chicken")) return "🍗";
  if (lower.includes("drink") || lower.includes("beverage") || lower.includes("shake")) return "🥤";
  if (lower.includes("combo")) return "🍱";
  if (lower.includes("china") || lower.includes("chinese") || lower.includes("noodle")) return "🍜";
  if (lower.includes("dip") || lower.includes("sauce") || lower.includes("mayo")) return "🥫";
  if (lower.includes("snack") || lower.includes("starter")) return "🍿";
  return "🍽️";
}

export function ShopMenu({ shop, categories, products }: Props) {
  const [items, setItems] = useState<ReturnType<typeof readCart>>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Client-side search filtering
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Featured customer favourites
  const featuredProducts = useMemo(() => {
    return filteredProducts.filter(
      (product) => product.is_featured && product.is_available
    );
  }, [filteredProducts]);

  // Products grouped by category for "all" mode
  const categoriesWithProducts = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = filteredProducts.filter(
          (p) => p.category_id === cat.id
        );
        return { category: cat, items: catProducts };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, filteredProducts]);

  // Visible products for specific category mode
  const singleCategoryProducts = useMemo(() => {
    if (activeCategory === "all") return [];
    return filteredProducts.filter(
      (product) => product.category_id === activeCategory
    );
  }, [filteredProducts, activeCategory]);

  const count = cartCount(items);
  const total = cartTotalPaise(items);

  return (
    <main className="min-h-dvh bg-[#FFF8F0] pb-28 text-[#17130F]">
      <div className="mx-auto w-full max-w-md">
        {/* -------------------------------------------------
            1. STICKY SEARCH BAR
        ------------------------------------------------- */}
        <div className="sticky top-0 z-40 bg-[#FFF8F0]/95 px-4 pt-3 pb-2 backdrop-blur-md">
          <div className="relative flex h-[48px] items-center rounded-[18px] bg-white px-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.035)] ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-[#E85D04]/40">
            <span className="text-base text-[#786F67]" aria-hidden>🔍</span>
            <input
              type="text"
              placeholder="Search momos, fries, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#17130F] placeholder:text-[#9A9189] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="ml-1 text-xs font-bold text-[#786F67] hover:text-[#17130F]"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* -------------------------------------------------
            2. STICKY CATEGORY RAIL
        ------------------------------------------------- */}
        <div className="sticky top-[58px] z-30 border-b border-black/5 bg-[#FFF8F0]/95 px-4 py-2 backdrop-blur-md">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`h-10 shrink-0 rounded-full px-4 text-xs font-extrabold transition ${
                activeCategory === "all"
                  ? "bg-[#E85D04] text-white shadow-sm"
                  : "bg-white text-[#5F564E] ring-1 ring-black/5 active:bg-orange-50"
              }`}
            >
              🔥 All Items
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`h-10 shrink-0 rounded-full px-4 text-xs font-extrabold transition ${
                  activeCategory === category.id
                    ? "bg-[#E85D04] text-white shadow-sm"
                    : "bg-white text-[#5F564E] ring-1 ring-black/5 active:bg-orange-50"
                }`}
              >
                {getCategoryIcon(category.name)} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------
            SHOP HEADER / BRAND
        ------------------------------------------------- */}
        <header className="relative mx-4 mt-3 overflow-hidden rounded-[24px] bg-[#17130F] text-white shadow-md">
          {shop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
                  {shop.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      🍜
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-[20px] font-black leading-tight text-white">
                    {shop.name}
                  </h1>
                  {shop.description ? (
                    <p className="truncate text-xs text-white/80">
                      {shop.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {shop.is_open ? (
                <span className="shrink-0 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                  ● Open
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                  Closed
                </span>
              )}
            </div>
          </div>
        </header>

        {/* -------------------------------------------------
            CLOSED SHOP NOTICE
        ------------------------------------------------- */}
        {!shop.is_open ? (
          <div className="mx-4 mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-extrabold text-red-700">
              We&apos;re closed right now
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-red-700/75">
              You can browse the menu, but new orders are currently paused.
            </p>
          </div>
        ) : null}

        {/* -------------------------------------------------
            ACTIVE ORDER TRACKING LINK
        ------------------------------------------------- */}
        {activeOrderId ? (
          <Link
            href={`/shop/${shop.slug}/order/${activeOrderId}`}
            className="mx-4 mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200/60 active:scale-[0.99]"
          >
            <div>
              <p className="text-[11px] font-semibold text-emerald-700/80">
                You have an active order
              </p>
              <p className="text-xs font-extrabold text-emerald-800">
                Track your order status
              </p>
            </div>

            <span className="text-base text-emerald-700 font-bold" aria-hidden>
              →
            </span>
          </Link>
        ) : null}

        {/* -------------------------------------------------
            3. HERO OFFER BANNER (ONE BANNER)
        ------------------------------------------------- */}
        <section className="mx-4 mt-4">
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#E85D04] via-[#F46B10] to-[#FF8533] p-4 text-white shadow-[0_4px_20px_rgba(232,93,4,0.20)]">
            <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                  🔥 SPECIAL OFFER
                </span>
                <span className="text-xl">🥟</span>
              </div>

              <div className="mt-3">
                <h3 className="display text-[24px] font-black leading-none text-white">
                  ₹75 OFF on ₹199+
                </h3>
                <p className="mt-1.5 text-xs font-medium text-white/90">
                  Use code <span className="font-extrabold underline decoration-white/60">STALL75</span> · Order your favourites now
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------
            4. CUSTOMER FAVOURITES (HORIZONTAL CARDS)
        ------------------------------------------------- */}
        {activeCategory === "all" && !searchQuery && featuredProducts.length > 0 ? (
          <section className="mt-6">
            <div className="px-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E85D04]">
                🔥 Customer Favourites
              </p>
              <h2 className="display mt-0.5 text-[22px] font-extrabold leading-tight">
                Popular right now
              </h2>
            </div>

            <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
              {featuredProducts.map((product) => {
                const qty = qtyByProduct[product.id] ?? 0;
                return (
                  <div
                    key={product.id}
                    className="w-[180px] shrink-0 overflow-hidden rounded-[20px] bg-white text-left shadow-[0_3px_14px_rgba(35,20,10,0.06)] ring-1 ring-black/5"
                  >
                    <div className="relative h-[130px] overflow-hidden bg-orange-50/70">
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

                      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#E85D04] shadow-sm">
                        Popular
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="truncate text-xs font-extrabold text-[#17130F]">
                        {product.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[#17130F]">
                          {formatINR(product.price_paise)}
                        </span>

                        {qty > 0 ? (
                          <div className="flex h-7 items-center overflow-hidden rounded-full bg-[#FFF0E5] ring-1 ring-[#E85D04]/20">
                            <button
                              type="button"
                              disabled={!shop.is_open}
                              onClick={() =>
                                persist(
                                  setCartQuantity(items, product.id, qty - 1)
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center text-xs font-bold text-[#E85D04]"
                            >
                              −
                            </button>
                            <span className="w-4 text-center text-[11px] font-extrabold">
                              {qty}
                            </span>
                            <button
                              type="button"
                              disabled={!shop.is_open}
                              onClick={() =>
                                persist(
                                  setCartQuantity(items, product.id, qty + 1)
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center bg-[#E85D04] text-xs font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
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
                                })
                              )
                            }
                            className="flex h-7 px-3 items-center justify-center rounded-full bg-[#E85D04] text-xs font-extrabold text-white active:scale-95 disabled:opacity-50"
                          >
                            ADD +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* -------------------------------------------------
            5. CATEGORY SECTIONS & PRODUCT ROWS
        ------------------------------------------------- */}
        <section className="mt-6 px-4 space-y-6">
          {searchQuery ? (
            <div>
              <div className="mb-3 px-1">
                <p className="text-xs font-extrabold text-[#E85D04]">
                  Search Results ({filteredProducts.length})
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-black/5">
                  <div className="text-3xl">🔍</div>
                  <p className="mt-2 text-xs font-bold">No matching items</p>
                  <p className="mt-0.5 text-[11px] text-[#786F67]">
                    Try searching for something else.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredProducts.map((product) => (
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
                          })
                        )
                      }
                      onIncrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) + 1
                          )
                        )
                      }
                      onDecrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) - 1
                          )
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : activeCategory === "all" ? (
            categoriesWithProducts.map(({ category, items: categoryProducts }) => (
              <div key={category.id} className="scroll-mt-36">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="display text-[20px] font-extrabold text-[#17130F]">
                    {getCategoryIcon(category.name)} {category.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className="text-xs font-bold text-[#E85D04] hover:underline"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {categoryProducts.map((product) => (
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
                          })
                        )
                      }
                      onIncrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) + 1
                          )
                        )
                      }
                      onDecrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) - 1
                          )
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="display text-[20px] font-extrabold text-[#17130F]">
                  {getCategoryIcon(
                    categories.find((c) => c.id === activeCategory)?.name ?? ""
                  )}{" "}
                  {categories.find((c) => c.id === activeCategory)?.name ?? "Menu"}
                </h2>

                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className="text-xs font-bold text-[#E85D04] hover:underline"
                >
                  Show All Items
                </button>
              </div>

              {singleCategoryProducts.length === 0 ? (
                <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-black/5">
                  <div className="text-3xl">🍽️</div>
                  <p className="mt-2 text-xs font-bold">No items in this category</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {singleCategoryProducts.map((product) => (
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
                          })
                        )
                      }
                      onIncrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) + 1
                          )
                        )
                      }
                      onDecrease={() =>
                        persist(
                          setCartQuantity(
                            items,
                            product.id,
                            (qtyByProduct[product.id] ?? 0) - 1
                          )
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* -------------------------------------------------
          7. STICKY CART BAR
      ------------------------------------------------- */}
      {count > 0 && shop.is_open ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <Link
            href={`/shop/${shop.slug}/cart`}
            className="flex min-h-[58px] items-center justify-between rounded-[20px] bg-[#E85D04] px-4 text-white shadow-[0_8px_24px_rgba(232,93,4,0.30)] active:scale-[0.985]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-base">
                🛒
              </span>

              <div>
                <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                  Your Cart
                </p>
                <p className="text-xs font-extrabold">
                  {count} item{count === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">
                {formatINR(total)}
              </span>

              <span className="text-lg font-bold" aria-hidden>
                View Cart →
              </span>
            </div>
          </Link>
        </div>
      ) : null}
    </main>
  );
}