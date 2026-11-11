import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { FileComment } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();
    const file = db.files.find((f) => f.id === params.id);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (session.role === 'CLIENT') {
      if (file.clientId !== session.userId && file.clientId !== session.clientId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
    }

    const newComment: FileComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fileId: file.id,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      content: (body.content || '').trim(),
      timestampSeconds: body.timestampSeconds !== undefined ? Number(body.timestampSeconds) : undefined,
      pinCoordinates: body.pinCoordinates
        ? {
            x: Math.round(Number(body.pinCoordinates.x)),
            y: Math.round(Number(body.pinCoordinates.y)),
          }
        : undefined,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      resolved: false,
    };

    if (!file.comments) {
      file.comments = [];
    }
    file.comments.push(newComment);
    saveDatabase(db);

    // Build log description
    let commentDesc = `Comment on "${file.title}"`;
    if (newComment.pinCoordinates) {
      commentDesc = `Pinned feedback on "${file.title}" at (${newComment.pinCoordinates.x}%, ${newComment.pinCoordinates.y}%)`;
    } else if (newComment.timestampSeconds !== undefined) {
      const mins = Math.floor(newComment.timestampSeconds / 60);
      const secs = (newComment.timestampSeconds % 60).toString().padStart(2, '0');
      commentDesc = `Timestamped video feedback at ${mins}:${secs} on "${file.title}"`;
    }

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: newComment.pinCoordinates ? 'Pinned Comment' : newComment.timestampSeconds !== undefined ? 'Video Timestamp Feedback' : 'File Comment',
      details: `${session.name}: "${newComment.content.substring(0, 80)}"`,
      clientId: file.clientId,
      projectId: file.projectId,
    });

    // Notify the other party
    const isClient = session.role === 'CLIENT';
    addNotification({
      recipientId: isClient ? 'ADMIN' : file.clientId,
      title: isClient ? 'New Feedback From Client' : 'Studio Designer Responded',
      message: `${session.name}: "${newComment.content.substring(0, 60)}"`,
      type: 'comment',
      link: isClient ? `/admin/files?id=${file.id}` : `/portal/review`,
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add comment' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();
    const file = db.files.find((f) => f.id === params.id);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const comment = file.comments?.find((c) => c.id === body.commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (body.resolved !== undefined) {
      comment.resolved = body.resolved;
    }

    saveDatabase(db);
    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update comment' }, { status: 500 });
  }
}
