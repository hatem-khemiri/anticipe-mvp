import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, Product } from '@/lib/db';

// GET : Récupérer tous les produits de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const result = await query<Product>(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY name',
      [parseInt(session.user.id)]
    );

    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error('Erreur GET /api/products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST : Créer un nouveau produit
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, businessImportance } = body;

    if (!name || !businessImportance) {
      return NextResponse.json(
        { error: 'Nom et importance requis' },
        { status: 400 }
      );
    }

    const result = await query<Product>(
      `INSERT INTO products (user_id, name, category, business_importance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [parseInt(session.user.id), name, category || null, businessImportance]
    );

    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    console.error('Erreur POST /api/products:', error);
    
    // Gérer les doublons
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un produit avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT : Mettre à jour un produit
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, category, businessImportance, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID produit requis' },
        { status: 400 }
      );
    }

    const result = await query<Product>(
      `UPDATE products 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           business_importance = COALESCE($3, business_importance),
           active = COALESCE($4, active)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        name,
        category,
        businessImportance,
        active,
        id,
        parseInt(session.user.id),
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Erreur PUT /api/products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE : Supprimer un produit
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
        { error: 'ID produit requis' },
        { status: 400 }
      );
    }

    await query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2',
      [parseInt(id), parseInt(session.user.id)]
    );

    return NextResponse.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}