// "use client";

// import Link from "next/link";
// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   cartTotalPaise,
//   clearCart,
//   readCart,
//   setCartQuantity,
//   writeCart,
// } from "@/lib/cart";
// import { formatINR } from "@/lib/format";
// import type { CartItem } from "@/types/database";

// export default function CartPage() {
//   const params = useParams<{ shopSlug: string }>();
//   const router = useRouter();
//   const shopSlug = params.shopSlug;
//   const [items, setItems] = useState<CartItem[]>([]);

//   useEffect(() => {
//     setItems(readCart(shopSlug));
//   }, [shopSlug]);

//   function persist(next: CartItem[]) {
//     setItems(next);
//     writeCart(shopSlug, next);
//   }

//   const total = cartTotalPaise(items);

//   return (
//     <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-6">
//       <div className="flex items-center justify-between">
//         <Link href={`/shop/${shopSlug}`} className="text-sm font-semibold text-brand">
//           ← Menu
//         </Link>
//         {items.length ? (
//           <button
//             type="button"
//             onClick={() => {
//               clearCart(shopSlug);
//               setItems([]);
//             }}
//             className="text-sm font-semibold text-muted"
//           >
//             Clear cart
//           </button>
//         ) : null}
//       </div>

//       <h1 className="display mt-4 text-3xl">Your cart</h1>

//       {items.length === 0 ? (
//         <div className="mt-10 rounded-2xl bg-card px-5 py-10 text-center ring-1 ring-line">
//           <p className="font-semibold">Cart is empty</p>
//           <Link href={`/shop/${shopSlug}`} className="mt-4 inline-flex font-semibold text-brand">
//             Browse menu
//           </Link>
//         </div>
//       ) : (
//         <ul className="mt-6 space-y-3">
//           {items.map((item) => (
//             <li key={item.productId} className="rounded-2xl bg-card p-4 ring-1 ring-line">
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <p className="font-semibold">{item.name}</p>
//                   <p className="mt-1 text-sm text-muted">
//                     {item.quantity} × {formatINR(item.pricePaise)} ={" "}
//                     <span className="font-semibold text-foreground">
//                       {formatINR(item.pricePaise * item.quantity)}
//                     </span>
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   className="text-xs font-bold uppercase text-muted"
//                   onClick={() => persist(setCartQuantity(items, item.productId, 0))}
//                 >
//                   Remove
//                 </button>
//               </div>
//               <div className="mt-3 flex items-center gap-3">
//                 <button
//                   type="button"
//                   className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-brand"
//                   onClick={() => persist(setCartQuantity(items, item.productId, item.quantity - 1))}
//                 >
//                   −
//                 </button>
//                 <span className="w-6 text-center font-bold">{item.quantity}</span>
//                 <button
//                   type="button"
//                   className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
//                   onClick={() => persist(setCartQuantity(items, item.productId, item.quantity + 1))}
//                 >
//                   +
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}

