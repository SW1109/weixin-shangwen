import { shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { Category, Dish } from '@/types/models'
import { getCategories, getDishes } from '@/api/customer'

export const useCatalogStore = defineStore('catalog', () => {
  const categories = shallowRef<Category[]>([])
  const dishes = shallowRef<Dish[]>([])

  async function loadCategories(force = false) {
    if (!force && categories.value.length) {
      return categories.value
    }

    categories.value = await getCategories()
    return categories.value
  }

  async function loadDishes(filters: { categoryId?: number; keyword?: string } = {}) {
    dishes.value = await getDishes(filters)
    return dishes.value
  }

  return {
    categories,
    dishes,
    loadCategories,
    loadDishes,
  }
})
