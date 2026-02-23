import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const result = await query(
      `SELECT shop_name, email, address, latitude, longitude 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        shopName: user.shop_name,
        email: user.email,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/user/profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}