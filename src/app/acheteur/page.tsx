'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { sokuMockStore, CommandeGlobaleSOKU } from '@/lib/mock-store';
import { MOCK_POINT_SOKU, MockProduit, MockPointSOKU } from '@/lib/mock-data';
import { contratMoteurAcheteur } from '@/lib/algorithmes/acheteur';
import { EcosystemNav } from '@/components/ui/ecosystem-nav';
import { PointSokuModal } from '@/components/ui/point-soku-modal';
import { ContactModal } from '@/components/ui/contact-modal';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
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
  X,
  Check,
  Star,
  ShoppingBasket,
  ShieldCheck,
} from 'lucide-react';

export default function AcheteurPage() {
  const [produits, setProduits] = useState<MockProduit[]>([]);
  const [commandes, setCommandes] = useState<CommandeGlobaleSOKU[]>([]);
  const [recherche, setRecherche] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('TOUS');
  const [ongletActif, setOngletActif] = useState<'catalogue' | 'panier' | 'commandes'>('catalogue');
  const [panier, setPanier] = useState<{ produit: MockProduit; quantite: number; variationSelectionnee?: string }[]>([]);
  const [modeLivraison, setModeLivraison] = useState<'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place'>('livreur_soku');
  const [produitDetail, setProduitDetail] = useState<MockProduit | null>(null);
  const [variationChoisie, setVariationChoisie] = useState<string>('');

  // Point SOKU Configured State
  const [pointSokuConfig, setPointSokuConfig] = useState<MockPointSOKU & { instructionAcheteur?: string }>(MOCK_POINT_SOKU);
  const [modalPointSokuOuvert, setModalPointSokuOuvert] = useState(false);

  // Contact Modal State
  const [modalContactData, setModalContactData] = useState<{
    nom: string;
    role: 'LIVREUR' | 'CLIENT';
    tel: string;
    cmdId: string;
  } | null>(null);

  // Feedback Success Notification
  const [notificationSucces, setNotificationSucces] = useState<string | null>(null);

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

  const ajouterAuPanier = (prod: MockProduit, variation?: string) => {
    setPanier((prev) => {
      const exist = prev.find((item) => item.produit.id === prod.id && item.variationSelectionnee === variation);
      if (exist) {
        return prev.map((item) =>
          item.produit.id === prod.id && item.variationSelectionnee === variation
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      }
      return [...prev, { produit: prod, quantite: 1, variationSelectionnee: variation || prod.variations?.[0] }];
    });
    setNotificationSucces(`"${prod.nom}" ajouté au panier.`);
  };

  const modifierQuantite = (id: string, delta: number) => {
    setPanier((prev) =>
      prev
        .map((item) => {
          if (item.produit.id === id) {
            const newQ = item.quantite + delta;
            return newQ > 0 ? { ...item, quantite: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as { produit: MockProduit; quantite: number; variationSelectionnee?: string }[]
    );
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
    setNotificationSucces('Votre commande globale multi-vendeurs a été créée avec succès !');
    setOngletActif('commandes');
  };

  // Memoized Search & Filtering
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
    const map = new Map<string, { produit: MockProduit; quantite: number; variationSelectionnee?: string }[]>();
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
  const totalArticlesCount = panier.reduce((acc, i) => acc + i.quantite, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Ecosystem Navbar */}
      <EcosystemNav />

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Buyer Role Sub-Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShoppingBag className="w-4 h-4" /> Application SOKU Acheteur
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Découverte & Achats</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Parcourez le catalogue local, organisez votre panier multi-vendeurs et suivez vos livraisons SOKU.
            </p>
          </div>

          <button
            onClick={declencherAnalyseAlgo}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Analyse Algorithmique Acheteur
          </button>
        </div>

        {/* Global Notification Banner */}
        {notificationSucces && (
          <SuccessBanner
            title="Notification SOKU"
            message={notificationSucces}
            onClose={() => setNotificationSucces(null)}
          />
        )}

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

            <div className="pt-2 border-t border-amber-200 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] text-amber-800 italic">
                * L&apos;algorithme conseille mais n&apos;effectue aucun achat automatique.
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

        {/* Buyer Mobile Tab Navigation */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-around text-xs font-bold">
          <button
            onClick={() => setOngletActif('catalogue')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              ongletActif === 'catalogue' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4 text-amber-400" /> Catalogue
          </button>
          <button
            onClick={() => setOngletActif('panier')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
              ongletActif === 'panier' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" /> Panier
            {totalArticlesCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                {totalArticlesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setOngletActif('commandes')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              ongletActif === 'commandes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" /> Suivi Commandes ({commandes.length})
          </button>
        </div>

        {/* TAB 1: CATALOGUE & SEARCH */}
        {ongletActif === 'catalogue' && (
          <div className="space-y-4">
            {/* Search & Categories Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
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

            {/* Product Cards Grid */}
            {produitsFiltres.length === 0 ? (
              <EmptyState
                title="Aucun produit trouvé"
                description="Aucun article ne correspond à vos critères de recherche dans le catalogue SOKU."
                actionLabel="Réinitialiser la recherche"
                onAction={() => {
                  setRecherche('');
                  setCategorieFiltre('TOUS');
                }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {produitsFiltres.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setProduitDetail(prod);
                      if (prod.variations && prod.variations.length > 0) {
                        setVariationChoisie(prod.variations[0]);
                      }
                    }}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    {/* Image Container */}
                    <div className="relative w-full h-36 sm:h-44 bg-slate-100 overflow-hidden">
                      <Image
                        src={prod.imageUrl}
                        alt={prod.nom}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Badges Overlay */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                        {prod.reductionPourcentage && (
                          <span className="bg-rose-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                            -{prod.reductionPourcentage}%
                          </span>
                        )}
                        {prod.badge && (
                          <span className="bg-slate-900/90 text-amber-400 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                            {prod.badge.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3 space-y-2 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            {prod.prix.toLocaleString()} FCFA
                          </span>
                          {prod.ancienPrix && (
                            <span className="text-[11px] text-slate-400 line-through font-medium">
                              {prod.ancienPrix.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 mt-0.5 group-hover:text-amber-600 transition-colors">
                          {prod.nom}
                        </h3>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                            <span>{prod.note}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500">{prod.nombreVentes} vendus</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-1.5 text-slate-500">
                          <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                            {prod.boutiqueNom}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              ajouterAuPanier(prod);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-lg shadow-xs font-bold text-[10px] flex items-center justify-center shrink-0"
                            title="Ajouter au Panier"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-VENDOR CART & CHECKOUT */}
        {ongletActif === 'panier' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                Mon Panier SOKU ({totalArticlesCount} articles)
              </h2>

              {panier.length === 0 ? (
                <EmptyState
                  title="Votre panier est vide"
                  description="Découvrez les produits locaux du catalogue et ajoutez-les à votre panier SOKU."
                  actionLabel="Explorer le Catalogue"
                  onAction={() => setOngletActif('catalogue')}
                  icon={ShoppingBasket}
                />
              ) : (
                <div className="space-y-4">
                  {/* Multi-Vendor Cart Decomposition */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      Décomposition Multi-Vendeurs (Paiement Unique SOKU) :
                    </p>

                    {panierParVendeur.map(([boutiqueNom, items]) => (
                      <div key={boutiqueNom} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                          <span className="flex items-center gap-1.5 text-sm">
                            <Store className="w-4 h-4 text-amber-600" />
                            {boutiqueNom}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                            Sous-Commande Vendeur
                          </span>
                        </div>

                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.produit.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <p className="font-bold text-slate-900">{item.produit.nom}</p>
                                {item.variationSelectionnee && (
                                  <span className="text-[10px] text-slate-500">
                                    Variante : {item.variationSelectionnee}
                                  </span>
                                )}
                                <p className="text-[11px] text-amber-600 font-extrabold mt-0.5">
                                  {item.produit.prix.toLocaleString()} FCFA / u
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Quantity Adjuster */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                                  <button
                                    onClick={() => modifierQuantite(item.produit.id, -1)}
                                    className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-900 px-1.5">{item.quantite}</span>
                                  <button
                                    onClick={() => modifierQuantite(item.produit.id, 1)}
                                    className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() => retirerDuPanier(item.produit.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Supprimer l'article"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Mode Selection */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Mode de livraison global :
                    </label>
                    <div className="space-y-2 text-xs">
                      {[
                        { id: 'livreur_soku', label: 'Livreur SOKU (Point SOKU opérationnel inclus)', icon: Truck, desc: 'Frais : 1 000 FCFA' },
                        { id: 'vendeur_lui_meme', label: 'Livraison directe par le Vendeur', icon: Store, desc: 'Frais : 800 FCFA' },
                        { id: 'retrait_sur_place', label: 'Retrait direct en Boutique', icon: MapPin, desc: 'Gratuit (0 FCFA)' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setModeLivraison(mode.id as 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                            modeLivraison === mode.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <mode.icon className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="font-bold">{mode.label}</p>
                              <p className="text-[10px] opacity-80">{mode.desc}</p>
                            </div>
                          </div>
                          {modeLivraison === mode.id && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Point SOKU Configuration Card (When Livreur SOKU is active) */}
                  {modeLivraison === 'livreur_soku' && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          Point SOKU de Livraison Configuré
                        </p>
                        <button
                          onClick={() => setModalPointSokuOuvert(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-xs"
                        >
                          Changer / Configurer
                        </button>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-950 space-y-0.5">
                        <p className="font-bold text-slate-900">{pointSokuConfig.nom}</p>
                        <p className="text-[11px] text-amber-900">{pointSokuConfig.repereVisuel}</p>
                        {pointSokuConfig.instructionAcheteur && (
                          <p className="text-[10px] text-slate-600 italic mt-1">
                            &quot;{pointSokuConfig.instructionAcheteur}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Totals & Single Checkout Submit */}
                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total articles</span>
                      <span className="font-semibold">{sousTotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Frais de livraison</span>
                      <span className="font-semibold">{fraisLivraison.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Général (Séquestre Unique)</span>
                      <span className="text-amber-600 text-base">{totalGeneral.toLocaleString()} FCFA</span>
                    </div>

                    <button
                      onClick={validerCommande}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md mt-3"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      Valider ma Commande Globale ({totalGeneral.toLocaleString()} FCFA)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REALTIME ORDER TRACKING */}
        {ongletActif === 'commandes' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Suivi Realtime de mes Commandes ({commandes.length})
              </h2>

              {commandes.length === 0 ? (
                <EmptyState
                  title="Aucune commande enregistrée"
                  description="Validez une commande globale dans le panier pour suivre son statut en temps réel."
                  actionLabel="Parcourir le catalogue"
                  onAction={() => setOngletActif('catalogue')}
                  icon={Clock}
                />
              ) : (
                <div className="space-y-4">
                  {commandes.map((cmd) => (
                    <div key={cmd.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">Commande #{cmd.id}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{cmd.dateCreation}</span>
                        </div>
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase">
                          {cmd.statutGlobal.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Sub-Orders Status Breakdown */}
                      <div className="space-y-2">
                        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                          Sous-Commandes Vendeurs :
                        </p>

                        {cmd.sousCommandes.map((sub) => (
                          <div key={sub.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-amber-600" />
                                {sub.boutiqueNom}
                              </span>
                              <span className="font-bold text-amber-800 text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {sub.statut.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 pl-4 border-l-2 border-amber-200 space-y-0.5">
                              {sub.articles.map((art, idx) => (
                                <p key={idx}>
                                  {art.quantite}x {art.produit.nom}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Point SOKU Information */}
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-bold flex items-center gap-1 text-amber-900">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" /> Point SOKU : {cmd.pointSoku.nom}
                          </p>
                          <p className="text-[10px] text-amber-800">{cmd.pointSoku.repereVisuel}</p>
                        </div>
                      </div>

                      {/* Driver Contact Card (When Driver Assigned) */}
                      {cmd.livreurNom && (
                        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-emerald-950">
                          <div>
                            <p className="font-extrabold text-emerald-900">{cmd.livreurNom}</p>
                            <p className="text-[11px] text-emerald-800">{cmd.livreurVehicule}</p>
                          </div>

                          <button
                            onClick={() =>
                              setModalContactData({
                                nom: cmd.livreurNom!,
                                role: 'LIVREUR',
                                tel: cmd.livreurTelephone!,
                                cmdId: cmd.id,
                              })
                            }
                            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" /> Appeler Livreur
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal (Fiche Produit) */}
      {produitDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setProduitDetail(null)}
              className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full text-slate-500 hover:text-slate-800 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Section */}
            <div className="relative w-full h-56 sm:h-64 bg-slate-100 rounded-xl overflow-hidden">
              <Image
                src={produitDetail.imageUrl}
                alt={produitDetail.nom}
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-1">
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded shadow-xs">
                  {produitDetail.categorie}
                </span>
                {produitDetail.reductionPourcentage && (
                  <span className="bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded shadow-xs">
                    -{produitDetail.reductionPourcentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Product & Boutique Details */}
            <div className="space-y-2">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-snug">
                  {produitDetail.nom}
                </h2>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <Store className="w-3.5 h-3.5 text-amber-500" /> {produitDetail.boutiqueNom}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {produitDetail.prix.toLocaleString()} FCFA
                  </span>
                  {produitDetail.ancienPrix && (
                    <span className="text-sm text-slate-400 line-through font-semibold">
                      {produitDetail.ancienPrix.toLocaleString()} FCFA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-bold">{produitDetail.note}</span>
                  <span className="text-slate-400">({produitDetail.nombreAvis} avis)</span>
                </div>
              </div>
            </div>

            {/* Variants */}
            {produitDetail.variations && produitDetail.variations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Choisissez une variante :
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {produitDetail.variations.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariationChoisie(v)}
                      className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                        variationChoisie === v
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Description :</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{produitDetail.description}</p>
            </div>

            {/* Protection Notice */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-950">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Protection SOKU & Séquestre Non-Custodial
              </p>
              <p className="text-[11px] text-amber-800">
                Vos fonds restent bloqués de manière sécurisée jusqu&apos;à la confirmation de votre livraison.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  ajouterAuPanier(produitDetail, variationChoisie);
                  setProduitDetail(null);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingBasket className="w-4 h-4 fill-slate-950" /> Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point SOKU Configuration Modal */}
      <PointSokuModal
        isOpen={modalPointSokuOuvert}
        onClose={() => setModalPointSokuOuvert(false)}
        onSelectPointSoku={(pt) => {
          setPointSokuConfig(pt);
          setNotificationSucces(`Point SOKU "${pt.nom}" configuré avec succès.`);
        }}
        pointSokuActuel={pointSokuConfig}
      />

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
