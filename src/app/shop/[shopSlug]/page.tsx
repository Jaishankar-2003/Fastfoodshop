import { notFound } from "next/navigation";
import { ShopMenu } from "@/components/customer/ShopMenu";
import { getShopBySlug, getShopMenu } from "@/lib/shop";
import { isServiceConfigured } from "@/lib/env";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}): Promise<Metadata> {
  const { shopSlug } = await params;
  if (!isServiceConfigured()) {
    return { title: shopSlug };
  }
  const shop = await getShopBySlug(shopSlug);
  return { title: shop?.name ?? "Shop" };
}

export default async function ShopPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;

  if (!isServiceConfigured()) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="display text-3xl">Shop is being set up</h1>
        <p className="mt-3 text-muted">Add Supabase keys to load this menu.</p>
      </main>
    );
  }

  const shop = await getShopBySlug(shopSlug);
  if (!shop || !shop.is_active) notFound();

  const { categories, products } = await getShopMenu(shop.id);

  return <ShopMenu shop={shop} categories={categories} products={products} />;
}
