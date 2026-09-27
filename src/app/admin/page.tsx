import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/format";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import { ShopOpenToggle } from "@/components/admin/ShopOpenToggle";
import type { Order } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted">Configure Supabase to use the admin dashboard.</p>;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const shop = await getShopByOwner(user.id);
  if (!shop) {
    return <CreateShopForm />;
  }

  const admin = createServiceClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data: todayOrders } = await admin
    .from("orders")
    .select("*")
    .eq("shop_id", shop.id)
    .gte("created_at", start.toISOString());

  const orders = (todayOrders ?? []) as Order[];
  const confirmed = orders.filter(
    (order) => !(order.payment_method === "ONLINE" && order.payment_status !== "PAID"),
  );
  const sales = confirmed
    .filter((order) => order.order_status !== "CANCELLED")
    .reduce((sum, order) => sum + order.total_paise, 0);
  const pending = confirmed.filter((order) => ["NEW", "PREPARING", "READY"].includes(order.order_status)).length;
  const completed = confirmed.filter((order) => order.order_status === "COMPLETED").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Today</h1>
          <p className="text-sm text-muted">{shop.name}</p>
        </div>
        <ShopOpenToggle isOpen={shop.is_open} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders" value={String(confirmed.length)} />
        <Stat label="Sales" value={formatINR(sales)} />
        <Stat label="Pending" value={String(pending)} />
        <Stat label="Completed" value={String(completed)} />
      </div>

      <Link
        href="/admin/orders"
        className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-brand font-bold text-white"
      >
        Open live orders
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-line">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
