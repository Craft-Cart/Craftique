"use client";

import { useCart } from "@/context/cart-context";
import { CartItemCard } from "@/components/cart-item-card";
import { CartSummary } from "@/components/cart-summary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-muted-foreground">
            Add some products to get started
          </p>
          <Button asChild size="lg">
            <Link href="/">Browse Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-lg text-muted-foreground">
          Review your items before checkout
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart Items */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {items.length} item(s) in cart
          </p>
          {items.map((item) => (
            <CartItemCard
              key={item.product.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <aside>
          <CartSummary items={items} />
        </aside>
      </div>
    </main>
  );
}
