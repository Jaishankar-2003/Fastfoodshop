import crypto from "crypto";
import Razorpay from "razorpay";
import { requireEnv } from "@/lib/env";
import {
  PaymentError,
  type CreateCheckoutInput,
  type CreateCheckoutResult,
  type PaymentGateway,
  type VerifyPaymentInput,
} from "@/lib/payments/types";

export class RazorpayGateway implements PaymentGateway {
  private client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: requireEnv("RAZORPAY_KEY_ID"),
      key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
    });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    try {
      const order = (await this.client.orders.create({
        amount: input.amountPaise,
        currency: "INR",
        receipt: input.receipt.slice(0, 40),
        notes: input.notes,
        payment_capture: true,
      })) as { id: string; amount: number | string; currency?: string };

      return {
        provider: "razorpay",
        providerOrderId: String(order.id),
        amountPaise: Number(order.amount),
        currency: String(order.currency ?? "INR"),
      };
    } catch (error) {
      console.error("Razorpay order create failed", error);
      throw new PaymentError("Unable to start online payment.");
    }
  }

  verifyCheckoutSignature(input: VerifyPaymentInput) {
    const secret = requireEnv("RAZORPAY_KEY_SECRET");
    const body = `${input.providerOrderId}|${input.providerPaymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return expected === input.providerSignature;
  }

  verifyWebhookSignature(rawBody: string, signature: string) {
    const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  }
}

export function getPaymentGateway(): PaymentGateway {
  return new RazorpayGateway();
}

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  );
}
