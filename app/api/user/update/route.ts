import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { shopName } = body;

    if (!shopName || shopName.trim() === '') {
      return NextResponse.json({ error: 'Le nom du commerce est requis' }, { status: 400 });
    }

    await query(
      'UPDATE users SET shop_name = $1, updated_at = NOW() WHERE id = $2',
      [shopName, userId]
    );

    return NextResponse.json({ message: 'Nom du commerce mis à jour' });
  } catch (error) {
    console.error('Erreur PUT /api/user/update:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}