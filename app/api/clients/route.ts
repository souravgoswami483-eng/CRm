import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { Client } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const status = searchParams.get('status') || '';
  const tag = searchParams.get('tag') || '';

  const db = getDatabase();
  let clients = [...db.clients];

  if (q) {
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  if (status) {
    clients = clients.filter((c) => c.status === status);
  }

  if (tag) {
    clients = clients.filter((c) => c.tags.includes(tag as any));
  }

  // Calculate client financial totals dynamically
  const clientsWithStats = clients.map((client) => {
    const clientInvoices = db.invoices.filter((i) => i.clientId === client.id);
    const totalBilled = clientInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const totalPaid = clientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const balanceDue = clientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
    const projectCount = db.projects.filter((p) => p.clientId === client.id).length;

    return {
      ...client,
      totalBilled,
      totalPaid,
      balanceDue,
      projectCount,
    };
  });

  return NextResponse.json({ clients: clientsWithStats });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    // Auto-generate unique Client ID: CL-2026-XXXX
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedClientId = `CL-${year}-${randomDigits}`;

    const newClient: Client = {
      id: `client_${Date.now()}`,
      clientId: generatedClientId,
      name: body.name || 'New Client',
      companyName: body.companyName || 'Studio Partner',
      logo: body.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: body.email,
      phone: body.phone || '',
      whatsapp: body.whatsapp || body.phone || '',
      address: body.address || '',
      gstin: body.gstin || '',
      industry: body.industry || 'Creative & Media',
      source: body.source || 'Direct',
      notes: body.notes || '',
      tags: body.tags && body.tags.length > 0 ? body.tags : ['One-time'],
      dateAdded: new Date().toISOString().substring(0, 10),
      status: 'Active',
      tempPassword: body.tempPassword || `client${Math.floor(100 + Math.random() * 900)}`,
    };

    db.clients.unshift(newClient);
    saveDatabase(db);

    recordActivity({
      userId: 'user_admin',
      userName: 'Sourav Roy',
      userRole: 'ADMIN',
      action: 'Client Created',
      details: `Created new client: ${newClient.name} (${newClient.companyName}) with ID ${newClient.clientId}`,
      clientId: newClient.id,
    });

    addNotification({
      recipientId: 'ADMIN',
      title: 'New Client Onboarded',
      message: `${newClient.name} (${newClient.companyName}) was onboarded with ID ${newClient.clientId}`,
      type: 'system',
      link: `/admin/clients`,
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 });
  }
}

