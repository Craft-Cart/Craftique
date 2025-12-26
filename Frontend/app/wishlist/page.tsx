'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingCart } from 'lucide-react'
import { Product, Wishlist } from '@/lib/types'

interface WishlistPageProps {}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Wishlist[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      // In a real implementation, this would call the wishlist API
      const mockResponse = await fetch('/api/wishlist')
      const data = await mockResponse.json()
      setWishlist(data.wishlist || [])
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ item_id: productId }),
      })
      
      if (response.ok) {
        fetchWishlist()
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
    }
  }

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${wishlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      })
      
      if (response.ok) {
        fetchWishlist()
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }

  const addToCart = async (product: Product) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      })
      
      if (response.ok) {
        // Show success message
        console.log('Added to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
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
    return <div className="p-6">Loading wishlist...</div>
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-4">
              Save items you love to keep track of them
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in your wishlist
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((wishlistItem) => {
          const product = products.find(p => p.id === wishlistItem.item_id)
          if (!product) return null

          return (
            <Card key={wishlistItem.id} className="group">
              <CardHeader className="p-4">
                <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                  <img
                    src={product.images[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                  />
                  {product.is_featured && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWishlist(wishlistItem.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">
                      {formatCurrency(product.price)}
                    </div>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.compare_at_price)}
                      </div>
                    )}
                  </div>
                  {product.quantity > 0 ? (
                    <Badge variant="secondary">In Stock</Badge>
                  ) : (
                    <Badge variant="outline">Out of Stock</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}