const pool = require("../config/db");

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    const result = await pool.query(
      `
      INSERT INTO categories (tenant_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [req.tenantId, name, description || null]
    );

    res.status(201).json({
      message: "Category created",
      category: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create category" });
  }
};

// READ
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE tenant_id = $1 ORDER BY name",
      [req.tenantId]
    );

    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};
