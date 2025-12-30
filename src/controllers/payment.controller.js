const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../config/db");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { planId } = req.body;

  const planRes = await pool.query(
    "SELECT price FROM subscription_plans WHERE id=$1",
    [planId]
  );

  const amount = planRes.rows[0].price * 100;

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
  });

  res.json(order);
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  // Activate subscription
  await pool.query(
    `
    INSERT INTO subscriptions (tenant_id, plan_id, status)
    VALUES ($1, $2, 'ACTIVE')
    ON CONFLICT (tenant_id)
    DO UPDATE SET plan_id=$2, status='ACTIVE'
    `,
    [req.tenantId, planId]
  );

  res.json({ success: true });
};
