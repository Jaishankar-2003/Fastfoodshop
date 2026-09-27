import { NextResponse } from "next/server";
import { CheckoutError, getShopBySlug, validateCartForCheckout } from "@/lib/shop";
import { insertOrder, validateCustomer } from "@/lib/orders";
import type { CartItem } from "@/types/database";

type CashOrderBody = {
  shopSlug?: string;
  name?: string;
  mobile?: string;
  items?: Array<Pick<CartItem, "productId" | "quantity">>;
  idempotencyKey?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CashOrderBody;
    const shopSlug = body.shopSlug?.trim();
    if (!shopSlug) {
      return NextResponse.json({ error: "Missing shop." }, { status: 400 });
    }

    const shop = await getShopBySlug(shopSlug);
    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const customer = validateCustomer(body.name ?? "", body.mobile ?? "");
    const cart = await validateCartForCheckout(shop, body.items ?? []);
    const order = await insertOrder({
      shopId: shop.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      cart,
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      orderStatus: "NEW",
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      const closed = error.message === "SHOP_CLOSED";
      return NextResponse.json(
        { error: closed ? "This shop is currently closed." : error.message, code: closed ? "SHOP_CLOSED" : "CHECKOUT" },
        { status: 400 },
      );
    }
    console.error("Cash order failed", error);
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }
}
