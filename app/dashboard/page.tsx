import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, DailySale, Product } from '@/lib/db';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const userId = parseInt(session.user.id);
  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  // Vérifier si des ventes ont été saisies hier
  const yesterdaySales = await query<DailySale>(
    'SELECT COUNT(*) as count FROM daily_sales WHERE user_id = $1 AND sale_date = $2',
    [userId, format(yesterday, 'yyyy-MM-dd')]
  );

  const hasYesterdaySales = yesterdaySales.rows[0]?.count > 0;

  // Vérifier si des recommandations existent pour demain
  const tomorrowRecs = await query(
    'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1 AND recommendation_date = $2',
    [userId, format(tomorrow, 'yyyy-MM-dd')]
  );

  const hasTomorrowRecs = tomorrowRecs.rows[0]?.count > 0;

  // Nombre de produits actifs
  const productsCount = await query<Product>(
    'SELECT COUNT(*) as count FROM products WHERE user_id = $1 AND active = TRUE',
    [userId]
  );

  const totalProducts = productsCount.rows[0]?.count || 0;

  // Dernières ventes (5 derniers jours)
  const recentSales = await query<{ sale_date: string; total: number }>(
    `SELECT sale_date, SUM(quantity_sold) as total
     FROM daily_sales
     WHERE user_id = $1 AND sale_date >= $2
     GROUP BY sale_date
     ORDER BY sale_date DESC
     LIMIT 5`,
    [userId, format(subDays(today, 5), 'yyyy-MM-dd')]
  );

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link
          href="/dashboard/sales"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Saisir les ventes
              </h3>
              <p className="text-sm text-gray-500">
                {hasYesterdaySales ? '✓ Hier saisi' : '⚠️ À saisir'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/recommendations"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Recommandations
              </h3>
              <p className="text-sm text-gray-500">
                {hasTomorrowRecs ? '✓ Disponibles' : 'À générer'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/products"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Gérer les produits
              </h3>
              <p className="text-sm text-gray-500">
                {totalProducts} produit{totalProducts > 1 ? 's' : ''} actif{totalProducts > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Ventes récentes */}
      {recentSales.rows.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Ventes récentes
          </h2>
          <div className="space-y-2">
            {recentSales.rows.map((sale) => (
              <div
                key={sale.sale_date}
                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
              >
                <span className="text-sm text-gray-600">
                  {format(new Date(sale.sale_date), 'EEEE d MMMM', { locale: fr })}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {sale.total} unités vendues
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message d'aide pour les nouveaux utilisateurs */}
      {totalProducts === 0 && (
        <div className="card bg-blue-50 border border-blue-200 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Commencez par configurer vos produits
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Pour utiliser l'application, vous devez d'abord{' '}
                  <Link
                    href="/dashboard/products"
                    className="font-medium underline"
                  >
                    ajouter vos produits
                  </Link>
                  , puis saisir vos ventes quotidiennes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}