import { query, WeatherCache } from './db';
import { addDays, format } from 'date-fns';

interface WeatherData {
  condition: 'beau' | 'moyen' | 'mauvais';
  temperature_avg: number;
  precipitation_mm: number;
  impact_percent: number;
}

/**
 * Récupère les données météo pour une date et un emplacement donnés
 * Utilise le cache si disponible (< 6h), sinon appelle l'API Open-Meteo
 */
export async function getWeatherForDate(
  latitude: number,
  longitude: number,
  targetDate: Date
): Promise<WeatherData> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Vérifier le cache (données < 6h)
  const cacheResult = await query<WeatherCache>(
    `SELECT * FROM weather_cache 
     WHERE latitude = $1 
     AND longitude = $2 
     AND forecast_date = $3 
     AND fetched_at > NOW() - INTERVAL '6 hours'
     LIMIT 1`,
    [latitude, longitude, dateStr]
  );

  if (cacheResult.rows.length > 0) {
    const cached = cacheResult.rows[0];
    return {
      condition: cached.weather_condition as 'beau' | 'moyen' | 'mauvais',
      temperature_avg: cached.temperature_avg || 15,
      precipitation_mm: cached.precipitation_mm || 0,
      impact_percent: calculateWeatherImpact(
        cached.weather_condition as string,
        cached.temperature_avg || 15,
        cached.precipitation_mm || 0
      ),
    };
  }

  // Appeler l'API Open-Meteo
  try {
    const weatherData = await fetchOpenMeteoData(latitude, longitude, targetDate);
    
    // Sauvegarder en cache
    await query(
      `INSERT INTO weather_cache 
       (latitude, longitude, forecast_date, temperature_avg, precipitation_mm, weather_condition)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (latitude, longitude, forecast_date) 
       DO UPDATE SET 
         temperature_avg = $4,
         precipitation_mm = $5,
         weather_condition = $6,
         fetched_at = NOW()`,
      [
        latitude,
        longitude,
        dateStr,
        weatherData.temperature_avg,
        weatherData.precipitation_mm,
        weatherData.condition,
      ]
    );

    return weatherData;
  } catch (error) {
    console.error('Erreur lors de la récupération météo:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      condition: 'moyen',
      temperature_avg: 15,
      precipitation_mm: 0,
      impact_percent: 0,
    };
  }
}

/**
 * Appelle l'API Open-Meteo pour récupérer les données météo
 */
async function fetchOpenMeteoData(
  latitude: number,
  longitude: number,
  targetDate: Date
): Promise<WeatherData> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');
  const today = new Date();
  const daysFromNow = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Open-Meteo : prévisions jusqu'à 16 jours, historique au-delà
  let url: string;
  
  if (daysFromNow >= 0 && daysFromNow <= 16) {
    // Prévisions futures (forecast)
    url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,precipitation_sum,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
  } else {
    // Historique (archive) - fonctionne uniquement pour le passé
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,precipitation_sum,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.daily || data.daily.time.length === 0) {
    throw new Error('Aucune donnée météo disponible');
  }

  const temperature = data.daily.temperature_2m_mean[0];
  const precipitation = data.daily.precipitation_sum[0] || 0;
  const weathercode = data.daily.weathercode[0];

  // Déterminer la condition simplifiée
  const condition = determineWeatherCondition(temperature, precipitation, weathercode);
  const impact = calculateWeatherImpact(condition, temperature, precipitation);

  return {
    condition,
    temperature_avg: temperature,
    precipitation_mm: precipitation,
    impact_percent: impact,
  };
}

/**
 * Détermine la condition météo simplifiée à partir des données brutes
 */
function determineWeatherCondition(
  temperature: number,
  precipitation: number,
  weathercode: number
): 'beau' | 'moyen' | 'mauvais' {
  // Codes météo WMO (Open-Meteo)
  // 0: ciel dégagé
  // 1-3: nuageux
  // 45-48: brouillard
  // 51-67: pluie
  // 71-77: neige
  // 80-99: averses/orages

  // Mauvais temps : pluie forte, neige, orages, ou température extrême
  if (
    precipitation > 5 ||
    temperature < 5 ||
    temperature > 35 ||
    weathercode >= 61 // pluie modérée à forte, neige, orages
  ) {
    return 'mauvais';
  }

  // Beau temps : pas de pluie, température agréable, ciel dégagé à partiellement nuageux
  if (
    precipitation === 0 &&
    temperature >= 15 &&
    temperature <= 28 &&
    weathercode <= 3
  ) {
    return 'beau';
  }

  // Moyen : tout le reste
  return 'moyen';
}

/**
 * Calcule l'impact météo sur les ventes (en pourcentage)
 */
function calculateWeatherImpact(
  condition: string,
  temperature: number,
  precipitation: number
): number {
  let impact = 0;

  // Impact de base selon la condition
  switch (condition) {
    case 'beau':
      impact = 5; // +5% par beau temps
      break;
    case 'mauvais':
      impact = -5; // -5% par mauvais temps
      break;
    case 'moyen':
      impact = 0;
      break;
  }

  // Ajustements supplémentaires selon température et précipitations
  // Pluie forte : impact négatif additionnel
  if (precipitation > 10) {
    impact -= 3;
  }

  // Température très basse : impact négatif additionnel
  if (temperature < 0) {
    impact -= 2;
  }

  // Canicule : impact négatif sur certains produits
  if (temperature > 32) {
    impact -= 2;
  }

  // Plafonner l'impact total à ±10%
  return Math.max(-10, Math.min(10, impact));
}

/**
 * Récupère les prévisions météo pour les 7 prochains jours
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherData[]> {
  const forecasts: WeatherData[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const targetDate = addDays(today, i);
    const weather = await getWeatherForDate(latitude, longitude, targetDate);
    forecasts.push(weather);
  }

  return forecasts;
}