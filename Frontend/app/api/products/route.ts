import { type NextRequest, NextResponse } from "next/server"

// Mock product data
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
  {
    id: "3",
    name: "Laptop Stand",
    description: "Ergonomic aluminum laptop stand",
    price: 49.99,
    category: "Accessories",
    image: "/placeholder.svg?height=400&width=400",
    stock: 25,
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with blue switches",
    price: 149.99,
    category: "Electronics",
    image: "/placeholder.svg?height=400&width=400",
    stock: 12,
  },
  {
    id: "5",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 79.99,
    category: "Electronics",
    image: "/placeholder.svg?height=400&width=400",
    stock: 30,
  },
  {
    id: "6",
    name: "USB-C Hub",
    description: "7-in-1 USB-C hub with HDMI and card reader",
    price: 59.99,
    category: "Accessories",
    image: "/placeholder.svg?height=400&width=400",
    stock: 20,
  },
  {
    id: "7",
    name: "Webcam 4K",
    description: "4K webcam with auto-focus and noise reduction",
    price: 129.99,
    category: "Electronics",
    image: "/placeholder.svg?height=400&width=400",
    stock: 10,
  },
  {
    id: "8",
    name: "Phone Stand",
    description: "Adjustable phone stand for desk",
    price: 24.99,
    category: "Accessories",
    image: "/placeholder.svg?height=400&width=400",
    stock: 50,
  },
  {
    id: "9",
    name: "Bluetooth Speaker",
    description: "Portable bluetooth speaker with 360° sound",
    price: 89.99,
    category: "Electronics",
    image: "/placeholder.svg?height=400&width=400",
    stock: 18,
  },
  {
    id: "10",
    name: "Cable Organizer",
    description: "Desk cable management organizer",
    price: 19.99,
    category: "Accessories",
    image: "/placeholder.svg?height=400&width=400",
    stock: 100,
  },
  {
    id: "11",
    name: "Monitor Arm",
    description: "Single monitor desk mount arm",
    price: 119.99,
    category: "Accessories",
    image: "/placeholder.svg?height=400&width=400",
    stock: 15,
  },
  {
    id: "12",
    name: "External SSD 1TB",
    description: "Fast external solid state drive",
    price: 159.99,
    category: "Electronics",
    image: "/placeholder.svg?height=400&width=400",
    stock: 22,
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "12")
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const inStock = searchParams.get("inStock")

  // Filter products
  let filtered = [...mockProducts]

  if (category) {
    filtered = filtered.filter((p) => p.category === category)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower),
    )
  }

  if (minPrice) {
    filtered = filtered.filter((p) => p.price >= Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    filtered = filtered.filter((p) => p.price <= Number.parseFloat(maxPrice))
  }

  if (inStock === "true") {
    filtered = filtered.filter((p) => p.stock > 0)
  }

  // Paginate
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedProducts = filtered.slice(start, end)

  const responseProducts = paginatedProducts.map(product => ({
    ...product,
    inStock: product.stock > 0
  }));

  return NextResponse.json({
    data: responseProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}
