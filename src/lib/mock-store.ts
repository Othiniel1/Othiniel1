import { MOCK_PRODUITS, MOCK_MISSIONS_LIVREUR, MOCK_POINT_SOKU, MockProduit, MockMissionLivreur, MockPointSOKU } from './mock-data';
import { busEvenements } from './evenements/bus';
import { orchestrateur } from './orchestrateur';
import { apiUniquePaiement } from './paiement/api-unique';

export type StatutCommandeGlobale =
  | 'CREEE'
  | 'PAYEE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'EN_COURS_DE_COLLECTE'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'EN_LITIGE'
  | 'ANNULEE';

export interface SousCommandeVendeur {
  id: string;
  vendeurId: string;
  boutiqueNom: string;
  articles: { produit: MockProduit; quantite: number; prixUnitaire: number }[];
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRETE' | 'REMISE_AU_LIVREUR' | 'LIVREE' | 'EN_LITIGE' | 'ANNULEE';
  montantSousTotal: number;
  motifAnnulation?: string;
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
  confirmationAcheteur?: {
    date: string;
    noteProduit?: number;
    commentaire?: string;
  };
  litigeDetails?: {
    date: string;
    motif: string;
    description: string;
  };
}

const STORAGE_KEY = 'soku_mock_store_v1';

class SOKUMockStore {
  private produits: MockProduit[] = [...MOCK_PRODUITS];
  private commandesGlobales: CommandeGlobaleSOKU[] = [];
  private missionsLivreur: MockMissionLivreur[] = [...MOCK_MISSIONS_LIVREUR];
  private listeners: Set<() => void> = new Set();
  private isHydrated: boolean = false;

  constructor() {
    this.initialiserCommandesParDefaut();
    // Hydrate client-side safely without SSR mismatch
    if (typeof window !== 'undefined') {
      setTimeout(() => this.hydraterDepuisStorage(), 0);
    }
  }

