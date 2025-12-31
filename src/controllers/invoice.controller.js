const pool = require("../config/db");
const generateInvoice = require("../utils/invoicePdf");

exports.downloadInvoice = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM invoices WHERE id=$1 AND tenant_id=$2",
    [id, req.tenantId]
  );

  if (result.rowCount === 0)
    return res.status(404).json({ message: "Invoice not found" });

  const invoice = result.rows[0];

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoice_number}.pdf`
  );

  const doc = generateInvoice({
    invoice_number: invoice.invoice_number,
    amount: invoice.amount,
    status: invoice.status,
    created_at: invoice.created_at,
    plan: "PRO",
  });

  doc.pipe(res);
  doc.end();
};

exports.getMyInvoices = async (req, res) => {
  const result = await pool.query(
    `
    SELECT id, invoice_number, amount, status, created_at
    FROM invoices
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    `,
    [req.tenantId]
  );

  res.json({ invoices: result.rows });
};

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
