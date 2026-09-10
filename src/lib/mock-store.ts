import { MOCK_PRODUITS, MOCK_MISSIONS_LIVREUR, MOCK_POINT_SOKU, MockProduit, MockMissionLivreur, MockPointSOKU } from './mock-data';
import { busEvenements } from './evenements/bus';

export type StatutCommandeGlobale =
  | 'CREEE'
  | 'PAYEE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'EN_COURS_DE_COLLECTE'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'ANNULEE';

export interface SousCommandeVendeur {
  id: string;
  vendeurId: string;
  boutiqueNom: string;
  articles: { produit: MockProduit; quantite: number; prixUnitaire: number }[];
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRETE' | 'REMISE_AU_LIVREUR' | 'LIVREE';
  montantSousTotal: number;
}

export interface CommandeGlobaleSOKU {
  id: string;
  acheteurId: string;
  acheteurNom: string;
  acheteurTelephone: string;
  sousCommandes: SousCommandeVendeur[];
  statutGlobal: StatutCommandeGlobale;
  fraisLivraison: number;
  montantTotalGlobal: number;
  modeLivraison: 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place';
  pointSoku: MockPointSOKU;
  livreurNom?: string;
  livreurVehicule?: string;
  livreurTelephone?: string;
  dateCreation: string;
}

