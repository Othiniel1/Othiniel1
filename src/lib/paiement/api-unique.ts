/**
 * Abstraction unique du systeme de paiement SOKU
 * SOKU NE DETIENT JAMAIS DIRECTEMENT LES FONDS DES UTILISATEURS.
 * Cette API interagit exclusivement avec les prestataires de paiement externes.
 */

export interface ParametresInitierPaiement {
  commandeId: string;
  montant: number;
  devise: string;
  telephoneAcheteur?: string;
  urlRetour?: string;
}

export interface ResultatPaiement {
  succes: boolean;
  referenceTransaction: string;
  statut: 'initialise' | 'bloque' | 'valide' | 'echec' | 'rembourse';
  message?: string;
  horodatage: string;
}

export interface ParametresValidationPreuve {
  commandeId: string;
  referenceTransaction: string;
  hashQrCode?: string;
  codeOtp?: string;
  preuveValide: boolean;
}

export interface ApiPaiementUnique {
  initierPaiement(params: ParametresInitierPaiement): Promise<ResultatPaiement>;
  bloquerFonds(referenceTransaction: string): Promise<ResultatPaiement>;
  verifierStatut(referenceTransaction: string): Promise<ResultatPaiement>;
  traiterWebhook(payload: Record<string, unknown>, signature?: string): Promise<ResultatPaiement>;
  validerPreuvesEtDebloquer(params: ParametresValidationPreuve): Promise<ResultatPaiement>;
  rembourser(referenceTransaction: string, motif?: string): Promise<ResultatPaiement>;
}

/**
 * Implementation de demonstration du service de paiement abstrait
 */
export class ServicePaiementUnique implements ApiPaiementUnique {
  public async initierPaiement(params: ParametresInitierPaiement): Promise<ResultatPaiement> {
    const referenceTransaction = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      succes: true,
      referenceTransaction,
      statut: 'initialise',
      message: `Paiement initie pour un montant de ${params.montant} ${params.devise}`,
      horodatage: new Date().toISOString(),
    };
  }

  public async bloquerFonds(referenceTransaction: string): Promise<ResultatPaiement> {
    return {
      succes: true,
      referenceTransaction,
      statut: 'bloque',
      message: 'Fonds sequestres avec succes chez le prestataire externe',
      horodatage: new Date().toISOString(),
    };
  }

  public async verifierStatut(referenceTransaction: string): Promise<ResultatPaiement> {
    return {
      succes: true,
      referenceTransaction,
      statut: 'bloque',
      message: 'Statut verifie avec succes',
      horodatage: new Date().toISOString(),
    };
  }

  public async traiterWebhook(payload: Record<string, unknown>): Promise<ResultatPaiement> {
    const ref = (payload.referenceTransaction as string) || 'tx_webhook_demo';
    return {
      succes: true,
      referenceTransaction: ref,
      statut: 'valide',
      message: 'Webhook traite avec succes',
      horodatage: new Date().toISOString(),
    };
  }

  public async validerPreuvesEtDebloquer(params: ParametresValidationPreuve): Promise<ResultatPaiement> {
    if (!params.preuveValide) {
      return {
        succes: false,
        referenceTransaction: params.referenceTransaction,
        statut: 'echec',
        message: 'Validation echouee : Preuve de livraison invalide',
        horodatage: new Date().toISOString(),
      };
    }

    return {
      succes: true,
      referenceTransaction: params.referenceTransaction,
      statut: 'valide',
      message: 'Fonds debloces et transferes au vendeur via le prestataire',
      horodatage: new Date().toISOString(),
    };
  }

  public async rembourser(referenceTransaction: string, motif?: string): Promise<ResultatPaiement> {
    return {
      succes: true,
      referenceTransaction,
      statut: 'rembourse',
      message: `Remboursement effectue. Motif: ${motif || 'Non precise'}`,
      horodatage: new Date().toISOString(),
    };
  }
}

export const apiPaiementUnique = new ServicePaiementUnique();
