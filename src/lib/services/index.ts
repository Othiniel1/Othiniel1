import { sokuMockStore, CommandeGlobaleSOKU, SousCommandeVendeur } from '@/lib/mock-store';
import { MockProduit, MockMissionLivreur } from '@/lib/mock-data';
import {
  IAuthService,
  IProduitRepository,
  ICommandeRepository,
  ILivraisonRepository,
  ProfilUtilisateur,
} from './interfaces';

class InMemoryAuthService implements IAuthService {
  private sessionCourante: ProfilUtilisateur | null = {
    id: 'user_001',
    nom: 'Kouassi Jean',
    telephone: '+2250707010203',
    email: 'kouassi@soku.ci',
    role: 'ACHETEUR',
  };

  async getUtilisateurCourant(): Promise<ProfilUtilisateur | null> {
    return this.sessionCourante;
  }

  async connexion(role: ProfilUtilisateur['role'], _identifiant?: string): Promise<ProfilUtilisateur> {
    const profilsSimules: Record<ProfilUtilisateur['role'], ProfilUtilisateur> = {
      ACHETEUR: { id: 'acheteur_001', nom: 'Kouassi Jean', telephone: '+2250707010203', role: 'ACHETEUR' },
      VENDEUR: { id: 'vendeur_001', nom: 'Délices de Cocody', telephone: '+2250102030405', role: 'VENDEUR', boutiqueId: 'vendeur_001' },
      LIVREUR: { id: 'livreur_001', nom: 'Yao Transport', telephone: '+2250506070809', role: 'LIVREUR' },
      ADMIN: { id: 'admin_001', nom: 'Admin SOKU', telephone: '+2250000000000', role: 'ADMIN' },
    };

    this.sessionCourante = profilsSimules[role] || profilsSimules.ACHETEUR;
    return this.sessionCourante;
  }

  async deconnexion(): Promise<void> {
    this.sessionCourante = null;
  }
}

class InMemoryProduitRepository implements IProduitRepository {
  async listerProduits(filtre?: { recherche?: string; categorie?: string }): Promise<MockProduit[]> {
    let prods = sokuMockStore.getProduits();
    if (filtre?.recherche) {
      const q = filtre.recherche.toLowerCase();
      prods = prods.filter((p) => p.nom.toLowerCase().includes(q) || p.boutiqueNom.toLowerCase().includes(q));
    }
    if (filtre?.categorie && filtre.categorie !== 'TOUS') {
      prods = prods.filter((p) => p.categorie === filtre.categorie);
    }
    return prods;
  }

  async obtenirParId(id: string): Promise<MockProduit | null> {
    return sokuMockStore.getProduits().find((p) => p.id === id) || null;
  }

  async sauvegarderProduit(produit: Partial<MockProduit>): Promise<MockProduit> {
    if (!produit.nom || !produit.prix) {
      throw new Error('Champs obligatoires manquants');
    }
    return sokuMockStore.ajouterProduit({
      nom: produit.nom,
      prix: produit.prix,
      boutiqueNom: produit.boutiqueNom || 'Boutique Partenaire',
      categorie: produit.categorie || 'Alimentation',
      imageUrl: produit.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      badge: produit.badge,
      note: 5.0,
      nombreAvis: 1,
      nombreVentes: 0,
      stock: produit.stock ?? 10,
      variations: produit.variations,
      description: produit.description || '',
    });
  }

  async mettreAJourStockEtPrix(id: string, stock: number, prix: number): Promise<void> {
    sokuMockStore.modifierProduitVendeur(id, { stock, prix });
  }
}

class InMemoryCommandeRepository implements ICommandeRepository {
  async listerCommandesGlobales(): Promise<CommandeGlobaleSOKU[]> {
    return sokuMockStore.getCommandesGlobales();
  }

  async creerCommandeGlobale(
    acheteurNom: string,
    acheteurTel: string,
    articles: { produit: MockProduit; quantite: number; variationSelectionnee?: string }[],
    modeLivraison: 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place',
    fraisLivraison: number
  ): Promise<CommandeGlobaleSOKU> {
    return sokuMockStore.creerCommandeGlobale(acheteurNom, acheteurTel, articles, modeLivraison, fraisLivraison);
  }

  async mettreAJourStatutSousCommande(commandeId: string, sousCommandeId: string, statut: SousCommandeVendeur['statut']): Promise<void> {
    sokuMockStore.mettreAJourStatutSousCommande(commandeId, sousCommandeId, statut);
  }

  async annulerSousCommande(commandeId: string, sousCommandeId: string, motif: string): Promise<void> {
    sokuMockStore.annulerSousCommande(commandeId, sousCommandeId, motif);
  }

  async confirmerReceptionAcheteur(commandeId: string, note?: number, commentaire?: string): Promise<void> {
    sokuMockStore.confirmerReceptionAcheteur(commandeId, note, commentaire);
  }

  async ouvrirLitigeAcheteur(commandeId: string, motif: string, description: string): Promise<void> {
    sokuMockStore.ouvrirLitigeAcheteur(commandeId, motif, description);
  }

  async trancherLitigeAdmin(commandeId: string, decision: 'REMBOURSER_ACHETEUR' | 'DEBLOQUER_VENDEUR', motifAdmin: string): Promise<void> {
    const user = await authService.getUtilisateurCourant();
    if (user?.role !== 'ADMIN') {
      throw new Error('Accès refusé : Opération réservée exclusivement aux administrateurs SOKU');
    }
    sokuMockStore.trancherLitigeAdmin(commandeId, decision, motifAdmin);
  }
}

class InMemoryLivraisonRepository implements ILivraisonRepository {
  async listerMissions(): Promise<MockMissionLivreur[]> {
    return sokuMockStore.getMissionsLivreur();
  }

  async mettreAJourStatutMission(missionId: string, statut: MockMissionLivreur['statut']): Promise<void> {
    sokuMockStore.mettreAJourStatutMissionLivreur(missionId, statut);
  }
}

export const authService = new InMemoryAuthService();
export const produitRepository = new InMemoryProduitRepository();
export const commandeRepository = new InMemoryCommandeRepository();
export const livraisonRepository = new InMemoryLivraisonRepository();
