import { MockProduit, MockMissionLivreur } from '@/lib/mock-data';
import { CommandeGlobaleSOKU, SousCommandeVendeur } from '@/lib/mock-store';

export interface ProfilUtilisateur {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  role: 'ACHETEUR' | 'VENDEUR' | 'LIVREUR' | 'ADMIN';
  boutiqueId?: string;
}

export interface IAuthService {
  getUtilisateurCourant(): Promise<ProfilUtilisateur | null>;
  connexion(role: ProfilUtilisateur['role'], identifiant?: string): Promise<ProfilUtilisateur>;
  deconnexion(): Promise<void>;
}

export interface IProduitRepository {
  listerProduits(filtre?: { recherche?: string; categorie?: string }): Promise<MockProduit[]>;
  obtenirParId(id: string): Promise<MockProduit | null>;
  sauvegarderProduit(produit: Partial<MockProduit>): Promise<MockProduit>;
  mettreAJourStockEtPrix(id: string, stock: number, prix: number): Promise<void>;
}

export interface ICommandeRepository {
  listerCommandesGlobales(): Promise<CommandeGlobaleSOKU[]>;
  creerCommandeGlobale(
    acheteurNom: string,
    acheteurTel: string,
    articles: { produit: MockProduit; quantite: number; variationSelectionnee?: string }[],
    modeLivraison: 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place',
    fraisLivraison: number
  ): Promise<CommandeGlobaleSOKU>;
  mettreAJourStatutSousCommande(commandeId: string, sousCommandeId: string, statut: SousCommandeVendeur['statut']): Promise<void>;
  annulerSousCommande(commandeId: string, sousCommandeId: string, motif: string): Promise<void>;
  confirmerReceptionAcheteur(commandeId: string, note?: number, commentaire?: string): Promise<void>;
  ouvrirLitigeAcheteur(commandeId: string, motif: string, description: string): Promise<void>;
}

export interface ILivraisonRepository {
  listerMissions(): Promise<MockMissionLivreur[]>;
  mettreAJourStatutMission(missionId: string, statut: MockMissionLivreur['statut']): Promise<void>;
}
