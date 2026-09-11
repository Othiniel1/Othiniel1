import { sokuMockStore } from '../lib/mock-store';
import { orchestrateur } from '../lib/orchestrateur';

describe('Phase 2B - Inter-Application State Synchronization & Workflow Integration', () => {
  test('1. Multi-vendor order creation decomposes sub-orders correctly and generates driver missions', () => {
    const panierDemo = [
      {
        produit: {
          id: 'prod_001',
          nom: 'Attiéké Frais Garba',
          boutiqueNom: 'Délices de Cocody',
          prix: 2500,
          categorie: 'Alimentation',
          description: 'Attiéké frais',
          stock: 20,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          note: 4.8,
          nombreAvis: 10,
          nombreVentes: 100,
        },
        quantite: 2,
      },
      {
        produit: {
          id: 'prod_002',
          nom: 'Huile de Palme Pure',
          boutiqueNom: 'Épicerie Bio Marcory',
          prix: 1800,
          categorie: 'Épicerie',
          description: 'Huile naturelle',
          stock: 30,
          imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
          note: 4.6,
          nombreAvis: 5,
          nombreVentes: 50,
        },
        quantite: 1,
      },
    ];

    const cmdGlobale = sokuMockStore.creerCommandeGlobale(
      'Test Acheteur',
      '+2250707010203',
      panierDemo,
      'livreur_soku',
      1000
    );

    expect(cmdGlobale.id).toBeDefined();
    expect(cmdGlobale.sousCommandes.length).toBe(2);
    expect(cmdGlobale.montantTotalGlobal).toBe(2500 * 2 + 1800 * 1 + 1000);

    // Check vendor sub-orders
    const subCocody = cmdGlobale.sousCommandes.find((s) => s.boutiqueNom === 'Délices de Cocody');
    const subMarcory = cmdGlobale.sousCommandes.find((s) => s.boutiqueNom === 'Épicerie Bio Marcory');

    expect(subCocody).toBeDefined();
    expect(subMarcory).toBeDefined();
    expect(subCocody?.statut).toBe('EN_ATTENTE');
    expect(subMarcory?.statut).toBe('EN_ATTENTE');
  });

  test('2. Vendor setting sub-order state to PRETE triggers driver mission creation', () => {
    const commandes = sokuMockStore.getCommandesGlobales();
    const targetCmd = commandes[0];
    const targetSub = targetCmd.sousCommandes[0];

    sokuMockStore.mettreAJourStatutSousCommande(targetCmd.id, targetSub.id, 'PRETE');

    const updatedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === targetCmd.id);
    const updatedSub = updatedCmd?.sousCommandes.find((s) => s.id === targetSub.id);

    expect(updatedSub?.statut).toBe('PRETE');

    // Verify driver mission created or present
    const missions = sokuMockStore.getMissionsLivreur();
    expect(missions.length).toBeGreaterThan(0);
  });

  test('3. Driver accepting mission updates buyer tracking and assigns driver contact', () => {
    const missions = sokuMockStore.getMissionsLivreur();
    const proposedMission = missions[0];

    sokuMockStore.mettreAJourStatutMissionLivreur(proposedMission.id, 'EN_COURS');

    const updatedMissions = sokuMockStore.getMissionsLivreur();
    const acceptedMission = updatedMissions.find((m) => m.id === proposedMission.id);
    expect(acceptedMission?.statut).toBe('EN_COURS');

    const globalCmd = sokuMockStore
      .getCommandesGlobales()
      .find((c) => c.id === proposedMission.commandeId);

    expect(globalCmd).toBeDefined();
    expect(globalCmd?.livreurNom).toBeDefined();
    expect(globalCmd?.livreurTelephone).toBeDefined();
  });

  test('4. Central Orchestrator enforces commission and escrow rules without alteration', () => {
    const commission = orchestrateur.calculerCommission(10000);
    expect(commission).toBe(500); // 5% platform fee

    const litigationCheck = orchestrateur.validerAutorisationDeblocage({
      statutCommande: 'livree',
      preuveValide: true,
      estEnLitige: true,
    });
    expect(litigationCheck.autorise).toBe(false);
  });
});
