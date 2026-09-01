import { MoteurAlgorithmiqueBase, RapportAlgorithmique } from './types';

export interface ContexteLivreur {
  zoneActuelle: string;
  estDisponible: boolean;
}

export interface DonneesAnalyseLivreur {
  coursesDisponiblesZone: number;
  revenuEstimeHeure: number;
  heuresPointeIdentifiees: string[];
}

export class ContratMoteurLivreur implements MoteurAlgorithmiqueBase<ContexteLivreur, DonneesAnalyseLivreur> {
  public readonly moteurType = 'livreur';

  public async analyser(
    utilisateurId: string,
    _contexte: ContexteLivreur
  ): Promise<RapportAlgorithmique<DonneesAnalyseLivreur>> {
    const donnees: DonneesAnalyseLivreur = {
      coursesDisponiblesZone: 8,
      revenuEstimeHeure: 4500,
      heuresPointeIdentifiees: ['12h-14h', '19h-21h'],
    };

    return {
      id: `rep_livreur_${Date.now()}`,
      moteur: this.moteurType,
      utilisateurId,
      donneesAnalysées: donnees,
      constat: `La zone "Cocody Vallon" enregistre une forte demande de livraisons pour le créneau du midi.`,
      explication: `8 commandes sont en attente d'assignation dans un rayon de 2 km.`,
      recommandation: `Positionnez-vous près de la rue des Jardins d'ici 11h45 pour maximiser vos opportunités de courses.`,
      horodatage: new Date().toISOString(),
    };
  }
}

export const contratMoteurLivreur = new ContratMoteurLivreur();
