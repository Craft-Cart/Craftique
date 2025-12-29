import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('[API Route: /api/orders/[id]] GET request received for order:', (await params).id);
  const { id } = await params

  console.log('[API Route: /api/orders/[id]] Returning order data');
  return NextResponse.json({
    id,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    total: 0,
    items: [],
  })
}
