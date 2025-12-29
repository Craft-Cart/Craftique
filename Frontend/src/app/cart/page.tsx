"use client";

import { useCart } from "@/components/cart-context";
import { CartItemCard } from "@/components/cart-item-card";
import { CartSummary } from "@/components/cart-summary";
import { EnhancedCart } from "@/components/enhanced-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Shopping Cart
          </h1>
          <Badge variant="secondary">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Review your items before checkout
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Cart</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Features</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Cart Items */}
            <div className="space-y-4">
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
        </TabsContent>
        
        <TabsContent value="enhanced">
          <EnhancedCart />
        </TabsContent>
      </Tabs>
    </main>
  );
}
