const pool = require("../config/db");

// CREATE VARIANT
exports.createVariant = async (req, res) => {
  try {
    const { label, price, stock } = req.body;
    const productId = req.params.id;

    if (!label || !price) {
      return res.status(400).json({
        message: "label and price are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO product_variants
        (product_id, label, price, stock)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
      `,
      [productId, label, price, stock || 0]
    );

    res.status(201).json({
      message: "Variant created",
      variant: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create variant" });
  }
};

// GET VARIANTS
exports.getVariants = async (req, res) => {
  try {
    const productId = req.params.id;

    const result = await pool.query(
      `
      SELECT * FROM product_variants
      WHERE product_id = $1
      ORDER BY price
      `,
      [productId]
    );

    res.json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch variants" });
  }
};
