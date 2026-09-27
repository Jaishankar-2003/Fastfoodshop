"use client";

import { useRef, useState } from "react";
import { paiseToRupees } from "@/lib/format";
import { bulkUploadProductsAction, deleteProductAction, saveProductAction } from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { Category, Product } from "@/types/database";

type Props = {
  shopId: string;
  categories: Category[];
  products: Product[];
};

function sampleMenuJson(categories: Category[]) {
  const first = categories[0]?.name ?? "Snacks";
  const second = categories[1]?.name ?? first;

  return JSON.stringify(
    [
      {
        name: "Veg Momos",
        description: "Steamed vegetable dumplings",
        price_rupees: 80,
        category: first,
        available: true,
        popular: true,
        image_url: "",
      },
      {
        name: "Chicken Momos",
        description: "Steamed chicken dumplings",
        price_rupees: 120,
        category: second,
        available: true,
        popular: false,
        image_url: "",
      },
    ],
    null,
    2,
  );
}

export function MenuManager({ shopId, categories, products }: Props) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function downloadSample() {
    const blob = new Blob([sampleMenuJson(categories)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu-sample.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onUploadJson(file: File) {
    setBulkError(null);
    setBulkMessage(null);
    setUploading(true);

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = await bulkUploadProductsAction(parsed);
      if (result.error) {
        setBulkError(result.error);
        return;
      }
      setBulkMessage(`Added ${result.count} product${result.count === 1 ? "" : "s"}.`);
    } catch {
      setBulkError("Could not read that JSON file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!categories.length) {
    return <p className="text-sm text-muted">Create a category first, then add products.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="h-12 rounded-2xl bg-brand px-4 font-bold text-white"
        >
          Add product
        </button>
        <button
          type="button"
          onClick={downloadSample}
          className="h-12 rounded-2xl px-4 font-semibold ring-1 ring-line"
        >
          Sample JSON
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 rounded-2xl px-4 font-semibold ring-1 ring-line disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload JSON"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onUploadJson(file);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Bulk upload uses your existing category names. Price is in rupees.
      </p>
      {bulkError ? <p className="mt-2 text-sm text-red-600">{bulkError}</p> : null}
      {bulkMessage ? <p className="mt-2 text-sm text-emerald-700">{bulkMessage}</p> : null}

      {creating || editing ? (
        <ProductForm
          shopId={shopId}
          categories={categories}
          product={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}

      <div className="mt-5 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-orange-50">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">🥟</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted">
                ₹{paiseToRupees(product.price_paise)} · {product.is_available ? "Available" : "Unavailable"}
                {product.is_featured ? " · Popular" : ""}
              </p>
            </div>
            <button type="button" className="text-sm font-semibold text-brand" onClick={() => setEditing(product)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  shopId,
  categories,
  product,
  onClose,
}: {
  shopId: string;
  categories: Category[];
  product: Product | null;
  onClose: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 space-y-3 rounded-3xl bg-card p-4 ring-1 ring-line"
      action={async (formData) => {
        formData.set("image_url", imageUrl);
        if (product) formData.set("id", product.id);
        const result = await saveProductAction(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        onClose();
      }}
    >
      <input type="hidden" name="id" defaultValue={product?.id} />
      <label className="block text-sm font-semibold">
        Name
        <input name="name" required defaultValue={product?.name} className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Description
        <textarea name="description" defaultValue={product?.description ?? ""} className="mt-2 w-full rounded-2xl px-4 py-3 ring-1 ring-line" />
      </label>
      <label className="block text-sm font-semibold">
        Price (₹)
        <input
          name="price_rupees"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={product ? paiseToRupees(product.price_paise) : 80}
          className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line"
        />
      </label>
      <label className="block text-sm font-semibold">
        Category
        <select
          name="category_id"
          defaultValue={product?.category_id ?? categories[0]?.id}
          className="mt-2 h-12 w-full rounded-2xl px-4 ring-1 ring-line"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="is_available_box" defaultChecked={product?.is_available ?? true} className="size-5" />
        Available
      </label>
      <input type="hidden" name="is_available" id="is_available" />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="is_featured_box" defaultChecked={product?.is_featured ?? false} className="size-5" />
        Popular
      </label>
      <ImageUpload shopId={shopId} folder="products" value={imageUrl} onChange={setImageUrl} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          className="h-12 flex-1 rounded-2xl bg-brand font-bold text-white"
          formAction={async (formData) => {
            const available = (formData.get("is_available_box") ? "true" : "false");
            const featured = (formData.get("is_featured_box") ? "true" : "false");
            formData.set("is_available", available);
            formData.set("is_featured", featured);
            formData.set("image_url", imageUrl);
            if (product) formData.set("id", product.id);
            const result = await saveProductAction(formData);
            if (result.error) {
              setError(result.error);
              return;
            }
            onClose();
          }}
        >
          Save
        </button>
        {product ? (
          <button
            type="button"
            className="h-12 rounded-2xl px-4 font-semibold text-red-700"
            onClick={async () => {
              await deleteProductAction(product.id);
              onClose();
            }}
          >
            Delete
          </button>
        ) : null}
        <button type="button" className="h-12 rounded-2xl px-4 font-semibold" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
