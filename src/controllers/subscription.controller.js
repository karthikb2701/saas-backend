const pool = require("../config/db");

exports.getMySubscription = async (req, res) => {
  const tenantId = req.tenantId;

  const result = await pool.query(
    `
    SELECT sp.name, sp.price, sp.order_limit
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
    `,
    [tenantId]
  );

  if (result.rowCount === 0) {
    return res.json({ name: "FREE", price: 0, order_limit: 20 });
  }

  res.json(result.rows[0]);
};

exports.getPlans = async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, price, order_limit FROM subscription_plans ORDER BY price"
  );

  res.json({ plans: result.rows });
};
