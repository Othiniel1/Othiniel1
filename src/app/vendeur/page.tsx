'use client';

import { useState, useEffect, useMemo } from 'react';
import { sokuMockStore, CommandeGlobaleSOKU, SousCommandeVendeur } from '@/lib/mock-store';
import { contratMoteurVendeur } from '@/lib/algorithmes/vendeur';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  Store,
  Package,
  CheckCircle,
  Plus,
  TrendingUp,
  Lock,
  Sparkles,
  BarChart3,
} from 'lucide-react';

export default function VendeurPage() {
  const [commandesGlobales, setCommandesGlobales] = useState<CommandeGlobaleSOKU[]>([]);
  const [niveauAccesInsight, setNiveauAccesInsight] = useState<'STANDARD' | 'AVANCE'>('STANDARD');
  const [notification, setNotification] = useState<string | null>(null);

  // New Product Modal State
  const [modalNouveauProduit, setModalNouveauProduit] = useState(false);
  const [nomNouveau, setNomNouveau] = useState('');
  const [prixNouveau, setPrixNouveau] = useState('');
  const [categorieNouvelle, setCategorieNouvelle] = useState('Alimentation');
  const [variationsNouvelles, setVariationsNouvelles] = useState('');

  // Background Insight Performance Cards (Native UX Features)
  const [performancesCommerciales, setPerformancesCommerciales] = useState<{
    constat: string;
    explication: string;
    recommandation: string;
  } | null>(null);

  useEffect(() => {
    setCommandesGlobales(sokuMockStore.getCommandesGlobales());

    // Execute background analysis quiet call
    contratMoteurVendeur.analyser('vendeur_001', {
      boutiqueId: 'vendeur_001',
      periodeJours: 7,
    }).then((res) => {
      setPerformancesCommerciales({
        constat: res.constat,
        explication: res.explication,
        recommandation: res.recommandation,
      });
    });

    const unsubscribe = sokuMockStore.subscribe(() => {
      setCommandesGlobales(sokuMockStore.getCommandesGlobales());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Filter sub-orders relevant to Vendeur "vendeur_001" (Délices de Cocody)
  const mesSousCommandes = useMemo(() => {
    const list: { cmdId: string; sub: SousCommandeVendeur }[] = [];
    commandesGlobales.forEach((cmd) => {
      cmd.sousCommandes.forEach((sub) => {
        if (sub.vendeurId === 'vendeur_001' || sub.boutiqueNom.includes('Cocody')) {
          list.push({ cmdId: cmd.id, sub });
        }
      });
    });
    return list;
  }, [commandesGlobales]);

  const faireAvancerStatut = (commandeId: string, sousCommandeId: string, statutActuel: SousCommandeVendeur['statut']) => {
    let nouveauStatut: SousCommandeVendeur['statut'] = 'EN_PREPARATION';
    if (statutActuel === 'EN_ATTENTE') nouveauStatut = 'EN_PREPARATION';
    else if (statutActuel === 'EN_PREPARATION') nouveauStatut = 'PRETE';
    else if (statutActuel === 'PRETE') nouveauStatut = 'REMISE_AU_LIVREUR';

    sokuMockStore.mettreAJourStatutSousCommande(commandeId, sousCommandeId, nouveauStatut);

    if (nouveauStatut === 'PRETE') {
      setNotification(`Sous-commande #${sousCommandeId} marquée "Prête pour collecte". La mission SOKU Livreur est disponible.`);
    } else {
      setNotification(`Statut mis à jour : ${nouveauStatut.replace(/_/g, ' ')}`);
    }
  };

  const creerNouveauProduit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomNouveau || !prixNouveau) return;

    const varsArray = variationsNouvelles ? variationsNouvelles.split(',').map((v) => v.trim()) : undefined;

    sokuMockStore.ajouterProduit({
      nom: nomNouveau,
      prix: parseInt(prixNouveau, 10),
      boutiqueNom: 'Délices de Cocody',
      categorie: categorieNouvelle,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      badge: 'NOUVEAU',
      note: 5.0,
      nombreAvis: 1,
      nombreVentes: 0,
      stock: 25,
      variations: varsArray,
      description: 'Nouveau produit ajouté par le vendeur Délices de Cocody.',
    });

    setNomNouveau('');
    setPrixNouveau('');
    setVariationsNouvelles('');
    setModalNouveauProduit(false);
    setNotification(`Le produit "${nomNouveau}" a été ajouté au catalogue avec succès.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Vendor Standalone App Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-4 h-4" /> SOKU Vendeur — Boutique Délices de Cocody
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestion Commerciale & Préparation</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Gérez vos sous-commandes reçues, mettez à jour la préparation et suivez vos performances.
            </p>
          </div>

          <button
            onClick={() => setModalNouveauProduit(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> Ajouter Produit
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <SuccessBanner
            title="Notification Vendeur"
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Access Tier Insight Header Card (Accumulated background insight concept) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-200 text-amber-900">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Restitution des Performances Commerciales</p>
              <p className="text-[11px] text-slate-500">
                Niveau d&apos;analyse débloqué selon l&apos;activité de la boutique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setNiveauAccesInsight('STANDARD')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                niveauAccesInsight === 'STANDARD'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Niveau Standard
            </button>
            <button
              onClick={() => setNiveauAccesInsight('AVANCE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                niveauAccesInsight === 'AVANCE'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Niveau Avancé
            </button>
          </div>
        </div>

        {/* Native Performance Insight Banner */}
        {performancesCommerciales && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Performance Commerciale & Stock Boutique</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold uppercase">
                Vue {niveauAccesInsight}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-amber-600" /> Constat Stock & Préparation
                </p>
                <p className="text-slate-700">{performancesCommerciales.constat}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Recommandation de Réapprovisionnement
                </p>
                <p className="text-slate-700">{performancesCommerciales.recommandation}</p>
              </div>
            </div>

            {niveauAccesInsight === 'AVANCE' ? (
              <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-300 text-xs text-amber-950 font-medium">
                <p className="font-bold text-amber-950 mb-0.5">Analyse Approfondie des Tendances :</p>
                <p>{performancesCommerciales.explication}</p>
              </div>
            ) : (
              <div className="bg-white/60 p-2.5 rounded-xl border border-dashed border-amber-300 flex items-center justify-between text-xs text-amber-900">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Détails d&apos;analyse approfondie verrouillés
                </span>
                <button
                  onClick={() => setNiveauAccesInsight('AVANCE')}
                  className="text-amber-800 underline font-bold text-[11px] hover:text-amber-950"
                >
                  Activer la vue avancée
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sub-Orders List for Vendeur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Sous-Commandes à Traiter ({mesSousCommandes.length})
          </h2>

          {mesSousCommandes.length === 0 ? (
            <EmptyState
              title="Aucune commande reçue"
              description="Les sous-commandes passées par les acheteurs auprès de votre boutique s'afficheront ici en temps réel."
              icon={Package}
            />
          ) : (
            <div className="space-y-4">
              {mesSousCommandes.map(({ cmdId, sub }) => (
                <div key={sub.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        Sous-Commande #{sub.id} (Rattachée à #{cmdId})
                      </span>
                      <span className="text-[10px] text-slate-500 block">Boutique : {sub.boutiqueNom}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase">
                      {sub.statut.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Articles List */}
                  <div className="space-y-2">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Articles commandés :</p>
                    <div className="space-y-1.5">
                      {sub.articles.map((item, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-900">
                            {item.quantite}x {item.produit.nom}
                          </span>
                          <span className="font-semibold text-amber-600">
                            {(item.prixUnitaire * item.quantite).toLocaleString()} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Advancement Action */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[11px] font-extrabold text-slate-900">
                      Montant Sous-Total : {sub.montantSousTotal.toLocaleString()} FCFA
                    </span>

                    {sub.statut !== 'REMISE_AU_LIVREUR' && sub.statut !== 'LIVREE' && (
                      <button
                        onClick={() => faireAvancerStatut(cmdId, sub.id, sub.statut)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                        {sub.statut === 'EN_ATTENTE' && 'Démarrer Préparation'}
                        {sub.statut === 'EN_PREPARATION' && 'Marquer comme Prête'}
                        {sub.statut === 'PRETE' && 'Remettre au Livreur'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Product Modal */}
      {modalNouveauProduit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full space-y-4 shadow-xl border border-slate-200 p-6 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" /> Ajouter un nouveau produit
              </h3>
              <button
                onClick={() => setModalNouveauProduit(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={creerNouveauProduit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du produit :</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Attiéké Garba Frais (Sac 5kg)"
                  value={nomNouveau}
                  onChange={(e) => setNomNouveau(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prix (FCFA) :</label>
                <input
                  type="number"
                  required
                  placeholder="ex: 2500"
                  value={prixNouveau}
                  onChange={(e) => setPrixNouveau(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catégorie :</label>
                <select
                  value={categorieNouvelle}
                  onChange={(e) => setCategorieNouvelle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Alimentation">Alimentation</option>
                  <option value="Épicerie">Épicerie</option>
                  <option value="Textile">Textile</option>
                  <option value="Cosmétique">Cosmétique</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Variations (séparées par des virgules) :</label>
                <input
                  type="text"
                  placeholder="ex: Portion Indiv, Sac 5kg, Format Familial"
                  value={variationsNouvelles}
                  onChange={(e) => setVariationsNouvelles(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalNouveauProduit(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-xs"
                >
                  Créer et publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
