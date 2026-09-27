import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import { ShopSettingsForm } from "@/components/admin/ShopSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
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
      <h1 className="display text-3xl">Shop settings</h1>
      <p className="mt-1 text-sm text-muted">Name, logo, open/closed, and public URL.</p>
      <div className="mt-6">
        <ShopSettingsForm shop={shop} />
      </div>
    </div>
  );
}