  private initialiserCommandesParDefaut() {
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

  private hydraterDepuisStorage() {
    try {
      if (typeof window === 'undefined') return;
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.produits && Array.isArray(parsed.produits)) this.produits = parsed.produits;
        if (parsed.commandesGlobales && Array.isArray(parsed.commandesGlobales)) this.commandesGlobales = parsed.commandesGlobales;
        if (parsed.missionsLivreur && Array.isArray(parsed.missionsLivreur)) this.missionsLivreur = parsed.missionsLivreur;
      }
    } catch {
      // Fallback clean deterministic state
    } finally {
      this.isHydrated = true;
      this.notify();
    }
  }

  private sauvegarderDansStorage() {
    try {
      if (typeof window === 'undefined') return;
      const payload = {
        produits: this.produits,
        commandesGlobales: this.commandesGlobales,
        missionsLivreur: this.missionsLivreur,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write issues
    }
  }

  public reinitialiserMockStore() {
    this.produits = [...MOCK_PRODUITS];
    this.missionsLivreur = [...MOCK_MISSIONS_LIVREUR];
    this.initialiserCommandesParDefaut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.sauvegarderDansStorage();
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

  public modifierProduitVendeur(produitId: string, updates: { stock?: number; prix?: number }) {
    this.produits = this.produits.map((p) => {
      if (p.id !== produitId) return p;
      return {
        ...p,
        stock: updates.stock !== undefined ? Math.max(0, updates.stock) : p.stock,
        prix: updates.prix !== undefined ? Math.max(0, updates.prix) : p.prix,
      };
    });
    this.notify();
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
    // Check stock availability
    panier.forEach(({ produit, quantite }) => {
      const liveProd = this.produits.find((p) => p.id === produit.id);
      if (liveProd && liveProd.stock < quantite) {
        throw new Error(`Stock insuffisant pour le produit "${produit.nom}". Stock restant: ${liveProd.stock}`);
      }
    });

    // Deduct stock
    this.produits = this.produits.map((p) => {
      const cartItem = panier.find((i) => i.produit.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantite) };
      }
      return p;
    });

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

  public ouvrirLitigeAcheteur(commandeId: string, motif: string, description: string) {
    this.commandesGlobales = this.commandesGlobales.map((cmd) => {
      if (cmd.id !== commandeId) return cmd;

      return {
        ...cmd,
        statutGlobal: 'EN_LITIGE' as const,
        sousCommandes: cmd.sousCommandes.map((s) => ({ ...s, statut: 'EN_LITIGE' as const })),
        litigeDetails: {
          date: new Date().toISOString(),
          motif,
          description,
        },
      };
    });

    this.notify();
  }

  public trancherLitigeAdmin(commandeId: string, decision: 'REMBOURSER_ACHETEUR' | 'DEBLOQUER_VENDEUR', motifAdmin: string) {
    this.commandesGlobales = this.commandesGlobales.map((cmd) => {
      if (cmd.id !== commandeId) return cmd;
      if (cmd.statutGlobal !== 'EN_LITIGE') throw new Error('Seule une commande EN_LITIGE peut être tranchée par l’administration');

      if (decision === 'REMBOURSER_ACHETEUR') {
        cmd.sousCommandes.forEach((sub) => {
          sub.articles.forEach(({ produit, quantite }) => {
            this.produits = this.produits.map((p) => p.id === produit.id ? { ...p, stock: p.stock + quantite } : p);
          });
        });

        apiUniquePaiement.rembourser(`pay_${cmd.id}`, cmd.montantTotalGlobal, motifAdmin);

        return {
          ...cmd,
          statutGlobal: 'ANNULEE' as const,
          sousCommandes: cmd.sousCommandes.map((s) => ({ ...s, statut: 'ANNULEE' as const, motifAnnulation: `Décision Admin: ${motifAdmin}` })),
        };
      } else {
        apiUniquePaiement.validerPreuvesEtDebloquer({
          commandeId: cmd.id,
          referenceTransaction: `pay_${cmd.id}`,
          preuveValide: true,
        });

        return {
          ...cmd,
          statutGlobal: 'LIVREE' as const,
          sousCommandes: cmd.sousCommandes.map((s) => ({ ...s, statut: 'LIVREE' as const })),
        };
      }
    });

    busEvenements.publier('paiement:debloque', 'orchestrateur-admin', { commandeId, decision, motifAdmin });
    this.notify();
  }

  public annulerSousCommande(commandeId: string, sousCommandeId: string, motif: string) {
    this.commandesGlobales = this.commandesGlobales.map((cmd) => {
      if (cmd.id !== commandeId) return cmd;

      let montantSubARembourser = 0;
      const nouvellesSousCommandes = cmd.sousCommandes.map((sub) => {
        if (sub.id !== sousCommandeId) return sub;
        montantSubARembourser = sub.montantSousTotal;
        return { ...sub, statut: 'ANNULEE' as const, motifAnnulation: motif };
      });

      // Restore stock for cancelled sub-order
      const targetSub = cmd.sousCommandes.find((s) => s.id === sousCommandeId);
      if (targetSub) {
        targetSub.articles.forEach(({ produit, quantite }) => {
          this.produits = this.produits.map((p) => {
            if (p.id === produit.id) {
              return { ...p, stock: p.stock + quantite };
            }
            return p;
          });
        });
      }

      // Check if all sub-orders are now cancelled
      const toutesAnnulees = nouvellesSousCommandes.every((s) => s.statut === 'ANNULEE');
      const statutGlobal = toutesAnnulees ? ('ANNULEE' as const) : cmd.statutGlobal;

      // If all sub-orders are cancelled, refund sub-order total + delivery fees
      const totalARembourser = toutesAnnulees
        ? montantSubARembourser + cmd.fraisLivraison
        : montantSubARembourser;

      if (totalARembourser > 0) {
        apiUniquePaiement.rembourser(`pay_${cmd.id}`, totalARembourser, motif);
      }

      return {
        ...cmd,
        sousCommandes: nouvellesSousCommandes,
        statutGlobal,
      };
    });

    this.notify();
  }

  public confirmerReceptionAcheteur(commandeId: string, noteProduit?: number, commentaire?: string) {
    this.commandesGlobales = this.commandesGlobales.map((cmd) => {
      if (cmd.id !== commandeId) return cmd;

      // Check if order is in dispute
      const estEnLitige = cmd.statutGlobal === 'EN_LITIGE';

      // Validate release through Orchestrator rules
      const validation = orchestrateur.validerAutorisationDeblocage({
        statutCommande: 'livree',
        preuveValide: true,
        estEnLitige,
      });

      if (!validation.autorise) {
        throw new Error(`Déblocage refusé par l'Orchestrateur: ${validation.motif}`);
      }

      apiUniquePaiement.validerPreuvesEtDebloquer({
        commandeId: cmd.id,
        referenceTransaction: `pay_${cmd.id}`,
        preuveValide: true,
      });

      return {
        ...cmd,
        statutGlobal: 'LIVREE' as const,
        sousCommandes: cmd.sousCommandes.map((s) => ({ ...s, statut: 'LIVREE' as const })),
        confirmationAcheteur: {
          date: new Date().toISOString(),
          noteProduit,
          commentaire,
        },
      };
    });

    this.notify();
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
