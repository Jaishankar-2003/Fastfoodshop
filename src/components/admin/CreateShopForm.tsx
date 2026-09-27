"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShopAction } from "@/app/admin/actions";

export function CreateShopForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    const result = await createShopAction(formData);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="max-w-lg space-y-4 rounded-3xl bg-card p-5 ring-1 ring-line">
      <h2 className="display text-2xl">Create your shop</h2>
      <label className="block text-sm font-semibold">
        Shop name
        <input name="name" required placeholder="Mallang's Momos" className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Shop URL slug
        <input name="slug" placeholder="mallangs-momos" className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Description
        <textarea name="description" rows={3} className="mt-2 w-full rounded-2xl px-4 py-3 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Contact mobile
        <input name="contact_mobile" inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Address (optional)
        <input name="address" className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button disabled={busy} className="h-12 w-full rounded-2xl bg-brand font-bold text-white">
        {busy ? "Creating…" : "Create shop"}
      </button>
    </form>
  );
}
