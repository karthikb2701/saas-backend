const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../config/db");

const generateInvoice = require("../utils/invoicePdf");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * CREATE RAZORPAY ORDER
 */
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    const planRes = await pool.query(
      "SELECT price FROM subscription_plans WHERE id=$1",
      [planId]
    );

    if (planRes.rowCount === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const amount = planRes.rows[0].price * 100; // in paise

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
    });

    res.json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

/**
 * VERIFY PAYMENT + ACTIVATE SUBSCRIPTION + CREATE INVOICE
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    // 1️⃣ Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 2️⃣ Get plan details
    const planRes = await pool.query(
      "SELECT id, name, price FROM subscription_plans WHERE id=$1",
      [planId]
    );

    if (planRes.rowCount === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = planRes.rows[0];

    // 3️⃣ Activate / update subscription
    const subRes = await pool.query(
      `
      INSERT INTO subscriptions (tenant_id, plan_id, status)
      VALUES ($1, $2, 'ACTIVE')
      ON CONFLICT (tenant_id)
      DO UPDATE SET plan_id=$2, status='ACTIVE'
      RETURNING id
      `,
      [req.tenantId, planId]
    );

    const subscriptionId = subRes.rows[0].id;

    // 4️⃣ Create invoice record
    const invoiceNumber = `INV-${Date.now()}`;

    const invoiceRes = await pool.query(
      `
      INSERT INTO invoices (
        tenant_id,
        subscription_id,
        invoice_number,
        amount,
        currency,
        status
      )
      VALUES ($1, $2, $3, $4, 'INR', 'PAID')
      RETURNING *
      `,
      [req.tenantId, subscriptionId, invoiceNumber, plan.price]
    );

    const invoice = invoiceRes.rows[0];

    // 5️⃣ Generate PDF (streamed on download)
    // We only generate when user downloads, so no file storage here

    res.json({
      success: true,
      invoiceId: invoice.id,
      message: "Payment verified, subscription activated",
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
