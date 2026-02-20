'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ ATTENTION : Cette action est irréversible !\n\nVoulez-vous vraiment supprimer votre compte et TOUTES vos données ?\n\n- Tous vos produits\n- Toutes vos ventes\n- Toutes vos recommandations\n\nTapez "SUPPRIMER" pour confirmer')) {
      return;
    }

    const confirmation = prompt('Tapez "SUPPRIMER" en majuscules pour confirmer :');
    
    if (confirmation !== 'SUPPRIMER') {
      alert('Suppression annulée.');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Compte supprimé avec succès. Vous allez être redirigé.');
        await signOut({ callbackUrl: '/login', redirect: true });
      } else {
        const data = await response.json();
        alert(`Erreur : ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

      {/* Section informations - À venir */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations du commerce</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      {/* Section localisation - À venir */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Localisation</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      {/* Section calendriers - À venir */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Calendriers culturels</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      {/* Danger Zone */}
      <div className="card bg-red-50 border border-red-200">
        <h2 className="text-xl font-semibold text-red-800 mb-4">Zone de danger</h2>
        <p className="text-sm text-red-600 mb-4">
          ⚠️ Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="btn btn-danger"
        >
          {deleting ? (
            <span className="spinner"></span>
          ) : (
            '🗑️ Supprimer mon compte et toutes mes données'
          )}
        </button>
      </div>
    </div>
  );
}