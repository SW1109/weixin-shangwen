import { request } from '@/utils/request'
import type {
  Address,
  AddressPayload,
  CartItem,
  Category,
  Dish,
  Order,
} from '@/types/models'

export function getCategories() {
  return request<Category[]>({
    url: '/categories',
  })
}

export function getDishes(params: { categoryId?: number; keyword?: string } = {}) {
  return request<Dish[]>({
    url: '/dishes',
    data: params,
  })
}

export function getDishDetail(id: number) {
  return request<Dish>({
    url: `/dishes/${id}`,
  })
}

export function getAddresses() {
  return request<Address[]>({
    url: '/customer/addresses',
    auth: 'user',
  })
}

export function saveAddress(payload: AddressPayload, id?: number) {
  return request<Address>({
    url: id ? `/customer/addresses/${id}` : '/customer/addresses',
    method: id ? 'PUT' : 'POST',
    data: payload,
    auth: 'user',
  })
}

export function deleteAddress(id: number) {
  return request<boolean>({
    url: `/customer/addresses/${id}`,
    method: 'DELETE',
    auth: 'user',
  })
}

export function setDefaultAddress(id: number) {
  return request<boolean>({
    url: `/customer/addresses/${id}/default`,
    method: 'POST',
    auth: 'user',
  })
}

export function getRemoteCart() {
  return request<CartItem[]>({
    url: '/customer/cart',
    auth: 'user',
  })
}

export function syncRemoteCart(items: CartItem[]) {
  return request<CartItem[]>({
    url: '/customer/cart',
    method: 'PUT',
    data: { items },
    auth: 'user',
  })
}

export function createOrder(payload: {
  addressId: number
  remark: string
  dishes: Array<{ dishId: number; quantity: number }>
}) {
  return request<{ orderId: number; orderNo: string }>({
    url: '/customer/orders',
    method: 'POST',
    data: payload,
    auth: 'user',
  })
}

export function getOrders(status?: string) {
  return request<Order[]>({
    url: '/customer/orders',
    data: status ? { status } : {},
    auth: 'user',
  })
}

export function getOrderDetail(id: number) {
  return request<Order>({
    url: `/customer/orders/${id}`,
    auth: 'user',
  })
}

export function payOrder(id: number) {
  return request<boolean>({
    url: `/customer/orders/${id}/pay`,
    method: 'POST',
    auth: 'user',
  })
}

export function cancelOrder(id: number) {
  return request<boolean>({
    url: `/customer/orders/${id}/cancel`,
    method: 'POST',
    auth: 'user',
  })
}
