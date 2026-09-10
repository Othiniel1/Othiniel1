export interface MockProduit {
  id: string;
  nom: string;
  boutiqueNom: string;
  prix: number;
  ancienPrix?: number;
  reductionPourcentage?: number;
  categorie: string;
  description: string;
  stock: number;
  imageUrl: string;
  note: number;
  nombreAvis: number;
  nombreVentes: number;
  badge?: 'NOUVEAU' | 'POPULAIRE' | 'PROMO' | 'STOCK_FAIBLE';
  variations?: string[];
}

export interface MockPointSOKU {
  id: string;
  nom: string;
  quartier: string;
  repereVisuel: string;
  latitude: number;
  longitude: number;
}

export interface MockCommande {
  id: string;
  acheteurNom: string;
  acheteurTelephone: string;
  pointSokuNom: string;
  articles: { produitNom: string; quantite: number; prixUnitaire: number }[];
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRETE' | 'EN_LIVRAISON' | 'LIVREE';
  montantTotal: number;
  modeLivraison: 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place';
}

export interface MockMissionLivreur {
  id: string;
  commandeId: string;
  typeMission: 'MUTUALISEE' | 'DEDIEE_PRIORITAIRE';
  pointRetraitNom: string;
  pointLivraisonNom: string;
  remunerationProposeeFCFA: number;
  distanceKm: number;
  statut: 'PROPOSEE' | 'EN_COURS' | 'TERMINEE' | 'REFUSEE';
  clientTelephone: string;
}

export const MOCK_POINT_SOKU: MockPointSOKU = {
  id: 'point_soku_001',
  nom: 'Point SOKU - Carrefour Cocody Saint-Jean',
  quartier: 'Cocody',
  repereVisuel: 'Kiosque SOKU Jaune & Bleu près de la Pharmacie Saint-Jean',
  latitude: 5.3599,
  longitude: -4.0083,
};

export const MOCK_PRODUITS: MockProduit[] = [
  {
    id: 'prod_001',
    nom: 'Attiéké Frais Garba (Sac 5kg)',
    boutiqueNom: 'Délices de Cocody',
    prix: 2500,
    ancienPrix: 3000,
    reductionPourcentage: 16,
    categorie: 'Alimentation',
    description: 'Attiéké frais produit localement à Dabou, emballage hermétique SOKU préservant la fraîcheur et la texture naturelle.',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    note: 4.8,
    nombreAvis: 142,
    nombreVentes: 850,
    badge: 'POPULAIRE',
    variations: ['Sac 5kg Standard', 'Sac 10kg Familial'],
  },
  {
    id: 'prod_002',
    nom: 'Huile de Palme Rouge Pure (1L)',
    boutiqueNom: 'Épicerie Bio Marcory',
    prix: 1800,
    ancienPrix: 2200,
    reductionPourcentage: 18,
    categorie: 'Épicerie',
    description: 'Huile naturelle extraite traditionnellement, riche en vitamine A, idéale pour la sauce graine et plats ivoiriens.',
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    note: 4.6,
    nombreAvis: 89,
    nombreVentes: 420,
    badge: 'PROMO',
    variations: ['Bouteille 1L', 'Bidon 5L'],
  },
  {
    id: 'prod_003',
    nom: 'Pagne Kita Traditionnel (3 Pagnes)',
    boutiqueNom: 'Textiles & Tradition Abidjan',
    prix: 15000,
    ancienPrix: 18000,
    reductionPourcentage: 16,
    categorie: 'Textile',
    description: 'Tissage artisanal haute qualité aux motifs traditionnels ivoiriens, parfait pour événements de prestige.',
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    note: 4.9,
    nombreAvis: 56,
    nombreVentes: 130,
    badge: 'STOCK_FAIBLE',
    variations: ['Motif Royal Or/Bleu', 'Motif Traditionnel Rouge/Vert'],
  },
];

export const MOCK_COMMANDES: MockCommande[] = [
  {
    id: 'cmd_8080',
    acheteurNom: 'Kouassi Jean',
    acheteurTelephone: '+2250707010203',
    pointSokuNom: 'Point SOKU - Carrefour Cocody Saint-Jean',
    articles: [
      { produitNom: 'Attiéké Frais Garba (Sac 5kg)', quantite: 2, prixUnitaire: 2500 },
    ],
    statut: 'EN_LIVRAISON',
    montantTotal: 6000,
    modeLivraison: 'livreur_soku',
  },
  {
    id: 'cmd_8081',
    acheteurNom: 'Awa Diop',
    acheteurTelephone: '+2250505040302',
    pointSokuNom: 'Point SOKU - Plateau Centre',
    articles: [
      { produitNom: 'Huile de Palme Rouge Pure (1L)', quantite: 1, prixUnitaire: 1800 },
    ],
    statut: 'EN_PREPARATION',
    montantTotal: 2600,
    modeLivraison: 'livreur_soku',
  },
];

export const MOCK_MISSIONS_LIVREUR: MockMissionLivreur[] = [
  {
    id: 'miss_101',
    commandeId: 'cmd_8080',
    typeMission: 'MUTUALISEE',
    pointRetraitNom: 'Boutique Délices de Cocody',
    pointLivraisonNom: 'Point SOKU - Saint-Jean',
    remunerationProposeeFCFA: 1200,
    distanceKm: 3.2,
    statut: 'EN_COURS',
    clientTelephone: '+2250707010203',
  },
  {
    id: 'miss_102',
    commandeId: 'cmd_8082',
    typeMission: 'MUTUALISEE',
    pointRetraitNom: 'Boutique Épicerie Bio Marcory',
    pointLivraisonNom: 'Point SOKU - Saint-Jean',
    remunerationProposeeFCFA: 1500,
    distanceKm: 4.5,
    statut: 'PROPOSEE',
    clientTelephone: '+2250102030405',
  },
  {
    id: 'miss_103',
    commandeId: 'cmd_8083',
    typeMission: 'DEDIEE_PRIORITAIRE',
    pointRetraitNom: 'Textiles & Tradition Abidjan',
    pointLivraisonNom: 'Livraison Directe Domicile II Plateau',
    remunerationProposeeFCFA: 3500,
    distanceKm: 8.1,
    statut: 'PROPOSEE',
    clientTelephone: '+2250908070605',
  },
];
