import { type NextRequest, NextResponse } from "next/server";

const mockProducts = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 299.99,
    category: "Electronics",
    image: "/premium-black-wireless-headphones.jpg",
    stock: 15,
  },
  {
    id: "2",
    name: "Smart Watch Pro",
    description: "Advanced fitness tracking and notifications",
    price: 399.99,
    category: "Electronics",
    image: "/modern-smart-watch-black.jpg",
    stock: 8,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API Route: /api/products/[id]] GET request received for product:', (await params).id);
  const { id } = await params;
  const product = mockProducts.find((p) => p.id === id);

  if (!product) {
    console.log('[API Route: /api/products/[id]] Product not found:', id);
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const productWithStockStatus = {
    ...product,
    inStock: product.stock > 0,
  };

  console.log('[API Route: /api/products/[id]] Product retrieved:', product.name);
  return NextResponse.json(productWithStockStatus);
}