//       {items.length ? (
//         <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6">
//           <div className="mb-3 flex items-center justify-between text-base font-bold">
//             <span>Subtotal</span>
//             <span>{formatINR(total)}</span>
//           </div>
//           <button
//             type="button"
//             onClick={() => router.push(`/shop/${shopSlug}/checkout`)}
//             className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
//           >
//             Continue
//           </button>
//         </div>
//       ) : null}
//     </main>
//   );
// }




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
    <main className="min-h-dvh bg-[#FFF8F0] text-[#17130F]">
      <div className="mx-auto w-full max-w-md px-4 pb-36 pt-5">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href={`/shop/${shopSlug}`}
            className="flex h-10 items-center gap-1 rounded-full px-2 text-sm font-bold text-[#E85D04] active:bg-orange-50"
          >
            <span className="text-xl" aria-hidden>
              ←
            </span>
            Menu
          </Link>

          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                clearCart(shopSlug);
                setItems([]);
              }}
              className="rounded-full px-3 py-2 text-xs font-bold text-[#786F67] active:bg-black/5"
            >
              Clear cart
            </button>
          ) : null}
        </div>

        {/* TITLE */}
        <div className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#E85D04]">
            Almost there
          </p>

          <h1 className="display mt-1 text-[34px] leading-none">
            Your cart
          </h1>

          {items.length > 0 ? (
            <p className="mt-2 text-sm text-[#786F67]">
              Check your items before you order.
            </p>
          ) : null}
        </div>

        {/* EMPTY CART */}
        {items.length === 0 ? (
          <div className="mt-12 rounded-[26px] bg-white px-6 py-12 text-center shadow-[0_3px_18px_rgba(35,20,10,0.05)] ring-1 ring-black/5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF0E5] text-4xl">
              🛒
            </div>

            <h2 className="display mt-5 text-[25px]">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-[250px] text-sm leading-5 text-[#786F67]">
              Add something delicious from the menu and it will appear here.
            </p>

            <Link
              href={`/shop/${shopSlug}`}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#E85D04] px-6 text-sm font-extrabold text-white shadow-sm active:scale-95"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            {/* CART ITEMS */}
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="rounded-[22px] bg-white p-3 shadow-[0_3px_18px_rgba(35,20,10,0.05)] ring-1 ring-black/5"
                >
                  <div className="flex gap-3">
                    {/* IMAGE */}
                    <div className="h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[17px] bg-orange-50">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          🥟
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-[15px] font-extrabold">
                            {item.name}
                          </h2>

                          <p className="mt-1 text-xs text-[#786F67]">
                            {formatINR(item.pricePaise)} each
                          </p>
                        </div>

                        <p className="shrink-0 text-[15px] font-extrabold">
                          {formatINR(item.pricePaise * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {/* QUANTITY */}
                        <div className="flex h-10 items-center overflow-hidden rounded-full bg-[#FFF0E5]">
                          <button
                            type="button"
                            onClick={() =>
                              persist(
                                setCartQuantity(
                                  items,
                                  item.productId,
                                  item.quantity - 1,
                                ),
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center text-lg font-bold text-[#E85D04] active:bg-orange-100"
                            aria-label={`Decrease ${item.name}`}
                          >
                            −
                          </button>

                          <span className="w-7 text-center text-sm font-extrabold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              persist(
                                setCartQuantity(
                                  items,
                                  item.productId,
                                  item.quantity + 1,
                                ),
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center bg-[#E85D04] text-lg font-bold text-white active:bg-[#D65303]"
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        {/* REMOVE */}
                        <button
                          type="button"
                          onClick={() =>
                            persist(
                              setCartQuantity(items, item.productId, 0),
                            )
                          }
                          className="px-2 py-2 text-xs font-bold text-[#9A9189] active:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* SUMMARY */}
            <section className="mt-6 rounded-[22px] bg-white p-4 ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#786F67]">
                  Subtotal
                </span>

                <span className="text-base font-extrabold">
                  {formatINR(total)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                <span className="text-base font-extrabold">
                  Total
                </span>

                <span className="text-xl font-extrabold text-[#E85D04]">
                  {formatINR(total)}
                </span>
              </div>
            </section>
          </>
        )}
      </div>

      {/* STICKY CHECKOUT */}
      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md bg-[#FFF8F0]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={() =>
              router.push(`/shop/${shopSlug}/checkout`)
            }
            className="flex min-h-[60px] w-full items-center justify-between rounded-[20px] bg-[#E85D04] px-5 text-white shadow-[0_8px_30px_rgba(232,93,4,0.28)] active:scale-[0.985]"
          >
            <div className="text-left">
              <p className="text-[11px] font-semibold text-white/70">
                Total
              </p>

              <p className="text-base font-extrabold">
                {formatINR(total)}
              </p>
            </div>

            <span className="flex items-center gap-2 text-sm font-extrabold">
              Continue to checkout
              <span className="text-xl" aria-hidden>
                →
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </main>
  );
}