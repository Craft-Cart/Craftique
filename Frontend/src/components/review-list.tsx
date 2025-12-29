'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from './star-rating'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { API_ENDPOINTS } from '@/lib/endpoints'
import { Review } from '@/lib/types'

interface ReviewListProps {
  productId: string
  isModerator?: boolean
}

export function ReviewList({ productId, isModerator = false }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const getAuthToken = () => {
    return localStorage.getItem('auth0_access_token') || ''
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.reviews.byItem(productId))
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.reviews.create(productId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReview),
      })

      if (response.ok) {
        setIsReviewDialogOpen(false)
        setNewReview({ rating: 5, title: '', comment: '' })
        fetchReviews()
      }
    } catch (error) {
    }
  }

  const approveReview = async (reviewId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.reviews.approve(reviewId), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })

      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
    }
  }

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.reviews.delete(reviewId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })

      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  if (loading) {
    return <div className="p-6">Loading reviews...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              {reviews.length} reviews • {averageRating.toFixed(1)} average rating
            </CardDescription>
          </div>
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button>Write Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience with this product.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <StarRating
                    rating={newReview.rating}
                    onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                    interactive
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Brief summary of your review"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Review</label>
                  <Textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Tell us about your experience"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReview}>Submit Review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <StarRating rating={review.rating} />
                  <span className="font-medium">{review.title || 'No title'}</span>
                  {review.verified_purchase && (
                    <Badge variant="secondary">Verified Purchase</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                  {isModerator && (
                    <div className="flex space-x-1">
                      {!review.is_approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveReview(review.id)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteReview(review.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{review.user?.name || 'Anonymous'}</span>
                {review.is_approved ? (
                  <Badge variant="default">Approved</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              {review.images.length > 0 && (
                <div className="mt-2 flex space-x-2">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}