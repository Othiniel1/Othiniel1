'use client';

import { useState, useEffect } from 'react';
import { sokuMockStore, CommandeGlobaleSOKU, SousCommandeVendeur } from '@/lib/mock-store';
import { MockProduit } from '@/lib/mock-data';
import { contratMoteurVendeur } from '@/lib/algorithmes/vendeur';
import { EcosystemNav } from '@/components/ui/ecosystem-nav';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
  Check,
  CheckCheck,
  Filter,
} from 'lucide-react';

export default function VendeurPage() {
  const [produits, setProduits] = useState<MockProduit[]>([]);
  const [commandesGlobales, setCommandesGlobales] = useState<CommandeGlobaleSOKU[]>([]);

  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauPrix, setNouveauPrix] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('Alimentation');
  const [nouveauStock, setNouveauStock] = useState('10');

  const [filtreStatutSub, setFiltreStatutSub] = useState<string>('TOUS');
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
    setProduits(sokuMockStore.getProduits());
    setCommandesGlobales(sokuMockStore.getCommandesGlobales());

    const unsubscribe = sokuMockStore.subscribe(() => {
      setProduits(sokuMockStore.getProduits());
      setCommandesGlobales(sokuMockStore.getCommandesGlobales());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const ajouterProduit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauNom || !nouveauPrix) return;

    sokuMockStore.ajouterProduit({
      nom: nouveauNom,
      boutiqueNom: 'Délices de Cocody',
      prix: Number(nouveauPrix),
      categorie: nouvelleCategorie,
      description: 'Produit ajouté depuis le tableau de bord vendeur SOKU.',
      stock: Number(nouveauStock),
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      note: 5.0,
      nombreAvis: 1,
      nombreVentes: 0,
      badge: 'NOUVEAU',
    });

    setNotification(`Produit "${nouveauNom}" ajouté au catalogue avec un stock de ${nouveauStock} u.`);
    setNouveauNom('');
    setNouveauPrix('');
  };

  const changerStatutSousCommande = (
    commandeId: string,
    sousCommandeId: string,
    nouveauStatut: SousCommandeVendeur['statut']
  ) => {
    sokuMockStore.mettreAJourStatutSousCommande(commandeId, sousCommandeId, nouveauStatut);

    if (nouveauStatut === 'PRETE') {
      setNotification(`Sous-commande #${sousCommandeId} marquée "Prête pour collecte". La mission SOKU Livreur est maintenant disponible.`);
    } else if (nouveauStatut === 'REMISE_AU_LIVREUR') {
      setNotification(`Colis transmis au Livreur pour la sous-commande #${sousCommandeId}.`);
    } else {
      setNotification(`Statut sous-commande mis à jour : ${nouveauStatut.replace(/_/g, ' ')}`);
    }
  };

  const declencherAnalyseAlgo = async () => {
    const res = await contratMoteurVendeur.analyser('vendeur_001', {
      boutiqueId: 'boutique_001',
      periodeJours: 30,
    });
    setRapportAlgo({
      donnees: res.donneesAnalysées as unknown as Record<string, unknown>,
      analyse: 'Analyse prédictive de la vitesse de rotation des stocks et des paniers moyens.',
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

  // Collect sub-orders
  const sousCommandesMoi = commandesGlobales.flatMap((cmd) =>
    cmd.sousCommandes.map((sub) => ({ cmdId: cmd.id, sub, date: cmd.dateCreation }))
  );

  const sousCommandesFiltrees = sousCommandesMoi.filter(({ sub }) => {
    if (filtreStatutSub === 'TOUS') return true;
    return sub.statut === filtreStatutSub;
  });

  const chiffreAffairesBrut = sousCommandesMoi.reduce((acc, { sub }) => acc + sub.montantSousTotal, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Ecosystem Navbar */}
      <EcosystemNav />

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Vendor Header Banner */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-4 h-4" /> Application SOKU Vendeur
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Gestion Boutique</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Gérez vos stocks, préparez vos sous-commandes et remettez vos colis aux livreurs SOKU.
            </p>
          </div>

          <button
            onClick={declencherAnalyseAlgo}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Analyse Algorithmique Vendeur
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

        {/* Consultative Algorithmic Banner (5 Blocks) */}
        {rapportAlgo && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Analyse Consultative — Moteur Algorithmique Vendeur</span>
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
                * L&apos;algorithme ne réapprovisionne aucun produit de façon autonome.
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

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Chiffre d&apos;Affaires Brut (Mock)</p>
            <p className="text-2xl font-black text-slate-900">{chiffreAffairesBrut.toLocaleString()} FCFA</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15% cette semaine
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Sous-Commandes à Traiter</p>
            <p className="text-2xl font-black text-amber-600">
              {sousCommandesMoi.filter(({ sub }) => sub.statut === 'EN_ATTENTE' || sub.statut === 'EN_PREPARATION').length}
            </p>
            <p className="text-[11px] text-slate-500">Flux de préparation actif</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Articles en Catalogue</p>
            <p className="text-2xl font-black text-slate-900">{produits.length}</p>
            <p className="text-[11px] text-slate-500">Total : {produits.reduce((acc, p) => acc + p.stock, 0)} unités</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Sub-Orders Processing */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  Sous-Commandes Vendeur ({sousCommandesFiltrees.length})
                </h2>

                {/* Sub-Orders Status Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                  {['TOUS', 'EN_ATTENTE', 'EN_PREPARATION', 'PRETE', 'REMISE_AU_LIVREUR'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFiltreStatutSub(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-[11px] ${
                        filtreStatutSub === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'TOUS' ? 'Toutes' : st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {sousCommandesFiltrees.length === 0 ? (
                <EmptyState
                  title="Aucune sous-commande dans ce statut"
                  description="Les commandes des acheteurs regroupant vos produits apparaîtront ici."
                  icon={ShoppingBag}
                />
              ) : (
                <div className="space-y-3">
                  {sousCommandesFiltrees.map(({ cmdId, sub }) => (
                    <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 mr-2">
                            Commande globale #{cmdId}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ID Sub: {sub.id} ({sub.boutiqueNom})
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                          {sub.statut.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <p className="font-bold">Articles commandés :</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                          {sub.articles.map((art, idx) => (
                            <li key={idx}>
                              <span className="font-bold text-slate-900">{art.quantite}x</span> {art.produit.nom} ({art.prixUnitaire.toLocaleString()} FCFA/u)
                            </li>
                          ))}
                        </ul>
                        <p className="font-extrabold text-slate-900 pt-1 border-t border-slate-200/60 mt-1">
                          Sous-total sous-commande : {sub.montantSousTotal.toLocaleString()} FCFA
                        </p>
                      </div>

                      {/* Lifecycle Control Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                        {sub.statut === 'EN_ATTENTE' && (
                          <button
                            onClick={() => changerStatutSousCommande(cmdId, sub.id, 'EN_PREPARATION')}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" /> Accepter & Lancer Préparation
                          </button>
                        )}

                        {sub.statut === 'EN_PREPARATION' && (
                          <button
                            onClick={() => changerStatutSousCommande(cmdId, sub.id, 'PRETE')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marquer Prête (Prêt pour Collecte Livreur)
                          </button>
                        )}

                        {sub.statut === 'PRETE' && (
                          <button
                            onClick={() => changerStatutSousCommande(cmdId, sub.id, 'REMISE_AU_LIVREUR')}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" /> Confirmer Remise au Livreur SOKU
                          </button>
                        )}

                        {sub.statut === 'REMISE_AU_LIVREUR' && (
                          <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                            <CheckCheck className="w-4 h-4 text-emerald-600" /> Colis remis au Livreur — En transit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catalog Management List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Catalogue Produits en Boutique
              </h2>

              <div className="divide-y divide-slate-100">
                {produits.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{p.nom}</p>
                      <p className="text-slate-500">{p.boutiqueNom} • {p.categorie} — Stock : <span className="font-bold text-slate-700">{p.stock} u</span></p>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">{p.prix.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Add Product Form */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                Nouveau Produit SOKU
              </h2>

              <form onSubmit={ajouterProduit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du produit</label>
                  <input
                    type="text"
                    placeholder="Ex: Piment Sento Frais (Sachet)"
                    value={nouveauNom}
                    onChange={(e) => setNouveauNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 1500"
                    value={nouveauPrix}
                    onChange={(e) => setNouveauPrix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={nouvelleCategorie}
                    onChange={(e) => setNouvelleCategorie(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Alimentation">Alimentation</option>
                    <option value="Épicerie">Épicerie</option>
                    <option value="Textile">Textile</option>
                    <option value="Cosmétique">Cosmétique</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock initial</label>
                  <input
                    type="number"
                    value={nouveauStock}
                    onChange={(e) => setNouveauStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-400" /> Publier le Produit
                </button>
              </form>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Conseil Vendeur SOKU
              </p>
              <p className="text-amber-800 leading-relaxed">
                Marquez vos sous-commandes &quot;Prêtes&quot; le plus tôt possible pour permettre la mise à disposition instantanée de la mission pour les livreurs partenaires.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
