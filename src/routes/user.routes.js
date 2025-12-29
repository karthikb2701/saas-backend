const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");

// ✅ PROTECTED ROUTE
router.get("/me", auth, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user, // from JWT
  });
});

module.exports = router;
