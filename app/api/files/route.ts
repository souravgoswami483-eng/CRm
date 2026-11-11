import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { CreativeFile } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const requestedClientId = searchParams.get('clientId');
  const status = searchParams.get('status');

  const db = getDatabase();
  let files = [...db.files];

  // Scoping: Clients only see their own files
  if (session.role === 'CLIENT') {
    files = files.filter(
      (f) => f.clientId === session.userId || f.clientId === session.clientId
    );
  } else {
    // Admin filtering
    if (requestedClientId) {
      files = files.filter(
        (f) => f.clientId === requestedClientId || f.clientId === `CL-${requestedClientId}`
      );
    }
  }

  if (projectId) {
    files = files.filter((f) => f.projectId === projectId);
  }

  if (status) {
    files = files.filter((f) => f.status === status);
  }

  // Automatic unlock check: Unlock downloads automatically if linked invoice is Paid
  files = files.map((f) => {
    const linkedInvoice = db.invoices.find(
      (inv) => (inv.projectId && inv.projectId === f.projectId) || inv.clientId === f.clientId
    );
    const isPaid = linkedInvoice && (linkedInvoice.status === 'Paid' || linkedInvoice.balanceDue === 0);

    return {
      ...f,
      downloadAllowed: f.downloadAllowed || !!isPaid,
      isWatermarked: isPaid ? false : f.isWatermarked,
    };
  });

  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required to upload assets' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDatabase();

    const project = db.projects.find((p) => p.id === body.projectId);
    const clientId = project ? project.clientId : body.clientId || '';

    if (!clientId) {
      return NextResponse.json({ error: 'File must be linked to a project with a valid client.' }, { status: 400 });
    }

    const initialVersion = {
      versionNumber: 1,
      fileUrl: body.fileUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop&q=80',
      thumbnailUrl: body.thumbnailUrl || body.fileUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
      fileType: body.fileType || 'image',
      fileSize: body.fileSize || '3.2 MB',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: body.versionNotes || 'Initial upload version 1',
    };

    const newFile: CreativeFile = {
      id: `file_${Date.now()}`,
      projectId: body.projectId,
      projectTitle: project ? project.title : body.projectTitle || 'Creative Asset',
      clientId,
      title: body.title || 'Creative_Artwork_V1.jpg',
      fileType: body.fileType || 'image',
      fileUrl: initialVersion.fileUrl,
      thumbnailUrl: initialVersion.thumbnailUrl,
      fileSize: initialVersion.fileSize,
      currentVersion: 1,
      versions: [initialVersion],
      status: body.status || 'Draft',
      isWatermarked: body.isWatermarked !== undefined ? body.isWatermarked : true,
      downloadAllowed: body.downloadAllowed !== undefined ? body.downloadAllowed : false,
      viewCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    db.files.unshift(newFile);
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: 'ADMIN',
      action: 'File Uploaded',
      details: `Uploaded new asset "${newFile.title}" for project "${newFile.projectTitle}"`,
      clientId: newFile.clientId,
      projectId: newFile.projectId,
    });

    addNotification({
      recipientId: newFile.clientId,
      title: 'New Creative File Ready For Review',
      message: `${session.name} uploaded "${newFile.title}" for your feedback.`,
      type: 'file_review',
      link: `/portal/review`,
    });

    return NextResponse.json({ success: true, file: newFile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to upload file' }, { status: 500 });
  }
}
