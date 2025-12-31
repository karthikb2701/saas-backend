const PDFDocument = require("pdfkit");

module.exports = function generateInvoice(invoice) {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Invoice No: ${invoice.invoice_number}`);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`);
  doc.moveDown();

  doc.text(`Plan: ${invoice.plan}`);
  doc.text(`Amount Paid: ₹${invoice.amount}`);
  doc.text(`Status: ${invoice.status}`);
  doc.moveDown(2);

  doc.text("Thank you for your business!", { align: "center" });

  return doc;
};
