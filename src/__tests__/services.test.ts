import { authService, produitRepository, commandeRepository } from '../lib/services';

describe('Layer SOKU Services & Repositories', () => {
  it('doit retourner le profil utilisateur courant par défaut', async () => {
    const user = await authService.getUtilisateurCourant();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('ACHETEUR');
  });

  it('doit basculer de rôle correctement lors de la connexion', async () => {
    const vendeur = await authService.connexion('VENDEUR');
    expect(vendeur.role).toBe('VENDEUR');
    expect(vendeur.boutiqueId).toBe('vendeur_001');

    const currentUser = await authService.getUtilisateurCourant();
    expect(currentUser?.role).toBe('VENDEUR');
  });

  it('doit filtrer les produits via le ProduitRepository', async () => {
    const tous = await produitRepository.listerProduits();
    expect(tous.length).toBeGreaterThan(0);

    const epicerie = await produitRepository.listerProduits({ categorie: 'Épicerie' });
    expect(epicerie.every((p) => p.categorie === 'Épicerie')).toBe(true);
  });

  it('doit créer une commande via le CommandeRepository et réserver le stock', async () => {
    const prods = await produitRepository.listerProduits();
    const prodTarget = prods[0];
    const initialStock = prodTarget.stock;

    const cmd = await commandeRepository.creerCommandeGlobale(
      'Test User',
      '+2250102030405',
      [{ produit: prodTarget, quantite: 1 }],
      'livreur_soku',
      1000
    );

    expect(cmd).toBeDefined();
    expect(cmd.statutGlobal).toBe('PAYEE');

    const updatedProd = await produitRepository.obtenirParId(prodTarget.id);
    expect(updatedProd?.stock).toBe(initialStock - 1);
  });
});
