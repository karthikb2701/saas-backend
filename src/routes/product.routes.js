const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");
const role = require("../middlewares/role.middleware");

const {
  createProduct,
  getProducts,
} = require("../controllers/product.controller");

// list products (OWNER & STAFF)
router.get("/", auth, tenant, role(["OWNER", "STAFF"]), getProducts);

// create product (OWNER only)
router.post("/", auth, tenant, role(["OWNER"]), createProduct);

module.exports = router;
