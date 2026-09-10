'use client';

import { useState, useEffect } from 'react';
import { sokuMockStore } from '@/lib/mock-store';
import { MOCK_POINT_SOKU, MockMissionLivreur } from '@/lib/mock-data';
import { contratMoteurLivreur } from '@/lib/algorithmes/livreur';
import { busEvenements } from '@/lib/evenements/bus';
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
  const [dialogueAppel, setDialogueAppel] = useState<{ client: string; tel: string } | null>(null);

  // Point SOKU Feedback Modal
  const [modalFeedbackOuverte, setModalFeedbackOuverte] = useState(false);
  const [niveauFacilite, setNiveauFacilite] = useState<'FACILE' | 'MOYEN' | 'DIFFICILE'>('FACILE');
  const [motifDifficulte, setMotifDifficulte] = useState<string>('GPS imprécis');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

    setFeedbackMessage(`Signalement "${niveauFacilite}" transmis à l'Orchestrateur.`);
    setModalFeedbackOuverte(false);
  };

  const activeMissions = missions.filter((m) => m.statut === 'EN_COURS');
  const proposedMutualised = missions.filter((m) => m.statut === 'PROPOSEE' && m.typeMission === 'MUTUALISEE');
  const proposedDedicated = missions.filter((m) => m.statut === 'PROPOSEE' && m.typeMission === 'DEDIEE_PRIORITAIRE');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Truck className="w-4 h-4" /> Application SOKU Livreur
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Livreur Partenaire</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Gérez vos tournées mutualisées, répondez aux missions dédiées et signalez la qualité des Points SOKU.
          </p>
        </div>

        <button
          onClick={declencherAnalyseAlgo}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          Analyse Algorithmique Livreur
        </button>
      </div>

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

          {/* Block 6: Human Decision Controls */}
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
            <p className="text-[11px] text-amber-800 italic">
              * L&apos;algorithme SOKU suggère mais n&apos;impose aucune mission forcée. Le livreur décide librement.
            </p>
            {rapportAlgo.decisionUtilisateur === 'EN_ATTENTE' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => traiterDecisionAlgo('ACCEPTEE')}
                  className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800 flex items-center gap-1"
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
        {/* Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Mon État Fonctionnel
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
                    ? 'bg-slate-900 text-white border-slate-900 shadow'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.replace(/_/g, ' ')}
                {statutActuel === st && <CheckCircle className="inline ml-1 w-3.5 h-3.5 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Selection & Multi-Factor Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-500" />
            Véhicule & Capacité Tridimensionnelle
          </h2>
          <div className="space-y-2 text-xs">
            <label className="block text-slate-600 font-semibold">Type de véhicule actif :</label>
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          Tableau de Bord Livreur
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 block">Revenus du Jour (Mock)</span>
            <span className="text-lg font-black text-slate-900">14 500 FCFA</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 block">Distance Parcourue</span>
            <span className="text-lg font-black text-slate-900">24.5 km</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 block">Missions Réussies</span>
            <span className="text-lg font-black text-slate-900">8 / 8</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 block">Taux Mutualisation</span>
            <span className="text-lg font-black text-amber-600">75%</span>
          </div>
        </div>
      </div>

      {/* Active Mission Processing */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Mission Active en Cours ({activeMissions.length})
        </h2>

        {activeMissions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Aucune mission en cours. Recommandation : acceptez une tournée ci-dessous.</p>
        ) : (
          <div className="space-y-4">
            {activeMissions.map((miss) => (
              <div key={miss.id} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold uppercase">
                    {miss.typeMission.replace(/_/g, ' ')}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {miss.remunerationProposeeFCFA} FCFA
                  </span>
                </div>

                <div className="text-xs text-slate-800 space-y-1">
                  <p><strong>Lieu Retrait :</strong> {miss.pointRetraitNom}</p>
                  <p><strong>Lieu Livraison :</strong> {miss.pointLivraisonNom}</p>
                  <p><strong>Distance :</strong> {miss.distanceKm} km</p>
                </div>

                {/* Point SOKU Feedback Trigger & Actions */}
                <div className="pt-3 border-t border-amber-200 flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setDialogueAppel({ client: 'Client #' + miss.commandeId, tel: miss.clientTelephone })}
                    className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 shadow"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Appeler le Destinataire
                  </button>

                  <button
                    onClick={() => setModalFeedbackOuverte(true)}
                    className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-amber-400 shadow"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Signaler Évaluation Point SOKU
                  </button>

                  <button
                    onClick={() => changerStatutMission(miss.id, 'TERMINEE')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Valider Livraison au Point SOKU
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Point SOKU Feedback Feedback Message Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-900 font-bold flex justify-between items-center">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Point SOKU Feedback Modal */}
      {modalFeedbackOuverte && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
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

      {/* Call Dialog Modal */}
      {dialogueAppel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" /> Contact Client SOKU
            </h3>
            <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl">
              <p><strong>Contact :</strong> {dialogueAppel.client}</p>
              <p><strong>Téléphone Direct :</strong> {dialogueAppel.tel}</p>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Appel simulé dans le cadre du prototype interactif SOKU.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogueAppel(null)}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposed Missions Lists (Mutualised & Dedicated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mutualised Tour Proposals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Tournée Mutualisée Proposée (Groupement Compatible)
            </h2>
            <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
              {proposedMutualised.length} arrêt(s) compatible(s)
            </span>
          </div>

          <p className="text-xs text-slate-500">
            SOKU regroupe les livraisons proches sur un itinéraire recommandé pour maximiser vos gains par km.
          </p>

          {proposedMutualised.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Aucune tournée mutualisée en attente.</p>
          ) : (
            <div className="space-y-3">
              {proposedMutualised.map((m, idx) => (
                <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">Étape #{idx + 1} — {m.pointRetraitNom}</span>
                    <span className="text-emerald-700 font-extrabold">{m.remunerationProposeeFCFA} FCFA</span>
                  </div>
                  <p className="text-slate-600">Destination : {m.pointLivraisonNom} ({m.distanceKm} km)</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => changerStatutMission(m.id, 'EN_COURS')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow"
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

        {/* Dedicated Priority Proposals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Mission Dédiée / VIP Express
            </h2>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              {proposedDedicated.length} opportunité(s)
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Livraison directe à tarif majoré. Priorité absolue sans arrêt intermédiaire.
          </p>

          {proposedDedicated.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Aucune mission dédiée express actuellement.</p>
          ) : (
            <div className="space-y-3">
              {proposedDedicated.map((m) => (
                <div key={m.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">{m.pointRetraitNom}</span>
                    <span className="text-amber-800 font-extrabold text-sm">{m.remunerationProposeeFCFA} FCFA</span>
                  </div>
                  <p className="text-slate-600">Livraison directe : {m.pointLivraisonNom} ({m.distanceKm} km)</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => changerStatutMission(m.id, 'EN_COURS')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Accepter Mission Dédiée
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
    </div>
  );
}
