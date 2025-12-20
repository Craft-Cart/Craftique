"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { paymentSchema, type PaymentFormData } from "@/lib/validation"
import type { PaymentDetails, CartItem, ShippingDetails } from "@/lib/types"
import { CheckoutService } from "@/services/checkout"
import { CreditCard, Lock } from "lucide-react"
import { useState } from "react"

interface StepPaymentProps {
  items: CartItem[]
  shipping: ShippingDetails
  data: PaymentDetails | null
  onNext: (data: PaymentDetails) => void
  onBack: () => void
}

export function StepPayment({ items, shipping, data, onNext, onBack }: StepPaymentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { subtotal, tax, shipping: shippingCost, total } = CheckoutService.calculateTotals(items)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: data || {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    },
  })

  const onSubmit = async (formData: PaymentFormData) => {
    setIsSubmitting(true)
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    onNext(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" maxLength={16} {...register("cardNumber")} />
                {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Name on Card</Label>
                <Input id="cardName" placeholder="John Doe" {...register("cardName")} />
                {errors.cardName && <p className="text-sm text-destructive">{errors.cardName.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" placeholder="MM/YY" maxLength={5} {...register("expiryDate")} />
                  {errors.expiryDate && <p className="text-sm text-destructive">{errors.expiryDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" maxLength={4} {...register("cvv")} />
                  {errors.cvv && <p className="text-sm text-destructive">{errors.cvv.message}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Your payment information is secure and encrypted</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
                  <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping To</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">
                {shipping.firstName} {shipping.lastName}
              </p>
              <p className="text-muted-foreground">{shipping.address}</p>
              <p className="text-muted-foreground">
                {shipping.city}, {shipping.state} {shipping.zipCode}
              </p>
              <p className="text-muted-foreground">{shipping.country}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          size="lg"
          disabled={isSubmitting}
          className="bg-transparent"
        >
          Back
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </form>
  )
}
