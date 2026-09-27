
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
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-6">
      <Link
        href={`/shop/${shopSlug}/cart`}
        className="text-sm font-semibold text-brand"
      >
        ← Cart
      </Link>

      {step === "details" ? (
        <section className="mt-4">
          <h1 className="display text-3xl">
            Your details
          </h1>

          <p className="mt-2 text-sm text-muted">
            We only need this to call you when the order
            is ready.
          </p>

          <label className="mt-6 block text-sm font-semibold">
            Name

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl bg-card px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
              autoComplete="name"
              placeholder="Arun"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold">
            Mobile number

            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="mt-2 h-12 w-full rounded-2xl bg-card px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
              autoComplete="tel"
              placeholder="9876543210"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={continueToPay}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
          >
            Continue
          </button>
        </section>
      ) : (
        <section className="mt-4 space-y-4">
          <h1 className="display text-3xl">
            Choose payment
          </h1>

          <p className="text-sm text-muted">
            {name} · {mobile} · Total {formatINR(total)}
          </p>

          {failedOnline ? (
            <div className="rounded-2xl bg-red-50 px-4 py-4 ring-1 ring-red-100">
              <p className="font-bold text-red-700">
                Payment failed
              </p>

              <p className="mt-1 text-sm text-red-700/80">
                Your order was not confirmed.
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy || Boolean(pendingOnlineOrderId)}
            onClick={placeCashOrder}
            className="w-full rounded-3xl bg-card p-5 text-left ring-1 ring-line disabled:opacity-60"
          >
            <p className="text-lg font-bold">
              Pay at shop
            </p>

            <p className="mt-1 text-sm text-muted">
              Place your order now and pay when collecting
              your food.
            </p>

            <span className="mt-4 inline-flex h-12 items-center rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white">
              {busy
                ? "Placing order…"
                : "Order & pay at shop"}
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={placeOnlineOrder}
            className="w-full rounded-3xl bg-card p-5 text-left ring-1 ring-line disabled:opacity-60"
          >
            <p className="text-lg font-bold">
              Pay online
            </p>

            <p className="mt-1 text-sm text-muted">
              Pay now using UPI / card / supported methods.
            </p>

            <span className="mt-4 inline-flex h-12 items-center rounded-2xl bg-brand px-4 text-sm font-bold text-white">
              {busy
                ? "Opening payment…"
                : failedOnline
                  ? "Try again"
                  : "Pay & place order"}
            </span>
          </button>
        </section>
      )}
    </main>
  );
}

