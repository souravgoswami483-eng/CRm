import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, sanitizeClient } from '@/lib/db';
import { getSessionFromRequest, generateOneTimePassword, hashPassword } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const db = getDatabase();
  const client = db.clients.find((c) => c.id === params.id || c.clientId === params.id);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // If role is CLIENT, they can ONLY view their own client profile
  if (session.role === 'CLIENT') {
    if (client.id !== session.userId && client.clientId !== session.clientId && client.email !== session.email) {
      return NextResponse.json({ error: 'Forbidden: Access denied to other client records' }, { status: 403 });
    }
  }

  const projects = db.projects.filter((p) => p.clientId === client.id || p.clientId === client.clientId);
  const invoices = db.invoices.filter((i) => i.clientId === client.id || i.clientId === client.clientId);
  const payments = db.payments.filter((p) => p.clientId === client.id || p.clientId === client.clientId);
  const files = db.files.filter((f) => f.clientId === client.id || f.clientId === client.clientId);
  const activities = db.activities.filter((a) => a.clientId === client.id || a.clientId === client.clientId);

  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const balanceDue = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  return NextResponse.json({
    client: {
      ...sanitizeClient(client),
      totalBilled,
      totalPaid,
      balanceDue,
    },
    projects,
    invoices,
    payments,
    files,
    activities,
  });
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
    const index = db.clients.findIndex((c) => c.id === params.id || c.clientId === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Preserve non-editable fields (clientId, passwordHash, id)
    const existing = db.clients[index];

    // Handle password reset action if requested
    let oneTimePassword: string | undefined;
    if (body.action === 'resetPassword') {
      oneTimePassword = generateOneTimePassword();
      existing.passwordHash = hashPassword(oneTimePassword);
      existing.mustChangePassword = true;
    }

    // Clean body so sensitive or immutable fields cannot be injected
    const { id, clientId, passwordHash, tempPassword, action, ...allowedUpdates } = body;

    db.clients[index] = {
      ...existing,
      ...allowedUpdates,
      id: existing.id,
      clientId: existing.clientId,
      passwordHash: existing.passwordHash,
      mustChangePassword: existing.mustChangePassword,
    };

    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: 'ADMIN',
      action: oneTimePassword ? 'Client Password Reset' : 'Client Updated',
      details: oneTimePassword
        ? `Reset password for client ${existing.name} (${existing.companyName})`
        : `Updated details for ${existing.name} (${existing.companyName})`,
      clientId: existing.id,
    });

    return NextResponse.json({
      success: true,
      client: sanitizeClient(db.clients[index]),
      ...(oneTimePassword ? { oneTimePassword } : {}),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 });
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
  const client = db.clients.find((c) => c.id === params.id || c.clientId === params.id);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  db.clients = db.clients.filter((c) => c.id !== client.id && c.clientId !== client.clientId);
  saveDatabase(db);

  recordActivity({
    userId: session.userId,
    userName: session.name,
    userRole: 'ADMIN',
    action: 'Client Deleted',
    details: `Deleted client ${client.name} (${client.companyName})`,
  });

  return NextResponse.json({ success: true });
}
