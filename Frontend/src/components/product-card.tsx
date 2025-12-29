"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { useCart } from "@/components/cart-context"
import { ShoppingCart, Star } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    console.log('[ProductCard] Adding product to cart:', product.name);
    addItem(product, 1)
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {product.price && (
            <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">Sale</Badge>
          )}
          {!(product.quantity > 0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="mb-2 font-medium text-balance leading-tight">{product.name}</h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          {product.average_rating && (
            <div className="mb-3 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{product.average_rating}</span>
              <span className="text-muted-foreground">({product.review_count})</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">${product.price.toString()}</span>
              {product.price && (
                <span className="text-sm text-muted-foreground line-through">${Number(product.price)}</span>
              )}
            </div>
            <Button size="sm" onClick={handleAddToCart} disabled={!(product.quantity > 0)} className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
