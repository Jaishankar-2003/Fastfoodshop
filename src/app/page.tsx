import Link from "next/link";
import { createIdempotencyKey } from "@/lib/idempotency";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-full max-w-xl px-5 py-10">
      <p className="text-sm font-semibold tracking-wide text-brand">QR SELF-ORDER</p>
      <h1 className="display mt-2 text-4xl leading-tight text-foreground">
        StallOrder for roadside fast-food shops
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Customers scan a QR, pick food, enter their name and mobile, then pay at the shop or
        online. No signup. No table numbers.
      </p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/admin/login"
          className="flex h-12 items-center justify-center rounded-2xl bg-brand px-4 text-base font-semibold text-white shadow-sm"
        >
          Shop owner admin
        </Link>
        <p className="text-center text-sm text-muted">
          After you create a shop, share{" "}
          <span className="font-medium text-foreground">/shop/your-shop-slug</span>
        </p>
      </div>

      <ol className="mt-10 space-y-3 text-sm text-muted">
        {[
          "Scan QR or open shop URL",
          "Add items to cart",
          "Name + mobile only",
          "Pay at shop or pay online",
          "Track when food is ready",
        ].map((step, index) => (
          <li key={step} className="flex gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-line">
            <span className="font-semibold text-brand">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </main>
  );
}
