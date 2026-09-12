'use client';

import { useState, useEffect, useMemo } from 'react';
import { sokuMockStore, CommandeGlobaleSOKU, SousCommandeVendeur } from '@/lib/mock-store';
import { MockProduit } from '@/lib/mock-data';
import { contratMoteurVendeur } from '@/lib/algorithmes/vendeur';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  Store,
  Package,
  CheckCircle,
  Plus,
  TrendingUp,
  Sparkles,
  Edit2,
  XCircle,
  Save,
  RotateCcw,
  History,
  DollarSign,
} from 'lucide-react';

export default function VendeurPage() {
  const [produits, setProduits] = useState<MockProduit[]>([]);
  const [commandesGlobales, setCommandesGlobales] = useState<CommandeGlobaleSOKU[]>([]);
  const [niveauAccesInsight] = useState<'STANDARD' | 'AVANCE'>('STANDARD');
  const [ongletActif, setOngletActif] = useState<'ventes' | 'stocks' | 'historique'>('ventes');
  const [notification, setNotification] = useState<string | null>(null);

  // Stock & Price Edit State
  const [produitEnEdition, setProduitEnEdition] = useState<string | null>(null);
  const [nouveauStock, setNouveauStock] = useState<number>(0);
  const [nouveauPrix, setNouveauPrix] = useState<number>(0);

  // New Product Modal State
  const [modalNouveauProduit, setModalNouveauProduit] = useState(false);
  const [nomNouveau, setNomNouveau] = useState('');
  const [prixNouveau, setPrixNouveau] = useState('');
  const [stockNouveau, setStockNouveau] = useState('20');
  const [categorieNouvelle] = useState('Alimentation');
  const [variationsNouvelles, setVariationsNouvelles] = useState('');

  // Background Insight Performance Cards
  const [performancesCommerciales, setPerformancesCommerciales] = useState<{
    constat: string;
    explication: string;
    recommandation: string;
  } | null>(null);

  useEffect(() => {
    setProduits(sokuMockStore.getProduits());
    setCommandesGlobales(sokuMockStore.getCommandesGlobales());

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
      setProduits(sokuMockStore.getProduits());
      setCommandesGlobales(sokuMockStore.getCommandesGlobales());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Filter vendor products & sub-orders for "Délices de Cocody"
  const mesProduits = useMemo(() => {
    return produits.filter((p) => p.boutiqueNom.includes('Cocody'));
  }, [produits]);

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

  const sousCommandesActives = useMemo(() => {
    return mesSousCommandes.filter((s) => s.sub.statut !== 'LIVREE' && s.sub.statut !== 'ANNULEE');
  }, [mesSousCommandes]);

  const sousCommandesHistorique = useMemo(() => {
    return mesSousCommandes.filter((s) => s.sub.statut === 'LIVREE' || s.sub.statut === 'ANNULEE');
  }, [mesSousCommandes]);

  const chiffreAffairesCumuleSimule = useMemo(() => {
    return mesSousCommandes
      .filter((s) => s.sub.statut === 'LIVREE')
      .reduce((acc, s) => acc + s.sub.montantSousTotal, 0);
  }, [mesSousCommandes]);

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

  const annulerSousCommandeParVendeur = (cmdId: string, subId: string) => {
    const motif = 'Rupture de stock signalée par le Vendeur';
    sokuMockStore.annulerSousCommande(cmdId, subId, motif);
    setNotification(`Sous-commande #${subId} annulée. Remboursement simulé déclenché pour l'acheteur.`);
  };

  const enregistrerMiseAJourProduit = (id: string) => {
    sokuMockStore.modifierProduitVendeur(id, {
      stock: nouveauStock,
      prix: nouveauPrix,
    });
    setProduitEnEdition(null);
    setNotification('Stock et prix mis à jour avec succès dans le catalogue.');
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
      stock: parseInt(stockNouveau, 10) || 10,
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestion Commerciale & Stocks</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Gérez vos sous-commandes reçues, mettez à jour vos stocks/prix et suivez vos performances.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => sokuMockStore.reinitialiserMockStore()}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Réinitialiser l'état prototype"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser Démo
            </button>

            <button
              onClick={() => setModalNouveauProduit(true)}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" /> Ajouter Produit
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <SuccessBanner title="Notification Vendeur" message={notification} onClose={() => setNotification(null)} />
        )}

        {/* Bilan Synthétique Vendeur Card */}
        <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiffre d&apos;Affaires Encaissé (Séquestre Libéré)</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                {chiffreAffairesCumuleSimule.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
            <span>Commandes traitées: <strong>{sousCommandesHistorique.length}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Articles référencés: <strong>{mesProduits.length}</strong></span>
          </div>
        </div>

        {/* Vendor Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-around text-xs font-bold">
          <button
            onClick={() => setOngletActif('ventes')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'ventes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 text-amber-400" /> Commandes en Cours ({sousCommandesActives.length})
          </button>
          <button
            onClick={() => setOngletActif('stocks')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'stocks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit2 className="w-4 h-4 text-amber-400" /> Stocks & Tarifs ({mesProduits.length})
          </button>
          <button
            onClick={() => setOngletActif('historique')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'historique' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" /> Historique Ventes ({sousCommandesHistorique.length})
          </button>
        </div>

        {/* TAB 1: COMMANDES EN COURS */}
        {ongletActif === 'ventes' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Sous-Commandes à Traiter ({sousCommandesActives.length})
            </h2>

            {sousCommandesActives.length === 0 ? (
              <EmptyState
                title="Aucune sous-commande en attente"
                description="Les sous-commandes passées par les acheteurs auprès de votre boutique s'afficheront ici en temps réel."
                icon={Package}
              />
            ) : (
              <div className="space-y-4">
                {sousCommandesActives.map(({ cmdId, sub }) => (
                  <div key={sub.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5">
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

                    <div className="space-y-2">
                      <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Articles commandés :</p>
                      <div className="space-y-1.5">
                        {sub.articles.map((item, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900">{item.quantite}x {item.produit.nom}</span>
                            <span className="font-semibold text-amber-600">{(item.prixUnitaire * item.quantite).toLocaleString()} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
                      <span className="text-[11px] font-extrabold text-slate-900">
                        Montant Sous-Total : {sub.montantSousTotal.toLocaleString()} FCFA
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => annulerSousCommandeParVendeur(cmdId, sub.id)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Annuler
                        </button>

                        <button
                          onClick={() => faireAvancerStatut(cmdId, sub.id, sub.statut)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                          {sub.statut === 'EN_ATTENTE' && 'Démarrer Préparation'}
                          {sub.statut === 'EN_PREPARATION' && 'Marquer comme Prête'}
                          {sub.statut === 'PRETE' && 'Remettre au Livreur'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STOCKS ET TARIFS */}
        {ongletActif === 'stocks' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-500" />
              Gestion des Stocks & Tarifs Catalogue ({mesProduits.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mesProduits.map((prod) => (
                <div key={prod.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900">{prod.nom}</p>
                      <p className="text-[10px] text-slate-500">{prod.categorie}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                      prod.stock < 5 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Stock: {prod.stock}
                    </span>
                  </div>

                  {produitEnEdition === prod.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">Prix (FCFA) :</label>
                          <input
                            type="number"
                            value={nouveauPrix}
                            onChange={(e) => setNouveauPrix(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">Stock :</label>
                          <input
                            type="number"
                            value={nouveauStock}
                            onChange={(e) => setNouveauStock(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setProduitEnEdition(null)} className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]">
                          Annuler
                        </button>
                        <button onClick={() => enregistrerMiseAJourProduit(prod.id)} className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs">
                          <Save className="w-3 h-3" /> Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-extrabold text-slate-900 text-sm">{prod.prix.toLocaleString()} FCFA</span>
                      <button
                        onClick={() => { setProduitEnEdition(prod.id); setNouveauStock(prod.stock); setNouveauPrix(prod.prix); }}
                        className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                      >
                        <Edit2 className="w-3 h-3 text-amber-600" /> Éditer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HISTORIQUE ET ARCHIVES */}
        {ongletActif === 'historique' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Historique des Ventes & Virement Séquestre ({sousCommandesHistorique.length})
            </h2>

            {sousCommandesHistorique.length === 0 ? (
              <EmptyState
                title="Aucune vente archivée"
                description="Vos sous-commandes livrées ou annulées apparaîtront ici avec leur bilan financier."
                icon={History}
              />
            ) : (
              <div className="space-y-3">
                {sousCommandesHistorique.map(({ cmdId, sub }) => (
                  <div key={sub.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">Sous-Commande #{sub.id}</span>
                        <span className="text-[10px] text-slate-500 block">Rattachée à #{cmdId}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] ${
                        sub.statut === 'LIVREE' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {sub.statut}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {sub.articles.map((art, idx) => (
                        <p key={idx} className="text-slate-700 font-medium">
                          {art.quantite}x {art.produit.nom} — {(art.prixUnitaire * art.quantite).toLocaleString()} FCFA
                        </p>
                      ))}
                    </div>

                    {sub.motifAnnulation && (
                      <p className="text-[10px] text-rose-600 font-bold">Motif annulation : {sub.motifAnnulation}</p>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                      <span>Montant total : {sub.montantSousTotal.toLocaleString()} FCFA</span>
                      {sub.statut === 'LIVREE' && (
                        <span className="text-emerald-700 text-[11px]">✓ Fonds libérés du séquestre (Net - 5%)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Native Performance Insight Banner */}
        {performancesCommerciales && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Performance Commerciale & Stock Boutique</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold uppercase">
                Vue {niveauAccesInsight}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1"><Package className="w-3.5 h-3.5 text-amber-600" /> Constat Stock</p>
                <p className="text-slate-700">{performancesCommerciales.constat}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-600" /> Recommandation</p>
                <p className="text-slate-700">{performancesCommerciales.recommandation}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Product Modal */}
      {modalNouveauProduit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full space-y-4 shadow-xl border border-slate-200 p-6 relative text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" /> Ajouter un nouveau produit
              </h3>
              <button onClick={() => setModalNouveauProduit(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={creerNouveauProduit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du produit :</label>
                <input type="text" required placeholder="ex: Attiéké Garba Frais (Sac 5kg)" value={nomNouveau} onChange={(e) => setNomNouveau(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix (FCFA) :</label>
                  <input type="number" required placeholder="ex: 2500" value={prixNouveau} onChange={(e) => setPrixNouveau(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock initial :</label>
                  <input type="number" required placeholder="ex: 20" value={stockNouveau} onChange={(e) => setStockNouveau(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button type="button" onClick={() => setModalNouveauProduit(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-xs">Créer et publier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
