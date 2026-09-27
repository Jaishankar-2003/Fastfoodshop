export type CreateCheckoutInput = {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
};

export type CreateCheckoutResult = {
  provider: "razorpay";
  providerOrderId: string;
  amountPaise: number;
  currency: string;
};

export type VerifyPaymentInput = {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
};

export interface PaymentGateway {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyCheckoutSignature(input: VerifyPaymentInput): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}
