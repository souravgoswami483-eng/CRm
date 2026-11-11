import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { getDatabase, sanitizeClient, sanitizeUser } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    const db = getDatabase();

    if (session.role === 'ADMIN') {
      const adminUser = db.users.find((u) => u.id === session.userId || u.role === 'ADMIN');
      return NextResponse.json({
        authenticated: true,
        user: adminUser ? sanitizeUser(adminUser) : {
          id: session.userId,
          role: 'ADMIN',
          name: session.name,
          email: session.email,
        },
      });
    } else {
      const client = db.clients.find(
        (c) => c.id === session.userId || c.clientId === session.clientId || c.email === session.email
      );
      if (!client || client.status !== 'Active') {
        return NextResponse.json({ error: 'Client account inactive or not found' }, { status: 403 });
      }

      return NextResponse.json({
        authenticated: true,
        user: sanitizeClient(client),
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Session verification failed' }, { status: 500 });
  }
}
