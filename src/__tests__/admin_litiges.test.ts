import { commandeRepository, authService } from '../lib/services';
import { sokuMockStore } from '../lib/mock-store';
import { busEvenements } from '../lib/evenements/bus';

describe('Litiges, Annulations et Arbitrage Administratif (/admin)', () => {
  beforeEach(() => {
    sokuMockStore.reinitialiserMockStore();
  });

  it('doit refuser la décision d’arbitrage si l’utilisateur n’est pas ADMIN', async () => {
    await authService.connexion('ACHETEUR');
    const cmds = await commandeRepository.listerCommandesGlobales();
    const cmdTarget = cmds[0];

    await commandeRepository.ouvrirLitigeAcheteur(cmdTarget.id, 'Produit non conforme', 'Article abîmé');

    await expect(
      commandeRepository.trancherLitigeAdmin(cmdTarget.id, 'REMBOURSER_ACHETEUR', 'Test non autorisé')
    ).rejects.toThrow('Accès refusé');
  });

  it('doit trancher le litige en faveur de l’acheteur (rembourser + restaurer stock)', async () => {
    await authService.connexion('ACHETEUR');
    const cmds = await commandeRepository.listerCommandesGlobales();
    const cmdTarget = cmds[0];

    await commandeRepository.ouvrirLitigeAcheteur(cmdTarget.id, 'Problème de qualité', 'Article non conforme');

    // Switch to ADMIN role
    await authService.connexion('ADMIN');

    let eventEmitted = false;
    busEvenements.abonner('paiement:debloque', (evt) => {
      const data = evt.donnees as { decision: string };
      if (data.decision === 'REMBOURSER_ACHETEUR') eventEmitted = true;
    });

    await commandeRepository.trancherLitigeAdmin(cmdTarget.id, 'REMBOURSER_ACHETEUR', 'Preuve d’insatisfaction validée');

    const updatedCmds = await commandeRepository.listerCommandesGlobales();
    const updatedTarget = updatedCmds.find((c) => c.id === cmdTarget.id);

    expect(updatedTarget?.statutGlobal).toBe('ANNULEE');
    expect(updatedTarget?.sousCommandes.every((s) => s.statut === 'ANNULEE')).toBe(true);
    expect(eventEmitted).toBe(true);
  });

  it('doit trancher le litige en faveur du vendeur (débloquer séquestre)', async () => {
    await authService.connexion('ACHETEUR');
    const cmds = await commandeRepository.listerCommandesGlobales();
    const cmdTarget = cmds[0];

    await commandeRepository.ouvrirLitigeAcheteur(cmdTarget.id, 'Absence injustifiée', 'Client absente lors du rendez-vous');

    await authService.connexion('ADMIN');
    await commandeRepository.trancherLitigeAdmin(cmdTarget.id, 'DEBLOQUER_VENDEUR', 'Preuve de livraison conforme fournie par le livreur');

    const updatedCmds = await commandeRepository.listerCommandesGlobales();
    const updatedTarget = updatedCmds.find((c) => c.id === cmdTarget.id);

    expect(updatedTarget?.statutGlobal).toBe('LIVREE');
    expect(updatedTarget?.sousCommandes.every((s) => s.statut === 'LIVREE')).toBe(true);
  });
});
