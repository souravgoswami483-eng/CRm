import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, addNotification } from '@/lib/db';
import { ChatMessage } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const clientId = searchParams.get('clientId');

  const db = getDatabase();
  let messages = [...db.messages];

  if (projectId) {
    messages = messages.filter((m) => m.projectId === projectId);
  } else if (clientId) {
    messages = messages.filter((m) => m.senderId === clientId || m.recipientId === clientId);
  }

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: body.projectId,
      senderId: body.senderId || 'user_admin',
      senderName: body.senderName || 'Sourav Roy',
      senderRole: body.senderRole || 'ADMIN',
      recipientId: body.recipientId || 'client',
      message: body.message || '',
      attachments: body.attachments || [],
      createdAt: new Date().toISOString(),
    };

    db.messages.push(newMessage);
    saveDatabase(db);

    const isClient = newMessage.senderRole === 'CLIENT';
    addNotification({
      recipientId: isClient ? 'ADMIN' : newMessage.recipientId,
      title: `Message from ${newMessage.senderName}`,
      message: newMessage.message.substring(0, 60),
      type: 'comment',
      link: isClient ? `/admin/messages` : `/portal/messages`,
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}

