'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function LivreurPage() {
  const [missions, setMissions] = useState<MockMissionLivreur[]>([]);
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

    // Quiet background call to prepare time-based yield estimates
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

  // Drivers make explicit choices on missions ("SOKU propose, le livreur décide")
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
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <SuccessBanner
            title="Notification Livreur"
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Native Insight Performance Banner for Driver (Focus on Time & Capacity) */}
        {rendementTemps && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rendement par Temps Immobilisé & Capacité</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold uppercase">
                Analyse de Temps
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Temps de Prise en Charge & Attente
                </p>
                <p className="text-slate-700">{rendementTemps.constat}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Conseil de Mutualisation des Parcours
                </p>
                <p className="text-slate-700">{rendementTemps.recommandation}</p>
              </div>
            </div>

            <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-300 text-xs text-amber-950 font-medium">
              <p className="font-bold text-amber-950 mb-0.5">Note sur l&apos;Optimisation du Temps :</p>
              <p>{rendementTemps.explication}</p>
            </div>
          </div>
        )}

        {/* Driver Decision Governance Banner */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 text-xs space-y-1">
          <p className="font-extrabold text-amber-400 flex items-center gap-1.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Principe SOKU : Le livreur conserve la liberté totale d&apos;acceptation
          </p>
          <p className="text-slate-300">
            SOKU propose des missions mutualisées ou directes. Vous êtes seul décideur d&apos;accepter ou de décliner chaque mission selon vos disponibilités et votre trajet.
          </p>
        </div>

        {/* Missions List for Livreur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Missions Proposées ({missions.filter((m) => m.statut !== 'REFUSEE').length})
          </h2>

          {missions.filter((m) => m.statut !== 'REFUSEE').length === 0 ? (
            <EmptyState
              title="Aucune mission disponible"
              description="Les nouvelles demandes de livraison prêtes s'afficheront ici automatiquement."
              icon={Truck}
            />
          ) : (
            <div className="space-y-4">
              {missions
                .filter((m) => m.statut !== 'REFUSEE')
                .map((miss) => (
                  <div key={miss.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5 text-xs">
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

                    {/* Routing Details & Operational Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Point de Collecte :</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> {miss.pointRetraitNom}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Point SOKU Livraison :</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> {miss.pointLivraisonNom}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                      <span>Distance estimée : <strong>{miss.distanceKm} km</strong></span>
                      <span>Statut mission : <strong className="uppercase text-amber-800">{miss.statut}</strong></span>
                    </div>

                    {/* Mission Decision Controls ("SOKU propose, le livreur décide") */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      {miss.clientTelephone && (
                        <button
                          onClick={() =>
                            setModalContactData({
                              nom: 'Acheteur SOKU',
                              role: 'CLIENT',
                              tel: miss.clientTelephone!,
                              cmdId: miss.commandeId,
                            })
                          }
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="w-3.5 h-3.5" /> Appeler Acheteur
                        </button>
                      )}

                      <div className="flex gap-2 ml-auto">
                        {miss.statut === 'PROPOSEE' && (
                          <>
                            <button
                              onClick={() => declinerMission(miss.id)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Décliner
                            </button>
                            <button
                              onClick={() => accepterMission(miss.id)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Accepter la Mission
                            </button>
                          </>
                        )}

                        {miss.statut === 'EN_COURS' && (
                          <button
                            onClick={() => terminerMission(miss.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> Valider Livraison Effectuée
                          </button>
                        )}

                        {miss.statut === 'TERMINEE' && (
                          <span className="bg-emerald-100 text-emerald-900 font-extrabold px-3 py-1 rounded-xl">
                            Mission Terminée
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
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
