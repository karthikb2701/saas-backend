const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");
const role = require("../middlewares/role.middleware");

const {
  createCategory,
  getCategories,
} = require("../controllers/category.controller");

// OWNER only
router.post("/", auth, tenant, role(["OWNER"]), createCategory);

// OWNER + STAFF
router.get("/", auth, tenant, role(["OWNER", "STAFF"]), getCategories);

module.exports = router;
