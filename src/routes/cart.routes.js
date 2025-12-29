const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");

const { addToCart, getCart } = require("../controllers/cart.controller");

router.post("/cart", auth, tenant, addToCart);
router.get("/cart", auth, tenant, getCart);

module.exports = router;
