const { fail } = require('../lib/http')
const { mapDishRow } = require('../lib/mappers')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function getRequestOrigin(request) {
  return `${request.protocol}://${request.headers.host}`
}

function toAbsoluteUrl(request, value) {
  const text = String(value || '').trim()
  if (!text) {
    return `${getRequestOrigin(request)}/static/logo.png`
  }

  if (/^https?:\/\//i.test(text)) {
    return text
  }

  if (text.startsWith('//')) {
    return `${request.protocol}:${text}`
  }

  if (text.startsWith('/')) {
    return `${getRequestOrigin(request)}${text}`
  }

  return `${getRequestOrigin(request)}/${text}`
}

function buildFrontendBaseUrl(request, config) {
  return trimSlash(config.h5.publicBaseUrl || getRequestOrigin(request))
}

function buildDescription(dish) {
  const text = dish.description || `推荐你看看 ${dish.name}`
  return text.length > 88 ? `${text.slice(0, 88)}...` : text
}

function renderShareHtml({ dish, imageUrl, sharePageUrl, targetUrl }) {
  const title = `${dish.name} | 汤汤点餐`
  const description = buildDescription(dish)
  const price = `¥${Number(dish.price).toFixed(2)}`

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="汤汤点餐">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(dish.name)}">
  <meta property="og:url" content="${escapeHtml(sharePageUrl)}">
  <meta property="product:price:amount" content="${escapeHtml(Number(dish.price).toFixed(2))}">
  <meta property="product:price:currency" content="CNY">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <script>
    window.setTimeout(function () {
      window.location.replace(${JSON.stringify(targetUrl)});
    }, 120);
  </script>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F8F5FA; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; }
    .card { width: min(680px, calc(100vw - 32px)); overflow: hidden; border: 1px solid rgba(172, 39, 237, .14); border-radius: 24px; background: #fff; box-shadow: 0 18px 48px rgba(54, 20, 82, .12); }
    .cover { width: 100%; height: 280px; object-fit: cover; display: block; background: #f3eef7; }
    .body { padding: 22px; }
    .title { margin: 0 0 10px; font-size: 22px; font-weight: 800; }
    .desc { margin: 0 0 18px; color: #5c6670; line-height: 1.6; }
    .footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .price { color: #AC27ED; font-size: 24px; font-weight: 800; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-width: 128px; height: 44px; padding: 0 18px; border-radius: 999px; background: #AC27ED; color: #fff; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <main class="card">
    <img class="cover" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(dish.name)}">
    <section class="body">
      <h1 class="title">${escapeHtml(dish.name)}</h1>
      <p class="desc">${escapeHtml(description)}</p>
      <div class="footer">
        <span class="price">${escapeHtml(price)}</span>
        <a class="button" href="${escapeHtml(targetUrl)}">打开商品</a>
      </div>
    </section>
  </main>
</body>
</html>`
}

async function shareRoutes(fastify) {
  fastify.get('/dishes/:id', async (request, reply) => {
    const dishId = Number(request.params.id)
    if (!dishId) {
      return fail(reply, 400, '菜品 ID 不合法')
    }

    const [rows] = await fastify.db.query(
      `
        SELECT
          d.id,
          d.category_id,
          c.name AS category_name,
          d.name,
          d.image,
          d.price,
          d.original_price,
          d.description,
          d.stock,
          d.sales,
          d.status,
          d.is_recommend,
          d.tags,
          d.sort
        FROM dishes d
        JOIN categories c ON c.id = d.category_id
        WHERE d.id = ? AND d.status = 1
        LIMIT 1
      `,
      [dishId],
    )

    if (!rows.length) {
      return fail(reply, 404, '菜品不存在或已下架')
    }

    const dish = mapDishRow(rows[0])
    const frontendBaseUrl = buildFrontendBaseUrl(request, fastify.configData)
    const imageUrl = toAbsoluteUrl(request, dish.image)
    const sharePageUrl = `${getRequestOrigin(request)}${request.url}`
    const targetUrl = `${frontendBaseUrl}/#/pages/customer/dish/index?id=${dish.id}&source=share`

    reply
      .type('text/html; charset=utf-8')
      .header('Cache-Control', 'public, max-age=300')
      .send(renderShareHtml({ dish, imageUrl, sharePageUrl, targetUrl }))
  })
}

module.exports = shareRoutes
