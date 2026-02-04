import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, User, Recommendation } from '@/lib/db';
import { generateRecommendations } from '@/lib/recommendations';
import { addDays, format } from 'date-fns';

// GET : Récupérer les recommandations pour une date
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date requise' },
        { status: 400 }
      );
    }

    const result = await query<Recommendation & { product_name: string }>(
      `SELECT r.*, p.name as product_name
       FROM recommendations r
       JOIN products p ON p.id = r.product_id
       WHERE r.user_id = $1 AND r.recommendation_date = $2
       ORDER BY r.quantity_standard DESC`,
      [parseInt(session.user.id), date]
    );

    return NextResponse.json({ recommendations: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/recommendations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST : Générer les recommandations pour J+1
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les infos utilisateur (localisation)
    const userResult = await query<User>(
      'SELECT latitude, longitude FROM users WHERE id = $1',
      [parseInt(session.user.id)]
    );

    const user = userResult.rows[0];

    if (!user || !user.latitude || !user.longitude) {
      return NextResponse.json(
        { error: 'Localisation non configurée. Merci de renseigner votre adresse.' },
        { status: 400 }
      );
    }

    // Générer les recommandations pour J+1
    const tomorrow = addDays(new Date(), 1);
    const recommendations = await generateRecommendations(
      parseInt(session.user.id),
      tomorrow,
      user.latitude,
      user.longitude
    );

    return NextResponse.json({
      message: 'Recommandations générées',
      date: format(tomorrow, 'yyyy-MM-dd'),
      recommendations,
    });
  } catch (error) {
    console.error('Erreur POST /api/recommendations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}