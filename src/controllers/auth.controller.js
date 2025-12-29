const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const isProd = process.env.NODE_ENV === "production";

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (userRes.rowCount === 0)
    return res.status(401).json({ message: "Invalid credentials" });

  const user = userRes.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const payload = {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res
    .cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd, // true on prod
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd, // 👈 MUST be false on localhost
      sameSite: "lax", // 👈 SAME HERE
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ message: "Login successful" });
};

exports.logout = (req, res) => {
  res
    .clearCookie("access_token", {
      httpOnly: true,
      sameSite: "lax",
    })
    .clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "lax",
    })
    .json({ message: "Logged out successfully" });
};

exports.me = async (req, res) => {
  res.json({
    user: req.user,
  });
};
