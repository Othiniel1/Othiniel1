import { sokuMockStore } from '../lib/mock-store';
import { apiUniquePaiement } from '../lib/paiement/api-unique';

describe('SOKU Phase 2C - Multi-Vendor & Order Lifecycle Integration Suite', () => {
  beforeEach(() => {
    sokuMockStore.reinitialiserMockStore();
  });

  test('1. Mock store persistence & reset state determinism', () => {
    const prodsInitial = sokuMockStore.getProduits();
    expect(prodsInitial.length).toBeGreaterThan(0);

    sokuMockStore.modifierProduitVendeur(prodsInitial[0].id, { stock: 99, prix: 1234 });
    const modded = sokuMockStore.getProduits().find((p) => p.id === prodsInitial[0].id);
    expect(modded?.stock).toBe(99);
    expect(modded?.prix).toBe(1234);

    sokuMockStore.reinitialiserMockStore();
    const resetProd = sokuMockStore.getProduits().find((p) => p.id === prodsInitial[0].id);
    expect(resetProd?.stock).not.toBe(99);
  });

  test('2. Vendor stock deduction and insufficient stock error handling', () => {
    const prod = sokuMockStore.getProduits()[0];
    const initialStock = prod.stock;

    sokuMockStore.creerCommandeGlobale(
      'Client Test',
      '+22500000000',
      [{ produit: prod, quantite: 1 }],
      'livreur_soku',
      1000
    );

    const updatedProd = sokuMockStore.getProduits().find((p) => p.id === prod.id);
    expect(updatedProd?.stock).toBe(initialStock - 1);

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

  test('3. Sub-order cancellation and full refund including delivery fee on total cancellation', () => {
    const refundSpy = jest.spyOn(apiUniquePaiement, 'rembourser');

    const cmd = sokuMockStore.getCommandesGlobales()[0];

    // Cancel all sub-orders
    cmd.sousCommandes.forEach((sub) => {
      sokuMockStore.annulerSousCommande(cmd.id, sub.id, 'Rupture stock vendeur');
    });

    const updatedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    expect(updatedCmd?.statutGlobal).toBe('ANNULEE');

    refundSpy.mockRestore();
  });

  test('4. Buyer dispute workflow freezes escrow release', () => {
    const cmd = sokuMockStore.getCommandesGlobales()[0];

    // Open dispute
    sokuMockStore.ouvrirLitigeAcheteur(cmd.id, 'Produit non conforme', 'Article abîmé lors de la livraison');

    const disputedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    expect(disputedCmd?.statutGlobal).toBe('EN_LITIGE');
    expect(disputedCmd?.litigeDetails?.motif).toBe('Produit non conforme');

    // Attempting confirmation on disputed order should be rejected
    expect(() => {
      sokuMockStore.confirmerReceptionAcheteur(cmd.id, 5, 'Essai de déblocage malgré le litige');
    }).toThrow(/Déblocage refusé/);
  });

  test('5. Buyer reception confirmation and escrow release', () => {
    const unlockSpy = jest.spyOn(apiUniquePaiement, 'validerPreuvesEtDebloquer');

    const cmd = sokuMockStore.getCommandesGlobales()[0];
    sokuMockStore.confirmerReceptionAcheteur(cmd.id, 5, 'Excellente qualité');

    const updatedCmd = sokuMockStore.getCommandesGlobales().find((c) => c.id === cmd.id);
    expect(updatedCmd?.statutGlobal).toBe('LIVREE');
    expect(updatedCmd?.confirmationAcheteur?.noteProduit).toBe(5);
    expect(unlockSpy).toHaveBeenCalled();

    unlockSpy.mockRestore();
  });
});
