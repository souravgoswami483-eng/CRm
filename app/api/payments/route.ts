import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { Payment } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const invoiceId = searchParams.get('invoiceId');
  const mode = searchParams.get('mode');

  const db = getDatabase();
  let payments = [...db.payments];

  if (clientId) {
    payments = payments.filter((p) => p.clientId === clientId);
  }

  if (invoiceId) {
    payments = payments.filter((p) => p.invoiceId === invoiceId);
  }

  if (mode) {
    payments = payments.filter((p) => p.mode === mode);
  }

  // Financial summary
  const totalReceived = db.payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPending = db.invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  const overdueAmount = db.invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  // Client-wise outstanding breakdown
  const clientOutstanding = db.clients.map((c) => {
    const clientInvoices = db.invoices.filter((i) => i.clientId === c.id);
    const pending = clientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
    const paid = clientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    return {
      clientId: c.id,
      clientCode: c.clientId,
      name: c.name,
      companyName: c.companyName,
      pending,
      paid,
    };
  });

  return NextResponse.json({
    payments,
    summary: {
      totalReceived,
      totalPending,
      overdueAmount,
      clientOutstanding,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    const invoice = db.invoices.find((i) => i.id === body.invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const paymentAmount = Number(body.amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const now = new Date();
    const dateStr = body.date || now.toISOString().substring(0, 10);
    const timeStr = body.time || now.toTimeString().substring(0, 8);

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientCompany: invoice.clientCompany,
      amount: paymentAmount,
      currency: invoice.currency || 'INR',
      date: dateStr,
      time: timeStr,
      mode: body.mode || 'UPI',
      transactionRef: body.transactionRef || `REF${Date.now().toString().slice(-8)}`,
      receiptUrl: body.receiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      notes: body.notes || 'Payment recorded',
      createdAt: now.toISOString(),
    };

    db.payments.unshift(newPayment);

    // Update invoice amountPaid and balanceDue
    const newAmountPaid = (invoice.amountPaid || 0) + paymentAmount;
    const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);

    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;

    if (newBalanceDue === 0) {
      invoice.status = 'Paid';
    } else if (newAmountPaid > 0) {
      invoice.status = 'Partially Paid';
    }

    saveDatabase(db);

    recordActivity({
      userId: body.recordedBy || 'user_admin',
      userName: body.recordedByName || 'Sourav Roy',
      userRole: body.recordedByRole || 'ADMIN',
      action: 'Payment Recorded',
      details: `Recorded ₹${paymentAmount.toLocaleString('en-IN')} payment for ${invoice.invoiceNumber} (${body.mode || 'UPI'})`,
      clientId: invoice.clientId,
      projectId: invoice.projectId,
    });

    addNotification({
      recipientId: 'ADMIN',
      title: 'Payment Received! 💰',
      message: `₹${paymentAmount.toLocaleString('en-IN')} received from ${invoice.clientCompany} for ${invoice.invoiceNumber}`,
      type: 'payment',
      link: `/admin/payments`,
    });

    addNotification({
      recipientId: invoice.clientId,
      title: 'Payment Receipt Issued',
      message: `Your payment of ₹${paymentAmount.toLocaleString('en-IN')} for ${invoice.invoiceNumber} has been confirmed.`,
      type: 'payment',
      link: `/portal/invoices?id=${invoice.id}`,
    });

    return NextResponse.json({ success: true, payment: newPayment, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
  }
}

