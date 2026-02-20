import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Supprimer l'utilisateur (les CASCADE supprimeront automatiquement toutes les données liées)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/user/delete:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}