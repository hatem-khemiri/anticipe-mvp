'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
        setShopName(data.shopName);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

          <div>
            <label className="label">Adresse</label>
            <p className="text-gray-900">{userData?.address}</p>
            <p className="text-xs text-gray-500 mt-1">Modification de l'adresse à venir</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <span className="spinner"></span> : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Autres paramètres</h2>
        <p className="text-gray-500 text-sm">Fonctionnalités à venir</p>
      </div>
    </div>
  );
}