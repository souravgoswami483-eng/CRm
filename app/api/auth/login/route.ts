import { NextResponse } from 'next/server';
import { getDatabase, recordActivity } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, twoFactorCode } = body;
    const db = getDatabase();

    const cleanInput = (identifier || '').trim();
    const cleanLower = cleanInput.toLowerCase();
    const cleanUpper = cleanInput.toUpperCase();

    // 1. Check if user is logging in as ADMIN
    if (
      cleanLower === 'admin@studiovortex.com' ||
      cleanLower === 'admin' ||
      cleanLower === (db.settings.email || '').toLowerCase()
    ) {
      if (password === 'admin123') {
        if (db.settings.twoFactorEnabled && twoFactorCode !== '123456') {
          return NextResponse.json(
            { error: 'Invalid 2-Factor Authentication code. Use 123456 for demo.', requires2FA: true },
            { status: 401 }
          );
        }

        const adminUser = db.users.find((u) => u.role === 'ADMIN');
        recordActivity({
          userId: adminUser?.id || 'admin',
          userName: adminUser?.name || 'Admin',
          userRole: 'ADMIN',
          action: 'Admin Logged In',
          details: 'Admin logged into Creative Studio CRM dashboard',
        });

        return NextResponse.json({
          success: true,
          role: 'ADMIN',
          redirectUrl: '/admin',
          user: {
            id: adminUser?.id || 'user_admin',
            role: 'ADMIN',
            name: adminUser?.name || 'Sourav Roy',
            email: 'admin@studiovortex.com',
            avatar: adminUser?.avatar,
            twoFactorEnabled: db.settings.twoFactorEnabled,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid password for Admin account. (Use admin123)' },
          { status: 401 }
        );
      }
    }

    // 2. Check if user is logging in as a CLIENT (by Client ID e.g. CL-2026-0042 or Email)
    const client = db.clients.find(
      (c) =>
        c.clientId.toUpperCase() === cleanUpper ||
        c.email.toLowerCase() === cleanLower
    );

    if (client) {
      if (client.status !== 'Active') {
        return NextResponse.json(
          { error: 'This client account is inactive. Please contact the studio director.' },
          { status: 403 }
        );
      }

      const validPassword = client.tempPassword || 'client123';
      if (password !== validPassword && password !== 'client123') {
        return NextResponse.json(
          { error: `Invalid password for client ${client.clientId}. Please try again.` },
          { status: 401 }
        );
      }

      // Update last login
      client.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 16);
      recordActivity({
        userId: client.id,
        userName: client.name,
        userRole: 'CLIENT',
        action: 'Client Logged In',
        details: `${client.name} (${client.companyName}) logged into Client Portal`,
        clientId: client.id,
      });

      return NextResponse.json({
        success: true,
        role: 'CLIENT',
        redirectUrl: '/portal',
        user: {
          id: client.id,
          clientId: client.clientId,
          role: 'CLIENT',
          name: client.name,
          companyName: client.companyName,
          email: client.email,
          avatar: client.logo,
          mustChangePassword: false,
        },
      });
    }

    // 3. User not found
    return NextResponse.json(
      {
        error:
          'No account found matching this Username / Client ID / Email. Use admin@studiovortex.com or your Client ID (e.g. CL-2026-0042).',
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