// Global Shared Demo State
class SOKUMockStore {
  private produits: MockProduit[] = [...MOCK_PRODUITS];
  private commandesGlobales: CommandeGlobaleSOKU[] = [];
  private missionsLivreur: MockMissionLivreur[] = [...MOCK_MISSIONS_LIVREUR];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initialiserCommandesParDefaut();
  }

  private initialiserCommandesParDefaut() {
    // Transform mock base order into multi-vendor order structure
    const initialCmd: CommandeGlobaleSOKU = {
      id: 'cmd_8080',
      acheteurId: 'acheteur_001',
      acheteurNom: 'Kouassi Jean',
      acheteurTelephone: '+2250707010203',
      sousCommandes: [
        {
          id: 'sub_8080_a',
          vendeurId: 'vendeur_001',
          boutiqueNom: 'Délices de Cocody',
          articles: [
            { produit: MOCK_PRODUITS[0], quantite: 2, prixUnitaire: 2500 }
          ],
          statut: 'PRETE',
          montantSousTotal: 5000,
        },
        {
          id: 'sub_8080_b',
          vendeurId: 'vendeur_002',
          boutiqueNom: 'Épicerie Bio Marcory',
          articles: [
            { produit: MOCK_PRODUITS[1], quantite: 1, prixUnitaire: 1800 }
          ],
          statut: 'EN_PREPARATION',
          montantSousTotal: 1800,
        }
      ],
      statutGlobal: 'EN_PREPARATION',
      fraisLivraison: 1000,
      montantTotalGlobal: 7800,
      modeLivraison: 'livreur_soku',
      pointSoku: MOCK_POINT_SOKU,
      livreurNom: 'Ibrahim Koné',
      livreurVehicule: 'Moto KTM 150cc',
      livreurTelephone: '+2250777665544',
      dateCreation: new Date().toISOString(),
    };

    this.commandesGlobales = [initialCmd];
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getProduits(): MockProduit[] {
    return this.produits;
  }

  public getCommandesGlobales(): CommandeGlobaleSOKU[] {
    return this.commandesGlobales;
  }

  public getMissionsLivreur(): MockMissionLivreur[] {
    return this.missionsLivreur;
  }

  public ajouterProduit(produit: Omit<MockProduit, 'id'>) {
    const newProd: MockProduit = {
      ...produit,
      id: `prod_${Date.now()}`,
    };
    this.produits = [newProd, ...this.produits];
    this.notify();
    return newProd;
  }

  public creerCommandeGlobale(
    acheteurNom: string,
    acheteurTelephone: string,
    panier: { produit: MockProduit; quantite: number }[],
    modeLivraison: 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place',
    fraisLivraison: number
  ): CommandeGlobaleSOKU {
    // Group cart items by vendor
    const sousCommandesMap = new Map<string, SousCommandeVendeur>();

    panier.forEach(({ produit, quantite }) => {
      const vId = produit.boutiqueNom;
      if (!sousCommandesMap.has(vId)) {
        sousCommandesMap.set(vId, {
          id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          vendeurId: vId,
          boutiqueNom: produit.boutiqueNom,
          articles: [],
          statut: 'EN_ATTENTE',
          montantSousTotal: 0,
        });
      }

      const sub = sousCommandesMap.get(vId)!;
      sub.articles.push({ produit, quantite, prixUnitaire: produit.prix });
      sub.montantSousTotal += produit.prix * quantite;
    });

    const sousCommandes = Array.from(sousCommandesMap.values());
    const sousTotal = sousCommandes.reduce((acc, s) => acc + s.montantSousTotal, 0);

    const nouvelleCommande: CommandeGlobaleSOKU = {
      id: `cmd_${Math.floor(1000 + Math.random() * 9000)}`,
      acheteurId: 'acheteur_001',
      acheteurNom,
      acheteurTelephone,
      sousCommandes,
      statutGlobal: 'PAYEE',
      fraisLivraison,
      montantTotalGlobal: sousTotal + fraisLivraison,
      modeLivraison,
      pointSoku: MOCK_POINT_SOKU,
      dateCreation: new Date().toISOString(),
    };

    this.commandesGlobales = [nouvelleCommande, ...this.commandesGlobales];

    // Emit event on bus
    busEvenements.publier('commande:creee', 'mock-store', {
      commandeId: nouvelleCommande.id,
      total: nouvelleCommande.montantTotalGlobal,
    });

    this.notify();
    return nouvelleCommande;
  }

  public mettreAJourStatutSousCommande(
    commandeId: string,
    sousCommandeId: string,
    nouveauStatut: SousCommandeVendeur['statut']
  ) {
    this.commandesGlobales = this.commandesGlobales.map((cmd) => {
      if (cmd.id !== commandeId) return cmd;

      const nouvellesSousCommandes = cmd.sousCommandes.map((sub) => {
        if (sub.id !== sousCommandeId) return sub;
        return { ...sub, statut: nouveauStatut };
      });

      // Recalculate global order status based on all sub-orders
      let nouveauStatutGlobal = cmd.statutGlobal;
      const tousPrets = nouvellesSousCommandes.every((s) => s.statut === 'PRETE' || s.statut === 'REMISE_AU_LIVREUR' || s.statut === 'LIVREE');
      const tousRemis = nouvellesSousCommandes.every((s) => s.statut === 'REMISE_AU_LIVREUR' || s.statut === 'LIVREE');
      const tousLivres = nouvellesSousCommandes.every((s) => s.statut === 'LIVREE');

      if (tousLivres) {
        nouveauStatutGlobal = 'LIVREE';
      } else if (tousRemis) {
        nouveauStatutGlobal = 'EN_LIVRAISON';
      } else if (tousPrets) {
        nouveauStatutGlobal = 'PRETE';
      } else {
        nouveauStatutGlobal = 'EN_PREPARATION';
      }

      // If transition to PRETE, make sure driver mission is available
      if (nouveauStatutGlobal === 'PRETE' && !this.missionsLivreur.some((m) => m.commandeId === cmd.id)) {
        this.missionsLivreur.push({
          id: `miss_${Date.now()}`,
          commandeId: cmd.id,
          typeMission: 'MUTUALISEE',
          pointRetraitNom: `Point Collecte - ${nouvellesSousCommandes[0]?.boutiqueNom || 'Boutique SOKU'}`,
          pointLivraisonNom: cmd.pointSoku.nom,
          remunerationProposeeFCFA: 1400,
          distanceKm: 3.8,
          statut: 'PROPOSEE',
          clientTelephone: cmd.acheteurTelephone,
        });
      }

      return {
        ...cmd,
        sousCommandes: nouvellesSousCommandes,
        statutGlobal: nouveauStatutGlobal,
      };
    });

    this.notify();
  }

  public mettreAJourStatutMissionLivreur(
    missionId: string,
    nouveauStatut: MockMissionLivreur['statut']
  ) {
    this.missionsLivreur = this.missionsLivreur.map((miss) => {
      if (miss.id !== missionId) return miss;

      // Update corresponding order status
      if (nouveauStatut === 'EN_COURS') {
        this.commandesGlobales = this.commandesGlobales.map((cmd) => {
          if (cmd.id === miss.commandeId) {
            return {
              ...cmd,
              statutGlobal: 'EN_LIVRAISON',
              livreurNom: 'Ibrahim Koné (KTM)',
              livreurTelephone: '+2250777665544',
            };
          }
          return cmd;
        });
      } else if (nouveauStatut === 'TERMINEE') {
        this.commandesGlobales = this.commandesGlobales.map((cmd) => {
          if (cmd.id === miss.commandeId) {
            return {
              ...cmd,
              statutGlobal: 'LIVREE',
              sousCommandes: cmd.sousCommandes.map((s) => ({ ...s, statut: 'LIVREE' })),
            };
          }
          return cmd;
        });
      }

      return { ...miss, statut: nouveauStatut };
    });

    this.notify();
  }
}

export const sokuMockStore = new SOKUMockStore();
