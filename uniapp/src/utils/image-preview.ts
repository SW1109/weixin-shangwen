function normalizeImageUrls(urls: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      urls
        .map((url) => url?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  )
}

export function previewImages(
  current?: string | null,
  urls: Array<string | null | undefined> = [],
) {
  const imageUrls = normalizeImageUrls(urls.length ? urls : [current])

  if (!imageUrls.length) {
    uni.showToast({
      title: '暂无可预览图片',
      icon: 'none',
    })
    return
  }

  const currentUrl = current?.trim()
  const previewCurrent = currentUrl && imageUrls.includes(currentUrl)
    ? currentUrl
    : imageUrls[0]

  uni.previewImage({
    current: previewCurrent,
    urls: imageUrls,
    fail: () => {
      uni.showToast({
        title: '图片预览失败',
        icon: 'none',
      })
    },
  })
}
