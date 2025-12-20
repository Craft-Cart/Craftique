"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { CheckoutService } from "@/services/checkout"
import type { CartItem } from "@/lib/types"

interface CartSummaryProps {
  items: CartItem[]
}

export function CartSummary({ items }: CartSummaryProps) {
  const { subtotal, tax, shipping, total } = CheckoutService.calculateTotals(items)

  return (
    <Card className="sticky top-24">
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

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {subtotal < 100 && (
          <p className="text-xs text-muted-foreground">Add ${(100 - subtotal).toFixed(2)} more for free shipping</p>
        )}

        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
