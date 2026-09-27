import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Shop settings" },
  { href: "/admin/qr", label: "QR code" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <>{children}</>;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  const shop = await getShopByOwner(user.id);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">StallOrder admin</p>
            <p className="font-semibold">{shop?.name ?? "Set up your shop"}</p>
          </div>
          <AdminSignOut />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={shop || item.href === "/admin" || item.href === "/admin/settings" ? item.href : "/admin/settings"}
              className="h-10 shrink-0 rounded-full bg-orange-50 px-4 text-sm font-semibold leading-10 text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
