'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
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

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations du commerce</h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Nom du commerce</label>
            <p className="text-gray-900 font-medium">{userData?.shopName}</p>
          </div>

          <div>
            <label className="label">Email</label>
            <p className="text-gray-900">{userData?.email}</p>
          </div>

          <div>
            <label className="label">Adresse</label>
            <p className="text-gray-900">{userData?.address}</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Autres paramètres</h2>
        <p className="text-gray-500 text-sm">Fonctionnalités à venir</p>
      </div>
    </div>
  );
}