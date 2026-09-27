"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getShopByOwner } from "@/lib/shop";
import { nextOrderStatus } from "@/lib/orders";
import { rupeesToPaise, slugify } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/database";

async function requireOwnerShop() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }
  const shop = await getShopByOwner(user.id);
  return { user, shop };
}

export async function createShopAction(formData: FormData) {
  const { user, shop } = await requireOwnerShop();
  if (shop) {
    return { error: "You already have a shop." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contactMobile = String(formData.get("contact_mobile") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!name || !slug) {
    return { error: "Shop name and URL slug are required." };
  }

  const admin = createServiceClient();
  const { error } = await admin.from("shops").insert({
    owner_id: user.id,
    name,
    slug,
    description: description || null,
    contact_mobile: contactMobile || null,
    address: address || null,
    is_active: true,
    is_open: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That shop URL is already taken. Try another slug." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateShopAction(formData: FormData) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const contactMobile = String(formData.get("contact_mobile") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const isOpen = String(formData.get("is_open") ?? "") === "true";
  const isActive = String(formData.get("is_active") ?? "") === "true";
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!name || !slug) {
    return { error: "Shop name and URL slug are required." };
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("shops")
    .update({
      name,
      slug,
      description: description || null,
      contact_mobile: contactMobile || null,
      address: address || null,
      is_open: isOpen,
      is_active: isActive,
      logo_url: logoUrl || null,
      image_url: imageUrl || null,
    })
    .eq("id", shop.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That shop URL is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath(`/shop/${slug}`);
  return { ok: true };
}

export async function toggleShopOpenAction(open: boolean) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { error } = await admin.from("shops").update({ is_open: open }).eq("id", shop.id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/shop/${shop.slug}`);
  return { ok: true };
}

export async function saveCategoryAction(formData: FormData) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isEnabled = String(formData.get("is_enabled") ?? "true") === "true";

  if (!name) return { error: "Category name is required." };

  const admin = createServiceClient();
  if (id) {
    const { error } = await admin
      .from("categories")
      .update({ name, sort_order: sortOrder, is_enabled: isEnabled })
      .eq("id", id)
      .eq("shop_id", shop.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("categories").insert({
      shop_id: shop.id,
      name,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_enabled: isEnabled,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { error } = await admin.from("categories").delete().eq("id", id).eq("shop_id", shop.id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function saveProductAction(formData: FormData) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const priceRupees = Number(formData.get("price_rupees") ?? 0);
  const isAvailable = String(formData.get("is_available") ?? "true") === "true";
  const isFeatured = String(formData.get("is_featured") ?? "false") === "true";
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!name || !categoryId) return { error: "Name and category are required." };
  if (!Number.isFinite(priceRupees) || priceRupees < 0) {
    return { error: "Enter a valid price." };
  }

  const payload = {
    shop_id: shop.id,
    category_id: categoryId,
    name,
    description: description || null,
    price_paise: rupeesToPaise(priceRupees),
    is_available: isAvailable,
    is_featured: isFeatured,
    image_url: imageUrl || null,
  };

  const admin = createServiceClient();
  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id).eq("shop_id", shop.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("products").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function deleteProductAction(id: string) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { error } = await admin.from("products").delete().eq("id", id).eq("shop_id", shop.id);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function advanceOrderAction(orderId: string) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { data } = await admin.from("orders").select("*").eq("id", orderId).eq("shop_id", shop.id).maybeSingle();
  const order = data as Order | null;
  if (!order) return { error: "Order not found." };

  const next = nextOrderStatus(order.order_status);
  if (!next) return { error: "This order cannot be advanced." };

  const { error } = await admin.from("orders").update({ order_status: next }).eq("id", order.id);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, status: next as OrderStatus };
}

export async function cancelOrderAction(orderId: string) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { error } = await admin
    .from("orders")
    .update({ order_status: "CANCELLED" })
    .eq("id", orderId)
    .eq("shop_id", shop.id)
    .in("order_status", ["NEW", "PREPARING", "READY"]);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function markCashReceivedAction(orderId: string) {
  const { shop } = await requireOwnerShop();
  if (!shop) return { error: "No shop found." };
  const admin = createServiceClient();
  const { data } = await admin.from("orders").select("*").eq("id", orderId).eq("shop_id", shop.id).maybeSingle();
  const order = data as Order | null;
  if (!order) return { error: "Order not found." };
  if (order.payment_method !== "CASH") {
    return { error: "Only cash orders can be marked received here." };
  }
  if (order.payment_status === "PAID") {
    return { ok: true };
  }

  const { error } = await admin.from("orders").update({ payment_status: "PAID" }).eq("id", order.id);
  if (error) return { error: error.message };

  await admin.from("payments").insert({
    order_id: order.id,
    provider: "cash",
    amount_paise: order.total_paise,
    currency: "INR",
    status: "PAID",
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}
