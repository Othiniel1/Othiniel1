'use client';

import { useState, useEffect, useMemo } from 'react';
import { sokuMockStore } from '@/lib/mock-store';
import { MockMissionLivreur } from '@/lib/mock-data';
import { contratMoteurLivreur } from '@/lib/algorithmes/livreur';
import { ContactModal } from '@/components/ui/contact-modal';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  History,
  DollarSign,
} from 'lucide-react';

export default function LivreurPage() {
  const [missions, setMissions] = useState<MockMissionLivreur[]>([]);
  const [ongletActif, setOngletActif] = useState<'missions' | 'historique'>('missions');
  const [notification, setNotification] = useState<string | null>(null);

  // Contact Modal State
  const [modalContactData, setModalContactData] = useState<{
    nom: string;
    role: 'LIVREUR' | 'CLIENT';
    tel: string;
    cmdId: string;
  } | null>(null);

  // Background Insight Performance Card (Native UX Feature)
  const [rendementTemps, setRendementTemps] = useState<{
    constat: string;
    explication: string;
    recommandation: string;
  } | null>(null);

  useEffect(() => {
    setMissions(sokuMockStore.getMissionsLivreur());

    contratMoteurLivreur.analyser('livreur_001', {
      zoneActuelle: 'Cocody Vallon',
      estDisponible: true,
    }).then((res) => {
      setRendementTemps({
        constat: res.constat,
        explication: res.explication,
        recommandation: res.recommandation,
      });
    });

    const unsubscribe = sokuMockStore.subscribe(() => {
      setMissions(sokuMockStore.getMissionsLivreur());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const missionsEnCoursOuProposees = useMemo(() => {
    return missions.filter((m) => m.statut !== 'TERMINEE' && m.statut !== 'REFUSEE');
  }, [missions]);

  const missionsHistorique = useMemo(() => {
    return missions.filter((m) => m.statut === 'TERMINEE' || m.statut === 'REFUSEE');
  }, [missions]);

  const totalGainsSimules = useMemo(() => {
    return missions
      .filter((m) => m.statut === 'TERMINEE')
      .reduce((acc, m) => acc + m.remunerationProposeeFCFA, 0);
  }, [missions]);

  const accepterMission = (id: string) => {
    sokuMockStore.mettreAJourStatutMissionLivreur(id, 'EN_COURS');
    setNotification(`Mission #${id} acceptée. Suivez le trajet vers le Point de Collecte.`);
  };

  const declinerMission = (id: string) => {
    sokuMockStore.mettreAJourStatutMissionLivreur(id, 'REFUSEE');
    setNotification(`Mission #${id} déclinée. Une autre mission vous sera proposée dès disponibilité.`);
  };

  const terminerMission = (id: string) => {
    sokuMockStore.mettreAJourStatutMissionLivreur(id, 'TERMINEE');
    setNotification(`Mission #${id} validée et terminée ! Les fonds sont débloqués.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Driver Standalone App Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Truck className="w-4 h-4" /> SOKU Livreur — Partenaire Transport
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Exécution & Tournées</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Consultez les missions proposées, optimisez votre temps de parcours et gérez vos livraisons.
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

        {/* Global Notification Banner */}
        {notification && (
          <SuccessBanner title="Notification Livreur" message={notification} onClose={() => setNotification(null)} />
        )}

        {/* Driver Earnings Summary Card */}
        <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total des Gains Simulés (Missions Effectuées)</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                {totalGainsSimules.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
            <span>Missions accomplies: <strong>{missionsHistorique.filter(m => m.statut === 'TERMINEE').length}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Missions refusées: <strong>{missionsHistorique.filter(m => m.statut === 'REFUSEE').length}</strong></span>
          </div>
        </div>

        {/* Driver Mobile Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-around text-xs font-bold">
          <button
            onClick={() => setOngletActif('missions')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'missions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" /> Missions Actives ({missionsEnCoursOuProposees.length})
          </button>
          <button
            onClick={() => setOngletActif('historique')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'historique' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" /> Bilan & Historique ({missionsHistorique.length})
          </button>
        </div>

        {/* TAB 1: MISSIONS ACTIVES */}
        {ongletActif === 'missions' && (
          <div className="space-y-4">
            {/* Driver Decision Governance Banner */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 text-xs space-y-1">
              <p className="font-extrabold text-amber-400 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Principe SOKU : Le livreur conserve la liberté totale d&apos;acceptation
              </p>
              <p className="text-slate-300">
                SOKU propose des missions mutualisées ou directes. Vous êtes seul décideur d&apos;accepter ou de décliner chaque mission.
              </p>
            </div>

            {/* Missions List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                Missions Proposées & En Cours ({missionsEnCoursOuProposees.length})
              </h2>

              {missionsEnCoursOuProposees.length === 0 ? (
                <EmptyState
                  title="Aucune mission active"
                  description="Les nouvelles demandes de livraison prêtes s'afficheront ici automatiquement."
                  icon={Truck}
                />
              ) : (
                <div className="space-y-4">
                  {missionsEnCoursOuProposees.map((miss) => (
                    <div key={miss.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">Mission #{miss.id}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase ml-2">
                            Type : {miss.typeMission}
                          </span>
                        </div>
                        <span className="text-sm font-black text-amber-600">
                          {miss.remunerationProposeeFCFA.toLocaleString()} FCFA
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Point de Collecte :</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {miss.pointRetraitNom}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Point SOKU Livraison :</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {miss.pointLivraisonNom}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span>Distance estimée : <strong>{miss.distanceKm} km</strong></span>
                        <span>Statut mission : <strong className="uppercase text-amber-800">{miss.statut}</strong></span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                        {miss.clientTelephone && (
                          <button
                            onClick={() => setModalContactData({ nom: 'Acheteur SOKU', role: 'CLIENT', tel: miss.clientTelephone!, cmdId: miss.commandeId })}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="w-3.5 h-3.5" /> Appeler Acheteur
                          </button>
                        )}

                        <div className="flex gap-2 ml-auto">
                          {miss.statut === 'PROPOSEE' && (
                            <>
                              <button onClick={() => declinerMission(miss.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Décliner
                              </button>
                              <button onClick={() => accepterMission(miss.id)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Accepter
                              </button>
                            </>
                          )}

                          {miss.statut === 'EN_COURS' && (
                            <button onClick={() => terminerMission(miss.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                              <CheckCircle className="w-4 h-4" /> Valider Livraison Effectuée
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIQUE DES MISSIONS */}
        {ongletActif === 'historique' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Historique des Courses ({missionsHistorique.length})
            </h2>

            {missionsHistorique.length === 0 ? (
              <EmptyState
                title="Aucune mission archivée"
                description="Vos missions terminées ou refusées apparaîtront dans cette section."
                icon={History}
              />
            ) : (
              <div className="space-y-3">
                {missionsHistorique.map((miss) => (
                  <div key={miss.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-900 text-sm">Mission #{miss.id}</span>
                      <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] ${
                        miss.statut === 'TERMINEE' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {miss.statut}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span>Trajet : {miss.pointRetraitNom} → {miss.pointLivraisonNom}</span>
                      <span className="font-bold text-slate-900">{miss.remunerationProposeeFCFA.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Native Performance Insight Banner */}
        {rendementTemps && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rendement par Temps Immobilisé & Capacité</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold uppercase">
                Analyse Temps
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-600" /> Temps d&apos;attente</p>
                <p className="text-slate-700">{rendementTemps.constat}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-600" /> Recommandation</p>
                <p className="text-slate-700">{rendementTemps.recommandation}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Contact Direct Modal */}
      {modalContactData && (
        <ContactModal
          isOpen={!!modalContactData}
          onClose={() => setModalContactData(null)}
          destinataireNom={modalContactData.nom}
          destinataireRole={modalContactData.role}
          destinataireTelephone={modalContactData.tel}
          commandeId={modalContactData.cmdId}
        />
      )}
    </div>
  );
}
