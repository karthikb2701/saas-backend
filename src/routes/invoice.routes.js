const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const { generateInvoice } = require("../controllers/invoice.controller");

const invoiceController = require("../controllers/invoice.controller");

router.get("/invoices", auth, tenant, invoiceController.getMyInvoices);

router.get(
  "/invoices/:id/download",
  auth,
  tenant,
  invoiceController.downloadInvoice
);

router.post("/invoices", auth, tenant, generateInvoice);

module.exports = router;
