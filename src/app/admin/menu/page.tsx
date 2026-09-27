import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner, getShopMenuAdmin } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  if (!isSupabaseConfigured()) return <p>Configure Supabase first.</p>;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const shop = await getShopByOwner(user.id);
  if (!shop) return <CreateShopForm />;
  const { categories, products } = await getShopMenuAdmin(shop.id);

  return (
    <div>
      <h1 className="display text-3xl">Menu</h1>
      <p className="mt-1 text-sm text-muted">Add products with price, photo, availability, and popular flag.</p>
      <div className="mt-6">
        <MenuManager shopId={shop.id} categories={categories} products={products} />
      </div>
    </div>
  );
}
