
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  cartTotalPaise,
  clearCart,
  readCart,
  readCustomer,
  writeActiveOrder,
  writeCustomer,
} from "@/lib/cart";
import { createIdempotencyKey } from "@/lib/idempotency";
import { formatINR, isValidIndianMobile, normalizeMobile } from "@/lib/format";
import type { CartItem } from "@/types/database";

type Step = "details" | "pay";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout");

    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const params = useParams<{ shopSlug: string }>();
  const router = useRouter();
  const shopSlug = params.shopSlug;

  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("details");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedOnline, setFailedOnline] = useState(false);

  const [pendingOnlineOrderId, setPendingOnlineOrderId] =
    useState<string | null>(null);

  useEffect(() => {
    const cart = readCart(shopSlug);
    setItems(cart);

    const saved = readCustomer(shopSlug);

    if (saved) {
      setName(saved.name);
      setMobile(saved.mobile);
    }
  }, [shopSlug]);

  const total = useMemo(() => cartTotalPaise(items), [items]);

  function continueToPay() {
    setError(null);

    const trimmed = name.trim();
    const phone = normalizeMobile(mobile);

    if (trimmed.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!isValidIndianMobile(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    writeCustomer(shopSlug, {
      name: trimmed,
      mobile: phone,
    });

    setName(trimmed);
    setMobile(phone);
    setStep("pay");
  }

  async function placeCashOrder() {
    setBusy(true);
    setError(null);

    try {
      const idempotencyKey = createIdempotencyKey();

      const response = await fetch("/api/orders/cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopSlug,
          name,
          mobile,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          idempotencyKey,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not place order.");
      }

      clearCart(shopSlug);
      writeActiveOrder(shopSlug, payload.orderId);

      router.replace(
        `/shop/${shopSlug}/order/${payload.orderId}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function placeOnlineOrder() {
    setBusy(true);
    setError(null);
    setFailedOnline(false);

    try {
      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        throw new Error(
          "Could not load payment page. Check your connection."
        );
      }

      const response = await fetch("/api/orders/online", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopSlug,
          name,
          mobile,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),

          idempotencyKey: pendingOnlineOrderId
            ? undefined
            : createIdempotencyKey(),

          existingOrderId: pendingOnlineOrderId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Could not start payment."
        );
      }

      if (payload.alreadyPaid) {
        clearCart(shopSlug);
        writeActiveOrder(shopSlug, payload.orderId);

        router.replace(
          `/shop/${shopSlug}/order/${payload.orderId}`
        );

        return;
      }

      setPendingOnlineOrderId(payload.orderId);

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: payload.keyId,
          amount: payload.amountPaise,
          currency: payload.currency,
          name: payload.shopName,
          description: `Order #${payload.orderNumber}`,
          order_id: payload.razorpayOrderId,

          prefill: {
            name: payload.customerName,
            contact: payload.customerMobile,
          },

          theme: {
            color: "#e2570d",
          },

          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verify = await fetch(
                "/api/payments/razorpay/verify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    orderId: payload.orderId,
                    ...response,
                  }),
                }
              );

              const verified = await verify.json();

              if (!verify.ok) {
                throw new Error(
                  verified.error ??
                  "Payment could not be verified."
                );
              }

              clearCart(shopSlug);

              writeActiveOrder(
                shopSlug,
                payload.orderId
              );

              router.replace(
                `/shop/${shopSlug}/order/${payload.orderId}`
              );

              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },

          modal: {
            ondismiss: () => {
              reject(new Error("PAYMENT_CANCELLED"));
            },
          },
        });

        rzp.open();
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Payment failed.";

      setFailedOnline(true);

      if (message === "PAYMENT_CANCELLED") {
        setError(
          "Payment was not completed. Your order is not confirmed."
        );
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!items.length && !pendingOnlineOrderId) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="font-semibold">
          Your cart is empty
        </p>

        <Link
          href={`/shop/${shopSlug}`}
          className="mt-4 inline-flex font-semibold text-brand"
        >
          Back to menu
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-[#FFF8F0] text-[#17130F] overflow-hidden flex flex-col">
      {/* Decorative low-opacity background shapes */}
      <div className="pointer-events-none absolute -right-12 top-10 h-48 w-48 rounded-full bg-orange-200/20 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 top-1/3 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="pointer-events-none absolute right-4 top-24 text-3xl opacity-[0.08] select-none" aria-hidden>🥟</div>
      <div className="pointer-events-none absolute left-4 top-60 text-3xl opacity-[0.08] select-none" aria-hidden>🍜</div>
      <div className="pointer-events-none absolute right-8 top-96 text-3xl opacity-[0.08] select-none" aria-hidden>🍟</div>

      <div className="relative mx-auto w-full max-w-md px-4 pb-8 pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* TOP NAVIGATION & PROGRESS */}
          <div className="flex items-center justify-between py-1">
            {step === "details" ? (
              <Link
                href={`/shop/${shopSlug}/cart`}
                className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-extrabold text-[#17130F] shadow-sm ring-1 ring-black/5 active:scale-95"
              >
                <span className="text-sm font-bold text-[#E85D04]">←</span> Cart
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("details");
                }}
                className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-extrabold text-[#17130F] shadow-sm ring-1 ring-black/5 active:scale-95"
              >
                <span className="text-sm font-bold text-[#E85D04]">←</span> Back
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#786F67]">
                {step === "details" ? "Step 2 of 3" : "Step 3 of 3"}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#E85D04]" />
                <div className={`h-2 rounded-full transition-all ${step === "details" ? "w-5 bg-[#E85D04]" : "w-2 bg-[#E85D04]"}`} />
                <div className={`h-2 rounded-full transition-all ${step === "pay" ? "w-5 bg-[#E85D04]" : "w-2 bg-stone-300"}`} />
              </div>
            </div>
          </div>

          {step === "details" ? (
            <div className="mt-4">
              {/* FRIENDLY HERO SECTION */}
              <div className="text-center">
                <div className="inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/5">
                  🍜
                </div>

                <h1 className="display mt-2.5 text-[28px] font-black leading-tight text-[#17130F]">
                  Almost there! 🎉
                </h1>
                <p className="mt-1 text-xs font-semibold text-[#786F67]">
                  Let&apos;s get your order ready
                </p>
              </div>

              {/* MAIN FORM CARD */}
              <div className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_4px_24px_rgba(35,20,10,0.06)] ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>👋</span>
                  <h2 className="text-[16px] font-extrabold text-[#17130F]">
                    Who should we call?
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#786F67] leading-relaxed">
                  We’ll only use these details when your order is ready.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    continueToPay();
                  }}
                  className="mt-4 space-y-4"
                >
                  {/* NAME INPUT */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#17130F]">
                      Your name
                    </label>
                    <div className="relative mt-1.5 flex h-[50px] items-center rounded-2xl bg-[#FFF8F0]/70 px-3.5 ring-1 ring-black/5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E85D04]">
                      <span className="text-base text-[#786F67]" aria-hidden>👤</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#17130F] placeholder:text-[#9A9189] focus:outline-none"
                        autoComplete="name"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                  </div>

                  {/* MOBILE NUMBER INPUT */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#17130F]">
                      Mobile number
                    </label>
                    <div className="relative mt-1.5 flex h-[50px] items-center rounded-2xl bg-[#FFF8F0]/70 px-3.5 ring-1 ring-black/5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E85D04]">
                      <div className="flex items-center gap-1 border-r border-stone-300/60 pr-2.5 text-xs font-extrabold text-[#17130F]">
                        <span aria-hidden>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        inputMode="numeric"
                        maxLength={10}
                        className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#17130F] placeholder:text-[#9A9189] focus:outline-none"
                        autoComplete="tel"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                  </div>

                  {/* TRUST MICROCOPY */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px] font-medium text-[#786F67]">
                    <span className="flex items-center gap-1">
                      <span className="text-xs" aria-hidden>🔒</span> We won&apos;t spam you.
                    </span>
                    <span className="text-[10px] text-[#9A9189]">Quick 10-sec step</span>
                  </div>

                  {/* INLINE ERROR */}
                  {error ? (
                    <div className="rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                      <p className="text-xs font-bold text-red-600">
                        ⚠️ {error}
                      </p>
                    </div>
                  ) : null}

                  {/* CONTINUE BUTTON */}
                  <button
                    type="submit"
                    className="mt-2 flex h-[54px] w-full items-center justify-center rounded-[20px] bg-[#E85D04] text-base font-black text-white shadow-[0_6px_20px_rgba(232,93,4,0.25)] transition-all active:scale-[0.985] active:bg-[#D65303]"
                  >
                    Continue →
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="text-center">
                <div className="inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/5">
                  💳
                </div>
                <h1 className="display mt-2 text-[26px] font-black leading-tight">
                  Choose payment
                </h1>
                <p className="mt-1 text-xs font-semibold text-[#786F67]">
                  {name} · +91 {mobile} · Total <span className="font-extrabold text-[#17130F]">{formatINR(total)}</span>
                </p>
              </div>

              {failedOnline ? (
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
                  <p className="font-bold text-red-700 text-sm">
                    Payment failed
                  </p>
                  <p className="mt-0.5 text-xs text-red-700/80">
                    Your order was not confirmed. Please try again or pay at shop.
                  </p>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl bg-red-50 p-3.5 ring-1 ring-red-200">
                  <p className="text-xs font-bold text-red-600">
                    ⚠️ {error}
                  </p>
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={busy || Boolean(pendingOnlineOrderId)}
                  onClick={placeCashOrder}
                  className="w-full rounded-[22px] bg-white p-5 text-left shadow-[0_3px_14px_rgba(35,20,10,0.05)] ring-1 ring-black/5 active:scale-[0.99] disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-extrabold text-[#17130F]">
                      💵 Pay at shop
                    </p>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-[#786F67]">
                      Cash / Counter
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-[#786F67]">
                    Place your order now and pay when collecting your food.
                  </p>

                  <span className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-xs font-extrabold text-white">
                    {busy ? "Placing order…" : "Order & pay at shop"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={placeOnlineOrder}
                  className="w-full rounded-[22px] bg-white p-5 text-left shadow-[0_3px_14px_rgba(35,20,10,0.05)] ring-1 ring-black/5 active:scale-[0.99] disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-extrabold text-[#17130F]">
                      ⚡ Pay online
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      UPI / Cards / Wallets
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-[#786F67]">
                    Pay now using UPI, GPay, PhonePe, or cards via Razorpay.
                  </p>

                  <span className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#E85D04] px-4 text-xs font-extrabold text-white shadow-sm">
                    {busy
                      ? "Opening payment…"
                      : failedOnline
                      ? "Try again"
                      : "Pay & place order"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BRANDING */}
        <div className="pt-6 text-center">
          <p className="text-[10px] font-extrabold tracking-widest text-[#9A9189] uppercase">
            Fresh • Fast • Local
          </p>
        </div>
      </div>
    </main>
  );
}

