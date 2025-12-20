import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return NextResponse.json({
    id,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    total: 0,
    items: [],
  })
}
