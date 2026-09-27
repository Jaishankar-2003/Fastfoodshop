import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import type { OrderWithItems } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!isSupabaseConfigured()) return <p>Configure Supabase first.</p>;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const shop = await getShopByOwner(user.id);
  if (!shop) return <CreateShopForm />;

  const admin = createServiceClient();
  const { data } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(80);

  return (
    <div>
      <h1 className="display text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-muted">Live updates — no refresh needed.</p>
      <div className="mt-6">
        <OrdersBoard shopId={shop.id} initialOrders={(data ?? []) as OrderWithItems[]} />
      </div>
    </div>
  );
}
