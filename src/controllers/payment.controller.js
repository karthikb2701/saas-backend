const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

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

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // paise
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

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Missing payment verification details",
        received: req.body,
      });
    }

    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    if (!req.tenantId) {
      return res.status(400).json({ message: "Tenant missing" });
    }

    // 1️⃣ Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("Expected Signature:", expectedSignature);
    console.log("Received Signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 2️⃣ Fetch plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // 3️⃣ Transaction: subscription + invoice
    await prisma.$transaction(async (tx) => {
      // 🔹 Upsert subscription
      const subscription = await tx.subscription.upsert({
        where: { tenantId: req.tenantId },
        update: {
          planId,
          status: "ACTIVE",
          startDate: new Date(),
        },
        create: {
          tenantId: req.tenantId,
          planId,
          status: "ACTIVE",
          startDate: new Date(),
        },
      });

      // 🔹 Create invoice
      await tx.invoice.create({
        data: {
          tenantId: req.tenantId,
          subscriptionId: subscription.id,
          amount: plan.price,
          status: "PAID",
          razorpayPaymentId: razorpay_payment_id,
          invoiceNumber: `INV-${Date.now()}`,
        },
      });
    });

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
    });
  } catch (err) {
    console.error("🔥 VERIFY PAYMENT ERROR:", err);
    res.status(500).json({
      message: "Internal error during payment verify",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
