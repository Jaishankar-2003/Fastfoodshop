import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getShopByOwner, getShopMenuAdmin } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/env";
import { CreateShopForm } from "@/components/admin/CreateShopForm";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  if (!isSupabaseConfigured()) return <p>Configure Supabase first.</p>;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const shop = await getShopByOwner(user.id);
  if (!shop) return <CreateShopForm />;
  const { categories } = await getShopMenuAdmin(shop.id);

  return (
    <div>
      <h1 className="display text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-muted">Momos, Drinks, Snacks, Combos, Specials — whatever this stall sells.</p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
