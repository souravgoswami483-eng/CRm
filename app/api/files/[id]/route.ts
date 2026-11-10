import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { FileVersion } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const logView = searchParams.get('view') === 'true';
  const viewerName = searchParams.get('viewerName') || 'Client';
  const viewerRole = searchParams.get('viewerRole') || 'CLIENT';

  const db = getDatabase();
  const file = db.files.find((f) => f.id === params.id);

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  if (logView) {
    file.viewCount = (file.viewCount || 0) + 1;
    file.lastViewedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    saveDatabase(db);

    recordActivity({
      userId: viewerRole === 'CLIENT' ? file.clientId : 'admin',
      userName: viewerName,
      userRole: viewerRole as any,
      action: 'File Viewed',
      details: `${viewerName} opened and viewed "${file.title}" (v${file.currentVersion})`,
      clientId: file.clientId,
      projectId: file.projectId,
    });
  }

  return NextResponse.json({ file });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = getDatabase();
    const index = db.files.findIndex((f) => f.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = db.files[index];

    // Case 1: Upload a new version (V2, V3, etc.)
    if (body.newVersion) {
      const nextVerNum = (file.versions?.length || file.currentVersion || 1) + 1;
      const newVer: FileVersion = {
        versionNumber: nextVerNum,
        fileUrl: body.newVersion.fileUrl || file.fileUrl,
        thumbnailUrl: body.newVersion.thumbnailUrl || body.newVersion.fileUrl || file.thumbnailUrl,
        fileType: body.newVersion.fileType || file.fileType,
        fileSize: body.newVersion.fileSize || '5.0 MB',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: body.newVersion.notes || `Version ${nextVerNum} revision`,
      };

      file.versions.push(newVer);
      file.currentVersion = nextVerNum;
      file.fileUrl = newVer.fileUrl;
      file.thumbnailUrl = newVer.thumbnailUrl;
      file.status = 'For Review';

      recordActivity({
        userId: 'user_admin',
        userName: 'Sourav Roy',
        userRole: 'ADMIN',
        action: 'New Version Uploaded',
        details: `Uploaded v${nextVerNum} for "${file.title}"`,
        clientId: file.clientId,
        projectId: file.projectId,
      });

      addNotification({
        recipientId: file.clientId,
        title: `New Version Available: v${nextVerNum}`,
        message: `Version ${nextVerNum} of "${file.title}" has been uploaded for review.`,
        type: 'file_review',
        link: `/portal/files?id=${file.id}`,
      });
    }

    // Case 2: Approval or Request Changes from Client
    if (body.status && body.status !== file.status) {
      const prev = file.status;
      file.status = body.status;

      if (body.status === 'Approved') {
        file.approvedAt = new Date().toISOString();
        file.approvedBy = body.approvedBy || 'Client';

        recordActivity({
          userId: file.clientId,
          userName: body.approvedBy || 'Client',
          userRole: 'CLIENT',
          action: 'File Approved',
          details: `Client approved "${file.title}" (v${file.currentVersion})!`,
          clientId: file.clientId,
          projectId: file.projectId,
        });

        addNotification({
          recipientId: 'ADMIN',
          title: 'Creative Approved! 🎉',
          message: `${body.approvedBy || 'Client'} approved "${file.title}"`,
          type: 'approval',
          link: `/admin/files?id=${file.id}`,
        });
      } else if (body.status === 'Changes Requested') {
        recordActivity({
          userId: file.clientId,
          userName: body.approvedBy || 'Client',
          userRole: 'CLIENT',
          action: 'Changes Requested',
          details: `Client requested changes on "${file.title}" (v${file.currentVersion})`,
          clientId: file.clientId,
          projectId: file.projectId,
        });

        addNotification({
          recipientId: 'ADMIN',
          title: 'Changes Requested on Creative',
          message: `${body.approvedBy || 'Client'} requested changes on "${file.title}"`,
          type: 'comment',
          link: `/admin/files?id=${file.id}`,
        });
      }
    }

    // Toggles for watermark and download permissions
    if (body.isWatermarked !== undefined) {
      file.isWatermarked = body.isWatermarked;
    }
    if (body.downloadAllowed !== undefined) {
      file.downloadAllowed = body.downloadAllowed;
    }
    if (body.currentVersion !== undefined && typeof body.currentVersion === 'number') {
      file.currentVersion = body.currentVersion;
      const verObj = file.versions.find((v) => v.versionNumber === body.currentVersion);
      if (verObj) {
        file.fileUrl = verObj.fileUrl;
        file.thumbnailUrl = verObj.thumbnailUrl;
      }
    }

    saveDatabase(db);
    return NextResponse.json({ success: true, file });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update file' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  db.files = db.files.filter((f) => f.id !== params.id);
  saveDatabase(db);
  return NextResponse.json({ success: true });
}

