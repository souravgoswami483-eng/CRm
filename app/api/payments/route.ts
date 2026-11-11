import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { Payment } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedClientId = searchParams.get('clientId');
  const invoiceId = searchParams.get('invoiceId');
  const mode = searchParams.get('mode');

  const db = getDatabase();
  let payments = [...db.payments];

  // Scoping: Clients only see their own payments
  if (session.role === 'CLIENT') {
    payments = payments.filter(
      (p) => p.clientId === session.userId || p.clientId === session.clientId
    );
  } else {
    // Admin filtering
    if (requestedClientId) {
      payments = payments.filter(
        (p) => p.clientId === requestedClientId || p.clientId === `CL-${requestedClientId}`
      );
    }
  }

  if (invoiceId) {
    payments = payments.filter((p) => p.invoiceId === invoiceId);
  }

  if (mode) {
    payments = payments.filter((p) => p.mode === mode);
  }

  // Sort payment ledger newest first (Task 2 rule)
  payments.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  // Financial summary - Count ONLY payments with status Completed (Cleared) in revenue (Task 2 rule)
  // Rejected and Pending Confirmation payments must NEVER count towards revenue
  const relevantInvoices =
    session.role === 'CLIENT'
      ? db.invoices.filter((i) => i.clientId === session.userId || i.clientId === session.clientId)
      : db.invoices;

  const relevantPayments =
    session.role === 'CLIENT'
      ? db.payments.filter((p) => p.clientId === session.userId || p.clientId === session.clientId)
      : db.payments;

  const totalReceived = relevantPayments
    .filter((p) => p.status === 'Completed')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalPending = relevantInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  const overdueAmount = relevantInvoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  const pendingConfirmations = relevantPayments.filter((p) => p.status === 'Pending Confirmation');
  const pendingConfirmationsTotal = pendingConfirmations.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Client-wise outstanding breakdown (for Admin)
  const clientOutstanding =
    session.role === 'ADMIN'
      ? db.clients.map((c) => {
          const clientInvoices = db.invoices.filter((i) => i.clientId === c.id || i.clientId === c.clientId);
          const pending = clientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
          const paid = clientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
          const pendingClientPayments = db.payments.filter(
            (p) => (p.clientId === c.id || p.clientId === c.clientId) && p.status === 'Pending Confirmation'
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
        })
      : [];

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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();

    const invoice = db.invoices.find((i) => i.id === body.invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Scoping check for client
    if (session.role === 'CLIENT') {
      if (invoice.clientId !== session.userId && invoice.clientId !== session.clientId) {
        return NextResponse.json({ error: 'Forbidden: You cannot pay an invoice that does not belong to you' }, { status: 403 });
      }
    }

    const paymentAmount = Number(body.amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const now = new Date();
    const dateStr = body.date || now.toISOString().substring(0, 10);
    const timeStr = body.time || now.toTimeString().substring(0, 8);
    const isClient = session.role === 'CLIENT';

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
      confirmedBy: isClient ? undefined : session.name,
      confirmedAt: isClient ? undefined : now.toISOString(),
      createdAt: now.toISOString(),
    };

    db.payments.unshift(newPayment);

    if (isClient) {
      // NOTE: Do NOT deduct invoice balance yet!
      // Only deducted when Admin authenticates and clears it.
      saveDatabase(db);

      recordActivity({
        userId: session.userId,
        userName: session.name,
        userRole: 'CLIENT',
        action: 'Payment Confirmation Requested',
        details: `${session.name} (${invoice.clientCompany}) submitted ₹${paymentAmount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}. Awaiting admin authentication.`,
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
      // Unlock files automatically when linked invoice is Paid (Task 2 rule)
      db.files.forEach((f) => {
        if ((invoice.projectId && f.projectId === invoice.projectId) || f.clientId === invoice.clientId) {
          f.downloadAllowed = true;
          f.isWatermarked = false;
        }
      });
    } else if (newAmountPaid > 0) {
      invoice.status = 'Partially Paid';
    }

    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admin can authenticate or reject payments' }, { status: 403 });
    }

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

    if (action === 'approve') {
      payment.status = 'Completed';
      payment.confirmedBy = session.name;
      payment.confirmedAt = new Date().toISOString();

      // Deduct balance from invoice now
      const newAmountPaid = (invoice.amountPaid || 0) + payment.amount;
      const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);
      invoice.amountPaid = newAmountPaid;
      invoice.balanceDue = newBalanceDue;

      if (newBalanceDue === 0) {
        invoice.status = 'Paid';
        // Unlock files automatically when linked invoice is Paid (Task 2 rule)
        db.files.forEach((f) => {
          if (f.projectId === invoice.projectId || f.clientId === invoice.clientId) {
            f.downloadAllowed = true;
            f.isWatermarked = false;
          }
        });
      } else if (newAmountPaid > 0) {
        invoice.status = 'Partially Paid';
      }

      saveDatabase(db);

      recordActivity({
        userId: session.userId,
        userName: session.name,
        userRole: 'ADMIN',
        action: 'Payment Authenticated & Approved',
        details: `Authenticated client payment of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}. Remaining balance: ₹${newBalanceDue.toLocaleString('en-IN')}`,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
      });

      addNotification({
        recipientId: invoice.clientId,
        title: 'Payment Confirmed! ✅',
        message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for invoice ${invoice.invoiceNumber} has been authenticated by Studio Admin.`,
        type: 'payment',
        link: `/portal/invoices?id=${invoice.id}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified, authenticated, and invoice balance updated.',
        payment,
        invoice,
      });
    } else if (action === 'reject') {
      payment.status = 'Rejected';
      payment.confirmedBy = `${session.name} (Rejected)`;
      payment.confirmedAt = new Date().toISOString();
      saveDatabase(db);

      recordActivity({
        userId: session.userId,
        userName: session.name,
        userRole: 'ADMIN',
        action: 'Payment Request Rejected',
        details: `Admin rejected payment request of ₹${payment.amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}`,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
      });

      addNotification({
        recipientId: invoice.clientId,
        title: 'Payment Verification Unsuccessful ⚠️',
        message: `Your payment request of ₹${payment.amount.toLocaleString('en-IN')} for invoice ${invoice.invoiceNumber} could not be verified. Please check with your bank or re-submit.`,
        type: 'payment',
        link: `/portal/invoices?id=${invoice.id}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment request marked as rejected.',
        payment,
        invoice,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update payment' }, { status: 500 });
  }
}
