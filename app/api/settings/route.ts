import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const db = getDatabase();

  // Calculate the true next invoice sequence number from all existing invoices
  const maxExistingSeq = db.invoices.reduce((max, inv) => {
    const match = inv.invoiceNumber?.match(/(\d+)$/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      return parsed > max ? parsed : max;
    }
    return max;
  }, 0);
  const trueNextNumber = Math.max(db.settings.invoiceNextNumber || 109, maxExistingSeq + 1);
  db.settings.invoiceNextNumber = trueNextNumber;

  // If client, return public branding and bank settings only
  if (session && session.role === 'CLIENT') {
    return NextResponse.json({
      settings: {
        studioName: db.settings.studioName,
        tagline: db.settings.tagline,
        ownerName: db.settings.ownerName,
        email: db.settings.email,
        phone: db.settings.phone,
        whatsapp: db.settings.whatsapp,
        website: db.settings.website,
        address: db.settings.address,
        gstin: db.settings.gstin,
        currency: db.settings.currency,
        currencySymbol: db.settings.currencySymbol,
        logoUrl: db.settings.logoUrl,
        upiId: db.settings.upiId,
        bankDetails: db.settings.bankDetails,
        theme: db.settings.theme,
      },
    });
  }

  // Admin gets full settings
  return NextResponse.json({ settings: db.settings });
}

export async function PUT(request: Request) {
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

    db.settings = {
      ...db.settings,
      ...body,
    };

    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: 'ADMIN',
      action: 'Settings Updated',
      details: 'Updated studio profile, financial preferences and invoice configuration',
    });

    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
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
    if (body.action === 'export') {
      const db = getDatabase();
      return NextResponse.json({ success: true, backup: db });
    }

    if (body.action === 'restore' && body.data) {
      saveDatabase(body.data);
      return NextResponse.json({ success: true, message: 'Database restored successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
