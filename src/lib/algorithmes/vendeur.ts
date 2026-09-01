import { MoteurAlgorithmiqueBase, RapportAlgorithmique } from './types';

export interface ContexteVendeur {
  boutiqueId: string;
  periodeJours?: number;
}

export interface DonneesAnalyseVendeur {
  totalVentes: number;
  produitsPopulaires: string[];
  rupturesStockImminentes: string[];
  tauxConversion: number;
}

export class ContratMoteurVendeur implements MoteurAlgorithmiqueBase<ContexteVendeur, DonneesAnalyseVendeur> {
  public readonly moteurType = 'vendeur';

  public async analyser(
    utilisateurId: string,
    _contexte: ContexteVendeur
  ): Promise<RapportAlgorithmique<DonneesAnalyseVendeur>> {
    const donnees: DonneesAnalyseVendeur = {
      totalVentes: 15,
      produitsPopulaires: ['Atiéké Premium', 'Huile de Palme 1L'],
      rupturesStockImminentes: ['Atiéké Premium'],
      tauxConversion: 12.5,
    };

    return {
      id: `rep_vendeur_${Date.now()}`,
      moteur: this.moteurType,
      utilisateurId,
      donneesAnalysées: donnees,
      constat: `Le produit "Atiéké Premium" représente 60% de vos ventes mais votre stock actuel sera épuisé dans environ 2 jours.`,
      explication: `La demande a augmenté de 25% cette semaine suite aux avis positifs reçus.`,
      recommandation: `Nous vous suggérons de réapprovisionner 50 unités de "Atiéké Premium" pour éviter une perte de chiffre d'affaires.`,
      horodatage: new Date().toISOString(),
    };
  }
}

export const contratMoteurVendeur = new ContratMoteurVendeur();
