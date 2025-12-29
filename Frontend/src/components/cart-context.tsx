/**
 * Shopping Cart Context
 * Singleton pattern for cart state management across the application
 */

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { CartItem, Product } from "@/lib/types"

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "ecommerce_cart"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('[CartContext] Loading cart from localStorage');
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        const cartItems = JSON.parse(stored);
        console.log('[CartContext] Cart loaded:', cartItems.length, 'items');
        setItems(cartItems);
      } catch (error) {
        console.error("[v0] Failed to parse cart from localStorage:", error)
      }
    } else {
      console.log('[CartContext] No cart found in localStorage');
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      console.log('[CartContext] Saving cart to localStorage:', items.length, 'items');
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = useCallback((product: Product, quantity = 1) => {
    console.log('[CartContext] addItem - Adding product:', product.name, 'quantity:', quantity);
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)

      if (existingItem) {
        console.log('[CartContext] addItem - Updating existing item quantity');
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * product.price }
            : item,
        )
      }

      console.log('[CartContext] addItem - Adding new item to cart');
      return [...prev, { product, quantity, total: quantity * product.price }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    console.log('[CartContext] removeItem - Removing product:', productId);
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      console.log('[CartContext] updateQuantity - Updating quantity for product:', productId, 'to:', quantity);
      if (quantity <= 0) {
        removeItem(productId)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity, total: quantity * item.product.price } : item,
        ),
      )
    },
    [removeItem],
  )

  const clearCart = useCallback(() => {
    console.log('[CartContext] clearCart - Clearing cart');
    setItems([])
  }, [])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
