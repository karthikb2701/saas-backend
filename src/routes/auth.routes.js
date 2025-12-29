const express = require("express");
const router = express.Router();

const { login, logout, me } = require("../controllers/auth.controller");
const { refresh } = require("../controllers/refresh.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", auth, me);

module.exports = router;
