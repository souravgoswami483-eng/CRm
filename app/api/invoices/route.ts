import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { Invoice } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedClientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const isEstimate = searchParams.get('isEstimate');

  const db = getDatabase();
  let invoices = [...db.invoices];

  // Dynamically update Overdue status if due date has passed and balanceDue > 0
  const today = new Date().toISOString().substring(0, 10);
  let updatedAny = false;
  invoices.forEach((inv) => {
    if (inv.balanceDue > 0 && inv.status !== 'Paid' && inv.status !== 'Draft' && inv.status !== 'Cancelled') {
      if (inv.dueDate < today && inv.status !== 'Overdue') {
        inv.status = 'Overdue';
        updatedAny = true;
      }
    }
  });
  if (updatedAny) {
    saveDatabase(db);
  }

  // Strictly enforce client query scoping on server
  if (session.role === 'CLIENT') {
    invoices = invoices.filter(
      (i) =>
        i.clientId === session.userId ||
        i.clientId === session.clientId ||
        i.clientEmail?.toLowerCase() === session.email?.toLowerCase()
    );
  } else {
    // Admin can optionally filter by clientId
    if (requestedClientId) {
      invoices = invoices.filter(
        (i) => i.clientId === requestedClientId || i.clientId === `CL-${requestedClientId}`
      );
    }
  }

  if (status) {
    invoices = invoices.filter((i) => i.status === status);
  }

  if (isEstimate === 'true') {
    invoices = invoices.filter((i) => i.isEstimate === true);
  } else if (isEstimate === 'false') {
    invoices = invoices.filter((i) => !i.isEstimate);
  }

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required to create invoices' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDatabase();

    // Data integrity: Reject any save with empty clientId on the server
    if (!body.clientId || typeof body.clientId !== 'string' || body.clientId.trim() === '') {
      return NextResponse.json({ error: 'Client selection is required. Please select a valid client.' }, { status: 400 });
    }

    const client = db.clients.find(
      (c) => c.id === body.clientId || c.clientId === body.clientId
    );
    if (!client) {
      return NextResponse.json({ error: 'Selected client does not exist in the database.' }, { status: 400 });
    }

    // Auto-generate invoice number using guaranteed monotonic server database sequence
    const year = new Date().getFullYear();
    const maxExistingSeq = db.invoices.reduce((max, inv) => {
      const match = inv.invoiceNumber?.match(/(\d+)$/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        return parsed > max ? parsed : max;
      }
      return max;
    }, 0);

    const currentSettingNext = db.settings.invoiceNextNumber || 109;
    const nextNum = Math.max(currentSettingNext, maxExistingSeq + 1);
    const prefix = body.isEstimate ? `EST-${year}-` : (db.settings.invoicePrefix || `INV-${year}-`);
    const invoiceNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;
    db.settings.invoiceNextNumber = nextNum + 1;

    // Calculate line item totals
    const items = (body.items || []).map((item: any, idx: number) => ({
      id: item.id || `item_${Date.now()}_${idx}`,
      service: item.service || 'Creative Service',
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }));

    const subtotal = items.reduce((acc: number, cur: any) => acc + cur.amount, 0);

    // Calculate discount
    const discountType = body.discountType || 'flat';
    const discountValue = Number(body.discountValue) || 0;
    const discountAmount =
      discountType === 'percentage'
        ? (subtotal * discountValue) / 100
        : discountValue;

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Calculate tax
    const taxType = body.taxType || 'GST (18%)';
    const taxPercent = Number(body.taxPercent) !== undefined ? Number(body.taxPercent) : 18;
    const taxAmount = (discountedSubtotal * taxPercent) / 100;

    const total = Math.round(discountedSubtotal + taxAmount);
    const amountPaid = Number(body.amountPaid) || 0;
    const balanceDue = Math.max(0, total - amountPaid);

    let calculatedStatus = body.status || 'Draft';
    if (balanceDue === 0 && total > 0) {
      calculatedStatus = 'Paid';
    } else if (amountPaid > 0 && balanceDue > 0) {
      calculatedStatus = 'Partially Paid';
    }

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      isEstimate: body.isEstimate || false,
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.companyName,
      clientEmail: client.email,
      clientAddress: client.address || body.clientAddress,
      clientGstin: client.gstin || body.clientGstin,
      projectId: body.projectId || undefined,
      projectTitle: body.projectTitle || undefined,
      date: body.date || new Date().toISOString().substring(0, 10),
      dueDate: body.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
      paymentTerms: body.paymentTerms || db.settings.defaultPaymentTerms || 'Net 15 Days',
      currency: body.currency || db.settings.currency || 'INR',
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxType,
      taxPercent,
      taxAmount,
      total,
      amountPaid,
      balanceDue,
      status: calculatedStatus,
      notes: body.notes || 'Thank you for choosing Vortex Creative Labs for your visual branding needs.',
      terms: body.terms || 'Payment is requested within the due date via UPI or Bank Transfer.',
      bankDetails: {
        ...db.settings.bankDetails,
        upiId: db.settings.upiId,
      },
      isRecurring: body.isRecurring || false,
      recurringInterval: body.recurringInterval || 'Monthly',
      createdAt: new Date().toISOString(),
    };

    db.invoices.unshift(newInvoice);
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: 'ADMIN',
      action: newInvoice.isEstimate ? 'Estimate Created' : 'Invoice Created',
      details: `Generated ${newInvoice.invoiceNumber} for ${newInvoice.clientCompany} - Total: ₹${newInvoice.total.toLocaleString('en-IN')}`,
      clientId: newInvoice.clientId,
      projectId: newInvoice.projectId,
    });

    if (newInvoice.status === 'Sent') {
      addNotification({
        recipientId: newInvoice.clientId,
        title: `New Invoice: ${newInvoice.invoiceNumber}`,
        message: `An invoice of ₹${newInvoice.total.toLocaleString('en-IN')} has been generated. Due: ${newInvoice.dueDate}`,
        type: 'invoice',
        link: `/portal/invoices?id=${newInvoice.id}`,
      });
    }

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create invoice' }, { status: 500 });
  }
}
