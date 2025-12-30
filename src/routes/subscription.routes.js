const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const subscriptionController = require("../controllers/subscription.controller");

// get current subscription
router.get(
  "/subscription/me",
  auth,
  tenant,
  subscriptionController.getMySubscription
);

// get all plans
router.get(
  "/subscription/plans",
  auth,
  tenant,
  subscriptionController.getPlans
);

module.exports = router;
