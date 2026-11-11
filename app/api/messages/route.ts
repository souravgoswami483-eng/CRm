import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { ChatMessage } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const requestedClientId = searchParams.get('clientId');

  const db = getDatabase();
  let messages = [...db.messages];

  // Scoping: Clients only see messages where they are sender or recipient
  if (session.role === 'CLIENT') {
    messages = messages.filter(
      (m) =>
        m.senderId === session.userId ||
        m.senderId === session.clientId ||
        m.recipientId === session.userId ||
        m.recipientId === session.clientId
    );
  } else {
    // Admin filtering
    if (projectId) {
      messages = messages.filter((m) => m.projectId === projectId);
    } else if (requestedClientId) {
      messages = messages.filter(
        (m) => m.senderId === requestedClientId || m.recipientId === requestedClientId
      );
    }
  }

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();

    const isClient = session.role === 'CLIENT';
    const recipientId = isClient ? 'user_admin' : (body.recipientId || 'client');

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: body.projectId,
      senderId: session.userId,
      senderName: session.name,
      senderRole: session.role,
      recipientId,
      message: (body.message || '').trim(),
      attachments: body.attachments || [],
      createdAt: new Date().toISOString(),
    };

    db.messages.push(newMessage);
    saveDatabase(db);

    addNotification({
      recipientId: isClient ? 'ADMIN' : newMessage.recipientId,
      title: `Message from ${session.name}`,
      message: newMessage.message.substring(0, 60),
      type: 'comment',
      link: isClient ? `/admin/messages` : `/portal/messages`,
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
