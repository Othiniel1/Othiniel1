import { sokuMockStore } from '../lib/mock-store';
import { apiUniquePaiement } from '../lib/paiement/api-unique';

describe('SOKU Phase 2C - Multi-Vendor & Order Lifecycle Integration Suite', () => {
  beforeEach(() => {
    sokuMockStore.reinitialiserMockStore();
  });

  test('1. Mock store persistence & reset state determinism', () => {
    const prodsInitial = sokuMockStore.getProduits();
    expect(prodsInitial.length).toBeGreaterThan(0);

    // Modify a product
    sokuMockStore.modifierProduitVendeur(prodsInitial[0].id, { stock: 99, prix: 1234 });
    const modded = sokuMockStore.getProduits().find((p) => p.id === prodsInitial[0].id);
    expect(modded?.stock).toBe(99);
    expect(modded?.prix).toBe(1234);

    // Reset store
    sokuMockStore.reinitialiserMockStore();
    const resetProd = sokuMockStore.getProduits().find((p) => p.id === prodsInitial[0].id);
    expect(resetProd?.stock).not.toBe(99);
  });

  test('2. Vendor stock deduction and insufficient stock error handling', () => {
    const prod = sokuMockStore.getProduits()[0];
    const initialStock = prod.stock;

    // Create valid order
    sokuMockStore.creerCommandeGlobale(
      'Client Test',
      '+22500000000',
      [{ produit: prod, quantite: 1 }],
      'livreur_soku',
      1000
    );

    const updatedProd = sokuMockStore.getProduits().find((p) => p.id === prod.id);
    expect(updatedProd?.stock).toBe(initialStock - 1);

    // Attempt ordering more than available stock
    expect(() => {
      sokuMockStore.creerCommandeGlobale(
        'Client Test Excess',
        '+22500000000',
        [{ produit: prod, quantite: 99999 }],
        'livreur_soku',
        1000
      );
    }).toThrow(/Stock insuffisant/);
  });

  test('3. Sub-order cancellation and partial refund via API unique', () => {
    const refundSpy = jest.spyOn(apiUniquePaiement, 'rembourser');

    const cmd = sokuMockStore.getCommandesGlobales()[0];
    const targetSub = cmd.sousCommandes[0];

    sokuMockStore.annulerSousCommande(cmd.id, targetSub.id, 'Rupture stock vendeur');

    const updatedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    const updatedSub = updatedCmd?.sousCommandes.find((s) => s.id === targetSub.id);

    expect(updatedSub?.statut).toBe('ANNULEE');
    expect(updatedSub?.motifAnnulation).toBe('Rupture stock vendeur');
    expect(refundSpy).toHaveBeenCalledWith(`pay_${cmd.id}`, targetSub.montantSousTotal, 'Rupture stock vendeur');

    refundSpy.mockRestore();
  });

  test('4. Buyer reception confirmation and escrow release', () => {
    const unlockSpy = jest.spyOn(apiUniquePaiement, 'validerPreuvesEtDebloquer');

    const cmd = sokuMockStore.getCommandesGlobales()[0];
    sokuMockStore.confirmerReceptionAcheteur(cmd.id, 5, 'Excellente qualité');

    const updatedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    expect(updatedCmd?.statutGlobal).toBe('LIVREE');
    expect(updatedCmd?.confirmationAcheteur?.noteProduit).toBe(5);
    expect(unlockSpy).toHaveBeenCalled();

    unlockSpy.mockRestore();
  });

  test('5. Multi-vendor cart decomposition remains isolated', () => {
    const prods = sokuMockStore.getProduits();
    const p1 = prods[0]; // Vendor A
    const p2 = prods[1]; // Vendor B

    const cmd = sokuMockStore.creerCommandeGlobale(
      'Acheteur Multi',
      '+22501020304',
      [
        { produit: p1, quantite: 1 },
        { produit: p2, quantite: 2 },
      ],
      'livreur_soku',
      1000
    );

    expect(cmd.sousCommandes.length).toBeGreaterThanOrEqual(2);

    // Cancel sub-order 1 only
    const sub1 = cmd.sousCommandes[0];
    sokuMockStore.annulerSousCommande(cmd.id, sub1.id, 'Test annulation partielle');

    const refreshedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    const cancelledSub = refreshedCmd?.sousCommandes.find((s) => s.id === sub1.id);
    const activeSub = refreshedCmd?.sousCommandes.find((s) => s.id !== sub1.id);

    expect(cancelledSub?.statut).toBe('ANNULEE');
    expect(activeSub?.statut).not.toBe('ANNULEE');
  });
});
