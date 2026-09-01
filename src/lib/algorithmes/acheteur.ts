import { MoteurAlgorithmiqueBase, RapportAlgorithmique } from './types';

export interface ContexteAcheteur {
  categoriesPreferees?: string[];
  localisationActuelle?: { latitude: number; longitude: number };
}

export interface DonneesAnalyseAcheteur {
  produitsRecommandes: string[];
  boutiquesProches: string[];
  economiePotentielle: number;
}

export class ContratMoteurAcheteur implements MoteurAlgorithmiqueBase<ContexteAcheteur, DonneesAnalyseAcheteur> {
  public readonly moteurType = 'acheteur';

  public async analyser(
    utilisateurId: string,
    _contexte: ContexteAcheteur
  ): Promise<RapportAlgorithmique<DonneesAnalyseAcheteur>> {
    const donnees: DonneesAnalyseAcheteur = {
      produitsRecommandes: ['Alloco Frais', 'Poulet Braisé'],
      boutiquesProches: ['Chez Tata Marcelle (300m)'],
      economiePotentielle: 500,
    };

    return {
      id: `rep_acheteur_${Date.now()}`,
      moteur: this.moteurType,
      utilisateurId,
      donneesAnalysées: donnees,
      constat: `Trois boutiques proches de votre position proposent vos plats préférés avec une réduction pour le retrait sur place.`,
      explication: `Vous effectuez habituellement vos achats alimentaires le vendredi en fin d'après-midi.`,
      recommandation: `Vous pouvez choisir l'option "Retrait sur place" chez Tata Marcelle pour économiser les frais de livraison.`,
      horodatage: new Date().toISOString(),
    };
  }
}

export const contratMoteurAcheteur = new ContratMoteurAcheteur();
