const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://saas-frontend-tan.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/users", require("./routes/user.routes"));
app.use("/products", require("./routes/product.routes"));
app.use("/categories", require("./routes/category.routes"));
app.use("/", require("./routes/variant.routes"));
app.use("/", require("./routes/cart.routes"));
app.use("/", require("./routes/order.routes"));
app.use("/", require("./routes/payment.routes"));
app.use("/", require("./routes/invoice.routes"));
app.use("/", require("./routes/subscription.routes"));

module.exports = app;
