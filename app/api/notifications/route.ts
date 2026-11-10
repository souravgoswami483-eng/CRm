import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get('recipientId') || 'ADMIN';

  const db = getDatabase();
  const notifications = db.notifications.filter(
    (n) => n.recipientId === recipientId || (recipientId === 'ADMIN' && n.recipientId === 'ADMIN')
  );

  return NextResponse.json({ notifications });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    if (body.markAllRead) {
      db.notifications.forEach((n) => {
        if (n.recipientId === (body.recipientId || 'ADMIN')) {
          n.read = true;
        }
      });
    } else if (body.id) {
      const n = db.notifications.find((item) => item.id === body.id);
      if (n) n.read = true;
    }

    saveDatabase(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

