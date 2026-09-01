/**
  * Bus d'événements interne SOKU (Decoupled System Event Bus)
  */

export type NomEvenement =
  | 'commande:creee'
  | 'commande:payee'
  | 'commande:annulee'
  | 'livraison:assignee'
  | 'livraison:validee'
  | 'paiement:bloque'
  | 'paiement:debloque'
  | 'litige:ouvert';

export interface EvenementSysteme<T = unknown> {
  id: string;
  nom: NomEvenement;
  source: string;
  donnees: T;
  timestamp: string;
}

type EventCallback<T = unknown> = (evenement: EvenementSysteme<T>) => void | Promise<void>;

class BusEvenements {
  private listeners: Map<NomEvenement, Set<EventCallback>> = new Map();

  /**
   * S'abonner à un événement
   */
  public abonner<T = unknown>(nom: NomEvenement, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(nom)) {
      this.listeners.set(nom, new Set());
    }
    const callbacks = this.listeners.get(nom)!;
    callbacks.add(callback as EventCallback);

    return () => {
      callbacks.delete(callback as EventCallback);
    };
  }

  /**
   * Publier un événement
   */
  public async publier<T = unknown>(
    nom: NomEvenement,
    source: string,
    donnees: T
  ): Promise<EvenementSysteme<T>> {
    const evenement: EvenementSysteme<T> = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      nom,
      source,
      donnees,
      timestamp: new Date().toISOString(),
    };

    const callbacks = this.listeners.get(nom);
    if (callbacks) {
      for (const cb of Array.from(callbacks)) {
        try {
          await cb(evenement);
        } catch (error) {
          // Log errors without stopping execution
          console.error(`Erreur lors du traitement de l'événement ${nom}:`, error);
        }
      }
    }

    return evenement;
  }
}

export const busEvenements = new BusEvenements();
