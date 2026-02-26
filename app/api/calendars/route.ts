import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const CALENDARIFIC_API_KEY = process.env.CALENDARIFIC_API_KEY;
const CALENDARIFIC_BASE_URL = 'https://calendarific.com/api/v2';

interface CalendarificHoliday {
  name: string;
  description: string;
  date: {
    iso: string;
  };
  type: string[];
  primary_type: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { year, country } = await request.json();
    const targetYear = year || new Date().getFullYear();
    const targetCountry = country || 'FR'; // France par défaut

    // Appeler l'API Calendarific
    const response = await fetch(
      `${CALENDARIFIC_BASE_URL}/holidays?api_key=${CALENDARIFIC_API_KEY}&country=${targetCountry}&year=${targetYear}`
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Erreur API Calendarific' }, { status: 500 });
    }

    const data = await response.json();
    const holidays: CalendarificHoliday[] = data.response.holidays;

    // Mapper les types Calendarific vers nos calendriers
    const typeMapping: Record<string, number> = {
      'Christian': 1, // Catholic
      'Muslim': 2,    // Muslim
      'Jewish': 4,    // Jewish (à créer)
      'Hindu': 5,     // Hindu (à créer)
      'National': 1,  // Catholic (fêtes nationales françaises)
      'Observance': 3 // Commercial
    };

    let inserted = 0;
    let updated = 0;

    for (const holiday of holidays) {
      // Déterminer le calendar_id basé sur le type
      let calendarId = 1; // Catholic par défaut
      
      for (const type of holiday.type) {
        if (typeMapping[type]) {
          calendarId = typeMapping[type];
          break;
        }
      }

      // Déterminer le type d'événement
      let eventType = 'religieux';
      if (holiday.type.includes('National holiday')) {
        eventType = 'ferie';
      } else if (holiday.type.includes('Observance')) {
        eventType = 'commercial';
      }

      // Insérer ou mettre à jour
      const existingEvent = await query(
        'SELECT id FROM cultural_events WHERE name = $1 AND start_date = $2',
        [holiday.name, holiday.date.iso]
      );

      if (existingEvent.rows.length === 0) {
        await query(
          `INSERT INTO cultural_events 
           (calendar_id, name, event_type, start_date, end_date, is_fixed_date, default_impact_percent) 
           VALUES ($1, $2, $3, $4, $4, true, 20.00)`,
          [calendarId, holiday.name, eventType, holiday.date.iso]
        );
        inserted++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      message: `Synchronisation réussie`,
      year: targetYear,
      country: targetCountry,
      inserted,
      updated,
      total: holidays.length
    });
  } catch (error) {
    console.error('Erreur sync calendriers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}