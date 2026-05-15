import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Dish } from '@/types/models'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/utils/storage'
import { syncRemoteCart, getRemoteCart } from '@/api/customer'
import { useAuthStore } from '@/stores/auth'

export const useCartStore = defineStore('cart', () => {
  const items = shallowRef<CartItem[]>([])

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  function persist() {
    writeStorage(STORAGE_KEYS.cart, items.value)
  }

  function hydrate() {
    items.value = readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  }

  function setItems(nextItems: CartItem[]) {
    items.value = nextItems
    persist()
  }

  async function pullRemote() {
    const authStore = useAuthStore()
    if (!authStore.isUserLoggedIn) {
      return
    }

    const remoteItems = await getRemoteCart()
    setItems(remoteItems)
  }

  async function pushRemote() {
    const authStore = useAuthStore()
    if (!authStore.isUserLoggedIn) {
      return
    }

    const remoteItems = await syncRemoteCart(items.value)
    setItems(remoteItems)
  }

  function addDish(dish: Dish | CartItem) {
    const nextItems = [...items.value]
    const dishId = 'id' in dish ? dish.id : dish.dishId
    const currentItem = nextItems.find((item) => item.dishId === dishId)

    if (currentItem) {
      currentItem.quantity += 1
    } else {
      nextItems.push({
        dishId,
        name: dish.name,
        image: dish.image,
        price: dish.price,
        quantity: 1,
        stock: dish.stock,
      })
    }

    setItems(nextItems)
    void pushRemote()
  }

  function decreaseDish(dishId: number) {
    const nextItems = [...items.value]
    const currentItem = nextItems.find((item) => item.dishId === dishId)
    if (!currentItem) {
      return
    }

    if (currentItem.quantity <= 1) {
      setItems(nextItems.filter((item) => item.dishId !== dishId))
    } else {
      currentItem.quantity -= 1
      setItems(nextItems)
    }

    void pushRemote()
  }

  function removeDish(dishId: number) {
    setItems(items.value.filter((item) => item.dishId !== dishId))
    void pushRemote()
  }

  function clear() {
    setItems([])
    void pushRemote()
  }

  function getDishQuantity(dishId: number) {
    return items.value.find((item) => item.dishId === dishId)?.quantity || 0
  }

  return {
    items,
    totalCount,
    totalPrice,
    hydrate,
    setItems,
    pullRemote,
    pushRemote,
    addDish,
    decreaseDish,
    removeDish,
    clear,
    getDishQuantity,
  }
})
