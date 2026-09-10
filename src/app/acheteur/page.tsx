'use client';

import { useState, useMemo } from 'react';
import {
  MOCK_PRODUITS,
  MOCK_POINT_SOKU,
  MockProduit,
} from '@/lib/mock-data';
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
  Info,
} from 'lucide-react';

export default function AcheteurPage() {
  const [produits] = useState<MockProduit[]>(MOCK_PRODUITS);
  const [recherche, setRecherche] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('TOUS');
  const [panier, setPanier] = useState<{ produit: MockProduit; quantite: number }[]>([]);
  const [modeLivraison, setModeLivraison] = useState<'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place'>('livreur_soku');
  const [commandeValidee, setCommandeValidee] = useState<boolean>(false);
  const [rapportAlgo, setRapportAlgo] = useState<{
    constat: string;
    explication: string;
    recommandation: string;
  } | null>(null);

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
      categoriesPreferees: ['Alimentation'],
      localisationActuelle: { latitude: 5.3599, longitude: -4.0083 },
    });
    setRapportAlgo({
      constat: res.constat,
      explication: res.explication,
      recommandation: res.recommandation,
    });
  };

  // Bolt Optimization: Memoize search filtering to prevent recalculation on every state change (e.g., cart updates, mode selection)
  const rechercheLower = recherche.toLowerCase();
  const produitsFiltres = useMemo(() => {
    return produits.filter((p) => {
      const correspondRecherche =
        p.nom.toLowerCase().includes(rechercheLower) ||
        p.boutiqueNom.toLowerCase().includes(rechercheLower);
      const correspondCat = categorieFiltre === 'TOUS' || p.categorie === categorieFiltre;
      return correspondRecherche && correspondCat;
    });
  }, [produits, rechercheLower, categorieFiltre]);

  const sousTotal = panier.reduce((acc, item) => acc + item.produit.prix * item.quantite, 0);
  const fraisLivraison = modeLivraison === 'livreur_soku' ? 1000 : modeLivraison === 'vendeur_lui_meme' ? 800 : 0;
  const totalGeneral = sousTotal + (panier.length > 0 ? fraisLivraison : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Profile Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-4 h-4" /> Application SOKU Acheteur
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Découverte & Achats</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Découvrez les produits des vendeurs locaux et choisissez votre mode de livraison adapté.
          </p>
        </div>

        {/* Algo Trigger Button */}
        <button
          onClick={declencherAnalyseAlgo}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          Analyse Algorithmique Acheteur
        </button>
      </div>

      {/* Consultative Algorithmic Banner */}
      {rapportAlgo && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Moteur Algorithmique Acheteur — Recommandation Consultative</span>
          </div>
          <div className="text-xs sm:text-sm text-amber-900 space-y-1.5 pl-7">
            <p><strong>Constat :</strong> {rapportAlgo.constat}</p>
            <p><strong>Explication :</strong> {rapportAlgo.explication}</p>
            <p className="text-amber-950 font-semibold">
              <strong>Recommandation :</strong> {rapportAlgo.recommandation}
            </p>
          </div>
          <p className="text-[11px] text-amber-700 italic pl-7">
            * SOKU suggère des opportunités selon vos habitudes. Vous gardez le contrôle total sur vos décisions d&apos;achat.
          </p>
        </div>
      )}

      {/* Search & Categories */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un produit ou boutique..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['TOUS', 'Alimentation', 'Épicerie', 'Textile'].map((cat) => (
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
        {/* Product Catalog Grid */}
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
                <button
                  onClick={() => ajouterAuPanier(prod)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart & Checkout Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Mon Panier ({panier.reduce((acc, i) => acc + i.quantite, 0)})
            </h2>

            {panier.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Votre panier est vide.</p>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-slate-100 text-xs">
                  {panier.map((item) => (
                    <div key={item.produit.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{item.produit.nom}</p>
                        <p className="text-slate-500">
                          {item.quantite} x {item.produit.prix} FCFA
                        </p>
                      </div>
                      <button
                        onClick={() => retirerDuPanier(item.produit.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delivery Mode Choice */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Choisissez votre mode de livraison :
                  </label>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { id: 'livreur_soku', label: 'Livreur SOKU (Point SOKU inclus)', icon: Truck },
                      { id: 'vendeur_lui_meme', label: 'Livraison directe par le Vendeur', icon: Store },
                      { id: 'retrait_sur_place', label: 'Retrait gratuit sur place', icon: MapPin },
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

                {/* Total & Validation */}
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
                    <span>Total Général</span>
                    <span className="text-amber-600">{totalGeneral.toLocaleString()} FCFA</span>
                  </div>

                  <button
                    onClick={() => setCommandeValidee(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow mt-2"
                  >
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    Valider ma Commande SOKU
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Order Tracking */}
          {commandeValidee && (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-emerald-900 font-bold text-sm">
                <span>Commande #cmd_8080 En Cours</span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-bold">
                  En livraison
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                Votre livreur SOKU <strong>Ibrahim Koné (KTM)</strong> est en route vers le Point SOKU.
              </p>
              <div className="flex gap-2 pt-1">
                <a
                  href="tel:+2250777665544"
                  className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  <Phone className="w-3.5 h-3.5" /> Appeler le Livreur
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
