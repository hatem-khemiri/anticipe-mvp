'use client';

import { useState, useEffect } from 'react';
import { DeleteAccountButton } from '../delete-account-button';

interface Calendar {
  calendar_name: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [shopName, setShopName] = useState('');
  
  // Adresse
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressChanged, setAddressChanged] = useState(false);
  
  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchCalendars();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
        setShopName(data.shopName);
        
        // Parser l'adresse
        if (data.address) {
          const addressParts = data.address.split(',');
          if (addressParts.length >= 3) {
            setStreetAddress(addressParts[0].trim());
            const postalCity = addressParts[1].trim().split(' ');
            setPostalCode(postalCity[0]);
            setCity(postalCity.slice(1).join(' '));
            setCountry(addressParts[2].trim());
          }
        }
        
        setLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const defaultCalendars = [
        { calendar_name: 'catholic', is_active: true },
        { calendar_name: 'muslim', is_active: true },
        { calendar_name: 'jewish', is_active: true },
        { calendar_name: 'hindu', is_active: false },
        { calendar_name: 'chinese', is_active: false },
        { calendar_name: 'commercial', is_active: true },
      ];

      const response = await fetch('/api/user/calendars');
      const data = await response.json();
      
      if (response.ok) {
        if (data.calendars.length === 0) {
          // Aucun calendrier en DB, initialiser
          setCalendars(defaultCalendars);
          
          // Enregistrer dans la DB (en parallèle pour être plus rapide)
          await Promise.all(
            defaultCalendars.map(cal =>
              fetch('/api/user/calendars', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  calendarName: cal.calendar_name,
                  isActive: cal.is_active,
                }),
              })
            )
          );
        } else {
          // Fusionner les calendriers DB avec les defaults
          const mergedCalendars = defaultCalendars.map(defaultCal => {
            const existingCal = data.calendars.find((c: Calendar) => c.calendar_name === defaultCal.calendar_name);
            return existingCal || defaultCal;
          });
          setCalendars(mergedCalendars);
          
          // Si des calendriers manquent en DB, les ajouter
          const missingCalendars = defaultCalendars.filter(
            defaultCal => !data.calendars.find((c: Calendar) => c.calendar_name === defaultCal.calendar_name)
          );
          
          if (missingCalendars.length > 0) {
            await Promise.all(
              missingCalendars.map(cal =>
                fetch('/api/user/calendars', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    calendarName: cal.calendar_name,
                    isActive: cal.is_active,
                  }),
                })
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getLocation = async () => {
    setGeoLoading(true);
    setError('');

    if (!streetAddress || !postalCode || !city) {
      setError('Veuillez remplir l\'adresse complète');
      setGeoLoading(false);
      return;
    }

    try {
      const query = `${streetAddress} ${postalCode} ${city}`;
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`
      );
      
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        const coords = result.geometry.coordinates;
        const props = result.properties;
        
        const validTypes = ['housenumber', 'street'];
        if (!validTypes.includes(props.type)) {
          setError('Adresse trop imprécise. Veuillez saisir un numéro de rue.');
          setGeoLoading(false);
          return;
        }
        
        if (props.postcode !== postalCode) {
          setError(`Code postal incorrect. L'adresse correspond au code postal ${props.postcode}.`);
          setGeoLoading(false);
          return;
        }

        if (props.score < 0.6) {
          setError('Adresse introuvable. Vérifiez l\'orthographe.');
          setGeoLoading(false);
          return;
        }

        setLocation({
          latitude: coords[1],
          longitude: coords[0],
        });
        setAddressChanged(false);
        setSuccess('Adresse géolocalisée avec succès');
        setError('');
      } else {
        setError('Adresse introuvable');
      }
    } catch (err: any) {
      setError(`Erreur : ${err.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSaveName = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Nom du commerce mis à jour !');
        setUserData({ ...userData, shopName });
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setError('');
    setSuccess('');

    if (!location.latitude || !location.longitude) {
      setError('Veuillez géolocaliser l\'adresse');
      return;
    }

    if (addressChanged) {
      setError('Adresse modifiée. Veuillez la géolocaliser à nouveau.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetAddress,
          postalCode,
          city,
          country,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Adresse mise à jour avec succès');
        fetchUserData();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la modification');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSyncCalendars = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/calendars/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          country: 'FR'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ ${data.inserted} événements ajoutés, ${data.updated} mis à jour pour ${data.year}`);
        fetchCalendars();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const toggleCalendar = async (calendarName: string) => {
    const calendar = calendars.find(c => c.calendar_name === calendarName);
    const newStatus = !calendar?.is_active;

    try {
      const response = await fetch('/api/user/calendars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarName,
          isActive: newStatus,
        }),
      });

      if (response.ok) {
        setCalendars(calendars.map(c =>
          c.calendar_name === calendarName ? { ...c, is_active: newStatus } : c
        ));
        setSuccess(`✅ Calendrier ${calendarName} ${newStatus ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du calendrier');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Informations du commerce */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations du commerce</h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Nom du commerce</label>
            <input
              type="text"
              className="input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input bg-gray-100"
              value={userData?.email || ''}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <span className="spinner"></span> : 'Enregistrer le nom'}
          </button>
        </div>
      </div>

      {/* Localisation */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Localisation</h2>
        
        {location.latitude && location.longitude && !addressChanged && (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <p className="text-sm text-green-800">
              ✓ Adresse géolocalisée
            </p>
          </div>
        )}

        {addressChanged && (
          <div className="rounded-md bg-orange-50 p-4 mb-4">
            <p className="text-sm text-orange-800">
              ⚠️ Adresse modifiée. Cliquez sur "Géolocaliser" pour valider.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Numéro et rue</label>
            <input
              type="text"
              className="input"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value);
                setAddressChanged(true);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Code postal</label>
              <input
                type="text"
                className="input"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setAddressChanged(true);
                }}
              />
            </div>

            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                className="input"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setAddressChanged(true);
                }}
              />
            </div>
          </div>

          <div>
            <label className="label">Pays</label>
            <input
              type="text"
              className="input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <button
            onClick={getLocation}
            disabled={geoLoading}
            className="btn btn-secondary w-full"
          >
            {geoLoading ? <span className="spinner"></span> : '📍 Géolocaliser cette adresse'}
          </button>

          <button
            onClick={handleSaveAddress}
            disabled={saving || !location.latitude || addressChanged}
            className="btn btn-primary"
          >
            {saving ? <span className="spinner"></span> : 'Enregistrer l\'adresse'}
          </button>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Modifier le mot de passe</h2>
        
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="btn btn-primary"
          >
            {passwordSaving ? <span className="spinner"></span> : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Synchronisation */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Synchronisation des calendriers</h2>
        <p className="text-sm text-gray-600 mb-4">
          Synchroniser les événements religieux et commerciaux depuis l'API Calendarific pour l'année en cours.
        </p>
        <button
          onClick={handleSyncCalendars}
          disabled={syncing}
          className="btn btn-primary"
        >
          {syncing ? <span className="spinner"></span> : `🔄 Synchroniser les calendriers ${new Date().getFullYear()}`}
        </button>
      </div>

      {/* Calendriers culturels */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Calendriers culturels</h2>
        <p className="text-sm text-gray-600 mb-4">
          Les calendriers activés seront pris en compte dans les recommandations de production.
        </p>

        <div className="space-y-3">
          {[
            { name: 'catholic', label: 'Calendrier catholique', description: 'Noël, Pâques, Toussaint...' },
            { name: 'muslim', label: 'Calendrier musulman', description: 'Ramadan, Aïd al-Fitr, Aïd al-Adha...' },
            { name: 'jewish', label: 'Calendrier judaïque', description: 'Hanoukka, Yom Kippour, Pessah...' },
            { name: 'hindu', label: 'Calendrier hindou', description: 'Diwali, Holi, Navaratri...' },
            { name: 'chinese', label: 'Calendrier chinois', description: 'Nouvel An chinois, Fête de la Mi-Automne...' },
            { name: 'commercial', label: 'Événements commerciaux', description: 'Saint-Valentin, Fête des mères, Black Friday...' },
          ].map((cal) => {
            const calendar = calendars.find(c => c.calendar_name === cal.name);
            const isActive = calendar?.is_active ?? false;

            return (
              <div key={cal.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{cal.label}</p>
                  <p className="text-sm text-gray-500">{cal.description}</p>
                </div>
                <button
                  onClick={() => toggleCalendar(cal.name)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Calendrier d'événements locaux (culturels/sportifs) :</strong> Cette fonctionnalité sera ajoutée prochainement. Elle utilisera votre géolocalisation pour adapter les recommandations aux événements de votre région.
          </p>
        </div>
      </div>

      {/* Suppression */}
      <DeleteAccountButton />
    </div>
  );
}