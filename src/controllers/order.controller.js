const pool = require("../config/db");

exports.createOrder = async (req, res) => {
  const userId = req.user.userId;
  const tenantId = req.tenantId;

  // get cart items
  const cartItems = await pool.query(
    `
    SELECT
      pv.label,
      pv.price,
      ci.quantity
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.id
    JOIN product_variants pv ON pv.id = ci.product_variant_id
    WHERE c.user_id = $1
    `,
    [userId]
  );

  if (cartItems.rowCount === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const total = cartItems.rows.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // create order
  const orderRes = await pool.query(
    `
    INSERT INTO orders (tenant_id, user_id, total_amount)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [tenantId, userId, total]
  );

  const orderId = orderRes.rows[0].id;

  // snapshot items
  for (const item of cartItems.rows) {
    await pool.query(
      `
      INSERT INTO order_items
        (order_id, product_name, variant_label, price, quantity)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [orderId, "Cake", item.label, item.price, item.quantity]
    );
  }

  // clear cart
  await pool.query(
    "DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)",
    [userId]
  );

  res.status(201).json({
    message: "Order created",
    order_id: orderId,
    total,
  });
};

exports.getOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, total_amount, order_status, created_at
      FROM orders
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      `,
      [req.tenantId, req.user.userId]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
