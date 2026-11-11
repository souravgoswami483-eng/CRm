import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification, sanitizeClient } from '@/lib/db';
import { getSessionFromRequest, generateOneTimePassword, hashPassword } from '@/lib/auth-server';
import { isValidEmail, isValidPhone, isValidGSTIN, isValidName } from '@/lib/validators';
import { Client, User } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  // Only Admin is allowed to list all clients
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

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

  // Calculate client financial totals dynamically, and strictly SANITIZE (no passwords)
  const clientsWithStats = clients.map((client) => {
    const clientInvoices = db.invoices.filter(
      (i) => i.clientId === client.id || i.clientId === client.clientId
    );
    const totalBilled = clientInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const totalPaid = clientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const balanceDue = clientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
    const projectCount = db.projects.filter(
      (p) => p.clientId === client.id || p.clientId === client.clientId
    ).length;

    const sanitized = sanitizeClient(client);

    return {
      ...sanitized,
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const body = await request.json();
    if (!isValidName(body.name, 2)) {
      return NextResponse.json({ error: 'Client contact person name must be at least 2 characters.' }, { status: 400 });
    }
    if (!isValidName(body.companyName, 2)) {
      return NextResponse.json({ error: 'Brand / company name must be at least 2 characters.' }, { status: 400 });
    }
    if (!isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Please enter a valid email address (e.g. client@company.com).' }, { status: 400 });
    }
    if (!isValidPhone(body.phone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number (digits only, e.g. +91 98765 43210).' }, { status: 400 });
    }
    if (body.gstin && !isValidGSTIN(body.gstin)) {
      return NextResponse.json({ error: 'Invalid GSTIN format (must be 15 alphanumeric characters).' }, { status: 400 });
    }

    const db = getDatabase();

    // Auto-generate unique Client ID: CL-2026-XXXX
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedClientId = `CL-${year}-${randomDigits}`;

    // Generate random one-time password
    const oneTimePassword = generateOneTimePassword();
    const passwordHash = hashPassword(oneTimePassword);

    const newClient: Client = {
      id: `client_${Date.now()}`,
      clientId: generatedClientId,
      name: body.name.trim(),
      companyName: body.companyName.trim(),
      logo: body.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: body.email.trim().toLowerCase(),
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
      passwordHash,
      mustChangePassword: true,
    };

    // Also register user representation
    const newUser: User = {
      id: `user_${newClient.id}`,
      role: 'CLIENT',
      name: newClient.name,
      email: newClient.email,
      clientId: newClient.clientId,
      companyName: newClient.companyName,
      avatar: newClient.logo,
      mustChangePassword: true,
      passwordHash,
    };

    db.clients.unshift(newClient);
    db.users.push(newUser);
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
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

    // Return the sanitized client, with oneTimePassword ONLY shown once on creation
    return NextResponse.json({
      client: sanitizeClient(newClient),
      oneTimePassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
