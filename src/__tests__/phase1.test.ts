import { orchestrateur, REGLES_PAR_DEFAUT } from '../../src/lib/orchestrateur';
import { busEvenements } from '../../src/lib/evenements/bus';
import { apiPaiementUnique } from '../../src/lib/paiement/api-unique';
import { contratMoteurVendeur } from '../../src/lib/algorithmes/vendeur';
import { contratMoteurAcheteur } from '../../src/lib/algorithmes/acheteur';
import { contratMoteurLivreur } from '../../src/lib/algorithmes/livreur';

describe('Phase 1 - Tests des briques fondamentales SOKU', () => {
  describe('1. Central Orchestrator & Platform Rules', () => {
    it('doit renvoyer les règles par défaut', () => {
      const regles = orchestrateur.obtenirRegles();
      expect(regles.commissionPourcentage).toBe(REGLES_PAR_DEFAUT.commissionPourcentage);
      expect(regles.deviseParDefaut).toBe('XOF');
    });

    it('doit calculer correctement la commission plateforme (5%)', () => {
      const commission = orchestrateur.calculerCommission(10000);
      expect(commission).toBe(500);
    });

    it('doit valider les modes de livraison autorisés', () => {
      expect(orchestrateur.validerModeLivraison('livreur_soku')).toBe(true);
      expect(orchestrateur.validerModeLivraison('vendeur_lui_meme')).toBe(true);
      expect(orchestrateur.validerModeLivraison('retrait_sur_place')).toBe(true);
      expect(orchestrateur.validerModeLivraison('teleportation')).toBe(false);
    });

    it('doit refuser le déblocage des fonds en cas de litige ouvert', () => {
      const res = orchestrateur.validerAutorisationDeblocage({
        statutCommande: 'livree',
        preuveValide: true,
        estEnLitige: true,
      });
      expect(res.autorise).toBe(false);
      expect(res.motif).toContain('litige');
    });
  });

  describe('2. Bus d\'événements système', () => {
    it('doit publier et recevoir des événements', async () => {
      const mockCallback = jest.fn();
      const desabonner = busEvenements.abonner('commande:creee', mockCallback);

      await busEvenements.publier('commande:creee', 'test', { commandeId: 'cmd_123' });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].donnees).toEqual({ commandeId: 'cmd_123' });

      desabonner();
    });
  });

  describe('3. API de paiement unique (lib/paiement/api-unique.ts)', () => {
    it('doit exécuter le cycle de vie du paiement avec les méthodes exactes', async () => {
      const initRes = await apiPaiementUnique.initierPaiement({
        commandeId: 'cmd_001',
        montant: 5000,
        devise: 'XOF',
      });
      expect(initRes.succes).toBe(true);
      expect(initRes.statut).toBe('initialise');

      const blocRes = await apiPaiementUnique.bloquerFonds(initRes.referenceTransaction);
      expect(blocRes.succes).toBe(true);
      expect(blocRes.statut).toBe('bloque');

      const valRes = await apiPaiementUnique.validerPreuvesEtDebloquer({
        commandeId: 'cmd_001',
        referenceTransaction: initRes.referenceTransaction,
        preuveValide: true,
      });
      expect(valRes.succes).toBe(true);
      expect(valRes.statut).toBe('valide');
    });
  });

  describe('4. Moteurs algorithmiques (Fondations Phase 1)', () => {
    it('le moteur vendeur doit respecter le flux consultatif', async () => {
      const rapport = await contratMoteurVendeur.analyser('user_vendeur_1', { boutiqueId: 'btq_1' });
      expect(rapport.moteur).toBe('vendeur');
      expect(rapport.constat).toBeDefined();
      expect(rapport.explication).toBeDefined();
      expect(rapport.recommandation).toBeDefined();
    });

    it('le moteur acheteur doit respecter le flux consultatif', async () => {
      const rapport = await contratMoteurAcheteur.analyser('user_acheteur_1', {});
      expect(rapport.moteur).toBe('acheteur');
      expect(rapport.recommandation).toBeDefined();
    });

    it('le moteur livreur doit respecter le flux consultatif', async () => {
      const rapport = await contratMoteurLivreur.analyser('user_livreur_1', { zoneActuelle: 'Cocody', estDisponible: true });
      expect(rapport.moteur).toBe('livreur');
      expect(rapport.recommandation).toBeDefined();
    });
  });
});
