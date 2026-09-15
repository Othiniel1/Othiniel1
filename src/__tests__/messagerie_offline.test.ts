import { messagerieService, notificationService, offlineSyncManager } from '../lib/services/communication';
import { busEvenements } from '../lib/evenements/bus';

describe('Services Messagerie, Notifications & Sync Offline SOKU', () => {
  it('doit envoyer et récupérer des messages dans une conversation contextualisée', async () => {
    const conv = await messagerieService.obtenirConversationParCommande('CMD-TEST-100');
    expect(conv).not.toBeNull();

    const msg = await messagerieService.envoyerMessage(
      conv!.id,
      'acheteur_001',
      'Kouassi Jean',
      'ACHETEUR',
      'vendeur_001',
      'Est-ce que ma commande est prête ?'
    );

    expect(msg.contenu).toBe('Est-ce que ma commande est prête ?');
    expect(msg.estLu).toBe(false);

    const msgs = messagerieService.obtenirMessages(conv!.id);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('doit créer des notifications sur des événements du bus métier SOKU', async () => {
    await busEvenements.publier('commande:creee', 'test', { commandeId: 'CMD-NOTIF-001' });

    const notifs = await notificationService.listerNotifications('vendeur_001');
    expect(notifs.some((n) => n.message.includes('CMD-NOTIF-001'))).toBe(true);
  });

  it('doit enregistrer des actions hors-ligne, dédupliquer et synchroniser correctement', async () => {
    offlineSyncManager.setModeSimuleEnLigne(false);

    const act1 = await offlineSyncManager.ajouterActionEnAttente('CHANGEMENT_STATUT_LIVRAISON', { id: 'm_001', statut: 'EN_COURS' });
    const act2 = await offlineSyncManager.ajouterActionEnAttente('CHANGEMENT_STATUT_LIVRAISON', { id: 'm_001', statut: 'EN_COURS' });

    expect(act1.id).toBe(act2.id); // Deduplication

    let pendings = await offlineSyncManager.listerActionsEnAttente();
    expect(pendings.filter((a) => a.statut === 'EN_ATTENTE').length).toBeGreaterThan(0);

    // Turn online and sync
    offlineSyncManager.setModeSimuleEnLigne(true);
    const res = await offlineSyncManager.synchroniserActions();
    expect(res.succes).toBeGreaterThan(0);

    pendings = await offlineSyncManager.listerActionsEnAttente();
    expect(pendings.every((a) => a.statut === 'SYNCHRONISE')).toBe(true);
  });
});
