'use client';

export function DeleteAccountButton() {
  const handleDelete = async () => {
    if (!confirm('⚠️ Supprimer votre compte et TOUTES vos données ?')) return;
    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer :');
    if (confirmation !== 'SUPPRIMER') {
      alert('Suppression annulée');
      return;
    }
    
    try {
      const response = await fetch('/api/user/delete', { method: 'DELETE' });
      if (response.ok) {
        alert('✅ Compte supprimé avec succès');
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert(`❌ Erreur : ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  return (
    <div className="card bg-red-50 border border-red-200 mt-8">
      <h3 className="text-sm font-medium text-red-800 mb-2">
        ⚠️ Suppression de compte
      </h3>
      <p className="text-xs text-red-600 mb-3">
        En cas de problème, vous pouvez supprimer votre compte et toutes vos données ici.
      </p>
      <button
        onClick={handleDelete}
        className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        🗑️ Supprimer mon compte et toutes mes données
      </button>
    </div>
  );
}