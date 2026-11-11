import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest, generateSignedFileToken } from '@/lib/auth-server';
import { FileVersion } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const logView = searchParams.get('view') === 'true';

  const db = getDatabase();
  const file = db.files.find((f) => f.id === params.id);

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Scoping check for client
  if (session.role === 'CLIENT') {
    if (file.clientId !== session.userId && file.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to other client files' }, { status: 403 });
    }
  }

  // Automatic download unlock check based on invoice payment
  const linkedInvoice = db.invoices.find(
    (inv) => (inv.projectId && inv.projectId === file.projectId) || inv.clientId === file.clientId
  );
  const isPaid = linkedInvoice && (linkedInvoice.status === 'Paid' || linkedInvoice.balanceDue === 0);
  if (isPaid) {
    file.downloadAllowed = true;
    file.isWatermarked = false;
  }

  if (logView) {
    file.viewCount = (file.viewCount || 0) + 1;
    file.lastViewedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'File Viewed',
      details: `${session.name} opened and reviewed "${file.title}" (v${file.currentVersion})`,
      clientId: file.clientId,
      projectId: file.projectId,
    });
  }

  // Generate signed expiring access URL
  const signedToken = await generateSignedFileToken(file.id, session.clientId || session.userId, 3600);
  const signedUrl = `/api/files/${file.id}/access?token=${signedToken}`;

  return NextResponse.json({ file: { ...file, signedUrl } });
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
    const index = db.files.findIndex((f) => f.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = db.files[index];

    // Client authorization check
    if (session.role === 'CLIENT') {
      if (file.clientId !== session.userId && file.clientId !== session.clientId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
    }

    // Case 1: Upload a new version (V2, V3, etc.) - Admin only
    if (body.newVersion) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admin can upload new creative versions' }, { status: 403 });
      }

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
      file.status = 'Draft';

      // Update linked project status
      const project = db.projects.find((p) => p.id === file.projectId);
      if (project) {
        project.status = 'Draft Shared';
      }

      recordActivity({
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
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
        link: `/portal/review`,
      });
    }

    // Case 2: File Status State Machine: Draft, Changes Requested, Approved
    if (body.status && body.status !== file.status) {
      const targetStatus = body.status;

      // Lock Approve while changes are open (Task 2 rule)
      if (targetStatus === 'Approved') {
        const hasOpenChanges = file.status === 'Changes Requested';
        if (hasOpenChanges && !body.forceResolveChanges) {
          return NextResponse.json(
            { error: 'Cannot approve file while changes are still requested/open. Please address or resolve changes first.' },
            { status: 400 }
          );
        }
      }

      file.status = targetStatus;

      // Project stage follows file status (Task 2 rule)
      const project = db.projects.find((p) => p.id === file.projectId);

      if (targetStatus === 'Approved') {
        file.approvedAt = new Date().toISOString();
        file.approvedBy = session.name;

        if (project) {
          project.status = 'Approved';
        }

        // Record the real actor in the audit log (Task 2 rule)
        recordActivity({
          userId: session.userId,
          userName: session.name,
          userRole: session.role,
          action: 'File Approved',
          details: `${session.name} (${session.role}) approved "${file.title}" (v${file.currentVersion})!`,
          clientId: file.clientId,
          projectId: file.projectId,
        });

        addNotification({
          recipientId: 'ADMIN',
          title: 'Creative Approved! 🎉',
          message: `${session.name} approved "${file.title}"`,
          type: 'approval',
          link: `/admin/files`,
        });
      } else if (targetStatus === 'Changes Requested') {
        if (project) {
          project.status = 'Revisions';
          project.revisionsUsed = (project.revisionsUsed || 0) + 1;
        }

        // Record the real actor in the audit log (Task 2 rule)
        recordActivity({
          userId: session.userId,
          userName: session.name,
          userRole: session.role,
          action: 'Changes Requested',
          details: `${session.name} (${session.role}) requested changes on "${file.title}" (v${file.currentVersion})`,
          clientId: file.clientId,
          projectId: file.projectId,
        });

        addNotification({
          recipientId: 'ADMIN',
          title: 'Changes Requested on Creative',
          message: `${session.name} requested changes on "${file.title}"`,
          type: 'comment',
          link: `/admin/files`,
        });
      }
    }

    // Toggles for watermark and download permissions (Admin only)
    if (session.role === 'ADMIN') {
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
    }

    // Check automatic invoice unlock
    const linkedInvoice = db.invoices.find(
      (inv) => (inv.projectId && inv.projectId === file.projectId) || inv.clientId === file.clientId
    );
    if (linkedInvoice && (linkedInvoice.status === 'Paid' || linkedInvoice.balanceDue === 0)) {
      file.downloadAllowed = true;
      file.isWatermarked = false;
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
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  const db = getDatabase();
  const file = db.files.find((f) => f.id === params.id);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  db.files = db.files.filter((f) => f.id !== params.id);
  saveDatabase(db);

  recordActivity({
    userId: session.userId,
    userName: session.name,
    userRole: 'ADMIN',
    action: 'File Deleted',
    details: `Deleted file "${file.title}"`,
  });

  return NextResponse.json({ success: true });
}
