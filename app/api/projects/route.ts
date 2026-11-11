import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordActivity, addNotification } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { Project } from '@/types';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedClientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const db = getDatabase();
  let projects = [...db.projects];

  // Scoping: Clients only see their own projects
  if (session.role === 'CLIENT') {
    projects = projects.filter(
      (p) => p.clientId === session.userId || p.clientId === session.clientId
    );
  } else {
    // Admin filtering
    if (requestedClientId) {
      projects = projects.filter(
        (p) => p.clientId === requestedClientId || p.clientId === `CL-${requestedClientId}`
      );
    }
  }

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  if (priority) {
    projects = projects.filter((p) => p.priority === priority);
  }

  // Attach linked invoices and files to each project
  const enriched = projects.map((proj) => {
    const projectFiles = db.files.filter((f) => f.projectId === proj.id);
    const projectInvoices = db.invoices.filter((i) => i.projectId === proj.id);
    return {
      ...proj,
      filesCount: projectFiles.length,
      invoicesCount: projectInvoices.length,
      files: projectFiles,
      invoices: projectInvoices,
    };
  });

  return NextResponse.json({ projects: enriched });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required to create projects' }, { status: 403 });
    }

    const body = await request.json();
    const db = getDatabase();

    // Data integrity validation on server
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return NextResponse.json({ error: 'Project title must be at least 3 characters.' }, { status: 400 });
    }
    if (!body.clientId || typeof body.clientId !== 'string' || body.clientId.trim() === '') {
      return NextResponse.json(
        { error: 'Client selection is required. Please select a valid client.' },
        { status: 400 }
      );
    }
    if (body.startDate && body.deadline && body.deadline < body.startDate) {
      return NextResponse.json({ error: 'Deadline cannot be earlier than project start date.' }, { status: 400 });
    }
    if (body.quotedAmount !== undefined && (isNaN(Number(body.quotedAmount)) || Number(body.quotedAmount) < 0)) {
      return NextResponse.json({ error: 'Quoted amount must be a valid non-negative number.' }, { status: 400 });
    }

    const client = db.clients.find((c) => c.id === body.clientId || c.clientId === body.clientId);
    if (!client) {
      return NextResponse.json({ error: 'Selected client does not exist in the database.' }, { status: 400 });
    }

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: (body.title || 'Untitled Creative Project').trim(),
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.companyName,
      type: body.type || 'Social Media Creatives',
      description: body.description || '',
      referenceLinks: body.referenceLinks || [],
      referenceFiles: body.referenceFiles || [],
      startDate: body.startDate || new Date().toISOString().substring(0, 10),
      deadline: body.deadline || '',
      status: body.status || 'Brief Received',
      priority: body.priority || 'Medium',
      revisionsAllowed: Number(body.revisionsAllowed) || 3,
      revisionsUsed: 0,
      quotedAmount: Number(body.quotedAmount) || 0,
      currency: body.currency || db.settings.currency || 'INR',
      tasks: body.tasks || [
        { id: `t_${Date.now()}_1`, title: 'Creative brief review & references', completed: false },
        { id: `t_${Date.now()}_2`, title: 'Draft v1 concept render', completed: false },
        { id: `t_${Date.now()}_3`, title: 'Client revision integration', completed: false },
        { id: `t_${Date.now()}_4`, title: 'Final delivery & source files', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.projects.unshift(newProject);
    saveDatabase(db);

    recordActivity({
      userId: session.userId,
      userName: session.name,
      userRole: 'ADMIN',
      action: 'Project Created',
      details: `Created project "${newProject.title}" for ${newProject.clientCompany}`,
      clientId: newProject.clientId,
      projectId: newProject.id,
    });

    addNotification({
      recipientId: newProject.clientId,
      title: 'New Project Started',
      message: `Your project "${newProject.title}" is now underway.`,
      type: 'system',
      link: `/portal/projects`,
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}
