const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");
const role = require("../middlewares/role.middleware");

const {
  createVariant,
  getVariants,
} = require("../controllers/variant.controller");

// OWNER only
router.post(
  "/products/:id/variants",
  auth,
  tenant,
  role(["OWNER"]),
  createVariant
);

// OWNER + STAFF
router.get(
  "/products/:id/variants",
  auth,
  tenant,
  role(["OWNER", "STAFF"]),
  getVariants
);

module.exports = router;
