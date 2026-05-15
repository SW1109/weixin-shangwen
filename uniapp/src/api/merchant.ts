import { request } from '@/utils/request'
import type {
  Category,
  CategoryPayload,
  DashboardData,
  Dish,
  DishPayload,
  Order,
  StatisticsSummary,
} from '@/types/models'

export function getDashboard() {
  return request<DashboardData>({
    url: '/merchant/dashboard',
    auth: 'merchant',
  })
}

export function getMerchantOrders(status?: string) {
  return request<Order[]>({
    url: '/merchant/orders',
    data: status ? { status } : {},
    auth: 'merchant',
  })
}

export function getMerchantOrderDetail(id: number) {
  return request<Order>({
    url: `/merchant/orders/${id}`,
    auth: 'merchant',
  })
}

export function updateMerchantOrderStatus(id: number, status: number) {
  return request<boolean>({
    url: `/merchant/orders/${id}/status`,
    method: 'POST',
    data: { status },
    auth: 'merchant',
  })
}

export function getMerchantDishes(categoryId?: number) {
  return request<Dish[]>({
    url: '/merchant/dishes',
    data: categoryId ? { categoryId } : {},
    auth: 'merchant',
  })
}

export function saveDish(payload: DishPayload) {
  return request<Dish>({
    url: payload.id ? `/merchant/dishes/${payload.id}` : '/merchant/dishes',
    method: payload.id ? 'PUT' : 'POST',
    data: payload,
    auth: 'merchant',
  })
}

export function deleteDish(id: number) {
  return request<boolean>({
    url: `/merchant/dishes/${id}`,
    method: 'DELETE',
    auth: 'merchant',
  })
}

export function toggleDishStatus(id: number, status: number) {
  return request<boolean>({
    url: `/merchant/dishes/${id}/status`,
    method: 'POST',
    data: { status },
    auth: 'merchant',
  })
}

export function getMerchantCategories() {
  return request<Category[]>({
    url: '/merchant/categories',
    auth: 'merchant',
  })
}

export function saveCategory(payload: CategoryPayload) {
  return request<Category>({
    url: payload.id
      ? `/merchant/categories/${payload.id}`
      : '/merchant/categories',
    method: payload.id ? 'PUT' : 'POST',
    data: payload,
    auth: 'merchant',
  })
}

export function deleteCategory(id: number) {
  return request<boolean>({
    url: `/merchant/categories/${id}`,
    method: 'DELETE',
    auth: 'merchant',
  })
}

export function getStatistics(params: {
  startDate?: string
  endDate?: string
  range?: string
}) {
  return request<StatisticsSummary>({
    url: '/merchant/statistics',
    data: params,
    auth: 'merchant',
  })
}
