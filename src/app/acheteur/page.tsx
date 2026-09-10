'use client';

import { useState, useEffect, useMemo } from 'react';
import { sokuMockStore, CommandeGlobaleSOKU } from '@/lib/mock-store';
import { MOCK_POINT_SOKU, MockProduit } from '@/lib/mock-data';
import { contratMoteurAcheteur } from '@/lib/algorithmes/acheteur';
import {
  ShoppingBag,
  Search,
  MapPin,
  Truck,
  Store,
  Zap,
  Phone,
  CheckCircle,
  Plus,
  Trash2,
  Clock,
  Eye,
  X,
  Check,
} from 'lucide-react';

export default function AcheteurPage() {
  const [produits, setProduits] = useState<MockProduit[]>([]);
  const [commandes, setCommandes] = useState<CommandeGlobaleSOKU[]>([]);
  const [recherche, setRecherche] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('TOUS');
  const [panier, setPanier] = useState<{ produit: MockProduit; quantite: number }[]>([]);
  const [modeLivraison, setModeLivraison] = useState<'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place'>('livreur_soku');
  const [produitDetail, setProduitDetail] = useState<MockProduit | null>(null);

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
    setCommandes(sokuMockStore.getCommandesGlobales());

    const unsubscribe = sokuMockStore.subscribe(() => {
      setProduits(sokuMockStore.getProduits());
      setCommandes(sokuMockStore.getCommandesGlobales());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const ajouterAuPanier = (prod: MockProduit) => {
    setPanier((prev) => {
      const exist = prev.find((item) => item.produit.id === prod.id);
      if (exist) {
        return prev.map((item) =>
          item.produit.id === prod.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { produit: prod, quantite: 1 }];
    });
  };

  const retirerDuPanier = (id: string) => {
    setPanier((prev) => prev.filter((item) => item.produit.id !== id));
  };

  const declencherAnalyseAlgo = async () => {
    const res = await contratMoteurAcheteur.analyser('acheteur_001', {
      categoriesPreferees: ['Alimentation', 'Épicerie'],
      localisationActuelle: { latitude: 5.3599, longitude: -4.0083 },
    });
    setRapportAlgo({
      donnees: res.donneesAnalysées as unknown as Record<string, unknown>,
      analyse: 'Traitement des habitudes d\'achat locales et de la proximité géographique des boutiques.',
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

  const validerCommande = () => {
    if (panier.length === 0) return;
    const frais = modeLivraison === 'livreur_soku' ? 1000 : modeLivraison === 'vendeur_lui_meme' ? 800 : 0;
    sokuMockStore.creerCommandeGlobale('Kouassi Jean', '+2250707010203', panier, modeLivraison, frais);
    setPanier([]);
  };

  // Bolt Optimization: Memoized Search & Filtering
  const rechercheLower = recherche.toLowerCase();
  const produitsFiltres = useMemo(() => {
    return produits.filter((p) => {
      const matchRecherche =
        p.nom.toLowerCase().includes(rechercheLower) ||
        p.boutiqueNom.toLowerCase().includes(rechercheLower);
      const matchCat = categorieFiltre === 'TOUS' || p.categorie === categorieFiltre;
      return matchRecherche && matchCat;
    });
  }, [produits, rechercheLower, categorieFiltre]);

  // Group cart items by boutique/vendor for multi-vendor presentation
  const panierParVendeur = useMemo(() => {
    const map = new Map<string, { produit: MockProduit; quantite: number }[]>();
    panier.forEach((item) => {
      const bNom = item.produit.boutiqueNom;
      if (!map.has(bNom)) map.set(bNom, []);
      map.get(bNom)!.push(item);
    });
    return Array.from(map.entries());
  }, [panier]);

  const sousTotal = panier.reduce((acc, item) => acc + item.produit.prix * item.quantite, 0);
  const fraisLivraison = modeLivraison === 'livreur_soku' ? 1000 : modeLivraison === 'vendeur_lui_meme' ? 800 : 0;
  const totalGeneral = sousTotal + (panier.length > 0 ? fraisLivraison : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-4 h-4" /> Application SOKU Acheteur
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Découverte & Achats</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Découvrez les produits locaux, gérez vos sous-commandes multi-vendeurs et suivez vos livraisons.
          </p>
        </div>

        <button
          onClick={declencherAnalyseAlgo}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          Analyse Algorithmique Acheteur
        </button>
      </div>

      {/* Consultative Algorithmic Banner (5 Structured Blocks) */}
      {rapportAlgo && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Zap className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Analyse Consultative — Moteur Algorithmique Acheteur</span>
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
              * L&apos;algorithme conseille mais n&apos;effectue aucun achat automatique. Vous conservez le pouvoir décisionnel.
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

      {/* Search & Categories Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher produit, aliment, boutique..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['TOUS', 'Alimentation', 'Épicerie', 'Textile', 'Cosmétique'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieFiltre(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categorieFiltre === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {produitsFiltres.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-amber-400 transition-all">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    {prod.categorie}
                  </span>
                  <span className="text-slate-500 font-medium">{prod.boutiqueNom}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{prod.nom}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{prod.description}</p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-extrabold text-slate-900">
                  {prod.prix.toLocaleString()} FCFA
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProduitDetail(prod)}
                    className="p-1.5 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300"
                    title="Voir Fiche Produit"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ajouterAuPanier(prod)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Cart & Multi-Vendor Sub-Orders Breakdown */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Mon Panier SOKU ({panier.reduce((acc, i) => acc + i.quantite, 0)})
            </h2>

            {panier.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Votre panier est vide.</p>
            ) : (
              <div className="space-y-4">
                {/* Multi-Vendor Decomposition */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Décomposition Multi-Vendeurs (Paiement Unique) :
                  </p>
                  {panierParVendeur.map(([boutiqueNom, items]) => (
                    <div key={boutiqueNom} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          {boutiqueNom}
                        </span>
                        <span className="text-slate-600">Sous-Commande Vendeur</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.produit.id} className="flex justify-between items-center">
                            <span>{item.quantite}x {item.produit.nom}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{(item.produit.prix * item.quantite).toLocaleString()} FCFA</span>
                              <button onClick={() => retirerDuPanier(item.produit.id)} className="text-slate-400 hover:text-rose-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Mode Choice */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Mode de livraison global :
                  </label>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { id: 'livreur_soku', label: 'Livreur SOKU (Point SOKU inclus)', icon: Truck },
                      { id: 'vendeur_lui_meme', label: 'Livraison directe Vendeur', icon: Store },
                      { id: 'retrait_sur_place', label: 'Retrait sur place', icon: MapPin },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setModeLivraison(mode.id as 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place')}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                          modeLivraison === mode.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <mode.icon className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-medium">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Point SOKU info for Livreur SOKU */}
                {modeLivraison === 'livreur_soku' && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Point SOKU Sélectionné
                    </p>
                    <p className="text-amber-950 font-medium">{MOCK_POINT_SOKU.nom}</p>
                    <p className="text-amber-800 text-[11px]">{MOCK_POINT_SOKU.repereVisuel}</p>
                  </div>
                )}

                {/* Checkout Totals & Submit */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Sous-total articles</span>
                    <span>{sousTotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Frais de livraison</span>
                    <span>{fraisLivraison.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Général (Paiement Unique)</span>
                    <span className="text-amber-600">{totalGeneral.toLocaleString()} FCFA</span>
                  </div>

                  <button
                    onClick={validerCommande}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow mt-2"
                  >
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    Valider ma Commande Globale
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Orders Tracking Timeline Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Suivi Real-time des Commandes ({commandes.length})
            </h2>

            <div className="space-y-4">
              {commandes.map((cmd) => (
                <div key={cmd.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900">#{cmd.id}</span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                      {cmd.statutGlobal.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Sub-orders Status List */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Sous-Commandes Vendeurs :</p>
                    {cmd.sousCommandes.map((sub) => (
                      <div key={sub.id} className="flex justify-between text-[11px] bg-white p-2 rounded border border-slate-200">
                        <span>{sub.boutiqueNom}</span>
                        <span className="font-bold text-amber-800">{sub.statut.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Driver Contact Card if assigned */}
                  {cmd.livreurNom && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between text-emerald-950">
                      <div>
                        <p className="font-bold">{cmd.livreurNom}</p>
                        <p className="text-[11px] text-emerald-800">{cmd.livreurVehicule}</p>
                      </div>
                      <a
                        href={`tel:${cmd.livreurTelephone}`}
                        className="bg-emerald-700 text-white p-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> Appeler
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {produitDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-xs">
                  {produitDetail.categorie}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{produitDetail.nom}</h3>
                <p className="text-xs text-slate-500 font-medium">{produitDetail.boutiqueNom}</p>
              </div>
              <button onClick={() => setProduitDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{produitDetail.description}</p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p><strong>Stock disponible :</strong> {produitDetail.stock} unités</p>
              <p><strong>Mode de livraison :</strong> Livreur SOKU ou Retrait sur place</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-black text-slate-900">
                {produitDetail.prix.toLocaleString()} FCFA
              </span>
              <button
                onClick={() => {
                  ajouterAuPanier(produitDetail);
                  setProduitDetail(null);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4" /> Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
