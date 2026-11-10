import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { CreativeFile } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');

  const db = getDatabase();
  let files = [...db.files];

  if (projectId) {
    files = files.filter((f) => f.projectId === projectId);
  }

  if (clientId) {
    files = files.filter((f) => f.clientId === clientId);
  }

  if (status) {
    files = files.filter((f) => f.status === status);
  }

  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    const project = db.projects.find((p) => p.id === body.projectId);

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
      clientId: project ? project.clientId : body.clientId || '',
      title: body.title || 'Creative_Artwork_V1.jpg',
      fileType: body.fileType || 'image',
      fileUrl: initialVersion.fileUrl,
      thumbnailUrl: initialVersion.thumbnailUrl,
      fileSize: initialVersion.fileSize,
      currentVersion: 1,
      versions: [initialVersion],
      status: body.status || 'For Review',
      isWatermarked: body.isWatermarked !== undefined ? body.isWatermarked : true,
      downloadAllowed: body.downloadAllowed !== undefined ? body.downloadAllowed : false,
      viewCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    db.files.unshift(newFile);
    saveDatabase(db);

    recordActivity({
      userId: 'user_admin',
      userName: 'Sourav Roy',
      userRole: 'ADMIN',
      action: 'File Uploaded',
      details: `Uploaded new asset "${newFile.title}" for project "${newFile.projectTitle}"`,
      clientId: newFile.clientId,
      projectId: newFile.projectId,
    });

    addNotification({
      recipientId: newFile.clientId,
      title: 'New Creative File Ready For Review',
      message: `Sourav Roy uploaded "${newFile.title}" for your feedback.`,
      type: 'file_review',
      link: `/portal/files?id=${newFile.id}`,
    });

    return NextResponse.json({ success: true, file: newFile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to upload file' }, { status: 500 });
  }
}

