/**
 * Structures et contrats de base pour les 3 moteurs algorithmiques SOKU.
 * Principe fondamental:
 * données -> analyse -> constat -> explication -> recommandation -> décision de l'utilisateur
 * Les moteurs sont strictement consultatifs et ne prennent PAS de décisions automatiques à la place de l'utilisateur.
 */

export type TypeMoteur = 'vendeur' | 'acheteur' | 'livreur';

export interface RapportAlgorithmique<TDonnees = Record<string, unknown>> {
  id: string;
  moteur: TypeMoteur;
  utilisateurId: string;
  donneesAnalysées: TDonnees;
  constat: string;
  explication: string;
  recommandation: string;
  horodatage: string;
}

export interface MoteurAlgorithmiqueBase<TContext = Record<string, unknown>, TOutput = Record<string, unknown>> {
  moteurType: TypeMoteur;
  analyser(utilisateurId: string, contexte: TContext): Promise<RapportAlgorithmique<TOutput>>;
}
