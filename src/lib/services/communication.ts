import {
  IMessagerieService,
  INotificationService,
  ISynchronisationOfflineService,
  MessageSOKU,
  ConversationSOKU,
  NotificationSOKU,
  ActionOfflineSOKU,
} from './communication-interfaces';
import { busEvenements } from '@/lib/evenements/bus';

class InMemoryMessagerieService implements IMessagerieService {
  private conversations: Map<string, ConversationSOKU> = new Map();
  private messages: Map<string, MessageSOKU[]> = new Map();

  constructor() {
    // Demo seed conversation
    const demoConvId = 'conv_cmd_001';
    this.conversations.set(demoConvId, {
      id: demoConvId,
      commandeId: 'CMD-1001',
      participants: [
        { id: 'acheteur_001', nom: 'Kouassi Jean', role: 'ACHETEUR' },
        { id: 'vendeur_001', nom: 'Délices de Cocody', role: 'VENDEUR' },
        { id: 'livreur_001', nom: 'Yao Transport', role: 'LIVREUR' },
      ],
      dateMiseAJour: new Date().toISOString(),
    });
    this.messages.set(demoConvId, [
      {
        id: 'msg_001',
        conversationId: demoConvId,
        expediteurId: 'vendeur_001',
        expediteurNom: 'Délices de Cocody',
        expediteurRole: 'VENDEUR',
        destinataireId: 'acheteur_001',
        contenu: 'Bonjour, votre commande de Garba est bien en cours de préparation.',
        dateEnvoi: new Date().toISOString(),
        estLu: true,
      },
    ]);
  }

  async listerConversations(utilisateurId: string): Promise<ConversationSOKU[]> {
    return Array.from(this.conversations.values()).filter((conv) =>
      conv.participants.some((p) => p.id === utilisateurId)
    );
  }

  async obtenirConversationParCommande(commandeId: string): Promise<ConversationSOKU | null> {
    for (const conv of this.conversations.values()) {
      if (conv.commandeId === commandeId) return conv;
    }
    // Auto-create if not exists for demo context
    const newConvId = `conv_${commandeId}`;
    const newConv: ConversationSOKU = {
      id: newConvId,
      commandeId,
      participants: [
        { id: 'acheteur_001', nom: 'Kouassi Jean', role: 'ACHETEUR' },
        { id: 'vendeur_001', nom: 'Délices de Cocody', role: 'VENDEUR' },
        { id: 'livreur_001', nom: 'Yao Transport', role: 'LIVREUR' },
      ],
      dateMiseAJour: new Date().toISOString(),
    };
    this.conversations.set(newConvId, newConv);
    this.messages.set(newConvId, []);
    return newConv;
  }

  async envoyerMessage(
    conversationId: string,
    expediteurId: string,
    expediteurNom: string,
    expediteurRole: MessageSOKU['expediteurRole'],
    destinataireId: string,
    contenu: string
  ): Promise<MessageSOKU> {
    const nouveauMsg: MessageSOKU = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId,
      expediteurId,
      expediteurNom,
      expediteurRole,
      destinataireId,
      contenu,
      dateEnvoi: new Date().toISOString(),
      estLu: false,
    };

    const list = this.messages.get(conversationId) || [];
    list.push(nouveauMsg);
    this.messages.set(conversationId, list);

    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.dernierMessage = nouveauMsg;
      conv.dateMiseAJour = nouveauMsg.dateEnvoi;
    }

    return nouveauMsg;
  }

  async marquerCommeLu(conversationId: string, utilisateurId: string): Promise<void> {
    const list = this.messages.get(conversationId);
    if (list) {
      list.forEach((m) => {
        if (m.destinataireId === utilisateurId) m.estLu = true;
      });
    }
  }

  public obtenirMessages(conversationId: string): MessageSOKU[] {
    return this.messages.get(conversationId) || [];
  }
}

class InMemoryNotificationService implements INotificationService {
  private notifications: Map<string, NotificationSOKU[]> = new Map();

