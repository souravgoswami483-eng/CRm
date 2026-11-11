import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const logView = searchParams.get('view') === 'true';

  const db = getDatabase();
  const invoice = db.invoices.find((i) => i.id === params.id || i.invoiceNumber === params.id);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Scoping check for client
  if (session.role === 'CLIENT') {
    if (
      invoice.clientId !== session.userId &&
      invoice.clientId !== session.clientId &&
      invoice.clientEmail?.toLowerCase() !== session.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this invoice' }, { status: 403 });
    }
  }

  if (logView && invoice.status === 'Sent') {
    invoice.status = 'Viewed';
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'Invoice Viewed',
      details: `${session.name} viewed invoice ${invoice.invoiceNumber}`,
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

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
      const maxExistingSeq = db.invoices.reduce((max, inv) => {
        const match = inv.invoiceNumber?.match(/(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          return parsed > max ? parsed : max;
        }
        return max;
      }, 0);
      const nextNum = Math.max((db.settings.invoiceNextNumber || 109), maxExistingSeq + 1);
      const invoiceNumber = `INV-${year}-${nextNum.toString().padStart(4, '0')}`;
      db.settings.invoiceNextNumber = nextNum + 1;

      currentInv.isEstimate = false;
      currentInv.invoiceNumber = invoiceNumber;
      currentInv.status = 'Sent';

      recordActivity({
        userId: session.userId,
        userName: session.name,
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
      id: currentInv.id,
      invoiceNumber: currentInv.invoiceNumber, // Preserve invoiceNumber
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
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  const db = getDatabase();
  const invoice = db.invoices.find((i) => i.id === params.id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  db.invoices = db.invoices.filter((i) => i.id !== params.id);
  saveDatabase(db);

  recordActivity({
    userId: session.userId,
    userName: session.name,
    userRole: 'ADMIN',
    action: 'Invoice Deleted',
    details: `Deleted invoice ${invoice.invoiceNumber} (${invoice.clientCompany})`,
  });

  return NextResponse.json({ success: true });
}
