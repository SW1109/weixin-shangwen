import type { OrderAddress } from '@/types/models'

export function formatPrice(value: number) {
  return Number(value || 0).toFixed(2)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAddress(address: OrderAddress) {
  return `${address.province}${address.city}${address.district}${address.detail}`
}
