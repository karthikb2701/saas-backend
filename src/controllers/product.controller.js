const pool = require("../config/db");

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      base_price,
      is_eggless,
      category_id,
      image_url,
    } = req.body;

    if (!name || !base_price) {
      return res.status(400).json({
        message: "name and base_price are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products
        (tenant_id, category_id, name, description, base_price, is_eggless, image_url)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        req.tenantId,
        category_id || null,
        name,
        description || null,
        base_price,
        is_eggless || false,
        image_url || null,
      ]
    );

    res.status(201).json({
      message: "Product created",
      product: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC",
      [req.tenantId]
    );

    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};
