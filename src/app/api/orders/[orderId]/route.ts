import { NextResponse } from "next/server";
import { getOrderWithItems } from "@/lib/shop";
import { isServiceConfigured } from "@/lib/env";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isServiceConfigured()) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }
  const { orderId } = await params;
  const order = await getOrderWithItems(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
