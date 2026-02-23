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
    const { 
      shopName, 
      businessType, 
      streetAddress, 
      postalCode, 
      city, 
      country, 
      latitude, 
      longitude,
      currentPassword,
      newPassword
    } = body;

    // Si changement de mot de passe
    if (currentPassword && newPassword) {
      // Vérifier l'ancien mot de passe
      const userResult = await query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );

      if (!isValidPassword) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );

      return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
    }

    // Mise à jour des informations générales
    const fullAddress = `${streetAddress}, ${postalCode} ${city}, ${country}`;

    await query(
      `UPDATE users 
       SET shop_name = $1, 
           address = $2, 
           latitude = $3, 
           longitude = $4, 
           updated_at = NOW() 
       WHERE id = $5`,
      [shopName, fullAddress, latitude, longitude, userId]
    );

    return NextResponse.json({ message: 'Informations mises à jour avec succès' });
  } catch (error) {
    console.error('Erreur PUT /api/user/update:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}