'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Trash2, ShoppingCart } from 'lucide-react'
import { CartItem, SavedCart } from '@/lib/types'

export function EnhancedCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [cartName, setCartName] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchCart()
    fetchSavedCarts()
    calculateTotal()
  }, [cart])

  const fetchCart = async () => {
    try {
      // Get cart from localStorage
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedCarts = async () => {
    try {
      const response = await fetch('/api/saved-carts', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSavedCarts(data.saved_carts || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved carts:', error)
    }
  }

  const calculateTotal = () => {
    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
    setTotal(cartTotal)
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: item.product.price * newQuantity }
        : item
    )
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId)
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('cart')
  }

  const saveCart = async () => {
    try {
      const response = await fetch('/api/saved-carts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cartName,
          items: cart,
        }),
      })

      if (response.ok) {
        setIsSaveDialogOpen(false)
        setCartName('')
        fetchSavedCarts()
      }
    } catch (error) {
      console.error('Failed to save cart:', error)
    }
  }

  const loadSavedCart = async (savedCartId: string) => {
    try {
      const savedCart = savedCarts.find(cart => cart.id === savedCartId)
      if (savedCart) {
        setCart(savedCart.items)
        localStorage.setItem('cart', JSON.stringify(savedCart.items))
      }
    } catch (error) {
      console.error('Failed to load saved cart:', error)
    }
  }

  const deleteSavedCart = async (savedCartId: string) => {
    try {
      const response = await fetch(`/api/saved-carts/${savedCartId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })

      if (response.ok) {
        setSavedCarts(savedCarts.filter(cart => cart.id !== savedCartId))
      }
    } catch (error) {
      console.error('Failed to delete saved cart:', error)
    }
  }

  const getAuthToken = () => {
    return localStorage.getItem('auth0_access_token') || ''
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return <div className="p-6">Loading cart...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Shopping Cart</CardTitle>
                  <CardDescription>
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Cart
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Cart</DialogTitle>
                        <DialogDescription>
                          Save your current cart for later use.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cart-name">Cart Name</Label>
                          <Input
                            id="cart-name"
                            value={cartName}
                            onChange={(e) => setCartName(e.target.value)}
                            placeholder="e.g., Weekend Shopping"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveCart}>Save Cart</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {cart.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Add some products to get started
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.product.images[0] || '/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.product.category?.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) => updateQuantity(item.product.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.product.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>{formatCurrency(total * 0.1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(total * 1.1)}</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={cart.length === 0}
                onClick={() => window.location.href = '/checkout'}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>

          {/* Saved Carts */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Carts</CardTitle>
              <CardDescription>
                Quick access to your previously saved carts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedCarts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved carts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {savedCarts.map((savedCart) => (
                    <div key={savedCart.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{savedCart.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedCart(savedCart.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(savedCart.created_at).toLocaleDateString()} • 
                        {JSON.parse(savedCart.items as string).length} items
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => loadSavedCart(savedCart.id)}
                      >
                        Load Cart
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}