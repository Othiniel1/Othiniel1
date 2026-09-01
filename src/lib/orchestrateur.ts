/**
  * Central Orchestrator & Governance Engine
  * Sole authority & single source of truth for platform business rules.
  */

export interface ReglesPlateforme {
  commissionPourcentage: number;
  delaiMaxLivraisonHeures: number;
  fraisLivraisonBase: number;
  deviseParDefaut: string;
  modesLivraisonAutorises: ('livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place')[];
}

export const REGLES_PAR_DEFAUT: ReglesPlateforme = {
  commissionPourcentage: 5.0, // 5% platform commission
  delaiMaxLivraisonHeures: 48,
  fraisLivraisonBase: 1000, // 1000 XOF
  deviseParDefaut: 'XOF',
  modesLivraisonAutorises: ['livreur_soku', 'vendeur_lui_meme', 'retrait_sur_place'],
};

export class OrchestrateurCentral {
  private regles: ReglesPlateforme = { ...REGLES_PAR_DEFAUT };

  /**
   * Recupere la configuration gouvernance active
   */
  public obtenirRegles(): ReglesPlateforme {
    return { ...this.regles };
  }

  /**
   * Met a jour dynamiquement un parametre depuis parametres_orchestrateur
   */
  public mettreAJourRegles(nouvellesRegles: Partial<ReglesPlateforme>): ReglesPlateforme {
    this.regles = {
      ...this.regles,
      ...nouvellesRegles,
    };
    return this.obtenirRegles();
  }

  /**
   * Verifie si un mode de livraison est valide selon les regles de la plateforme
   */
  public validerModeLivraison(mode: string): boolean {
    return this.regles.modesLivraisonAutorises.includes(mode as 'livreur_soku' | 'vendeur_lui_meme' | 'retrait_sur_place');
  }

  /**
   * Calcule la commission plateforme pour une transaction donnée
   */
  public calculerCommission(montantTotal: number): number {
    if (montantTotal <= 0) return 0;
    return (montantTotal * this.regles.commissionPourcentage) / 100;
  }

  /**
   * Valide si le deblocage des fonds est autorisé selon les preuves
   */
  public validerAutorisationDeblocage(params: {
    statutCommande: string;
    preuveValide: boolean;
    estEnLitige: boolean;
  }): { autorise: boolean; motif?: string } {
    if (params.estEnLitige) {
      return { autorise: false, motif: 'Un litige est actuellement ouvert sur la commande' };
    }
    if (params.statutCommande !== 'livree') {
      return { autorise: false, motif: 'La commande doit etre au statut livree' };
    }
    if (!params.preuveValide) {
      return { autorise: false, motif: 'La preuve de livraison est invalide ou manquante' };
    }
    return { autorise: true };
  }
}

export const orchestrateur = new OrchestrateurCentral();
