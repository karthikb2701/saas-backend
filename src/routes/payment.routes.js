const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const paymentController = require("../controllers/payment.controller");

router.post("/payments/create", auth, tenant, paymentController.createOrder);
router.post("/payments/verify", auth, tenant, paymentController.verifyPayment);

module.exports = router;
