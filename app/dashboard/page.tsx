'use client';

import { DeleteAccountButton } from './delete-account-button';

export default function SettingsPage() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations du commerce</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Localisation</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Mot de passe</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Calendriers culturels</h2>
        <p className="text-gray-500 text-sm">Fonctionnalité à venir</p>
      </div>

      {/* Zone de suppression */}
      <DeleteAccountButton />
    </div>
  );
}