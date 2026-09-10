'use client';

import { useState } from 'react';
import {
  MOCK_PRODUITS,
  MOCK_COMMANDES,
  MockProduit,
  MockCommande,
} from '@/lib/mock-data';
import { contratMoteurVendeur } from '@/lib/algorithmes/vendeur';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Zap,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function VendeurPage() {
  const [produits, setProduits] = useState<MockProduit[]>(MOCK_PRODUITS);
  const [commandes, setCommandes] = useState<MockCommande[]>(MOCK_COMMANDES);
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauPrix, setNouveauPrix] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('Alimentation');
  const [nouveauStock, setNouveauStock] = useState('10');
  const [rapportAlgo, setRapportAlgo] = useState<{
    constat: string;
    explication: string;
    recommandation: string;
  } | null>(null);

  const ajouterProduit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauNom || !nouveauPrix) return;

    const newProd: MockProduit = {
      id: `prod_${Date.now()}`,
      nom: nouveauNom,
      boutiqueNom: 'Ma Boutique SOKU',
      prix: Number(nouveauPrix),
      categorie: nouvelleCategorie,
      description: 'Produit ajouté depuis le tableau de bord vendeur.',
      stock: Number(nouveauStock),
    };

    setProduits([newProd, ...produits]);
    setNouveauNom('');
    setNouveauPrix('');
  };

  const changerStatutCommande = (id: string, nouveauStatut: MockCommande['statut']) => {
    setCommandes((prev) =>
      prev.map((cmd) => (cmd.id === id ? { ...cmd, statut: nouveauStatut } : cmd))
    );
  };

  const declencherAnalyseAlgo = async () => {
    const res = await contratMoteurVendeur.analyser('vendeur_001', {
      boutiqueId: 'boutique_001',
      periodeJours: 30,
    });
    setRapportAlgo({
      constat: res.constat,
      explication: res.explication,
      recommandation: res.recommandation,
    });
  };

  const chiffreAffairesMois = commandes.reduce((acc, c) => acc + c.montantTotal, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Store className="w-4 h-4" /> Application SOKU Vendeur
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Espace Gestion Boutique</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Gérez votre catalogue, traitez vos commandes et suivez vos recommandations algorithmiques.
          </p>
        </div>

        <button
          onClick={declencherAnalyseAlgo}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          Analyse Algorithmique Vendeur
        </button>
      </div>

      {/* Consultative Banner */}
      {rapportAlgo && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Moteur Algorithmique Vendeur — Recommandation Consultative</span>
          </div>
          <div className="text-xs sm:text-sm text-amber-900 space-y-1.5 pl-7">
            <p><strong>Constat :</strong> {rapportAlgo.constat}</p>
            <p><strong>Explication :</strong> {rapportAlgo.explication}</p>
            <p className="text-amber-950 font-semibold">
              <strong>Recommandation :</strong> {rapportAlgo.recommandation}
            </p>
          </div>
          <p className="text-[11px] text-amber-700 italic pl-7">
            * L&apos;algorithme SOKU ne modifie ni vos prix ni vos stocks de manière autonome. Vous conservez la pleine maîtrise commerciale.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500">Chiffre d&apos;Affaires Estimé</p>
          <p className="text-2xl font-black text-slate-900">{chiffreAffairesMois.toLocaleString()} FCFA</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12% ce mois-ci
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500">Commandes à Traiter</p>
          <p className="text-2xl font-black text-amber-600">
            {commandes.filter((c) => c.statut !== 'LIVREE').length}
          </p>
          <p className="text-[11px] text-slate-500">Préparation & remise livreur</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500">Articles en Catalogue</p>
          <p className="text-2xl font-black text-slate-900">{produits.length}</p>
          <p className="text-[11px] text-slate-500">Stock total : {produits.reduce((acc, p) => acc + p.stock, 0)} unités</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Processing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Commandes Récents & Suivi
            </h2>

            <div className="space-y-3">
              {commandes.map((cmd) => (
                <div key={cmd.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 mr-2">#{cmd.id}</span>
                      <span className="text-xs font-medium text-slate-600">Client : {cmd.acheteurNom}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {cmd.statut}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <p>Articles : {cmd.articles.map((a) => `${a.quantite}x ${a.produitNom}`).join(', ')}</p>
                    <p className="text-slate-500">Point SOKU cible : <strong>{cmd.pointSokuNom}</strong></p>
                    <p className="font-bold text-slate-900">Total : {cmd.montantTotal.toLocaleString()} FCFA</p>
                  </div>

                  {/* Actions according to workflow */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                    {cmd.statut === 'EN_ATTENTE' && (
                      <button
                        onClick={() => changerStatutCommande(cmd.id, 'EN_PREPARATION')}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <Clock className="w-3.5 h-3.5" /> Lancer la Préparation
                      </button>
                    )}
                    {cmd.statut === 'EN_PREPARATION' && (
                      <button
                        onClick={() => changerStatutCommande(cmd.id, 'PRETE')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marquer Prête / Prêt à Remettre au Livreur
                      </button>
                    )}
                    {cmd.statut === 'PRETE' && (
                      <button
                        onClick={() => changerStatutCommande(cmd.id, 'EN_LIVRAISON')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" /> Remis au Livreur SOKU
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catalog Listing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Vos Articles en Vente
            </h2>

            <div className="divide-y divide-slate-100">
              {produits.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{p.nom}</p>
                    <p className="text-slate-500">{p.categorie} — Stock : {p.stock} unités</p>
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm">{p.prix.toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Add Product Form */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Ajouter un Produit
            </h2>

            <form onSubmit={ajouterProduit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du produit</label>
                <input
                  type="text"
                  placeholder="Ex: Banane Aloko Fraîche (Sac)"
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
                  placeholder="Ex: 3000"
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
                <label className="block font-bold text-slate-700 mb-1">Quantité initiale en stock</label>
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Publier dans la Boutique
              </button>
            </form>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-2">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Conseil SOKU Vendeur
            </p>
            <p className="text-amber-800 leading-relaxed">
              Maintenez vos stocks à jour pour éviter tout refus de commande. Les dépôts aux Points SOKU avant 11h augmentent vos ventes de 35%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
