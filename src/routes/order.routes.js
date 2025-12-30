const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const subscription = require("../middlewares/subscription.middleware");

const { createOrder, getOrders } = require("../controllers/order.controller");

router.post("/orders", auth, tenant, subscription, createOrder);

router.get("/orders", auth, tenant, getOrders);

module.exports = router;
