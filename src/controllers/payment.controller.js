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
  console.log("🔥 VERIFY PAYMENT HIT");
  console.log("BODY:", req.body);
  console.log("TENANT ID:", req.tenantId);

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
      console.log("❌ SIGNATURE MISMATCH");
      return res.status(400).json({ message: "Payment verification failed" });
    }

    console.log("✅ Signature verified");

    // 2️⃣ Check tenantId
    if (!req.tenantId) {
      console.log("❌ TENANT ID MISSING");
      return res.status(400).json({ message: "Tenant missing" });
    }

    // 3️⃣ Insert subscription
    console.log("➡️ Inserting subscription");

    const subRes = await pool.query(
      `
      INSERT INTO subscriptions (tenant_id, plan_id, status)
      VALUES ($1, $2, 'ACTIVE')
      RETURNING *
      `,
      [req.tenantId, planId]
    );

    console.log("✅ Subscription inserted:", subRes.rows[0]);

    // 4️⃣ Insert invoice
    const invoiceNumber = `INV-${Date.now()}`;

    console.log("➡️ Inserting invoice");

    const invRes = await pool.query(
      `
      INSERT INTO invoices (
        tenant_id,
        subscription_id,
        invoice_number,
        amount,
        status
      )
      VALUES ($1, $2, $3, 999, 'PAID')
      RETURNING *
      `,
      [req.tenantId, subRes.rows[0].id, invoiceNumber]
    );

    console.log("✅ Invoice inserted:", invRes.rows[0]);

    res.json({ success: true });
  } catch (err) {
    console.error("🔥 VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Internal error during payment verify" });
  }
};
