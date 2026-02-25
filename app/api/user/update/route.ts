import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { shopName, currentPassword, newPassword } = body;

    // Changement de mot de passe
    if (currentPassword && newPassword) {
      const userResult = await query('SELECT password FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);

      if (!isValidPassword) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
    }

    // Modification du nom
    if (shopName) {
      await query('UPDATE users SET shop_name = $1 WHERE id = $2', [shopName, userId]);
      return NextResponse.json({ message: 'Nom du commerce mis à jour' });
    }

    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 });
  } catch (error) {
    console.error('Erreur PUT /api/user/update:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}