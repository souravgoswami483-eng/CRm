import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const logView = searchParams.get('view') === 'true';

  const db = getDatabase();
  const invoice = db.invoices.find((i) => i.id === params.id || i.invoiceNumber === params.id);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (logView && invoice.status === 'Sent') {
    invoice.status = 'Viewed';
    saveDatabase(db);

    recordActivity({
      userId: invoice.clientId,
      userName: invoice.clientName,
      userRole: 'CLIENT',
      action: 'Invoice Viewed',
      details: `${invoice.clientName} viewed invoice ${invoice.invoiceNumber}`,
      clientId: invoice.clientId,
    });
  }

  const payments = db.payments.filter((p) => p.invoiceId === invoice.id || p.invoiceNumber === invoice.invoiceNumber);

  return NextResponse.json({ invoice, payments });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = getDatabase();
    const index = db.invoices.findIndex((i) => i.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentInv = db.invoices[index];

    // If converting an estimate into an invoice
    if (body.convertToInvoice) {
      const year = new Date().getFullYear();
      const nextNum = db.settings.invoiceNextNumber || 109;
      const invoiceNumber = `INV-${year}-${nextNum.toString().padStart(4, '0')}`;
      db.settings.invoiceNextNumber = nextNum + 1;

      currentInv.isEstimate = false;
      currentInv.invoiceNumber = invoiceNumber;
      currentInv.status = 'Sent';

      recordActivity({
        userId: 'user_admin',
        userName: 'Sourav Roy',
        userRole: 'ADMIN',
        action: 'Estimate Converted to Invoice',
        details: `Converted quotation to ${invoiceNumber} for ${currentInv.clientCompany}`,
        clientId: currentInv.clientId,
      });

      addNotification({
        recipientId: currentInv.clientId,
        title: `Official Invoice Generated: ${invoiceNumber}`,
        message: `Your project estimate has been converted to invoice ${invoiceNumber} (₹${currentInv.total.toLocaleString('en-IN')})`,
        type: 'invoice',
        link: `/portal/invoices?id=${currentInv.id}`,
      });

      saveDatabase(db);
      return NextResponse.json({ success: true, invoice: currentInv });
    }

    // Normal invoice updates
    db.invoices[index] = {
      ...currentInv,
      ...body,
    };

    saveDatabase(db);
    return NextResponse.json({ success: true, invoice: db.invoices[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  db.invoices = db.invoices.filter((i) => i.id !== params.id);
  saveDatabase(db);
  return NextResponse.json({ success: true });
}

