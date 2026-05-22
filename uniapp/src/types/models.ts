export type OrderStatus = 1 | 2 | 3 | 4 | 5

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface UserProfile {
  id: number
  openid: string
  nickName: string
  avatarUrl: string
  phoneNumber: string
}

export interface MerchantProfile {
  id: number
  username: string
  role: string
  storeName: string
  storePhone: string
  storeAddress: string
  status: number
}

export interface Category {
  id: number
  name: string
  sort: number
  icon?: string | null
  status: number
}

export interface Dish {
  id: number
  categoryId: number
  categoryName: string
  name: string
  image: string
  price: number
  originalPrice?: number | null
  description: string
  stock: number
  sales: number
  status: number
  isRecommend: boolean
  tags: string[]
  sort: number
}

export interface CartItem {
  dishId: number
  name: string
  image: string
  price: number
  quantity: number
  stock: number
}

export interface Address {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

export interface AddressPayload {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

export interface OrderItem {
  dishId: number
  name: string
  image: string
  price: number
  quantity: number
}

export interface OrderUserInfo {
  nickName: string
  avatarUrl: string
  phoneNumber: string
}

export interface OrderAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

export interface Order {
  id: number
  orderNo: string
  userInfo: OrderUserInfo
  dishes: OrderItem[]
  totalAmount: number
  address: OrderAddress
  remark: string
  status: OrderStatus
  payStatus: number
  createTime: string
  updateTime: string
  payTime?: string | null
  completeTime?: string | null
}

export interface StatisticsSummary {
  totalSales: number
  totalOrders: number
  paidOrders: number
  completedOrders: number
  canceledOrders: number
  uniqueCustomers: number
  repeatCustomers: number
  totalDishes: number
  avgOrderAmount: number
  avgDishesPerOrder: number
  payRate: number
  completionRate: number
  cancelRate: number
  peakSalesLabel: string
  ordersByStatus: Record<string, number>
  statusDistribution: StatusDistributionStat[]
  salesTrend: SalesTrendPoint[]
  categorySales: CategorySalesStat[]
  topDishes: TopDishStat[]
}

export interface SalesTrendPoint {
  label: string
  sales: number
  orders: number
}

export interface StatusDistributionStat {
  status: number
  label: string
  value: number
  ratio: number
}

export interface CategorySalesStat {
  categoryId: number
  name: string
  quantity: number
  amount: number
}

export interface TopDishStat {
  dishId: number
  name: string
  quantity: number
  amount: number
}

export interface DashboardData {
  todayStats: StatisticsSummary
  orderStats: {
    unpaid: number
    toDeliver: number
    delivering: number
  }
  recentOrders: Order[]
}

export interface UserSession {
  token: string
  userInfo: UserProfile
}

export interface MerchantSession {
  token: string
  merchantInfo: MerchantProfile
}

export interface DishPayload {
  id?: number
  categoryId: number
  name: string
  image: string
  price: number
  originalPrice?: number | null
  description: string
  stock: number
  status: number
  isRecommend: boolean
  tags: string[]
  sort?: number
}

export interface CategoryPayload {
  id?: number
  name: string
  sort: number
  icon?: string | null
  status: number
}
