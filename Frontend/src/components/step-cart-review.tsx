"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CartItem } from "@/lib/types"
import { CheckoutService } from "@/lib/checkout"

interface StepCartReviewProps {
  items: CartItem[]
  onNext: () => void
  onBack: () => void
}

export function StepCartReview({ items, onNext, onBack }: StepCartReviewProps) {
  const { subtotal, tax, shipping, total } = CheckoutService.calculateTotals(items)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={item.product.image || "/placeholder.svg"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.product.name}</h4>
                <p className="text-sm text-muted-foreground">
                  ${item.product.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t pt-4 text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack} size="lg" className="bg-transparent">
          Back to Cart
        </Button>
        <Button onClick={onNext} size="lg">
          Continue to Shipping
        </Button>
      </div>
    </div>
  )
}
