import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const db = getDatabase();
  const project = db.projects.find((p) => p.id === params.id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Scoping check for client
  if (session.role === 'CLIENT') {
    if (project.clientId !== session.userId && project.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to access this project' }, { status: 403 });
    }
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDatabase();
    const index = db.projects.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentProject = db.projects[index];

    // Client permission check
    if (session.role === 'CLIENT') {
      if (currentProject.clientId !== session.userId && currentProject.clientId !== session.clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Clients can only update tasks or specific allowed fields
      if (body.tasks) {
        currentProject.tasks = body.tasks;
      }
      currentProject.updatedAt = new Date().toISOString();
      saveDatabase(db);
      return NextResponse.json({ success: true, project: currentProject });
    }

    // Admin updates
    const previousStatus = currentProject.status;
    db.projects[index] = {
      ...currentProject,
      ...body,
      id: currentProject.id,
      clientId: currentProject.clientId, // Prevent modifying clientId
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(db);

    if (body.status && body.status !== previousStatus) {
      recordActivity({
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
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
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  const db = getDatabase();
  const project = db.projects.find((p) => p.id === params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  db.projects = db.projects.filter((p) => p.id !== params.id);
  saveDatabase(db);

  recordActivity({
    userId: session.userId,
    userName: session.name,
    userRole: 'ADMIN',
    action: 'Project Deleted',
    details: `Deleted project "${project.title}" (${project.clientCompany})`,
  });

  return NextResponse.json({ success: true });
}
