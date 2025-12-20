"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Order } from "@/lib/types"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface StepSuccessProps {
  order: Order
}

export function StepSuccess({ order }: StepSuccessProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>

          <h2 className="mb-2 text-3xl font-bold">Order Placed Successfully!</h2>
          <p className="mb-6 text-lg text-muted-foreground">Thank you for your purchase</p>

          <div className="mb-8 rounded-lg bg-muted p-6">
            <p className="mb-2 text-sm text-muted-foreground">Order Number</p>
            <p className="text-2xl font-bold">{order.id}</p>
          </div>

          <div className="mb-6 space-y-3 text-left">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{order.items.length}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {order.shipping_cost === 0 ? "FREE" : `$${order.shipping_cost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to <strong>{order.shipping.email}</strong>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
