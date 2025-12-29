const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const { payOrder } = require("../controllers/payment.controller");

router.post("/payments", auth, tenant, payOrder);

module.exports = router;
