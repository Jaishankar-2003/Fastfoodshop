import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import { ShopQr } from "@/components/admin/ShopQr";

export const dynamic = "force-dynamic";

export default async function AdminQrPage() {
  if (!isSupabaseConfigured()) return <p>Configure Supabase first.</p>;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const shop = await getShopByOwner(user.id);
  if (!shop) return <CreateShopForm />;

  return (
    <div>
      <h1 className="display text-3xl">QR code</h1>
      <p className="mt-1 text-sm text-muted">Customers scan this and land on your menu. No app install.</p>
      <div className="mt-6">
        <ShopQr slug={shop.slug} name={shop.name} />
      </div>
    </div>
  );
}
