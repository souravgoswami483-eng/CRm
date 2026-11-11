import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedClientId = searchParams.get('clientId');
  const projectId = searchParams.get('projectId');
  const limit = Number(searchParams.get('limit')) || 100;

  const db = getDatabase();
  let activities = [...db.activities];

  // Scoping: Clients only see activities related to their own account
  if (session.role === 'CLIENT') {
    activities = activities.filter(
      (a) => a.clientId === session.userId || a.clientId === session.clientId
    );
  } else {
    // Admin filtering
    if (requestedClientId) {
      activities = activities.filter(
        (a) => a.clientId === requestedClientId || a.clientId === `CL-${requestedClientId}`
      );
    }
  }

  if (projectId) {
    activities = activities.filter((a) => a.projectId === projectId);
  }

  // Sort newest first
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ activities: activities.slice(0, limit) });
}
