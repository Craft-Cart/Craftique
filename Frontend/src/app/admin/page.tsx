'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserManagement } from './user-management'
import { OrderManagement } from './order-management'
import { ProductManagement } from './product-management'
import { CategoryManagement } from './category-management'
import { AnalyticsDashboard } from './analytics'
import { useRBAC } from '@/hooks/use-rbac'
import { API_ENDPOINTS } from '@/lib/endpoints'
import { User, Order, Product } from '@/lib/types'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
}

export default function AdminDashboard() {
  console.log('[Page: Admin] Component mounting');
  const {
    loading: rbacLoading,
    canAccessAdmin,
    canManageUsers,
    canManageItems,
    canManageCategories,
    canAccessAnalytics,
    isAdmin,
    isModerator
  } = useRBAC()

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    console.log('[Page: Admin] Fetching dashboard stats');
    try {
      const { authService } = await import('@/lib/auth-service')
      const token = await authService['getAuthToken']()

      if (!token) {
        console.warn('[Page: Admin] No auth token available')
        setLoading(false)
        return
      }

  const fetchDashboardStats = async () => {
    try {
      // Get token from auth-service which handles HttpOnly cookies properly
      const { authService } = await import('@/lib/auth-service')
      const token = await authService['getAuthToken']()

      if (!token) {
        console.warn('No auth token available')
        setLoading(false)
        return
      }

      const [usersResponse, ordersResponse, productsResponse] = await Promise.all([
        fetch(API_ENDPOINTS.users.list, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(API_ENDPOINTS.orders.list, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(API_ENDPOINTS.items.list, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const usersData = await usersResponse.json()
      const ordersData = await ordersResponse.json()
      const productsData = await productsResponse.json()

      console.log('[Page: Admin] Stats fetched:', { users: usersData.total, orders: ordersData.total, products: productsData.total });

      setStats({
        totalUsers: usersData.total || 0,
        totalOrders: ordersData.total || 0,
        totalRevenue: ordersData.orders?.reduce((sum: number, order: Order) => sum + Number(order.total), 0) || 0,
        totalProducts: productsData.total || 0,
      })
    } catch (error) {
      console.error('[Page: Admin] Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (rbacLoading || loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  if (!canAccessAdmin()) {
    return <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="mb-4">You don't have permission to access the admin dashboard.</p>
      <a href="/auth/login?returnTo=/admin" className="text-blue-600 hover:underline">
        Login with Admin Account
      </a>
    </div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isAdmin() ? 'Admin Dashboard' : 'Moderator Dashboard'}</h1>
        <Badge variant="secondary">{isAdmin() ? 'Administrator' : 'Moderator'}</Badge>
      </div>

      {/* Stats Cards - Only show for Admins */}
      {isAdmin() && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* For moderators, show only categories and products count */}
      {isModerator() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Tabs */}
      <Tabs defaultValue={isModerator() ? "categories" : "users"} className="space-y-4">
        <TabsList>
          {isAdmin() && canManageUsers() && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin() && <TabsTrigger value="orders">Orders</TabsTrigger>}
          {canManageCategories() && <TabsTrigger value="categories">Categories</TabsTrigger>}
          {canManageItems() && <TabsTrigger value="products">Products</TabsTrigger>}
          {isAdmin() && canAccessAnalytics() && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {isAdmin() && canManageUsers() && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}

        {isAdmin() && (
          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
        )}

        {canManageCategories() && (
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
        )}

        {canManageItems() && (
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
        )}

        {isAdmin() && canAccessAnalytics() && (
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}