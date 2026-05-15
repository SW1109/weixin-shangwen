const { mapOrderRow } = require('./mappers')

const validTransitions = {
  1: [2, 5],
  2: [3, 5],
  3: [4],
  4: [],
  5: [],
}

function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

function canTransition(fromStatus, toStatus) {
  return (validTransitions[fromStatus] || []).includes(toStatus)
}

async function hydrateOrders(executor, rows) {
  if (!rows.length) {
    return []
  }

  const orderIds = rows.map((row) => row.id)
  const placeholders = orderIds.map(() => '?').join(', ')
  const [itemRows] = await executor.query(
    `
      SELECT
        id,
        order_id,
        dish_id,
        dish_name,
        dish_image,
        price,
        quantity
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY id ASC
    `,
    orderIds,
  )

  const groupedItems = itemRows.reduce((map, item) => {
    if (!map[item.order_id]) {
      map[item.order_id] = []
    }
    map[item.order_id].push(item)
    return map
  }, {})

  return rows.map((row) => mapOrderRow(row, groupedItems[row.id] || []))
}

module.exports = {
  validTransitions,
  generateOrderNo,
  canTransition,
  hydrateOrders,
}
