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

  // Financial summary - only consider Completed payments as confirmed received
  const totalReceived = db.payments
    .filter((p) => (p.status || 'Completed') === 'Completed')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalPending = db.invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  const overdueAmount = db.invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  const pendingConfirmations = db.payments.filter((p) => p.status === 'Pending Confirmation');
  const pendingConfirmationsTotal = pendingConfirmations.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Client-wise outstanding breakdown
  const clientOutstanding = db.clients.map((c) => {
    const clientInvoices = db.invoices.filter((i) => i.clientId === c.id);
    const pending = clientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
    const paid = clientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const pendingClientPayments = db.payments.filter(
      (p) => p.clientId === c.id && p.status === 'Pending Confirmation'
    );
    return {
      clientId: c.id,
      clientCode: c.clientId,
      name: c.name,
      companyName: c.companyName,
      pending,
      paid,
      pendingVerificationCount: pendingClientPayments.length,
      pendingVerificationAmount: pendingClientPayments.reduce((acc, p) => acc + (p.amount || 0), 0),
    };
  });

  return NextResponse.json({
    payments,
    summary: {
      totalReceived,
      totalPending,
      overdueAmount,
      pendingConfirmationsCount: pendingConfirmations.length,
      pendingConfirmationsTotal,
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
    const isClient = body.recordedByRole === 'CLIENT';

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
      notes: body.notes || (isClient ? 'Client submitted payment request' : 'Payment recorded by Admin'),
      status: isClient ? 'Pending Confirmation' : 'Completed',
      confirmedBy: isClient ? undefined : (body.recordedByName || 'Sourav Roy (Studio Director)'),
      confirmedAt: isClient ? undefined : now.toISOString(),
      createdAt: now.toISOString(),
    };

    db.payments.unshift(newPayment);

    if (isClient) {
      // NOTE: Do NOT deduct invoice balance yet!
      // It will only be deducted when Admin authenticates and approves it.
      saveDatabase(db);

      recordActivity({
        userId: body.recordedBy || invoice.clientId,
        userName: body.recordedByName || invoice.clientName,
        userRole: 'CLIENT',
        action: 'Payment Confirmation Requested',
        details: `${invoice.clientName} (${invoice.clientCompany}) submitted ₹${paymentAmount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}. Awaiting admin authentication.`,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
      });

      addNotification({
        recipientId: 'ADMIN',
        title: 'Payment Confirmation Requested 🔔',
        message: `${invoice.clientCompany} submitted ₹${paymentAmount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}. Action required: Verify and authenticate.`,
        type: 'payment',
        link: `/admin/payments`,
      });

      return NextResponse.json({
        success: true,
        payment: newPayment,
        pendingConfirmation: true,
        message: 'Payment confirmation requested. Waiting for admin authentication.',
      });
    }

    // If recorded by ADMIN, complete immediately
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
      userRole: 'ADMIN',
      action: 'Payment Recorded',
      details: `Recorded ₹${paymentAmount.toLocaleString('en-IN')} payment for ${invoice.invoiceNumber} (${body.mode || 'UPI'})`,
      clientId: invoice.clientId,
      projectId: invoice.projectId,
    });

    addNotification({
      recipientId: invoice.clientId,
      title: 'Payment Receipt Issued',
      message: `Your payment of ₹${paymentAmount.toLocaleString('en-IN')} for ${invoice.invoiceNumber} has been verified and confirmed.`,
      type: 'payment',
      link: `/portal/invoices?id=${invoice.id}`,
    });

    return NextResponse.json({ success: true, payment: newPayment, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, action } = body; // action: 'approve' | 'reject'
    const db = getDatabase();

    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const invoice = db.invoices.find((i) => i.id === payment.invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'approve') {
      payment.status = 'Completed';
      payment.confirmedBy = body.adminName || 'Sourav Roy (Studio Director)';
      payment.confirmedAt = now.toISOString();

      // NOW deduct the balance and complete the pending amount!
      const newAmountPaid = (invoice.amountPaid || 0) + payment.amount;
      const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);

      invoice.amountPaid = newAmountPaid;
      invoice.balanceDue = newBalanceDue;

      if (newBalanceDue === 0) {
        invoice.status = 'Paid';
      } else {
        invoice.status = 'Partially Paid';
      }

      saveDatabase(db);

      recordActivity({
        userId: 'user_admin',
        userName: body.adminName || 'Sourav Roy',
        userRole: 'ADMIN',
        action: 'Payment Authenticated',
        details: `Authenticated & confirmed payment of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber} (${payment.clientCompany})`,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
      });

      addNotification({
        recipientId: payment.clientId,
        title: 'Payment Confirmed & Authenticated! ✅',
        message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber} has been authenticated by Studio Director Sourav Roy. Balance updated.`,
        type: 'payment',
        link: `/portal/invoices`,
      });

      return NextResponse.json({
        success: true,
        payment,
        invoice,
        message: 'Payment successfully authenticated and invoice updated.',
      });
    } else if (action === 'reject') {
      payment.status = 'Rejected';
      saveDatabase(db);

      recordActivity({
        userId: 'user_admin',
        userName: body.adminName || 'Sourav Roy',
        userRole: 'ADMIN',
        action: 'Payment Rejected',
        details: `Rejected unverified payment submission of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}`,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
      });

      addNotification({
        recipientId: payment.clientId,
        title: 'Payment Verification Notice ⚠️',
        message: `Your payment submission of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber} (Ref: ${payment.transactionRef}) could not be verified. Please check UTR or contact admin.`,
        type: 'payment',
        link: `/portal/invoices`,
      });

      return NextResponse.json({ success: true, payment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to authenticate payment' }, { status: 500 });
  }
}
