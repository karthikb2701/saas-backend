const pool = require("../config/db");

exports.generateInvoice = async (req, res) => {
  const { order_id } = req.body;
  const tenantId = req.tenantId;

  const invoiceNumber = `INV-${Date.now()}`;

  const result = await pool.query(
    `
    INSERT INTO invoices
      (tenant_id, order_id, invoice_number)
    VALUES
      ($1, $2, $3)
    RETURNING *
    `,
    [tenantId, order_id, invoiceNumber]
  );

  res.status(201).json({
    message: "Invoice generated",
    invoice: result.rows[0],
  });
};
