export interface MessageSOKU {
  id: string;
  conversationId: string;
  expediteurId: string;
  expediteurNom: string;
  expediteurRole: 'ACHETEUR' | 'VENDEUR' | 'LIVREUR' | 'SYSTEME';
  destinataireId: string;
  contenu: string;
  dateEnvoi: string;
  estLu: boolean;
}

export interface ConversationSOKU {
  id: string;
  commandeId?: string;
  livraisonId?: string;
  participants: { id: string; nom: string; role: string }[];
  dernierMessage?: MessageSOKU;
  dateMiseAJour: string;
}

export interface NotificationSOKU {
  id: string;
  utilisateurId: string;
  titre: string;
  message: string;
  type: 'COMMANDE' | 'LIVRAISON' | 'LITIGE' | 'SYSTEME';
  dateCreation: string;
  estLue: boolean;
  lienAction?: string;
}

export interface ActionOfflineSOKU {
  id: string;
  typeAction: 'CHANGEMENT_STATUT_LIVRAISON' | 'VALIDATION_RECEPTION' | 'MESSAGERIE_ENVOI';
  payload: Record<string, unknown>;
  horodatage: number;
  statut: 'EN_ATTENTE' | 'SYNCHRONISE' | 'ECHEC';
  nbTentatives: number;
  erreurDerniereTentative?: string;
}

export interface IMessagerieService {
  listerConversations(utilisateurId: string): Promise<ConversationSOKU[]>;
  obtenirConversationParCommande(commandeId: string): Promise<ConversationSOKU | null>;
  envoyerMessage(conversationId: string, expediteurId: string, expediteurNom: string, expediteurRole: MessageSOKU['expediteurRole'], destinataireId: string, contenu: string): Promise<MessageSOKU>;
  marquerCommeLu(conversationId: string, utilisateurId: string): Promise<void>;
}

export interface INotificationService {
  listerNotifications(utilisateurId: string): Promise<NotificationSOKU[]>;
  creerNotification(utilisateurId: string, titre: string, message: string, type: NotificationSOKU['type'], lienAction?: string): Promise<NotificationSOKU>;
  marquerCommeLue(notificationId: string): Promise<void>;
}

export interface ISynchronisationOfflineService {
  ajouterActionEnAttente(typeAction: ActionOfflineSOKU['typeAction'], payload: Record<string, unknown>): Promise<ActionOfflineSOKU>;
  listerActionsEnAttente(): Promise<ActionOfflineSOKU[]>;
  synchroniserActions(): Promise<{ succes: number; echecs: number }>;
  estEnLigne(): boolean;
}
