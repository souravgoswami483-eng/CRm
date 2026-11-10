import { jsPDF } from 'jspdf';
import { Invoice, Payment, StudioSettings } from '@/types';

export function generateInvoicePDF(invoice: Invoice, settings?: StudioSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [139, 92, 246]; // Violet accent
  const darkColor = [24, 24, 27];
  const mutedColor = [113, 113, 122];

  // Studio Header Banner
  doc.setFillColor(24, 24, 32);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.studioName || 'VORTEX CREATIVE LABS', 15, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text(settings?.tagline || 'Brand Identity, Motion Graphics & Visual Direction', 15, 24);
  doc.text(`${settings?.email || 'admin@studiovortex.com'}  |  ${settings?.phone || '+91 98765 43210'}`, 15, 30);

  // Invoice Code on top right
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(192, 132, 252);
  doc.text(invoice.isEstimate ? 'QUOTATION' : 'INVOICE', 195, 20, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.invoiceNumber, 195, 28, { align: 'right' });

  // Metadata Block
  let y = 48;
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('BILLED TO:', 15, y);
  doc.text('INVOICE DETAILS:', 130, y);

  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(invoice.clientCompany || invoice.clientName, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Invoice Date: ${invoice.date}`, 130, y);

  y += 5;
  doc.text(`Attn: ${invoice.clientName}`, 15, y);
  doc.text(`Due Date: ${invoice.dueDate}`, 130, y);

  y += 5;
  doc.text(invoice.clientEmail || '', 15, y);
  doc.text(`Payment Terms: ${invoice.paymentTerms || 'Net 15 Days'}`, 130, y);

  if (invoice.clientAddress) {
    y += 5;
    doc.text(invoice.clientAddress.substring(0, 50), 15, y);
  }
  if (invoice.clientGstin) {
    y += 5;
    doc.text(`GSTIN: ${invoice.clientGstin}`, 15, y);
  }

  // Items Table Header
  y += 12;
  doc.setFillColor(244, 244, 245);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 67);
  doc.text('ITEM & DESCRIPTION', 18, y + 5.5);
  doc.text('QTY', 125, y + 5.5, { align: 'right' });
  doc.text('RATE (INR)', 155, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', 190, y + 5.5, { align: 'right' });

  // Items Row
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  invoice.items.forEach((item, idx) => {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(item.service, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(item.quantity.toString(), 125, y, { align: 'right' });
    doc.text(`₹${item.rate.toLocaleString('en-IN')}`, 155, y, { align: 'right' });
    doc.text(`₹${item.amount.toLocaleString('en-IN')}`, 190, y, { align: 'right' });

    if (item.description) {
      y += 4.5;
      doc.setFontSize(8);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(item.description.substring(0, 80), 18, y);
      doc.setFontSize(9);
    }

    y += 3;
    doc.setDrawColor(228, 228, 231);
    doc.line(15, y, 195, y);
  });

  // Summary Totals
  y += 8;
  const totalsX = 135;
  const valuesX = 190;
  doc.setFontSize(9.5);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  doc.text('Subtotal:', totalsX, y);
  doc.text(`₹${invoice.subtotal.toLocaleString('en-IN')}`, valuesX, y, { align: 'right' });

  if (invoice.discountAmount > 0) {
    y += 6;
    doc.setTextColor(16, 185, 129); // Green for discount
    doc.text(`Discount (${invoice.discountType === 'percentage' ? invoice.discountValue + '%' : 'Flat'}):`, totalsX, y);
    doc.text(`-₹${invoice.discountAmount.toLocaleString('en-IN')}`, valuesX, y, { align: 'right' });
  }

  y += 6;
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Tax (${invoice.taxType}):`, totalsX, y);
  doc.text(`₹${invoice.taxAmount.toLocaleString('en-IN')}`, valuesX, y, { align: 'right' });

  y += 8;
  doc.setFillColor(244, 244, 248);
  doc.rect(totalsX - 3, y - 5, 63, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text('Total Amount:', totalsX, y + 2);
  doc.text(`₹${invoice.total.toLocaleString('en-IN')}`, valuesX, y + 2, { align: 'right' });

  if (invoice.amountPaid > 0) {
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text('Amount Paid:', totalsX, y);
    doc.text(`₹${invoice.amountPaid.toLocaleString('en-IN')}`, valuesX, y, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(invoice.balanceDue > 0 ? 220 : 16, invoice.balanceDue > 0 ? 38 : 185, invoice.balanceDue > 0 ? 38 : 129);
    doc.text('Balance Due:', totalsX, y);
    doc.text(`₹${invoice.balanceDue.toLocaleString('en-IN')}`, valuesX, y, { align: 'right' });
  }

  // Bank & UPI Section
  const paymentBoxY = Math.max(y + 15, 220);
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, paymentBoxY, 180, 42, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('PAYMENT METHODS & BANK DETAILS', 20, paymentBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Bank Name: ${settings?.bankDetails.bankName || 'HDFC Bank Ltd'}`, 20, paymentBoxY + 14);
  doc.text(`Account Name: ${settings?.bankDetails.accountName || 'Vortex Creative Labs'}`, 20, paymentBoxY + 19);
  doc.text(`Account No: ${settings?.bankDetails.accountNumber || '50200067891234'}`, 20, paymentBoxY + 24);
  doc.text(`IFSC Code: ${settings?.bankDetails.ifsc || 'HDFC0000240'}`, 20, paymentBoxY + 29);
  doc.text(`UPI ID / VPA: ${settings?.upiId || 'sourav.vortex@okhdfcbank'}`, 20, paymentBoxY + 34);

  // Digital Signature
  doc.text('Authorized Signatory:', 140, paymentBoxY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(settings?.ownerName || 'Sourav Roy', 140, paymentBoxY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Creative Director, Vortex', 140, paymentBoxY + 33);

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('This is a computer generated invoice from Vortex Creative CRM. Thank you for your partnership!', 105, 285, { align: 'center' });

  // Trigger Download
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function generatePaymentReceiptPDF(payment: Payment, settings?: StudioSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald success color
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL PAYMENT RECEIPT', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.studioName || 'VORTEX CREATIVE LABS', 15, 23);

  doc.setFontSize(11);
  doc.text(`Receipt Ref: ${payment.transactionRef}`, 195, 20, { align: 'right' });

  let y = 48;
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(15, y, 180, 50, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('PAYMENT CONFIRMATION', 22, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Received From: ${payment.clientCompany} (${payment.clientName})`, 22, y + 16);
  doc.text(`Invoice Reference: ${payment.invoiceNumber}`, 22, y + 22);
  doc.text(`Payment Mode: ${payment.mode}`, 22, y + 28);
  doc.text(`Transaction / UTR: ${payment.transactionRef}`, 22, y + 34);
  doc.text(`Date & Time: ${payment.date} at ${payment.time}`, 22, y + 40);

  // Large Amount Display
  y += 62;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(15, y, 180, 25, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text('AMOUNT RECEIVED IN FULL / PARTIAL:', 22, y + 10);
  doc.setFontSize(18);
  doc.text(`₹${payment.amount.toLocaleString('en-IN')}`, 22, y + 19);

  // Studio Seal / Sign
  y += 40;
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(`Issued by: ${settings?.studioName || 'Vortex Creative Labs'}`, 15, y);
  doc.text(`GSTIN: ${settings?.gstin || '29ABCDE1234F1Z5'}`, 15, y + 6);
  doc.text('Authorized Digital Receipt Stamp - No physical signature required.', 15, y + 12);

  doc.save(`Receipt_${payment.transactionRef}.pdf`);
}

