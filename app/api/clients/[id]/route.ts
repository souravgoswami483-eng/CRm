import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const client = db.clients.find((c) => c.id === params.id || c.clientId === params.id);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const projects = db.projects.filter((p) => p.clientId === client.id);
  const invoices = db.invoices.filter((i) => i.clientId === client.id);
  const payments = db.payments.filter((p) => p.clientId === client.id);
  const files = db.files.filter((f) => f.clientId === client.id);
  const activities = db.activities.filter((a) => a.clientId === client.id);

  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const balanceDue = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  return NextResponse.json({
    client: {
      ...client,
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
    const body = await request.json();
    const db = getDatabase();
    const index = db.clients.findIndex((c) => c.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Preserve non-editable Unique Client ID
    const currentClientId = db.clients[index].clientId;
    db.clients[index] = {
      ...db.clients[index],
      ...body,
      clientId: currentClientId,
    };

    saveDatabase(db);

    recordActivity({
      userId: 'user_admin',
      userName: 'Sourav Roy',
      userRole: 'ADMIN',
      action: 'Client Updated',
      details: `Updated details for ${db.clients[index].name} (${db.clients[index].companyName})`,
      clientId: db.clients[index].id,
    });

    return NextResponse.json({ success: true, client: db.clients[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const client = db.clients.find((c) => c.id === params.id);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  db.clients = db.clients.filter((c) => c.id !== params.id);
  saveDatabase(db);

  recordActivity({
    userId: 'user_admin',
    userName: 'Sourav Roy',
    userRole: 'ADMIN',
    action: 'Client Deleted',
    details: `Deleted client ${client.name} (${client.companyName})`,
  });

  return NextResponse.json({ success: true });
}

