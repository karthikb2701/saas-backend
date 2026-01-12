const prisma = require("../lib/prisma");

exports.getMySubscription = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return res.json({ name: "FREE", price: 0, orderLimit: 20 });
    }

    res.json({
      name: subscription.plan.name,
      price: subscription.plan.price,
      orderLimit: subscription.plan.orderLimit,
    });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });

    res.json({ plans });
  } catch (err) {
    console.error("Get plans error:", err);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
};
