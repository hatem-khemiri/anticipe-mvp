'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    businessType: '',
    address: '',
  });
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getLocation = async () => {
    setGeoLoading(true);
    setError('');

    if (!formData.address) {
      setError('Veuillez entrer une adresse d\'abord');
      setGeoLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setLocation({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
        setError('');
      } else {
        setError('Impossible de trouver cette adresse');
      }
    } catch (err) {
      setError('Erreur lors de la géolocalisation');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.businessType) {
      setError('Veuillez sélectionner un type de commerce');
      return;
    }

    if (!location.latitude || !location.longitude) {
      setError('Veuillez géolocaliser votre adresse');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          shopName: formData.shopName,
          address: formData.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Commencez à anticiper votre production
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {location.latitude && location.longitude && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                ✓ Adresse géolocalisée avec succès
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="shopName" className="label">
                Nom du commerce *
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                required
                className="input"
                placeholder="Ma Boutique"
                value={formData.shopName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="businessType" className="label">
                Type de commerce *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                className="input"
                value={formData.businessType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Sélectionnez...</option>
                <option value="boulangerie">Boulangerie / Pâtisserie</option>
                <option value="restaurant">Restaurant / Traiteur</option>
                <option value="snack">Snack / Sandwicherie</option>
                <option value="cookies">Cookies / Confiserie</option>
                <option value="autre">Autre production alimentaire</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="Minimum 6 caractères"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="address" className="label">
                Adresse complète * (nécessaire pour la météo)
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="input"
                placeholder="12 rue de la République, 75001 Paris"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading || !formData.address}
                className="mt-2 btn btn-secondary w-full"
              >
                {geoLoading ? (
                  <span className="spinner"></span>
                ) : (
                  '📍 Géolocaliser cette adresse'
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !location.latitude}
              className="btn btn-primary w-full"
            >
              {loading ? <span className="spinner"></span> : 'Créer mon compte'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Déjà un compte ? Connectez-vous
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}