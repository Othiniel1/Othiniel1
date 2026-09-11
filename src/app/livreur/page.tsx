'use client';

import { useState, useEffect } from 'react';
import { sokuMockStore } from '@/lib/mock-store';
import { MOCK_POINT_SOKU, MockMissionLivreur } from '@/lib/mock-data';
import { contratMoteurLivreur } from '@/lib/algorithmes/livreur';
import { busEvenements } from '@/lib/evenements/bus';
import { EcosystemNav } from '@/components/ui/ecosystem-nav';
import { ContactModal } from '@/components/ui/contact-modal';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  ShieldCheck,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  Package,
} from 'lucide-react';

type StatutFonctionnel =
  | 'DISPONIBLE'
  | 'EN_MISSION'
  | 'CAPACITE_PARTIELLE'
  | 'FIN_DE_TOURNEE'
  | 'HORS_LIGNE';

type TypeVehicule = 'moto_ktm' | 'scooter_125' | 'velo_cargo' | 'moto_suzuki' | 'mini_camionnette';

export default function LivreurPage() {
  const [statutActuel, setStatutActuel] = useState<StatutFonctionnel>('DISPONIBLE');
  const [vehicule, setVehicule] = useState<TypeVehicule>('moto_ktm');
  const [missions, setMissions] = useState<MockMissionLivreur[]>([]);

  // Contact Modal State
  const [modalContactData, setModalContactData] = useState<{
    nom: string;
    role: 'LIVREUR' | 'CLIENT';
    tel: string;
    cmdId: string;
  } | null>(null);

  // Point SOKU Feedback Modal State
  const [modalFeedbackOuverte, setModalFeedbackOuverte] = useState(false);
  const [niveauFacilite, setNiveauFacilite] = useState<'FACILE' | 'MOYEN' | 'DIFFICILE'>('FACILE');
  const [motifDifficulte, setMotifDifficulte] = useState<string>('GPS imprécis');
  const [notification, setNotification] = useState<string | null>(null);

  // Algorithmic Consultative State (5 Blocks)
  const [rapportAlgo, setRapportAlgo] = useState<{
    donnees: Record<string, unknown>;
    analyse: string;
    constat: string;
    explication: string;
    recommandation: string;
    decisionUtilisateur: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  } | null>(null);

  useEffect(() => {
    setMissions(sokuMockStore.getMissionsLivreur());

    const unsubscribe = sokuMockStore.subscribe(() => {
      setMissions(sokuMockStore.getMissionsLivreur());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const changerStatutMission = (id: string, nouveauStatut: MockMissionLivreur['statut']) => {
    sokuMockStore.mettreAJourStatutMissionLivreur(id, nouveauStatut);

    if (nouveauStatut === 'EN_COURS') {
      setNotification(`Mission #${id} acceptée par le livreur. Vous êtes maintenant en charge de la livraison.`);
      setStatutActuel('EN_MISSION');
    } else if (nouveauStatut === 'REFUSEE') {
      setNotification(`Mission #${id} déclinée. L'algorithme proposera la mission à un autre partenaire disponible.`);
    } else if (nouveauStatut === 'TERMINEE') {
      setNotification(`Mission #${id} validée et clôturée au Point SOKU.`);
      setStatutActuel('DISPONIBLE');
    }
  };

  const declencherAnalyseAlgo = async () => {
    const res = await contratMoteurLivreur.analyser('livreur_001', {
      zoneActuelle: 'Cocody Vallon',
      estDisponible: true,
    });
    setRapportAlgo({
      donnees: res.donneesAnalysées as unknown as Record<string, unknown>,
      analyse: 'Calcul de la densité de commandes et de la vitesse moyenne de déplacement en zone dense.',
      constat: res.constat,
      explication: res.explication,
      recommandation: res.recommandation,
      decisionUtilisateur: 'EN_ATTENTE',
    });
  };

  const traiterDecisionAlgo = (decision: 'ACCEPTEE' | 'REFUSEE') => {
    if (rapportAlgo) {
      setRapportAlgo({ ...rapportAlgo, decisionUtilisateur: decision });
    }
  };

  const soumettreFeedbackPointSoku = () => {
    busEvenements.publier('livraison:validee', 'livreur-app', {
      pointSokuId: MOCK_POINT_SOKU.id,
      facilite: niveauFacilite,
      motif: niveauFacilite !== 'FACILE' ? motifDifficulte : 'Aucun',
    });

    setNotification(`Signalement qualité "${niveauFacilite}" transmis pour le Point SOKU.`);
    setModalFeedbackOuverte(false);
  };

  const activeMissions = missions.filter((m) => m.statut === 'EN_COURS');
  const proposedMutualised = missions.filter((m) => m.statut === 'PROPOSEE' && m.typeMission === 'MUTUALISEE');
  const proposedDedicated = missions.filter((m) => m.statut === 'PROPOSEE' && m.typeMission === 'DEDIEE_PRIORITAIRE');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Ecosystem Navbar */}
      <EcosystemNav />

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Driver Header Banner */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Truck className="w-4 h-4" /> Application SOKU Livreur
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Livreur Partenaire</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Gérez vos tournées mutualisées SOKU Éco, vos missions express et signalez la qualité des Points SOKU.
            </p>
          </div>

          <button
            onClick={declencherAnalyseAlgo}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Analyse Algorithmique Livreur
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <SuccessBanner
            title="Notification Livreur"
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Consultative Algorithmic Banner (5 Blocks) */}
        {rapportAlgo && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Analyse Consultative — Moteur Algorithmique Livreur</span>
              </div>
              <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                Mode Avis Conseil
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-900 mb-1">1. DONNÉES</p>
                <p className="text-slate-700">{JSON.stringify(rapportAlgo.donnees)}</p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-900 mb-1">2. ANALYSE</p>
                <p className="text-slate-700">{rapportAlgo.analyse}</p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-900 mb-1">3. CONSTAT</p>
                <p className="text-slate-700">{rapportAlgo.constat}</p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-900 mb-1">4. EXPLICATION</p>
                <p className="text-slate-700">{rapportAlgo.explication}</p>
              </div>
              <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-300">
                <p className="font-extrabold text-amber-950 mb-1">5. RECOMMANDATION</p>
                <p className="text-amber-950 font-medium">{rapportAlgo.recommandation}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] text-amber-800 italic">
                * SOKU propose, le livreur décide librement.
              </p>
              {rapportAlgo.decisionUtilisateur === 'EN_ATTENTE' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => traiterDecisionAlgo('ACCEPTEE')}
                    className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800 flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Accepter Recommandation
                  </button>
                  <button
                    onClick={() => traiterDecisionAlgo('REFUSEE')}
                    className="bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-300"
                  >
                    Décliner
                  </button>
                </div>
              ) : (
                <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                  rapportAlgo.decisionUtilisateur === 'ACCEPTEE' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  Décision enregistrée : {rapportAlgo.decisionUtilisateur}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status & Capacity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Functional Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Mon État Fonctionnel Partenaire
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {(
                [
                  'DISPONIBLE',
                  'EN_MISSION',
                  'CAPACITE_PARTIELLE',
                  'FIN_DE_TOURNEE',
                  'HORS_LIGNE',
                ] as StatutFonctionnel[]
              ).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatutActuel(st)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    statutActuel === st
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                  {statutActuel === st && <CheckCircle className="inline ml-1 w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Selection & 3D Capacity Gauges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              Véhicule & Capacité Tridimensionnelle
            </h2>
            <div className="space-y-2 text-xs">
              <label className="block text-slate-600 font-semibold">Véhicule actif :</label>
              <select
                value={vehicule}
                onChange={(e) => setVehicule(e.target.value as TypeVehicule)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="moto_ktm">Moto KTM (Moyenne capacité)</option>
                <option value="scooter_125">Scooter 125cc (Petite capacité)</option>
                <option value="velo_cargo">Vélo Cargo / Électrique (Courte distance)</option>
                <option value="moto_suzuki">Moto Suzuki 150 (Haute résistance)</option>
                <option value="mini_camionnette">Mini-Camionnette (Volume élevé / Colis lourds)</option>
              </select>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] space-y-1">
                <p className="font-bold text-slate-900">Jauges de Capacité (Poids, Volume, Colis) :</p>
                <p>• Charge utile utile : {vehicule === 'mini_camionnette' ? '500 kg max (Utilisé: 80 kg)' : '30 kg max (Utilisé: 12 kg)'}</p>
                <p>• Volume utile : {vehicule === 'mini_camionnette' ? '2.5 m³ libre (Utilisé: 0.4 m³)' : '0.05 m³ libre (Utilisé: 0.02 m³)'}</p>
                <p>• Contrainte colis max : {vehicule === 'mini_camionnette' ? '20 colis' : '4 colis'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Dashboard KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Tableau de Bord Activité
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Revenus du Jour (Mock)</span>
              <span className="text-lg font-black text-slate-900">14 500 FCFA</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Distance Parcourue</span>
              <span className="text-lg font-black text-slate-900">24.5 km</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Missions Réussies</span>
              <span className="text-lg font-black text-slate-900">8 / 8</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Taux Mutualisation</span>
              <span className="text-lg font-black text-amber-600">75%</span>
            </div>
          </div>
        </div>

        {/* Active Mission Processing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Mission Active en Cours ({activeMissions.length})
          </h2>

          {activeMissions.length === 0 ? (
            <EmptyState
              title="Aucune mission active en cours"
              description="Consultez les tournées SOKU Éco et missions express ci-dessous et acceptez une proposition."
              icon={Package}
            />
          ) : (
            <div className="space-y-4">
              {activeMissions.map((miss) => (
                <div key={miss.id} className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg font-extrabold uppercase">
                      {miss.typeMission.replace(/_/g, ' ')}
                    </span>
                    <span className="font-black text-slate-900 text-base">
                      {miss.remunerationProposeeFCFA.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 space-y-1 bg-white/90 p-3 rounded-xl border border-amber-200">
                    <p><strong>Lieu Retrait Vendeur :</strong> {miss.pointRetraitNom}</p>
                    <p><strong>Destination Point SOKU :</strong> {miss.pointLivraisonNom}</p>
                    <p><strong>Distance de parcours :</strong> {miss.distanceKm} km</p>
                  </div>

                  {/* Actions & Contextual Calling */}
                  <div className="pt-2 border-t border-amber-200 flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() =>
                        setModalContactData({
                          nom: 'Destinataire Client #' + miss.commandeId,
                          role: 'CLIENT',
                          tel: miss.clientTelephone,
                          cmdId: miss.commandeId,
                        })
                      }
                      className="bg-slate-900 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-400" /> Appeler le Destinataire
                    </button>

                    <button
                      onClick={() => setModalFeedbackOuverte(true)}
                      className="bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-amber-400 shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Évaluer Point SOKU
                    </button>

                    <button
                      onClick={() => changerStatutMission(miss.id, 'TERMINEE')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Valider Livraison au Point SOKU
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Point SOKU Feedback Modal */}
        {modalFeedbackOuverte && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 relative">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" /> Le point SOKU était-il facile à trouver ?
                </h3>
                <button onClick={() => setModalFeedbackOuverte(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center gap-2 text-xs font-bold">
                {(['FACILE', 'MOYEN', 'DIFFICILE'] as const).map((niv) => (
                  <button
                    key={niv}
                    onClick={() => setNiveauFacilite(niv)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      niveauFacilite === niv
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {niv}
                  </button>
                ))}
              </div>

              {niveauFacilite !== 'FACILE' && (
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">Motif du problème rencontré :</label>
                  <select
                    value={motifDifficulte}
                    onChange={(e) => setMotifDifficulte(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="GPS imprécis">GPS imprécis</option>
                    <option value="Accès difficile">Accès difficile / Travaux</option>
                    <option value="Photo insuffisante">Photo repère insuffisante</option>
                    <option value="Client absent">Client absent</option>
                    <option value="Point mal indiqué">Point mal indiqué</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={soumettreFeedbackPointSoku}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Transmettre Signalement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proposed Missions Lists (Mutualised & Dedicated) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mutualised SOKU Eco Proposals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                SOKU Éco — Tournées Groupées Proposées
              </h2>
              <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                {proposedMutualised.length} arrêt(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Groupement de livraisons compatibles sur un même itinéraire recommandé.
            </p>

            {proposedMutualised.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Aucune tournée mutualisée en attente.</p>
            ) : (
              <div className="space-y-3">
                {proposedMutualised.map((m, idx) => (
                  <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-900">Étape #{idx + 1} — {m.pointRetraitNom}</span>
                      <span className="text-emerald-700 font-extrabold">{m.remunerationProposeeFCFA.toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-slate-600">Destination Point SOKU : {m.pointLivraisonNom} ({m.distanceKm} km)</p>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => changerStatutMission(m.id, 'EN_COURS')}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Accepter & Ajouter à la Tournée
                      </button>
                      <button
                        onClick={() => changerStatutMission(m.id, 'REFUSEE')}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dedicated Express Proposals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                SOKU Prioritaire — Mission Dédiée Express
              </h2>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {proposedDedicated.length} opportunité(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Livraison directe sans arrêt intermédiaire à tarif majoré.
            </p>

            {proposedDedicated.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Aucune mission dédiée express actuellement.</p>
            ) : (
              <div className="space-y-3">
                {proposedDedicated.map((m) => (
                  <div key={m.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-900">{m.pointRetraitNom}</span>
                      <span className="text-amber-800 font-extrabold text-sm">{m.remunerationProposeeFCFA.toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-slate-600">Livraison directe : {m.pointLivraisonNom} ({m.distanceKm} km)</p>

                    <div className="flex gap-2 pt-2 border-t border-amber-200">
                      <button
                        onClick={() => changerStatutMission(m.id, 'EN_COURS')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Accepter Mission Express
                      </button>
                      <button
                        onClick={() => changerStatutMission(m.id, 'REFUSEE')}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
      </main>
    </div>
  );
}
