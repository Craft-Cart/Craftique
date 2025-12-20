import { NextResponse } from "next/server"

const mockCategories = [
  { id: "1", name: "Electronics", slug: "Electronics", count: 8 },
  { id: "2", name: "Accessories", slug: "Accessories", count: 4 },
]

export async function GET() {
  return NextResponse.json(mockCategories)
}
