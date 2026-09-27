import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPaymentGateway } from "@/lib/payments/razorpay";
import { markOrderPaid } from "@/lib/orders";
import type { Order, Payment } from "@/types/database";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        amount?: number;
        notes?: { orderId?: string };
      };
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  try {
    const gateway = getPaymentGateway();
    if (!gateway.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as RazorpayWebhook;
    const paymentEntity = event.payload?.payment?.entity;
    const providerPaymentId = paymentEntity?.id;
    const providerOrderId = paymentEntity?.order_id;
    const eventName = event.event ?? "";

    if (!providerPaymentId || !providerOrderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const supabase = createServiceClient();
    const eventId = `${eventName}:${providerPaymentId}`;

    const { data: duplicate } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_event_id", eventId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const { data: paymentRow } = await supabase
      .from("payments")
      .select("*")
      .eq("provider_order_id", providerOrderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let payment = paymentRow as Payment | null;
    let order: Order | null = null;

    if (payment) {
      const { data: orderRow } = await supabase.from("orders").select("*").eq("id", payment.order_id).maybeSingle();
      order = orderRow as Order | null;
    } else if (paymentEntity?.notes?.orderId) {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("*")
        .eq("id", paymentEntity.notes.orderId)
        .maybeSingle();
      order = orderRow as Order | null;
    }

    if (!order) {
      return NextResponse.json({ ok: true, unmatched: true });
    }

    const captured = eventName === "payment.captured" || paymentEntity?.status === "captured";
    const failed = eventName === "payment.failed" || paymentEntity?.status === "failed";

    if (captured) {
      if (payment) {
        await supabase
          .from("payments")
          .update({
            provider_payment_id: providerPaymentId,
            provider_event_id: eventId,
            status: "PAID",
            raw_payload: event,
          })
          .eq("id", payment.id);
      } else {
        await supabase.from("payments").insert({
          order_id: order.id,
          provider: "razorpay",
          provider_order_id: providerOrderId,
          provider_payment_id: providerPaymentId,
          provider_event_id: eventId,
          amount_paise: paymentEntity?.amount ?? order.total_paise,
          currency: "INR",
          status: "PAID",
          raw_payload: event,
        });
      }
      await markOrderPaid(order.id);
    } else if (failed && order.payment_status !== "PAID") {
      if (payment) {
        await supabase
          .from("payments")
          .update({
            provider_payment_id: providerPaymentId,
            provider_event_id: eventId,
            status: "FAILED",
            raw_payload: event,
          })
          .eq("id", payment.id);
      }
      await supabase
        .from("orders")
        .update({ payment_status: "FAILED" })
        .eq("id", order.id)
        .eq("payment_status", "PENDING");
    } else if (payment) {
      await supabase
        .from("payments")
        .update({ provider_event_id: eventId, raw_payload: event })
        .eq("id", payment.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
