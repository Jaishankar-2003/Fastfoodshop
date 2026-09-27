"use client";

import { useState, useTransition } from "react";
import { toggleShopOpenAction } from "@/app/admin/actions";

export function ShopOpenToggle({ isOpen }: { isOpen: boolean }) {
  const [open, setOpen] = useState(isOpen);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !open;
        setOpen(next);
        startTransition(async () => {
          await toggleShopOpenAction(next);
        });
      }}
      className={`h-11 rounded-full px-4 text-sm font-bold ${
        open ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {open ? "Shop open" : "Shop closed"}
    </button>
  );
}
