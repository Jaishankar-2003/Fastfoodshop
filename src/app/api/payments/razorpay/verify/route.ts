import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPaymentGateway } from "@/lib/payments/razorpay";
import { markOrderPaid } from "@/lib/orders";
import type { Order, Payment } from "@/types/database";

type VerifyBody = {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.orderId;
    const providerOrderId = body.razorpay_order_id;
    const providerPaymentId = body.razorpay_payment_id;
    const providerSignature = body.razorpay_signature;

    if (!orderId || !providerOrderId || !providerPaymentId || !providerSignature) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    const gateway = getPaymentGateway();
    const valid = gateway.verifyCheckoutSignature({
      providerOrderId,
      providerPaymentId,
      providerSignature,
    });

    if (!valid) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: orderRow } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    const order = orderRow as Order | null;
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "PAID") {
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        orderNumber: order.order_number,
        alreadyPaid: true,
      });
    }

    const { data: paymentRow } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order.id)
      .eq("provider_order_id", providerOrderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payment = paymentRow as Payment | null;

    if (payment) {
      await supabase
        .from("payments")
        .update({
          provider_payment_id: providerPaymentId,
          provider_signature: providerSignature,
          status: "PAID",
        })
        .eq("id", payment.id);
    } else {
      await supabase.from("payments").insert({
        order_id: order.id,
        provider: "razorpay",
        provider_order_id: providerOrderId,
        provider_payment_id: providerPaymentId,
        provider_signature: providerSignature,
        amount_paise: order.total_paise,
        currency: "INR",
        status: "PAID",
      });
    }

    await markOrderPaid(order.id);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error("Payment verify failed", error);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 500 });
  }
}
