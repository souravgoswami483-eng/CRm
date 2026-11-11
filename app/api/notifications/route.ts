import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const db = getDatabase();
  let notifications = [...db.notifications];

  if (session.role === 'CLIENT') {
    notifications = notifications.filter(
      (n) => n.recipientId === session.userId || n.recipientId === session.clientId
    );
  } else {
    notifications = notifications.filter((n) => n.recipientId === 'ADMIN');
  }

  // Sort newest first (Task 2 rule)
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ notifications });
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();

    if (body.markAllRead) {
      db.notifications.forEach((n) => {
        const matchesUser =
          session.role === 'ADMIN'
            ? n.recipientId === 'ADMIN'
            : n.recipientId === session.userId || n.recipientId === session.clientId;
        if (matchesUser) {
          n.read = true;
        }
      });
    } else if (body.id) {
      const n = db.notifications.find((item) => item.id === body.id);
      if (n) {
        n.read = true;
      }
    }

    saveDatabase(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
