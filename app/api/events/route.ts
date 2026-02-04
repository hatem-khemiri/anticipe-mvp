import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, ExceptionalEvent } from '@/lib/db';

// GET : Récupérer tous les événements exceptionnels de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const result = await query<ExceptionalEvent>(
      'SELECT * FROM exceptional_events WHERE user_id = $1 ORDER BY start_date DESC',
      [parseInt(session.user.id)]
    );

    return NextResponse.json({ events: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/events:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST : Créer un nouvel événement exceptionnel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, startDate, endDate, impactPercent, affectedCategories, notes } = body;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Nom et date de début requis' },
        { status: 400 }
      );
    }

    const result = await query<ExceptionalEvent>(
      `INSERT INTO exceptional_events (user_id, name, start_date, end_date, impact_percent, affected_categories, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        parseInt(session.user.id),
        name,
        startDate,
        endDate || null,
        impactPercent || 10,
        affectedCategories || null,
        notes || null,
      ]
    );

    return NextResponse.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Erreur POST /api/events:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT : Mettre à jour un événement exceptionnel
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, startDate, endDate, impactPercent, affectedCategories, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID événement requis' },
        { status: 400 }
      );
    }

    const result = await query<ExceptionalEvent>(
      `UPDATE exceptional_events 
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           impact_percent = COALESCE($4, impact_percent),
           affected_categories = COALESCE($5, affected_categories),
           notes = COALESCE($6, notes)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name,
        startDate,
        endDate,
        impactPercent,
        affectedCategories,
        notes,
        id,
        parseInt(session.user.id),
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Erreur PUT /api/events:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE : Supprimer un événement exceptionnel
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID événement requis' },
        { status: 400 }
      );
    }

    await query(
      'DELETE FROM exceptional_events WHERE id = $1 AND user_id = $2',
      [parseInt(id), parseInt(session.user.id)]
    );

    return NextResponse.json({ message: 'Événement supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/events:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}