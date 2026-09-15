import { messagerieService, notificationService, offlineSyncManager } from '../lib/services/communication';
import { livraisonRepository } from '../lib/services';
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

  it('doit enregistrer des actions hors-ligne, dédupliquer et répercuter réellement les modifications lors de la synchronisation', async () => {
    offlineSyncManager.setModeSimuleEnLigne(false);

    const missionsBefore = await livraisonRepository.listerMissions();
    const targetMission = missionsBefore[0];

    // Queue action offline
    const act1 = await offlineSyncManager.ajouterActionEnAttente('CHANGEMENT_STATUT_LIVRAISON', { id: targetMission.id, statut: 'EN_COURS' });
    const act2 = await offlineSyncManager.ajouterActionEnAttente('CHANGEMENT_STATUT_LIVRAISON', { id: targetMission.id, statut: 'EN_COURS' });

    // Deduplication check
    expect(act1.id).toBe(act2.id);

    let pendings = await offlineSyncManager.listerActionsEnAttente();
    expect(pendings.filter((a) => a.statut === 'EN_ATTENTE').length).toBeGreaterThan(0);

    // Reconnect and sync
    offlineSyncManager.setModeSimuleEnLigne(true);
    const res = await offlineSyncManager.synchroniserActions();
    expect(res.succes).toBeGreaterThan(0);

    // Verify status transition in queue
    pendings = await offlineSyncManager.listerActionsEnAttente();
    expect(pendings.find((a) => a.id === act1.id)?.statut).toBe('SYNCHRONISE');

    // Verify real state mutation in repository
    const missionsAfter = await livraisonRepository.listerMissions();
    const updatedTarget = missionsAfter.find((m) => m.id === targetMission.id);
    expect(updatedTarget?.statut).toBe('EN_COURS');
  });

  it('doit conserver l’action en statut ECHEC si le rejeu échoue sans la supprimer', async () => {
    offlineSyncManager.setModeSimuleEnLigne(false);

    // Add action with bad payload to trigger rejection
    const invalidAction = await offlineSyncManager.ajouterActionEnAttente('CHANGEMENT_STATUT_LIVRAISON', { id: 'mission_inexistante_9999', statut: 'INVALID_STATUS' });

    offlineSyncManager.setModeSimuleEnLigne(true);
    const res = await offlineSyncManager.synchroniserActions();
    expect(res.echecs).toBeGreaterThan(0);

    const pendings = await offlineSyncManager.listerActionsEnAttente();
    const failedAction = pendings.find((a) => a.id === invalidAction.id);
    expect(failedAction?.statut).toBe('ECHEC');
    expect(failedAction?.nbTentatives).toBeGreaterThan(0);
    expect(failedAction?.erreurDerniereTentative).toBeDefined();
  });
});
