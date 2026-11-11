import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSessionFromRequest, generateSignedFileToken, verifySignedFileToken } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action'); // 'download' or 'view'

  const db = getDatabase();
  const file = db.files.find((f) => f.id === params.id);

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // 1. If accessed with a signed token
  if (token) {
    const verification = await verifySignedFileToken(token, file.id);
    if (!verification.valid) {
      return NextResponse.json({ error: 'Access token expired or invalid' }, { status: 403 });
    }
    // Token is valid; redirect to actual file url
    return NextResponse.redirect(file.fileUrl);
  }

  // 2. Otherwise authenticate via session
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  // Check client ownership
  if (session.role === 'CLIENT') {
    if (file.clientId !== session.userId && file.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to other client files' }, { status: 403 });
    }

    // Check if download is locked due to unpaid invoice
    if (action === 'download') {
      const linkedInvoice = db.invoices.find(
        (inv) => inv.projectId === file.projectId || inv.clientId === file.clientId
      );
      const isInvoicePaid = linkedInvoice && (linkedInvoice.status === 'Paid' || linkedInvoice.balanceDue === 0);
      const isAllowed = file.downloadAllowed || isInvoicePaid;

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'File download is locked until the linked project invoice is cleared.' },
          { status: 403 }
        );
      }
    }
  }

  // Generate short-lived signed access token (valid for 1 hour)
  const signedToken = await generateSignedFileToken(file.id, session.clientId || session.userId, 3600);
  const secureUrl = `/api/files/${file.id}/access?token=${signedToken}`;

  return NextResponse.json({
    success: true,
    fileId: file.id,
    title: file.title,
    signedUrl: secureUrl,
    directUrl: file.fileUrl,
    downloadAllowed: file.downloadAllowed,
    isWatermarked: file.isWatermarked,
  });
}
