import { livraisonRepository, stockageMediaService } from '../lib/services';

describe('Preuves de Livraison et Service de Stockage de Médias SOKU', () => {
  it('doit enregistrer une preuve de livraison valide (Code OTP, Signature ou Photo)', async () => {
    const preuve = await livraisonRepository.enregistrerPreuveLivraison({
      commandeId: 'CMD-PROOF-100',
      livreurId: 'livreur_001',
      typePreuve: 'CODE_OTP',
      valeurPreuve: '9842',
    });

    expect(preuve).toBeDefined();
    expect(preuve.id).toContain('prv_');
    expect(preuve.estValide).toBe(true);

    const recup = await livraisonRepository.obtenirPreuveLivraison('CMD-PROOF-100');
    expect(recup?.valeurPreuve).toBe('9842');
  });

  it('doit refuser d’enregistrer une preuve de livraison sans valeur', async () => {
    await expect(
      livraisonRepository.enregistrerPreuveLivraison({
        commandeId: 'CMD-PROOF-101',
        livreurId: 'livreur_001',
        typePreuve: 'SIGNATURE',
        valeurPreuve: '   ',
      })
    ).rejects.toThrow('La valeur de la preuve de livraison est obligatoire');
  });

  it('doit encoder et stocker des médias locaux via StockageMediaService', async () => {
    const res = await stockageMediaService.stockerMedia('photo_livraison.png', 'aW1hZ2UtZGVtby1iYXNlNjQ=');
    expect(res.url).toContain('data:image/png;base64,');
    expect(res.mediaId).toBeDefined();

    await expect(stockageMediaService.supprimerMedia(res.mediaId)).resolves.not.toThrow();
  });
});
