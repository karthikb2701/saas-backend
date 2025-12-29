const pool = require("../config/db");

// ADD / UPDATE CART ITEM
exports.addToCart = async (req, res) => {
  const { variant_id, quantity } = req.body;
  const userId = req.user.userId;
  const tenantId = req.tenantId;

  if (!variant_id || !quantity) {
    return res
      .status(400)
      .json({ message: "variant_id and quantity required" });
  }

  // ensure cart exists
  const cartRes = await pool.query(
    `
    INSERT INTO carts (tenant_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id
    `,
    [tenantId, userId]
  );

  const cartId = cartRes.rows[0].id;

  // upsert cart item
  await pool.query(
    `
    INSERT INTO cart_items (cart_id, product_variant_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (cart_id, product_variant_id)
    DO UPDATE SET quantity = EXCLUDED.quantity
    `,
    [cartId, variant_id, quantity]
  );

  res.json({ message: "Item added to cart" });
};

// VIEW CART
exports.getCart = async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `
    SELECT
      ci.id,
      pv.label,
      pv.price,
      ci.quantity,
      (pv.price * ci.quantity) AS total
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.id
    JOIN product_variants pv ON pv.id = ci.product_variant_id
    WHERE c.user_id = $1
    `,
    [userId]
  );

  res.json({ cart: result.rows });
};
