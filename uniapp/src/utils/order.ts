import type { OrderStatus } from '@/types/models'

export const customerOrderTabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: '1' },
  { label: '待配送', value: '2' },
  { label: '配送中', value: '3' },
  { label: '已完成', value: '4' },
]

export const merchantOrderTabs = customerOrderTabs

export function getOrderStatusText(status: OrderStatus) {
  return {
    1: '待支付',
    2: '待配送',
    3: '配送中',
    4: '已完成',
    5: '已取消',
  }[status]
}

export function getOrderStatusColor(status: OrderStatus) {
  return {
    1: '#ff9800',
    2: '#bc0bf6',
    3: '#a009d1',
    4: '#8a0fd8',
    5: '#999999',
  }[status]
}

export function getMerchantNextAction(status: OrderStatus) {
  if (status === 2) {
    return {
      label: '开始配送',
      nextStatus: 3,
    }
  }

  if (status === 3) {
    return {
      label: '完成订单',
      nextStatus: 4,
    }
  }

  return null
}
