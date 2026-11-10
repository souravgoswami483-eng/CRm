import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const project = db.projects.find((p) => p.id === params.id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const files = db.files.filter((f) => f.projectId === project.id);
  const invoices = db.invoices.filter((i) => i.projectId === project.id);
  const messages = db.messages.filter((m) => m.projectId === project.id);
  const activities = db.activities.filter((a) => a.projectId === project.id);

  return NextResponse.json({
    project,
    files,
    invoices,
    messages,
    activities,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = getDatabase();
    const index = db.projects.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const previousStatus = db.projects[index].status;
    db.projects[index] = {
      ...db.projects[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(db);

    if (body.status && body.status !== previousStatus) {
      recordActivity({
        userId: 'user_admin',
        userName: 'Sourav Roy',
        userRole: 'ADMIN',
        action: 'Project Status Updated',
        details: `Moved "${db.projects[index].title}" from ${previousStatus} → ${body.status}`,
        clientId: db.projects[index].clientId,
        projectId: db.projects[index].id,
      });

      addNotification({
        recipientId: db.projects[index].clientId,
        title: 'Project Status Update',
        message: `"${db.projects[index].title}" is now "${body.status}"`,
        type: 'system',
        link: `/portal/projects`,
      });
    }

    return NextResponse.json({ success: true, project: db.projects[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const project = db.projects.find((p) => p.id === params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  db.projects = db.projects.filter((p) => p.id !== params.id);
  saveDatabase(db);

  return NextResponse.json({ success: true });
}

