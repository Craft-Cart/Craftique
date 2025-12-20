import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Simulate order creation
  const order = {
    id: `ORD-${Date.now()}`,
    items: body.items,
    shipping: body.shipping,
    payment: body.payment,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    total: body.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(order)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("id")

  if (orderId) {
    return NextResponse.json({
      id: orderId,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      total: 0,
    })
  }

  return NextResponse.json({ error: "Order ID required" }, { status: 400 })
}
