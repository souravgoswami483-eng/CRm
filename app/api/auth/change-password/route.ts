import { NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword, verifyPassword } from '@/lib/auth-server';
import { getDatabase, saveDatabase, recordActivity } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    if (session.role === 'ADMIN') {
      const adminUser = db.users.find((u) => u.id === session.userId || u.role === 'ADMIN');
      if (!adminUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (currentPassword && adminUser.passwordHash && !verifyPassword(currentPassword, adminUser.passwordHash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      adminUser.passwordHash = hashPassword(newPassword);
      saveDatabase(db);
      recordActivity({
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: 'ADMIN',
        action: 'Password Changed',
        details: 'Admin updated their account password',
      });
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } else {
      const client = db.clients.find(
        (c) => c.id === session.userId || c.clientId === session.clientId || c.email === session.email
      );
      if (!client) {
        return NextResponse.json({ error: 'Client account not found' }, { status: 404 });
      }
      if (currentPassword && client.passwordHash && !verifyPassword(currentPassword, client.passwordHash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      client.passwordHash = hashPassword(newPassword);
      client.mustChangePassword = false;
      saveDatabase(db);
      recordActivity({
        userId: client.id,
        userName: client.name,
        userRole: 'CLIENT',
        action: 'Password Changed',
        details: `${client.name} updated their portal password`,
        clientId: client.id,
      });
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
  }
}
