const pool = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const result = await pool.query(
      `
      SELECT sp.order_limit
      FROM subscriptions s
      JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
      `,
      [tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        message: "No active subscription",
      });
    }

    const limit = result.rows[0].order_limit;

    if (limit) {
      const count = await pool.query(
        `
        SELECT COUNT(*) FROM orders
        WHERE tenant_id = $1
          AND created_at >= date_trunc('month', now())
        `,
        [tenantId]
      );

      if (parseInt(count.rows[0].count) >= limit) {
        return res.status(403).json({
          message: "Monthly order limit reached. Upgrade plan.",
        });
      }
    }

    next();
  } catch (err) {
    console.error("Subscription middleware error:", err);
    res.status(500).json({ message: "Subscription check failed" });
  }
};
