"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CartItem } from "@/lib/types"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    setQuantity(newQuantity)
    onUpdateQuantity(item.product.id, newQuantity)
  }

  const handleInputChange = (value: string) => {
    const num = Number.parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      handleQuantityChange(num)
    }
  }

  const itemTotal = item.product.price * item.quantity

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={item.product.images[0] || "/placeholder.svg"}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h3 className="font-medium leading-tight">{item.product.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">${Number(item.product.price)} each</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                  <span className="sr-only">Decrease quantity</span>
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="h-8 w-16 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                  <span className="sr-only">Increase quantity</span>
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold">${itemTotal.toFixed(2)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onRemove(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove item</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
