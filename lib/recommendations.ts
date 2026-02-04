import { query, Product, DailySale, CulturalEvent, ExceptionalEvent } from './db';
import { getWeatherForDate } from './weather';
import { addDays, format, subDays, subYears, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecommendationInput {
  userId: number;
  productId: number;
  targetDate: Date;
  latitude: number;
  longitude: number;
}

interface RecommendationResult {
  productId: number;
  productName: string;
  quantityStandard: number;
  quantityPrudent: number;
  confidenceLevel: number;
  weatherCondition: string;
  weatherImpact: number;
  season: string;
  dayOfWeek: string;
  activeCulturalEvents: string[];
  activeExceptionalEvents: string[];
  historicalData: {
    j7: number | null;
    j14: number | null;
    j365: number | null;
  };
  weights: {
    j7: number;
    j14: number;
    j365: number;
  };
  totalAdjustment: number;
  explanation: string;
}

/**
 * Génère les recommandations pour tous les produits d'un utilisateur pour une date donnée
 */
export async function generateRecommendations(
  userId: number,
  targetDate: Date,
  latitude: number,
  longitude: number
): Promise<RecommendationResult[]> {
  // Récupérer tous les produits actifs
  const productsResult = await query<Product>(
    'SELECT * FROM products WHERE user_id = $1 AND active = TRUE ORDER BY name',
    [userId]
  );

  const products = productsResult.rows;

  // Générer une recommandation pour chaque produit
  const recommendations: RecommendationResult[] = [];

  for (const product of products) {
    const recommendation = await generateProductRecommendation({
      userId,
      productId: product.id,
      targetDate,
      latitude,
      longitude,
    });

    recommendations.push(recommendation);
  }

  // Sauvegarder les recommandations en base
  await saveRecommendations(userId, targetDate, recommendations);

  return recommendations;
}

/**
 * Génère la recommandation pour un produit spécifique
 */
async function generateProductRecommendation(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const { userId, productId, targetDate, latitude, longitude } = input;

  // 1. Récupérer les données historiques
  const historical = await getHistoricalSales(userId, productId, targetDate);

  // 2. Calculer les poids adaptatifs
  const weights = calculateAdaptiveWeights(historical);

  // 3. Calculer la base historique pondérée
  let baseQuantity = calculateWeightedBase(historical, weights);

  // 4. Récupérer les contextes actifs
  const weather = await getWeatherForDate(latitude, longitude, targetDate);
  const season = getSeason(targetDate);
  const dayOfWeek = format(targetDate, 'EEEE', { locale: fr });
  const culturalEvents = await getActiveCulturalEvents(userId, targetDate);
  const exceptionalEvents = await getActiveExceptionalEvents(userId, targetDate);

  // 5. Calculer les ajustements contextuels
  let totalAdjustment = 0;

  // Météo
  totalAdjustment += weather.impact_percent;

  // Événements culturels
  const culturalImpact = culturalEvents.reduce(
    (sum, event) => sum + event.default_impact_percent,
    0
  );
  totalAdjustment += Math.min(culturalImpact, 10); // Plafonné à +10%

  // Événements exceptionnels
  const exceptionalImpact = exceptionalEvents.reduce(
    (sum, event) => sum + event.impact_percent,
    0
  );
  totalAdjustment += Math.min(exceptionalImpact, 10); // Plafonné à +10%

  // Plafonner l'ajustement total à ±15%
  totalAdjustment = Math.max(-15, Math.min(15, totalAdjustment));

  // 6. Appliquer l'ajustement
  const adjustedQuantity = Math.round(baseQuantity * (1 + totalAdjustment / 100));

  // 7. Calculer les scénarios
  const quantityStandard = Math.max(0, adjustedQuantity);
  const quantityPrudent = Math.max(0, Math.round(quantityStandard * 0.9));

  // 8. Calculer le niveau de confiance
  const confidenceLevel = calculateConfidenceLevel(historical, weights);

  // 9. Récupérer le nom du produit
  const productResult = await query<Product>(
    'SELECT name FROM products WHERE id = $1',
    [productId]
  );
  const productName = productResult.rows[0]?.name || 'Produit inconnu';

  // 10. Générer l'explication
  const explanation = generateExplanation({
    baseQuantity,
    adjustedQuantity,
    totalAdjustment,
    weather,
    culturalEvents,
    exceptionalEvents,
    historical,
    weights,
  });

  return {
    productId,
    productName,
    quantityStandard,
    quantityPrudent,
    confidenceLevel,
    weatherCondition: weather.condition,
    weatherImpact: weather.impact_percent,
    season,
    dayOfWeek,
    activeCulturalEvents: culturalEvents.map((e) => e.name),
    activeExceptionalEvents: exceptionalEvents.map((e) => e.name),
    historicalData: {
      j7: historical.j7,
      j14: historical.j14,
      j365: historical.j365,
    },
    weights,
    totalAdjustment,
    explanation,
  };
}

/**
 * Récupère les ventes historiques pour J-7, J-14, J-365
 */
async function getHistoricalSales(
  userId: number,
  productId: number,
  targetDate: Date
): Promise<{ j7: number | null; j14: number | null; j365: number | null }> {
  const j7Date = format(subDays(targetDate, 7), 'yyyy-MM-dd');
  const j14Date = format(subDays(targetDate, 14), 'yyyy-MM-dd');
  const j365Date = format(subYears(targetDate, 1), 'yyyy-MM-dd');

  const j7Result = await query<DailySale>(
    'SELECT quantity_sold FROM daily_sales WHERE user_id = $1 AND product_id = $2 AND sale_date = $3',
    [userId, productId, j7Date]
  );

  const j14Result = await query<DailySale>(
    'SELECT quantity_sold FROM daily_sales WHERE user_id = $1 AND product_id = $2 AND sale_date = $3',
    [userId, productId, j14Date]
  );

  const j365Result = await query<DailySale>(
    'SELECT quantity_sold FROM daily_sales WHERE user_id = $1 AND product_id = $2 AND sale_date = $3',
    [userId, productId, j365Date]
  );

  return {
    j7: j7Result.rows[0]?.quantity_sold || null,
    j14: j14Result.rows[0]?.quantity_sold || null,
    j365: j365Result.rows[0]?.quantity_sold || null,
  };
}

/**
 * Calcule les poids adaptatifs en fonction des données disponibles
 */
function calculateAdaptiveWeights(historical: {
  j7: number | null;
  j14: number | null;
  j365: number | null;
}): { j7: number; j14: number; j365: number } {
  const hasJ7 = historical.j7 !== null;
  const hasJ14 = historical.j14 !== null;
  const hasJ365 = historical.j365 !== null;

  // Si aucune donnée historique, retourner des poids nuls
  if (!hasJ7 && !hasJ14 && !hasJ365) {
    return { j7: 0, j14: 0, j365: 0 };
  }

  // Cas 1 : Toutes les données disponibles (poids standard)
  if (hasJ7 && hasJ14 && hasJ365) {
    return { j7: 40, j14: 20, j365: 40 };
  }

  // Cas 2 : J-7 et J-14 disponibles, pas J-365
  if (hasJ7 && hasJ14 && !hasJ365) {
    return { j7: 60, j14: 40, j365: 0 };
  }

  // Cas 3 : Uniquement J-7 disponible
  if (hasJ7 && !hasJ14 && !hasJ365) {
    return { j7: 100, j14: 0, j365: 0 };
  }

  // Cas 4 : J-7 et J-365 disponibles, pas J-14
  if (hasJ7 && !hasJ14 && hasJ365) {
    return { j7: 50, j14: 0, j365: 50 };
  }

  // Autres cas : distribuer équitablement les poids disponibles
  const availableCount = [hasJ7, hasJ14, hasJ365].filter(Boolean).length;
  const equalWeight = 100 / availableCount;

  return {
    j7: hasJ7 ? equalWeight : 0,
    j14: hasJ14 ? equalWeight : 0,
    j365: hasJ365 ? equalWeight : 0,
  };
}

/**
 * Calcule la quantité de base pondérée
 */
function calculateWeightedBase(
  historical: { j7: number | null; j14: number | null; j365: number | null },
  weights: { j7: number; j14: number; j365: number }
): number {
  let sum = 0;
  let totalWeight = 0;

  if (historical.j7 !== null && weights.j7 > 0) {
    sum += historical.j7 * (weights.j7 / 100);
    totalWeight += weights.j7;
  }

  if (historical.j14 !== null && weights.j14 > 0) {
    sum += historical.j14 * (weights.j14 / 100);
    totalWeight += weights.j14;
  }

  if (historical.j365 !== null && weights.j365 > 0) {
    sum += historical.j365 * (weights.j365 / 100);
    totalWeight += weights.j365;
  }

  // Si aucune donnée historique, retourner 0
  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(sum);
}

/**
 * Calcule le niveau de confiance (0-100)
 */
function calculateConfidenceLevel(
  historical: { j7: number | null; j14: number | null; j365: number | null },
  weights: { j7: number; j14: number; j365: number }
): number {
  // Base : 50% si au moins une donnée historique
  let confidence = 50;

  // +20% pour J-7
  if (historical.j7 !== null) confidence += 20;

  // +15% pour J-14
  if (historical.j14 !== null) confidence += 15;

  // +15% pour J-365
  if (historical.j365 !== null) confidence += 15;

  return Math.min(100, confidence);
}

/**
 * Récupère les événements culturels actifs pour une date donnée
 */
async function getActiveCulturalEvents(
  userId: number,
  targetDate: Date
): Promise<CulturalEvent[]> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const result = await query<CulturalEvent>(
    `SELECT ce.* 
     FROM cultural_events ce
     JOIN user_calendars uc ON uc.calendar_id = ce.calendar_id
     WHERE uc.user_id = $1 
     AND uc.is_active = TRUE
     AND ce.start_date <= $2
     AND (ce.end_date IS NULL OR ce.end_date >= $2)`,
    [userId, dateStr]
  );

  return result.rows;
}

