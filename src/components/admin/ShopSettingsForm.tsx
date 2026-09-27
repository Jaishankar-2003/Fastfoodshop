"use client";

import { useState } from "react";
import { updateShopAction } from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { Shop } from "@/types/database";

export function ShopSettingsForm({ shop }: { shop: Shop }) {
  const [logoUrl, setLogoUrl] = useState(shop.logo_url ?? "");
  const [imageUrl, setImageUrl] = useState(shop.image_url ?? "");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="max-w-lg space-y-4"
      action={async (formData) => {
        formData.set("logo_url", logoUrl);
        formData.set("image_url", imageUrl);
        formData.set("is_open", formData.get("is_open_box") ? "true" : "false");
        formData.set("is_active", formData.get("is_active_box") ? "true" : "false");
        const result = await updateShopAction(formData);
        setMessage(result.error ?? "Saved.");
      }}
    >
      <label className="block text-sm font-semibold">
        Shop name
        <input name="name" required defaultValue={shop.name} className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Shop slug
        <input name="slug" required defaultValue={shop.slug} className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Description
        <textarea name="description" defaultValue={shop.description ?? ""} className="mt-2 w-full rounded-2xl px-4 py-3 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Contact mobile
        <input name="contact_mobile" defaultValue={shop.contact_mobile ?? ""} className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Address
        <input name="address" defaultValue={shop.address ?? ""} className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="is_open_box" defaultChecked={shop.is_open} className="size-5" />
        Shop open (accepting orders)
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="is_active_box" defaultChecked={shop.is_active} className="size-5" />
        Shop active (visible via QR)
      </label>
      <ImageUpload shopId={shop.id} folder="shop" value={logoUrl} onChange={setLogoUrl} />
      <p className="text-xs text-muted">Logo above. Cover image below.</p>
      <ImageUpload shopId={shop.id} folder="shop" value={imageUrl} onChange={setImageUrl} />
      {message ? <p className="text-sm font-medium">{message}</p> : null}
      <button className="h-12 w-full rounded-2xl bg-brand font-bold text-white">Save settings</button>
    </form>
  );
}
