import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const result = await query(
      'SELECT calendar_name, is_active FROM user_calendar_preferences WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({ calendars: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/user/calendars:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { calendarName, isActive } = await request.json();

    await query(
      `INSERT INTO user_calendar_preferences (user_id, calendar_name, is_active)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, calendar_name) 
       DO UPDATE SET is_active = $3`,
      [userId, calendarName, isActive]
    );

    return NextResponse.json({ message: 'Calendrier mis à jour' });
  } catch (error) {
    console.error('Erreur PUT /api/user/calendars:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}