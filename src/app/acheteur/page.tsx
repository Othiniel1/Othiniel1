'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { sokuMockStore, CommandeGlobaleSOKU } from '@/lib/mock-store';
import { MOCK_POINT_SOKU, MockProduit, MockPointSOKU } from '@/lib/mock-data';
import { authService, produitRepository, commandeRepository } from '@/lib/services';
import { contratMoteurAcheteur } from '@/lib/algorithmes/acheteur';
import { PointSokuModal } from '@/components/ui/point-soku-modal';
import { ChatDrawer } from '@/components/ui/chat-drawer';
import { ContactModal } from '@/components/ui/contact-modal';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { DisputeModal } from '@/components/ui/dispute-modal';
import { EmptyState, SuccessBanner } from '@/components/ui/state-cards';
import {
  ShoppingBag,
  Search,
  MapPin,
  Truck,
  Store,
  CheckCircle,
  Plus,
  Trash2,
  Clock,
  X,
  Check,
  Star,
  ShoppingBasket,
  Sparkles,
  History,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

export default function AcheteurPage() {
  const [produits, setProduits] = useState<MockProduit[]>([]);
  const [commandes, setCommandes] = useState<CommandeGlobaleSOKU[]>([]);
  const [recherche, setRecherche] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('TOUS');
  const [ongletActif, setOngletActif] = useState<'catalogue' | 'panier' | 'commandes' | 'historique'>('catalogue');
  const [panier, setPanier] = useState<{ produit: MockProduit; quantite: number; variationSelectionnee?: string }[]>([]);
  const [modeLivraison, setModeLivraison] = useState<'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place'>('livreur_soku');
  const [produitDetail, setProduitDetail] = useState<MockProduit | null>(null);
  const [variationChoisie, setVariationChoisie] = useState<string>('');

  // Point SOKU Configured State
  const [pointSokuConfig, setPointSokuConfig] = useState<MockPointSOKU & { instructionAcheteur?: string }>(MOCK_POINT_SOKU);
  const [modalPointSokuOuvert, setModalPointSokuOuvert] = useState(false);

  // Modal States
  const [modalContactData, setModalContactData] = useState<{ nom: string; role: 'LIVREUR' | 'CLIENT'; tel: string; cmdId: string } | null>(null);
  const [modalFeedbackCmdId, setModalFeedbackCmdId] = useState<string | null>(null);
  const [modalLitigeCmdId, setModalLitigeCmdId] = useState<string | null>(null);
  const [modalConfirmReset, setModalConfirmReset] = useState(false);

  // Chat Drawer State
  const [chatCommandeId, setChatCommandeId] = useState<string | null>(null);

  // Feedback Notification & Error States
  const [notificationSucces, setNotificationSucces] = useState<string | null>(null);
  const [erreurGlobal, setErreurGlobal] = useState<string | null>(null);

  // Native Insight Recommendations
  const [recommandationProximite, setRecommandationProximite] = useState<{ constat: string; explication: string; recommandation: string } | null>(null);

  useEffect(() => {
    authService.connexion('ACHETEUR');
    produitRepository.listerProduits().then(setProduits);
    commandeRepository.listerCommandesGlobales().then(setCommandes);

    contratMoteurAcheteur.analyser('acheteur_001', {
      categoriesPreferees: ['Alimentation', 'Épicerie'],
      localisationActuelle: { latitude: 5.3599, longitude: -4.0083 },
    }).then((res) => {
      setRecommandationProximite({
        constat: res.constat,
        explication: res.explication,
        recommandation: res.recommandation,
      });
    });

    const unsubscribe = sokuMockStore.subscribe(() => {
      setProduits(sokuMockStore.getProduits());
      setCommandes(sokuMockStore.getCommandesGlobales());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const ajouterAuPanier = (prod: MockProduit, variation?: string) => {
    if (prod.stock <= 0) {
      setErreurGlobal(`Le produit "${prod.nom}" est actuellement en rupture de stock.`);
      return;
    }

    setPanier((prev) => {
      const exist = prev.find((item) => item.produit.id === prod.id && item.variationSelectionnee === variation);
      if (exist) {
        if (exist.quantite + 1 > prod.stock) {
          setErreurGlobal(`Stock maximum atteint (${prod.stock}) pour "${prod.nom}".`);
          return prev;
        }
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
            if (newQ > item.produit.stock) {
              setErreurGlobal(`Stock insuffisant (${item.produit.stock} max)`);
              return item;
            }
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

  const validerCommande = async () => {
    if (panier.length === 0) return;
    const frais = modeLivraison === 'livreur_soku' ? 1000 : modeLivraison === 'vendeur_lui_meme' ? 800 : 0;

    try {
      const currentUser = await authService.getUtilisateurCourant();
      await commandeRepository.creerCommandeGlobale(
        currentUser?.nom || 'Kouassi Jean',
        currentUser?.telephone || '+2250707010203',
        panier,
        modeLivraison,
        frais
      );
      setPanier([]);
      setNotificationSucces('Votre commande globale multi-vendeurs a été créée avec succès !');
      setOngletActif('commandes');
    } catch (e: unknown) {
      setErreurGlobal((e as Error).message || 'Erreur lors de la validation de la commande');
    }
  };

  const confirmerReception = async (cmdId: string, note?: number, commentaire?: string) => {
    try {
      await commandeRepository.confirmerReceptionAcheteur(cmdId, note, commentaire);
      setNotificationSucces(`Livraison #${cmdId} confirmée. Les fonds ont été libérés au vendeur.`);
    } catch (e: unknown) {
      setErreurGlobal((e as Error).message || 'Erreur lors de la confirmation de réception.');
    }
  };

  const ouvrirLitige = async (cmdId: string, motif: string, description: string) => {
    await commandeRepository.ouvrirLitigeAcheteur(cmdId, motif, description);
    setNotificationSucces(`Litige ouvert pour la commande #${cmdId}. Le déblocage des fonds est gelé.`);
  };

  // Filtered lists for active tracking vs archived history
  const commandesActives = useMemo(() => {
    return commandes.filter((c) => c.statutGlobal !== 'LIVREE' && c.statutGlobal !== 'ANNULEE');
  }, [commandes]);

  const commandesHistorique = useMemo(() => {
    return commandes.filter((c) => c.statutGlobal === 'LIVREE' || c.statutGlobal === 'ANNULEE');
  }, [commandes]);

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
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-grow pb-24 sm:pb-12">
        {/* Buyer Standalone App Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShoppingBag className="w-4 h-4" /> SOKU Acheteur
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Découverte & Achats</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Parcourez le catalogue local, organisez votre panier multi-vendeurs et suivez vos livraisons.
            </p>
          </div>

          <button
            onClick={() => setModalConfirmReset(true)}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            title="Réinitialiser l'état prototype"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser Démo
          </button>
        </div>

        {/* Global Notifications */}
        {notificationSucces && (
          <SuccessBanner title="Notification SOKU" message={notificationSucces} onClose={() => setNotificationSucces(null)} />
        )}
        {erreurGlobal && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-2xl text-xs font-bold flex justify-between items-center">
            <span>⚠️ {erreurGlobal}</span>
            <button onClick={() => setErreurGlobal(null)} className="text-rose-700">✕</button>
          </div>
        )}

        {/* Native Insight Recommendation Banner */}
        {recommandationProximite && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Suggéré pour vous à proximité :</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {recommandationProximite.recommandation} ({recommandationProximite.explication})
            </p>
          </div>
        )}

        {/* Buyer Mobile Tab Navigation */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-around text-xs font-bold">
          <button
            onClick={() => setOngletActif('catalogue')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'catalogue' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4 text-amber-400" /> Catalogue
          </button>
          <button
            onClick={() => setOngletActif('panier')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
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
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'commandes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" /> Suivi ({commandesActives.length})
          </button>
          <button
            onClick={() => setOngletActif('historique')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              ongletActif === 'historique' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" /> Historique ({commandesHistorique.length})
          </button>
        </div>

        {/* TAB 1: CATALOGUE */}
        {ongletActif === 'catalogue' && (
          <div className="space-y-4">
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
                      categorieFiltre === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {produitsFiltres.length === 0 ? (
              <EmptyState
                title="Aucun produit trouvé"
                description="Aucun article ne correspond à vos critères dans le catalogue."
                actionLabel="Réinitialiser"
                onAction={() => { setRecherche(''); setCategorieFiltre('TOUS'); }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {produitsFiltres.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setProduitDetail(prod);
                      if (prod.variations && prod.variations.length > 0) setVariationChoisie(prod.variations[0]);
                    }}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="relative w-full h-36 sm:h-44 bg-slate-100 overflow-hidden">
                      <Image
                        src={prod.imageUrl}
                        alt={prod.nom}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                        {prod.reductionPourcentage && (
                          <span className="bg-rose-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                            -{prod.reductionPourcentage}%
                          </span>
                        )}
                        {prod.stock <= 0 && (
                          <span className="bg-slate-900 text-rose-400 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                            Rupture
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 space-y-2 flex-grow flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-slate-900">{prod.prix.toLocaleString()} FCFA</span>
                          {prod.ancienPrix && (
                            <span className="text-[11px] text-slate-400 line-through font-medium">{prod.ancienPrix.toLocaleString()} FCFA</span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 mt-0.5 group-hover:text-amber-600 transition-colors">
                          {prod.nom}
                        </h3>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-1.5 text-slate-500">
                          <span className="font-semibold text-slate-700 truncate max-w-[100px]">{prod.boutiqueNom}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); ajouterAuPanier(prod); }}
                            disabled={prod.stock <= 0}
                            className={`p-1.5 rounded-lg shadow-xs font-bold text-[10px] flex items-center justify-center shrink-0 ${
                              prod.stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
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

        {/* TAB 2: PANIER MULTI-VENDEURS */}
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
                  description="Découvrez les produits locaux et ajoutez-les à votre panier multi-vendeurs."
                  actionLabel="Explorer le Catalogue"
                  onAction={() => setOngletActif('catalogue')}
                  icon={ShoppingBasket}
                />
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      Décomposition Multi-Vendeurs (Paiement Unique SOKU) :
                    </p>

                    {panierParVendeur.map(([boutiqueNom, items]) => (
                      <div key={boutiqueNom} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                          <span className="flex items-center gap-1.5 text-sm">
                            <Store className="w-4 h-4 text-amber-600" /> {boutiqueNom}
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
                                <p className="text-[11px] text-amber-600 font-extrabold mt-0.5">
                                  {item.produit.prix.toLocaleString()} FCFA / u
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                                  <button onClick={() => modifierQuantite(item.produit.id, -1)} className="w-5 h-5 bg-white rounded font-bold text-slate-700 text-xs shadow-xs">-</button>
                                  <span className="font-bold text-slate-900 px-1.5">{item.quantite}</span>
                                  <button onClick={() => modifierQuantite(item.produit.id, 1)} className="w-5 h-5 bg-white rounded font-bold text-slate-700 text-xs shadow-xs">+</button>
                                </div>

                                <button onClick={() => retirerDuPanier(item.produit.id)} className="text-slate-400 hover:text-rose-600 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">Mode de livraison global :</label>
                    <div className="space-y-2">
                      {[
                        { id: 'livreur_soku', label: 'Livreur SOKU (Point SOKU inclus)', icon: Truck, desc: 'Frais : 1 000 FCFA' },
                        { id: 'vendeur_lui_meme', label: 'Livraison directe Vendeur', icon: Store, desc: 'Frais : 800 FCFA' },
                        { id: 'retrait_sur_place', label: 'Retrait direct en Boutique', icon: MapPin, desc: 'Gratuit (0 FCFA)' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setModeLivraison(mode.id as 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                            modeLivraison === mode.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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

                  {modeLivraison === 'livreur_soku' && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-600" /> Point SOKU Configuré
                        </p>
                        <button onClick={() => setModalPointSokuOuvert(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-xs">
                          Changer
                        </button>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-950">
                        <p className="font-bold text-slate-900">{pointSokuConfig.nom}</p>
                        <p className="text-[11px] text-amber-900">{pointSokuConfig.repereVisuel}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between text-slate-600"><span>Sous-total</span><span className="font-semibold">{sousTotal.toLocaleString()} FCFA</span></div>
                    <div className="flex justify-between text-slate-600"><span>Frais de livraison</span><span className="font-semibold">{fraisLivraison.toLocaleString()} FCFA</span></div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total (Séquestre SOKU)</span>
                      <span className="text-amber-600 text-base">{totalGeneral.toLocaleString()} FCFA</span>
                    </div>

                    <button
                      onClick={validerCommande}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md mt-3"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-400" /> Valider ma Commande ({totalGeneral.toLocaleString()} FCFA)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SUIVI REALTIME */}
        {ongletActif === 'commandes' && (
          <div className="max-w-2xl mx-auto space-y-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Suivi Realtime des Commandes en Cours ({commandesActives.length})
              </h2>

              {commandesActives.length === 0 ? (
                <EmptyState
                  title="Aucune commande en cours"
                  description="Vos commandes actives s'afficheront ici en temps réel jusqu'à confirmation de livraison."
                  actionLabel="Explorer le catalogue"
                  onAction={() => setOngletActif('catalogue')}
                  icon={Clock}
                />
              ) : (
                <div className="space-y-4">
                  {commandesActives.map((cmd) => (
                    <div key={cmd.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">Commande #{cmd.id}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{cmd.dateCreation}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase ${
                          cmd.statutGlobal === 'EN_LITIGE' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {cmd.statutGlobal.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {cmd.sousCommandes.map((sub) => (
                          <div key={sub.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-900">{sub.boutiqueNom}</span>
                              <span className="text-amber-800 text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {sub.statut.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {sub.articles.map((art, idx) => (
                                <p key={idx}>{art.quantite}x {art.produit.nom}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {cmd.statutGlobal === 'EN_LITIGE' && cmd.litigeDetails && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1 text-rose-950">
                          <p className="font-bold flex items-center gap-1">
                            <ShieldAlert className="w-4 h-4 text-rose-600" /> Litige Ouvert : {cmd.litigeDetails.motif}
                          </p>
                          <p className="text-[11px] text-rose-900">&quot;{cmd.litigeDetails.description}&quot;</p>
                          <p className="text-[10px] text-rose-700 italic">Déblocage des fonds temporairement gelé.</p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
                        <span className="font-extrabold text-slate-900">Total: {cmd.montantTotalGlobal.toLocaleString()} FCFA</span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setChatCommandeId(cmd.id)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 text-[11px]"
                          >
                            💬 Contacter Vendeur/Livreur
                          </button>

                          {cmd.statutGlobal !== 'EN_LITIGE' && (
                            <>
                              <button
                                onClick={() => setModalLitigeCmdId(cmd.id)}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 text-[11px]"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> Déclarer Litige
                              </button>

                              <button
                                onClick={() => setModalFeedbackCmdId(cmd.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 text-[11px] shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Confirmer Réception
                              </button>
                            </>
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

        {/* TAB 4: HISTORIQUE ET ARCHIVES */}
        {ongletActif === 'historique' && (
          <div className="max-w-2xl mx-auto space-y-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Historique des Commandes ({commandesHistorique.length})
              </h2>

              {commandesHistorique.length === 0 ? (
                <EmptyState
                  title="Aucun historique archivé"
                  description="Vos commandes livrées ou annulées apparaîtront dans cette rubrique d'archives."
                  icon={History}
                />
              ) : (
                <div className="space-y-4">
                  {commandesHistorique.map((cmd) => (
                    <div key={cmd.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">Commande #{cmd.id}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{cmd.dateCreation}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase ${
                          cmd.statutGlobal === 'LIVREE' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}>
                          {cmd.statutGlobal}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {cmd.sousCommandes.map((sub) => (
                          <div key={sub.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-900">{sub.boutiqueNom}</p>
                              {sub.motifAnnulation && (
                                <p className="text-[10px] text-rose-600 font-semibold">Motif : {sub.motifAnnulation}</p>
                              )}
                            </div>
                            <span className="font-bold text-slate-700">{sub.montantSousTotal.toLocaleString()} FCFA</span>
                          </div>
                        ))}
                      </div>

                      {cmd.confirmationAcheteur && (
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                          <div className="flex items-center gap-1 font-bold">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> Note donnée : {cmd.confirmationAcheteur.noteProduit}/5
                          </div>
                          {cmd.confirmationAcheteur.commentaire && (
                            <span className="italic text-[10px] text-emerald-800">&quot;{cmd.confirmationAcheteur.commentaire}&quot;</span>
                          )}
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

      {/* Product Detail Modal */}
      {produitDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-slate-200 p-6 relative text-xs">
            <button onClick={() => setProduitDetail(null)} className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full text-slate-500 hover:text-slate-800 z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full h-56 bg-slate-100 rounded-xl overflow-hidden">
              <Image src={produitDetail.imageUrl} alt={produitDetail.nom} fill sizes="500px" className="object-cover" />
            </div>

            <div className="space-y-2">
              <h2 className="font-extrabold text-slate-900 text-lg">{produitDetail.nom}</h2>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">{produitDetail.prix.toLocaleString()} FCFA</span>
                <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                  produitDetail.stock < 5 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Stock disponible : {produitDetail.stock}
                </span>
              </div>
            </div>

            <button
              onClick={() => { ajouterAuPanier(produitDetail, variationChoisie); setProduitDetail(null); }}
              disabled={produitDetail.stock <= 0}
              className={`w-full font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md ${
                produitDetail.stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBasket className="w-4 h-4" /> {produitDetail.stock > 0 ? 'Ajouter au panier' : 'Produit en rupture'}
            </button>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {modalLitigeCmdId && (
        <DisputeModal
          isOpen={!!modalLitigeCmdId}
          onClose={() => setModalLitigeCmdId(null)}
          commandeId={modalLitigeCmdId}
          onConfirmDispute={(motif, desc) => ouvrirLitige(modalLitigeCmdId, motif, desc)}
        />
      )}

      {/* Confirmation & Feedback Modal */}
      {modalFeedbackCmdId && (
        <FeedbackModal
          isOpen={!!modalFeedbackCmdId}
          onClose={() => setModalFeedbackCmdId(null)}
          commandeId={modalFeedbackCmdId}
          onConfirm={(note, com) => confirmerReception(modalFeedbackCmdId, note, com)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {modalConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl border border-slate-200 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" /> Confirmer la réinitialisation
            </h3>
            <p className="text-slate-600">
              Voulez-vous réinitialiser l&apos;état du prototype SOKU ? Toutes les commandes créées et modifications de stock seront effacées.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModalConfirmReset(false)} className="px-3 py-1.5 bg-slate-100 font-bold rounded-lg text-slate-700">Annuler</button>
              <button
                onClick={() => {
                  sokuMockStore.reinitialiserMockStore();
                  setModalConfirmReset(false);
                  setNotificationSucces('État du prototype réinitialisé avec succès.');
                }}
                className="px-3 py-1.5 bg-amber-500 font-bold rounded-lg text-slate-950 shadow-xs"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point SOKU Modal */}
      <PointSokuModal
        isOpen={modalPointSokuOuvert}
        onClose={() => setModalPointSokuOuvert(false)}
        onSelectPointSoku={(pt) => { setPointSokuConfig(pt); setNotificationSucces(`Point SOKU "${pt.nom}" configuré.`); }}
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

      {/* Chat Drawer */}
      {chatCommandeId && (
        <ChatDrawer
          isOpen={!!chatCommandeId}
          onClose={() => setChatCommandeId(null)}
          commandeId={chatCommandeId}
          utilisateurCourant={{ id: 'acheteur_001', nom: 'Kouassi Jean', role: 'ACHETEUR' }}
          destinataireId="vendeur_001"
          destinataireNom="Vendeur Délices de Cocody"
        />
      )}
    </div>
  );
}
