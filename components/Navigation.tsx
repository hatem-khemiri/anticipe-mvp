'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord' },
    { href: '/dashboard/sales', label: 'Saisie des ventes' },
    { href: '/dashboard/recommendations', label: 'Recommandations' },
    { href: '/dashboard/products', label: 'Produits' },
    { href: '/dashboard/events', label: 'Événements' },
    { href: '/dashboard/settings', label: 'Paramètres' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                🥖 Bakery Forecast
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-sm text-gray-700 mr-4">{user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="btn btn-secondary"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}