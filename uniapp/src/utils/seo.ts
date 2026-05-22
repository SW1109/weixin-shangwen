import type { Dish } from '@/types/models'
import {
  buildDishH5ShareUrl,
  buildDishShareDescription,
  buildDishShareTitle,
} from '@/utils/share'

// #ifdef H5
function upsertMeta(key: 'name' | 'property', value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${key}="${value}"]`,
  )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(key, value)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}
// #endif

export function setDishSeoMeta(dish: Dish) {
  // #ifdef H5
  if (typeof document === 'undefined') {
    return
  }

  const title = buildDishShareTitle(dish)
  const description = buildDishShareDescription(dish)
  const shareUrl = buildDishH5ShareUrl(dish.id)

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:type', 'product')
  upsertMeta('property', 'og:site_name', '汤汤点餐')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:image', dish.image)
  upsertMeta('property', 'og:image:alt', dish.name)
  upsertMeta('property', 'og:url', shareUrl)
  upsertMeta('property', 'product:price:amount', String(dish.price))
  upsertMeta('property', 'product:price:currency', 'CNY')
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', dish.image)
  // #endif
}
