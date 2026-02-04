import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, shopName, address, latitude, longitude } = body;

    // Validation
    if (!email || !password || !shopName) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await query(
      `INSERT INTO users (email, password_hash, shop_name, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, shop_name`,
      [email, passwordHash, shopName, address || null, latitude || null, longitude || null]
    );

    const user = result.rows[0];

    // Activer automatiquement le calendrier catholique et commercial
    await query(
      `INSERT INTO user_calendars (user_id, calendar_id, is_active)
       SELECT $1, id, TRUE FROM cultural_calendars WHERE type IN ('catholique', 'commercial')`,
      [user.id]
    );

    return NextResponse.json({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        shopName: user.shop_name,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}