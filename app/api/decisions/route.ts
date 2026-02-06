import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, ProductionDecision } from '@/lib/db';

// POST : Valider les décisions de production
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { decisions } = body;

    // decisions est un array d'objets : 
    // { recommendationId, productId, date, finalQuantity, choseStandard, chosePrudent, choseCustom, notes }

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return NextResponse.json(
        { error: 'Décisions manquantes' },
        { status: 400 }
      );
    }

    const saved = [];

    for (const decision of decisions) {
      const {
        recommendationId,
        productId,
        date,
        finalQuantity,
        choseStandard,
        chosePrudent,
        choseCustom,
        notes,
      } = decision;

      const result = await query<ProductionDecision>(
        `INSERT INTO production_decisions (
          recommendation_id,
          user_id,
          product_id,
          decision_date,
          final_quantity,
          chose_standard,
          chose_prudent,
          chose_custom,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, product_id, decision_date)
        DO UPDATE SET
          final_quantity = $5,
          chose_standard = $6,
          chose_prudent = $7,
          chose_custom = $8,
          notes = $9,
          validated_at = NOW()
        RETURNING *`,
        [
          recommendationId,
          parseInt(session.user.id),
          productId,
          date,
          finalQuantity,
          choseStandard || false,
          chosePrudent || false,
          choseCustom || false,
          notes || null,
        ]
      );

      saved.push(result.rows[0]);
    }

    return NextResponse.json({
      message: 'Décisions validées',
      decisions: saved,
    });
  } catch (error) {
    console.error('Erreur POST /api/decisions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET : Récupérer les décisions pour une date
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

    const result = await query<ProductionDecision & { product_name: string }>(
      `SELECT pd.*, p.name as product_name
       FROM production_decisions pd
       JOIN products p ON p.id = pd.product_id
       WHERE pd.user_id = $1 AND pd.decision_date = $2
       ORDER BY p.name`,
      [parseInt(session.user.id), date]
    );

    return NextResponse.json({ decisions: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/decisions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}