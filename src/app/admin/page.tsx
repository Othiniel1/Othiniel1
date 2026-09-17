'use client';

import { useState, useEffect, useMemo } from 'react';
import { sokuMockStore, CommandeGlobaleSOKU } from '@/lib/mock-store';
import { authService, commandeRepository } from '@/lib/services';
import { SuccessBanner } from '@/components/ui/state-cards';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  RotateCcw,
  DollarSign,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPage() {
  const [estAdmin, setEstAdmin] = useState(false);
  const [commandes, setCommandes] = useState<CommandeGlobaleSOKU[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Decision Modal State
  const [modalArbitrageData, setModalArbitrageData] = useState<{
    cmdId: string;
    montant: number;
    motifLitige: string;
    descriptionLitige: string;
  } | null>(null);

  const [decisionChoisie, setDecisionChoisie] = useState<'REMBOURSER_ACHETEUR' | 'DEBLOQUER_VENDEUR'>('REMBOURSER_ACHETEUR');
  const [motifAdmin, setMotifAdmin] = useState('');

  useEffect(() => {
    // Authenticate as ADMIN
    authService.connexion('ADMIN').then((user) => {
      setEstAdmin(user.role === 'ADMIN');
      commandeRepository.listerCommandesGlobales().then(setCommandes);
    });

    const unsubscribe = sokuMockStore.subscribe(() => {
      commandeRepository.listerCommandesGlobales().then(setCommandes);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const litigesEnCours = useMemo(() => {
    return commandes.filter((c) => c.statutGlobal === 'EN_LITIGE');
  }, [commandes]);

  const historiqueCommandes = useMemo(() => {
    return commandes.filter((c) => c.statutGlobal !== 'EN_LITIGE');
  }, [commandes]);

  const executerArbitrage = async () => {
    if (!modalArbitrageData || !motifAdmin.trim()) return;

    try {
      await commandeRepository.trancherLitigeAdmin(modalArbitrageData.cmdId, decisionChoisie, motifAdmin);
      setNotification(`Arbitrage exécuté avec succès pour la commande #${modalArbitrageData.cmdId}. Décision : ${decisionChoisie}.`);
      setModalArbitrageData(null);
      setMotifAdmin('');
    } catch (err: unknown) {
      setErreur((err as Error).message || 'Erreur lors de l’exécution de l’arbitrage');
    }
  };

  if (!estAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-xs font-bold">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-md w-full text-center space-y-3">
          <Lock className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-rose-400">Accès Administrateur Refusé</h2>
          <p className="text-slate-400">Vous devez disposer du rôle SOKU ADMIN pour accéder à l&apos;espace de gouvernance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-12">
        {/* Admin Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" /> SOKU Administration — Gouvernance & Arbitrage
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace d&apos;Arbitrage des Litiges</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Tranchez les litiges gelés, consultez les preuves et débloquez les séquestres en conformité avec les règles de la plateforme.
            </p>
          </div>

          <button
            onClick={() => sokuMockStore.reinitialiserMockStore()}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            title="Réinitialiser l'état prototype"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser Démo
          </button>
        </div>

        {/* Global Notifications */}
        {notification && (
          <SuccessBanner title="Notification Administration" message={notification} onClose={() => setNotification(null)} />
        )}

        {erreur && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-2xl text-xs font-bold flex justify-between items-center">
            <span>⚠️ {erreur}</span>
            <button onClick={() => setErreur(null)} className="text-rose-700">✕</button>
          </div>
        )}

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <div className="bg-rose-950 text-rose-100 p-4 rounded-2xl border border-rose-900 space-y-1">
            <p className="text-rose-400 uppercase text-[10px] tracking-wider">Litiges Actifs en Attente</p>
            <p className="text-2xl font-black text-rose-400">{litigesEnCours.length}</p>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-slate-400 uppercase text-[10px] tracking-wider">Total Commandes Gérées</p>
            <p className="text-2xl font-black text-amber-400">{commandes.length}</p>
          </div>

          <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-900 space-y-1">
            <p className="text-emerald-400 uppercase text-[10px] tracking-wider">Taux Commission Plateforme</p>
            <p className="text-2xl font-black text-emerald-400">5.0%</p>
          </div>
        </div>

        {/* Litiges Actifs Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Litiges Ouverts & Séquestres Gelés ({litigesEnCours.length})
          </h2>

          {litigesEnCours.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200 text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">Aucun litige actif</p>
              <p className="text-slate-500 text-xs">Tous les séquestres fonctionnent normalement sans blocage arbitral.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {litigesEnCours.map((cmd) => (
                <div key={cmd.id} className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">Commande #{cmd.id}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Date : {cmd.dateCreation}</span>
                    </div>
                    <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-lg font-extrabold text-[11px] uppercase">
                      Séquestre Gelé ({cmd.montantTotalGlobal.toLocaleString()} FCFA)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                    <p className="font-extrabold text-rose-900">Motif : {cmd.litigeDetails?.motif || 'Non spécifié'}</p>
                    <p className="text-slate-700 italic">&quot;{cmd.litigeDetails?.description}&quot;</p>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-slate-700">Acheteur : {cmd.acheteurNom} ({cmd.acheteurTelephone})</span>
                    <button
                      onClick={() => setModalArbitrageData({
                        cmdId: cmd.id,
                        montant: cmd.montantTotalGlobal,
                        motifLitige: cmd.litigeDetails?.motif || '',
                        descriptionLitige: cmd.litigeDetails?.description || '',
                      })}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" /> Trancher le Litige
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique Global */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-base font-extrabold text-slate-900">Historique des Commandes de la Plateforme ({historiqueCommandes.length})</h3>
          <div className="space-y-2">
            {historiqueCommandes.map((cmd) => (
              <div key={cmd.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900">Commande #{cmd.id}</span>
                  <span className="text-slate-500 ml-2">Acheteur: {cmd.acheteurNom}</span>
                </div>
                <div className="flex items-center gap-3 font-bold">
                  <span>{cmd.montantTotalGlobal.toLocaleString()} FCFA</span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] uppercase">{cmd.statutGlobal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Arbitrage Modal */}
      {modalArbitrageData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full space-y-4 shadow-xl border border-slate-200 p-6 relative text-xs">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Arbitrage Administratif — Commande #{modalArbitrageData.cmdId}
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">Montant en Séquestre : {modalArbitrageData.montant.toLocaleString()} FCFA</p>
              <p className="text-slate-600">Litige : {modalArbitrageData.motifLitige} - &quot;{modalArbitrageData.descriptionLitige}&quot;</p>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-800">Décision d&apos;Arbitrage SOKU :</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDecisionChoisie('REMBOURSER_ACHETEUR')}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${
                    decisionChoisie === 'REMBOURSER_ACHETEUR' ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Rembourser l&apos;Acheteur (Restaurer les stocks)
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionChoisie('DEBLOQUER_VENDEUR')}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${
                    decisionChoisie === 'DEBLOQUER_VENDEUR' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Débloquer le Séquestre au Vendeur (Conserver commission 5%)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Motif explicatif de la décision :</label>
              <textarea
                required
                rows={3}
                placeholder="Indiquez la justification officielle de l'arbitrage..."
                value={motifAdmin}
                onChange={(e) => setMotifAdmin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setModalArbitrageData(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
                Annuler
              </button>
              <button
                onClick={executerArbitrage}
                disabled={!motifAdmin.trim()}
                className={`px-4 py-2 font-extrabold rounded-xl shadow-xs ${
                  motifAdmin.trim() ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Valider Décision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
