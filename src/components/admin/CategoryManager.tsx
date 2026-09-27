"use client";

import { useState } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import type { Category } from "@/types/database";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setCreating(true);
          setEditing(null);
        }}
        className="h-12 rounded-2xl bg-brand px-4 font-bold text-white"
      >
        Add category
      </button>
      {creating || editing ? (
        <form
          className="mt-4 space-y-3 rounded-3xl bg-card p-4 ring-1 ring-line"
          action={async (formData) => {
            if (editing) formData.set("id", editing.id);
            formData.set("is_enabled", formData.get("is_enabled_box") ? "true" : "false");
            await saveCategoryAction(formData);
            setCreating(false);
            setEditing(null);
          }}
        >
          <input name="name" required defaultValue={editing?.name} placeholder="Momos" className="h-12 w-full rounded-2xl px-4 ring-1 ring-line" />
          <input
            name="sort_order"
            type="number"
            defaultValue={editing?.sort_order ?? categories.length + 1}
            className="h-12 w-full rounded-2xl px-4 ring-1 ring-line"
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled_box" defaultChecked={editing?.is_enabled ?? true} className="size-5" />
            Enabled
          </label>
          <div className="flex gap-2">
            <button className="h-12 flex-1 rounded-2xl bg-brand font-bold text-white">Save</button>
            {editing ? (
              <button
                type="button"
                className="h-12 px-4 font-semibold text-red-700"
                onClick={async () => {
                  await deleteCategoryAction(editing.id);
                  setEditing(null);
                }}
              >
                Delete
              </button>
            ) : null}
            <button type="button" className="h-12 px-4" onClick={() => { setCreating(false); setEditing(null); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <ul className="mt-5 space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 ring-1 ring-line">
            <div>
              <p className="font-semibold">{category.name}</p>
              <p className="text-xs text-muted">
                Order {category.sort_order} · {category.is_enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
            <button type="button" className="text-sm font-semibold text-brand" onClick={() => setEditing(category)}>
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