  constructor() {
    // Listen to business bus events to automatically issue notifications
    busEvenements.abonner('commande:creee', (evt) => {
      const donnees = evt.donnees as { commandeId?: string };
      this.creerNotification(
        'vendeur_001',
        'Nouvelle commande reçue',
        `Commande #${donnees?.commandeId || '1001'} passée par l'acheteur.`,
        'COMMANDE'
      );
    });

    busEvenements.abonner('litige:ouvert', (evt) => {
      const donnees = evt.donnees as { commandeId?: string };
      this.creerNotification(
        'acheteur_001',
        'Litige enregistrée',
        `Le litige concernant la commande #${donnees?.commandeId} a été transmis à l'arbitrage.`,
        'LITIGE'
      );
    });
  }

  async listerNotifications(utilisateurId: string): Promise<NotificationSOKU[]> {
    return this.notifications.get(utilisateurId) || [];
  }

  async creerNotification(
    utilisateurId: string,
    titre: string,
    message: string,
    type: NotificationSOKU['type'],
    lienAction?: string
  ): Promise<NotificationSOKU> {
    const notif: NotificationSOKU = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      utilisateurId,
      titre,
      message,
      type,
      dateCreation: new Date().toISOString(),
      estLue: false,
      lienAction,
    };

    const userNotifs = this.notifications.get(utilisateurId) || [];
    userNotifs.unshift(notif);
    this.notifications.set(utilisateurId, userNotifs);

    return notif;
  }

  async marquerCommeLue(notificationId: string): Promise<void> {
    for (const notifs of this.notifications.values()) {
      const target = notifs.find((n) => n.id === notificationId);
      if (target) {
        target.estLue = true;
        break;
      }
    }
  }
}

class OfflineSyncManager implements ISynchronisationOfflineService {
  private fileAttente: ActionOfflineSOKU[] = [];
  private simulateurEnLigne: boolean = true;

  public setModeSimuleEnLigne(enLigne: boolean) {
    this.simulateurEnLigne = enLigne;
  }

  estEnLigne(): boolean {
    if (typeof window !== 'undefined' && navigator && typeof navigator.onLine === 'boolean') {
      return navigator.onLine && this.simulateurEnLigne;
    }
    return this.simulateurEnLigne;
  }

  async ajouterActionEnAttente(
    typeAction: ActionOfflineSOKU['typeAction'],
    payload: Record<string, unknown>
  ): Promise<ActionOfflineSOKU> {
    // Deduplicate identical pending actions
    const empreinte = JSON.stringify({ typeAction, payload });
    const existant = this.fileAttente.find(
      (a) => a.statut === 'EN_ATTENTE' && JSON.stringify({ typeAction: a.typeAction, payload: a.payload }) === empreinte
    );

    if (existant) return existant;

    const action: ActionOfflineSOKU = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      typeAction,
      payload,
      horodatage: Date.now(),
      statut: 'EN_ATTENTE',
      nbTentatives: 0,
    };

    this.fileAttente.push(action);
    return action;
  }

  async listerActionsEnAttente(): Promise<ActionOfflineSOKU[]> {
    return [...this.fileAttente];
  }

  async synchroniserActions(): Promise<{ succes: number; echecs: number }> {
    if (!this.estEnLigne()) {
      return { succes: 0, echecs: this.fileAttente.filter((a) => a.statut === 'EN_ATTENTE').length };
    }

    let succes = 0;
    let echecs = 0;

    for (const action of this.fileAttente) {
      if (action.statut === 'SYNCHRONISE') continue;

      action.nbTentatives += 1;
      try {
        // Dispatch stored offline action to corresponding repository
        if (action.typeAction === 'CHANGEMENT_STATUT_LIVRAISON') {
          const { livraisonRepository } = await import('./index');
          const p = action.payload as { id: string; statut: 'PROPOSEE' | 'EN_COURS' | 'TERMINEE' | 'REFUSEE' };
          const missions = await livraisonRepository.listerMissions();
          const target = missions.find((m) => m.id === p?.id);
          if (!target) {
            throw new Error(`Mission #${p?.id} non trouvée lors du rejeu.`);
          }
          await livraisonRepository.mettreAJourStatutMission(p.id, p.statut);
        }
        action.statut = 'SYNCHRONISE';
        succes += 1;
      } catch (err: unknown) {
        action.statut = 'ECHEC';
        action.erreurDerniereTentative = (err as Error).message;
        echecs += 1;
      }
    }

    return { succes, echecs };
  }
}

export const messagerieService = new InMemoryMessagerieService();
export const notificationService = new InMemoryNotificationService();
export const offlineSyncManager = new OfflineSyncManager();
