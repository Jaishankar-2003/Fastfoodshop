import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { CheckoutError, getShopBySlug, validateCartForCheckout } from "@/lib/shop";
import { insertOrder, validateCustomer } from "@/lib/orders";
import { getPaymentGateway, isRazorpayConfigured } from "@/lib/payments/razorpay";
import type { CartItem, Order } from "@/types/database";

type OnlineOrderBody = {
  shopSlug?: string;
  name?: string;
  mobile?: string;
  items?: Array<Pick<CartItem, "productId" | "quantity">>;
  idempotencyKey?: string;
  existingOrderId?: string;
};

export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Online payments are not configured yet. Please pay at the shop." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as OnlineOrderBody;
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
    const supabase = createServiceClient();

    let order: Order | null = null;

    if (body.existingOrderId) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", body.existingOrderId)
        .eq("shop_id", shop.id)
        .maybeSingle();
      const existing = data as Order | null;
      if (
        existing &&
        existing.payment_method === "ONLINE" &&
        existing.payment_status !== "PAID" &&
        existing.customer_mobile === customer.mobile
      ) {
        order = existing;
      }
    }

    if (!order) {
      order = await insertOrder({
        shopId: shop.id,
        customerName: customer.name,
        customerMobile: customer.mobile,
        cart,
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        orderStatus: "NEW",
        idempotencyKey: body.idempotencyKey,
      });
    }

    if (order.payment_status === "PAID") {
      return NextResponse.json({
        alreadyPaid: true,
        orderId: order.id,
        orderNumber: order.order_number,
      });
    }

    const gateway = getPaymentGateway();
    const checkout = await gateway.createCheckout({
      amountPaise: order.total_paise,
      receipt: `ord_${order.order_number}`,
      notes: {
        orderId: order.id,
        shopId: shop.id,
      },
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      provider: "razorpay",
      provider_order_id: checkout.providerOrderId,
      amount_paise: checkout.amountPaise,
      currency: checkout.currency,
      status: "CREATED",
    });

    if (paymentError) {
      console.error("Payment row insert failed", paymentError);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: checkout.providerOrderId,
      amountPaise: checkout.amountPaise,
      currency: checkout.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerName: customer.name,
      customerMobile: customer.mobile,
      shopName: shop.name,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      const closed = error.message === "SHOP_CLOSED";
      return NextResponse.json(
        { error: closed ? "This shop is currently closed." : error.message, code: closed ? "SHOP_CLOSED" : "CHECKOUT" },
        { status: 400 },
      );
    }
    console.error("Online order intent failed", error);
    return NextResponse.json({ error: "Could not start online payment." }, { status: 500 });
  }
}
