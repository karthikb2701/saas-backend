const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const { generateInvoice } = require("../controllers/invoice.controller");

router.post("/invoices", auth, tenant, generateInvoice);

module.exports = router;