/**
 * Récupère les événements exceptionnels actifs pour une date donnée
 */
async function getActiveExceptionalEvents(
  userId: number,
  targetDate: Date
): Promise<ExceptionalEvent[]> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const result = await query<ExceptionalEvent>(
    `SELECT * FROM exceptional_events
     WHERE user_id = $1
     AND start_date <= $2
     AND (end_date IS NULL OR end_date >= $2)`,
    [userId, dateStr]
  );

  return result.rows;
}

/**
 * Détermine la saison en fonction de la date
 */
function getSeason(date: Date): string {
  const month = date.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

/**
 * Génère une explication textuelle de la recommandation
 */
function generateExplanation(params: {
  baseQuantity: number;
  adjustedQuantity: number;
  totalAdjustment: number;
  weather: any;
  culturalEvents: CulturalEvent[];
  exceptionalEvents: ExceptionalEvent[];
  historical: { j7: number | null; j14: number | null; j365: number | null };
  weights: { j7: number; j14: number; j365: number };
}): string {
  const parts: string[] = [];

  // Base historique
  if (params.baseQuantity > 0) {
    parts.push(`Base : ${params.baseQuantity} unités (calculée à partir de l'historique)`);
  } else {
    parts.push('Aucune donnée historique disponible');
  }

  // Ajustement météo
  if (params.weather.impact_percent !== 0) {
    const sign = params.weather.impact_percent > 0 ? '+' : '';
    parts.push(
      `Météo (${params.weather.condition}) : ${sign}${params.weather.impact_percent}%`
    );
  }

  // Événements culturels
  if (params.culturalEvents.length > 0) {
    const names = params.culturalEvents.map((e) => e.name).join(', ');
    parts.push(`Événements culturels actifs : ${names}`);
  }

  // Événements exceptionnels
  if (params.exceptionalEvents.length > 0) {
    const names = params.exceptionalEvents.map((e) => e.name).join(', ');
    parts.push(`Événements exceptionnels : ${names}`);
  }

  // Ajustement total
  if (params.totalAdjustment !== 0) {
    const sign = params.totalAdjustment > 0 ? '+' : '';
    parts.push(`Ajustement total : ${sign}${params.totalAdjustment}%`);
  }

  return parts.join(' • ');
}

/**
 * Sauvegarde les recommandations en base de données
 */
async function saveRecommendations(
  userId: number,
  targetDate: Date,
  recommendations: RecommendationResult[]
): Promise<void> {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  for (const rec of recommendations) {
    await query(
      `INSERT INTO recommendations (
        user_id, product_id, recommendation_date,
        quantity_standard, quantity_prudent, confidence_level,
        weather_condition, weather_impact_percent,
        season, day_of_week,
        active_cultural_events, active_exceptional_events,
        j7_value, j14_value, j365_value,
        j7_weight, j14_weight, j365_weight,
        total_adjustment_percent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (user_id, product_id, recommendation_date) 
      DO UPDATE SET
        quantity_standard = $4,
        quantity_prudent = $5,
        confidence_level = $6,
        weather_condition = $7,
        weather_impact_percent = $8,
        season = $9,
        day_of_week = $10,
        active_cultural_events = $11,
        active_exceptional_events = $12,
        j7_value = $13,
        j14_value = $14,
        j365_value = $15,
        j7_weight = $16,
        j14_weight = $17,
        j365_weight = $18,
        total_adjustment_percent = $19,
        generated_at = NOW()`,
      [
        userId,
        rec.productId,
        dateStr,
        rec.quantityStandard,
        rec.quantityPrudent,
        rec.confidenceLevel,
        rec.weatherCondition,
        rec.weatherImpact,
        rec.season,
        rec.dayOfWeek,
        rec.activeCulturalEvents,
        rec.activeExceptionalEvents,
        rec.historicalData.j7,
        rec.historicalData.j14,
        rec.historicalData.j365,
        rec.weights.j7,
        rec.weights.j14,
        rec.weights.j365,
        rec.totalAdjustment,
      ]
    );
  }
}