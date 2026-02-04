import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, DailySale } from '@/lib/db';
import Papa from 'papaparse';

// GET : Récupérer les ventes d'une date
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

    const result = await query<DailySale & { product_name: string }>(
      `SELECT ds.*, p.name as product_name
       FROM daily_sales ds
       JOIN products p ON p.id = ds.product_id
       WHERE ds.user_id = $1 AND ds.sale_date = $2
       ORDER BY p.name`,
      [parseInt(session.user.id), date]
    );

    return NextResponse.json({ sales: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/sales:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST : Saisir les ventes manuellement ou via CSV
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'manual') {
      // Saisie manuelle : un produit à la fois
      const { productId, date, quantitySold, quantityUnsold } = data;

      if (!productId || !date || quantitySold === undefined) {
        return NextResponse.json(
          { error: 'Données manquantes' },
          { status: 400 }
        );
      }

      const result = await query<DailySale>(
        `INSERT INTO daily_sales (user_id, product_id, sale_date, quantity_sold, quantity_unsold)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, product_id, sale_date)
         DO UPDATE SET 
           quantity_sold = $4,
           quantity_unsold = $5
         RETURNING *`,
        [
          parseInt(session.user.id),
          productId,
          date,
          quantitySold,
          quantityUnsold || 0,
        ]
      );

      return NextResponse.json({ sale: result.rows[0] });
    } else if (type === 'csv') {
      // Import CSV
      const { csvContent } = data;

      if (!csvContent) {
        return NextResponse.json(
          { error: 'Contenu CSV manquant' },
          { status: 400 }
        );
      }

      // Parser le CSV
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        return NextResponse.json(
          { error: 'Erreur de parsing CSV', details: parsed.errors },
          { status: 400 }
        );
      }

      const rows = parsed.data as Array<{
        Date: string;
        Produit: string;
        'Quantité vendue': string;
        'Quantité invendue'?: string;
      }>;

      // Valider et importer les données
      const imported = [];
      const errors = [];

      for (const [index, row] of rows.entries()) {
        try {
          // Valider le format
          if (!row.Date || !row.Produit || !row['Quantité vendue']) {
            errors.push({
              line: index + 2,
              error: 'Données manquantes',
              row,
            });
            continue;
          }

          // Chercher le produit
          const productResult = await query(
            'SELECT id FROM products WHERE user_id = $1 AND name = $2',
            [parseInt(session.user.id), row.Produit.trim()]
          );

          if (productResult.rows.length === 0) {
            errors.push({
              line: index + 2,
              error: `Produit "${row.Produit}" non trouvé`,
              row,
            });
            continue;
          }

          const productId = productResult.rows[0].id;
          const quantitySold = parseInt(row['Quantité vendue']);
          const quantityUnsold = row['Quantité invendue']
            ? parseInt(row['Quantité invendue'])
            : 0;

          // Insérer ou mettre à jour
          await query(
            `INSERT INTO daily_sales (user_id, product_id, sale_date, quantity_sold, quantity_unsold)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, product_id, sale_date)
             DO UPDATE SET 
               quantity_sold = $4,
               quantity_unsold = $5`,
            [
              parseInt(session.user.id),
              productId,
              row.Date,
              quantitySold,
              quantityUnsold,
            ]
          );

          imported.push({
            date: row.Date,
            product: row.Produit,
            quantitySold,
          });
        } catch (err) {
          errors.push({
            line: index + 2,
            error: 'Erreur lors de l\'import',
            details: err,
            row,
          });
        }
      }

      return NextResponse.json({
        message: `${imported.length} ventes importées`,
        imported,
        errors,
      });
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur POST /api/sales:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE : Supprimer une vente
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
        { error: 'ID vente requis' },
        { status: 400 }
      );
    }

    await query(
      'DELETE FROM daily_sales WHERE id = $1 AND user_id = $2',
      [parseInt(id), parseInt(session.user.id)]
    );

    return NextResponse.json({ message: 'Vente supprimée' });
  } catch (error) {
    console.error('Erreur DELETE /api/sales:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}