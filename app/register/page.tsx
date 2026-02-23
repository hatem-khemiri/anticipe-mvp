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
    streetAddress: '',
    postalCode: '',
    city: '',
    country: 'France',
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
  const [addressChanged, setAddressChanged] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Si l'adresse change, invalider la géolocalisation
    if (name === 'streetAddress' || name === 'postalCode' || name === 'city') {
      setLocation({ latitude: null, longitude: null });
      setAddressChanged(true);
    }
  };

  const getFullAddress = () => {
    return `${formData.streetAddress}, ${formData.postalCode} ${formData.city}, ${formData.country}`;
  };

  const getLocation = async () => {
    setGeoLoading(true);
    setError('');

    if (!formData.streetAddress || !formData.postalCode || !formData.city) {
      setError('Veuillez remplir l\'adresse complète (rue, code postal, ville)');
      setGeoLoading(false);
      return;
    }

    try {
      console.log('Géolocalisation via API Adresse (gouvernement français)');
      
      // Utiliser l'API Adresse officielle française (gratuite, sans limite, très précise)
      const query = `${formData.streetAddress} ${formData.postalCode} ${formData.city}`;
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`
      );
      
      console.log('Status:', response.status);
      const data = await response.json();
      console.log('Réponse complète:', data);

      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        const coords = result.geometry.coordinates; // [longitude, latitude]
        const props = result.properties;
        
        console.log('Type:', props.type);
        console.log('Score:', props.score);
        
        // VÉRIFICATION 1 : Type doit être "housenumber" ou "street" (pas "municipality" ou "locality")
        const validTypes = ['housenumber', 'street'];
        if (!validTypes.includes(props.type)) {
          setError(`❌ Adresse trop imprécise. Type trouvé : "${props.type}". Veuillez saisir un numéro de rue précis (ex: "12 rue de Rivoli" et non juste "Paris").`);
          console.log('❌ Type invalide:', props.type);
          setGeoLoading(false);
          return;
        }
        
        // VÉRIFICATION 2 : Le code postal doit correspondre exactement
        const foundPostalCode = props.postcode;
        if (foundPostalCode !== formData.postalCode) {
          setError(`⚠️ Code postal incorrect. L'adresse trouvée correspond au code postal ${foundPostalCode}. Vérifiez votre saisie.`);
          setGeoLoading(false);
          return;
        }

        // VÉRIFICATION 3 : Score minimum de 0.6 (accepte les abréviations mais rejette les adresses floues)
        const score = props.score;
        if (score < 0.6) {
          setError(`❌ Adresse introuvable ou trop imprécise (score: ${(score * 100).toFixed(0)}%). Vérifiez l'orthographe de la rue.`);
          console.log('❌ Score insuffisant:', score);
          setGeoLoading(false);
          return;
        }

        setLocation({
          latitude: coords[1],  // Latitude
          longitude: coords[0], // Longitude
        });
        setAddressChanged(false);
        setError('');
        console.log('✅ Géolocalisation réussie:', coords[1], coords[0], 'Type:', props.type, 'Score:', score);
      } else {
        setError('❌ Adresse introuvable. Vérifiez l\'orthographe de la rue, du code postal et de la ville.');
        console.log('❌ Aucun résultat trouvé');
      }
    } catch (err: any) {
      console.error('❌ Erreur géolocalisation:', err);
      setError(`Erreur : ${err.message || 'Service de géolocalisation indisponible. Réessayez dans quelques secondes.'}`);
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
      setError('⚠️ Vous devez géolocaliser votre adresse avant de créer votre compte. Cliquez sur "📍 Géolocaliser cette adresse".');
      return;
    }

    if (addressChanged) {
      setError('⚠️ L\'adresse a été modifiée. Veuillez la géolocaliser à nouveau.');
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
          address: getFullAddress(),
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

          {location.latitude && location.longitude && !addressChanged && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                ✓ Adresse géolocalisée avec succès
              </p>
              <p className="text-xs text-green-600 mt-1">
                Coordonnées : {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {addressChanged && (
            <div className="rounded-md bg-orange-50 p-4">
              <p className="text-sm text-orange-800">
                ⚠️ Adresse modifiée. Cliquez sur "Géolocaliser cette adresse" pour valider les changements.
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

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Adresse complète * (nécessaire pour la météo)
              </h3>

              <div className="space-y-3">
                <div>
                  <label htmlFor="streetAddress" className="label">
                    Numéro et rue
                  </label>
                  <input
                    id="streetAddress"
                    name="streetAddress"
                    type="text"
                    required
                    className="input"
                    placeholder="12 rue de la République"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="postalCode" className="label">
                      Code postal
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      required
                      className="input"
                      placeholder="75001"
                      value={formData.postalCode}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="label">
                      Ville
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      className="input"
                      placeholder="Paris"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="label">
                    Pays
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    className="input"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={getLocation}
                  disabled={geoLoading || !formData.streetAddress || !formData.postalCode || !formData.city}
                  className="btn btn-secondary w-full"
                >
                  {geoLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    '📍 Géolocaliser cette adresse'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !location.latitude || addressChanged}
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