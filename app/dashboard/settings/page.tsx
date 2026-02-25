'use client';

import { useState, useEffect } from 'react';
import { DeleteAccountButton } from '../delete-account-button';

export default function SettingsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  
  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  
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

          <div>
            <label className="label">Adresse</label>
            <p className="text-gray-900">{userData?.address}</p>
            <p className="text-xs text-gray-500 mt-1">La modification de l'adresse sera disponible prochainement</p>
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <span className="spinner"></span> : 'Enregistrer les modifications'}
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

      {/* Suppression */}
      <DeleteAccountButton />
    </div>
  );
}