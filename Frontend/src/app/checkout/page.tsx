"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart-context"
import { CheckoutSteps } from "@/components/checkout-steps"
import { StepCartReview } from "@/components/step-cart-review"
import { StepShipping } from "@/components/step-shipping"
import { StepPayment } from "@/components/step-payment"
import { StepSuccess } from "@/components/step-success"
import { CheckoutService } from "@/lib/checkout"
import type { ShippingDetails, PaymentDetails, Order } from "@/lib/types"
import { useEffect } from "react"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [shippingData, setShippingData] = useState<ShippingDetails | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (items.length === 0 && currentStep < 4) {
      router.push("/cart")
    }
  }, [items.length, currentStep, router])

  const handleCartReviewNext = () => {
    setCurrentStep(2)
  }

  const handleShippingNext = (data: ShippingDetails) => {
    setShippingData(data)
    setCurrentStep(3)
  }

  const handlePaymentNext = async (data: PaymentDetails) => {
    setPaymentData(data)

    if (!shippingData) return

    const newOrder = await CheckoutService.submitOrder(items, shippingData, data)
    setOrder(newOrder)
    clearCart()
    setCurrentStep(4)
  }

  if (items.length === 0 && currentStep < 4) {
    return null
  }

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Checkout</h1>
        <p className="text-lg text-muted-foreground">Complete your purchase</p>
      </div>

      <CheckoutSteps currentStep={currentStep} />

      {currentStep === 1 && (
        <StepCartReview items={items} onNext={handleCartReviewNext} onBack={() => router.push("/cart")} />
      )}

      {currentStep === 2 && (
        <StepShipping data={shippingData} onNext={handleShippingNext} onBack={() => setCurrentStep(1)} />
      )}

      {currentStep === 3 && shippingData && (
        <StepPayment
          items={items}
          shipping={shippingData}
          data={paymentData}
          onNext={handlePaymentNext}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && order && <StepSuccess order={order} />}
    </main>
  )
}
