const pool = require("../config/db");

// MOCK PAYMENT SUCCESS
exports.payOrder = async (req, res) => {
  const { order_id, transaction_id } = req.body;
  const tenantId = req.tenantId;

  if (!order_id || !transaction_id) {
    return res.status(400).json({
      message: "order_id and transaction_id required",
    });
  }

  // get order
  const orderRes = await pool.query(
    "SELECT total_amount FROM orders WHERE id = $1 AND tenant_id = $2",
    [order_id, tenantId]
  );

  if (orderRes.rowCount === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  const amount = orderRes.rows[0].total_amount;

  // insert payment
  await pool.query(
    `
    INSERT INTO payments
      (tenant_id, order_id, gateway, transaction_id, amount, status)
    VALUES
      ($1, $2, $3, $4, $5, 'SUCCESS')
    `,
    [tenantId, order_id, "MOCK", transaction_id, amount]
  );

  // update order
  await pool.query(
    `
    UPDATE orders
    SET payment_status = 'PAID', order_status = 'CONFIRMED'
    WHERE id = $1
    `,
    [order_id]
  );

  res.json({ message: "Payment successful" });
};
