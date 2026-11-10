import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity } from '@/lib/db';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json({ settings: db.settings });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    db.settings = {
      ...db.settings,
      ...body,
    };

    saveDatabase(db);

    recordActivity({
      userId: 'user_admin',
      userName: 'Sourav Roy',
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

