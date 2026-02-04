import { sql } from '@vercel/postgres';

export { sql };

// Helper function pour exécuter des requêtes
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await sql.query(text, params);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount || 0,
  };
}

// Types de base
export interface User {
  id: number;
  email: string;
  password_hash: string;
  shop_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
}

export interface Product {
  id: number;
  user_id: number;
  name: string;
  category: string | null;
  business_importance: 'coeur' | 'secondaire' | 'opportuniste';
  active: boolean;
  created_at: Date;
}

export interface DailySale {
  id: number;
  user_id: number;
  product_id: number;
  sale_date: string;
  quantity_sold: number;
  quantity_unsold: number;
  created_at: Date;
}

export interface Recommendation {
  id: number;
  user_id: number;
  product_id: number;
  recommendation_date: string;
  generated_at: Date;
  quantity_standard: number;
  quantity_prudent: number;
  confidence_level: number | null;
  weather_condition: string | null;
  weather_impact_percent: number | null;
  season: string | null;
  day_of_week: string | null;
  active_cultural_events: string[] | null;
  active_exceptional_events: string[] | null;
  j7_value: number | null;
  j14_value: number | null;
  j365_value: number | null;
  j7_weight: number | null;
  j14_weight: number | null;
  j365_weight: number | null;
  total_adjustment_percent: number | null;
}

export interface ProductionDecision {
  id: number;
  recommendation_id: number;
  user_id: number;
  product_id: number;
  decision_date: string;
  final_quantity: number;
  chose_standard: boolean | null;
  chose_prudent: boolean | null;
  chose_custom: boolean | null;
  notes: string | null;
  validated_at: Date;
}

export interface CulturalCalendar {
  id: number;
  name: string;
  type: 'catholique' | 'musulman' | 'juif' | 'commercial' | 'custom';
  description: string | null;
}

export interface CulturalEvent {
  id: number;
  calendar_id: number;
  name: string;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  is_fixed_date: boolean;
  default_impact_percent: number;
  affected_categories: string[] | null;
}

export interface ExceptionalEvent {
  id: number;
  user_id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  impact_percent: number;
  affected_categories: string[] | null;
  notes: string | null;
  created_at: Date;
}

export interface WeatherCache {
  id: number;
  latitude: number;
  longitude: number;
  forecast_date: string;
  temperature_avg: number | null;
  precipitation_mm: number | null;
  weather_condition: string | null;
  fetched_at: Date;
}