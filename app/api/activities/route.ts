import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const projectId = searchParams.get('projectId');
  const limit = Number(searchParams.get('limit')) || 100;

  const db = getDatabase();
  let activities = [...db.activities];

  if (clientId) {
    activities = activities.filter((a) => a.clientId === clientId);
  }

  if (projectId) {
    activities = activities.filter((a) => a.projectId === projectId);
  }

  return NextResponse.json({ activities: activities.slice(0, limit) });
}

