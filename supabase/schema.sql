-- ==============================================================================
-- SOKU PLATFORM DATABASE SCHEMA (DEFINITIVE 21 TABLES)
-- ==============================================================================
-- Platform: Supabase / PostgreSQL
-- Governance: Centralized business rules enforced by lib/orchestrateur.ts
-- Security: Row Level Security (RLS) enabled on all 21 tables
-- Escrow: Funds NEVER held by SOKU. Table 12 tracks status of external provider holds.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. UTILISATEURS (Profiles / Core Users)
-- Roles: acheteur, vendeur, livreur, administrateur
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    telephone TEXT UNIQUE,
    nom_complet TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('acheteur', 'vendeur', 'livreur', 'administrateur')),
    statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'en_attente_kyc')),
    langue_preferee TEXT NOT NULL DEFAULT 'fr' CHECK (langue_preferee IN ('fr', 'en', 'es', 'pt', 'ar')),
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. DOSSIERS_KYC (KYC Verification Documents & Verification Status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dossiers_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    type_piece TEXT NOT NULL CHECK (type_piece IN ('carte_identite', 'passeport', 'permis_conduire', 'registre_commerce')),
    numero_piece TEXT NOT NULL,
    url_document_recto TEXT NOT NULL,
    url_document_verso TEXT,
    statut_validation TEXT NOT NULL DEFAULT 'soumis' CHECK (statut_validation IN ('soumis', 'en_cours', 'valide', 'rejete')),
    motif_rejet TEXT,
    verifie_le TIMESTAMPTZ,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. BOUTIQUES (Seller Shop Details & Business Profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.boutiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendeur_id UUID NOT NULL UNIQUE REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    nom_boutique TEXT NOT NULL,
    description TEXT,
    adresse TEXT NOT NULL,
    ville TEXT NOT NULL DEFAULT 'Abidjan',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    est_active BOOLEAN NOT NULL DEFAULT TRUE,
    note_moyenne NUMERIC(3, 2) DEFAULT 0.00,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PRODUITS (Product Catalog)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    prix_base NUMERIC(12, 2) NOT NULL CHECK (prix_base >= 0),
    devise TEXT NOT NULL DEFAULT 'XOF',
    categorie TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    est_disponible BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. STOCKS_VARIATIONS (Product Variants & Dynamic Inventory tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stocks_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    nom_variation TEXT NOT NULL, -- e.g. "Taille L - Rouge"
    quantite_disponible INT NOT NULL DEFAULT 0 CHECK (quantite_disponible >= 0),
    prix_ajuste NUMERIC(12, 2),
    sku TEXT UNIQUE,
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. COMMANDES (Master Orders)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.commandes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acheteur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id),
    statut_commande TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_commande IN ('en_attente', 'payee', 'en_prepa', 'en_livraison', 'livree', 'annulee', 'en_litige')),
    montant_total NUMERIC(12, 2) NOT NULL CHECK (montant_total >= 0),
    devise TEXT NOT NULL DEFAULT 'XOF',
    mode_livraison TEXT NOT NULL CHECK (mode_livraison IN ('livreur_soku', 'vendeur_lui_meme', 'retrait_sur_place')),
    frais_livraison NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    adresse_livraison TEXT,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. LIGNES_COMMANDES (Order Line Items)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lignes_commandes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES public.produits(id),
    variation_id UUID REFERENCES public.stocks_variations(id),
    quantite INT NOT NULL CHECK (quantite > 0),
    prix_unitaire NUMERIC(12, 2) NOT NULL CHECK (prix_unitaire >= 0)
);

-- ==============================================================================
-- 8. LIVRAISONS (Master Deliveries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.livraisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL UNIQUE REFERENCES public.commandes(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('livreur_soku', 'vendeur_lui_meme', 'retrait_sur_place')),
    statut_livraison TEXT NOT NULL DEFAULT 'en_attente_assignation' CHECK (statut_livraison IN ('en_attente_assignation', 'assignee', 'recuperee', 'en_transit', 'livree', 'echec')),
    adresse_depart TEXT NOT NULL,
    adresse_arrivee TEXT NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. ASSIGNATIONS_LIVREURS (Delivery Driver Dispatch & Assignments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assignations_livreurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    livraison_id UUID NOT NULL REFERENCES public.livraisons(id) ON DELETE CASCADE,
    livreur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    statut_assignation TEXT NOT NULL DEFAULT 'proposee' CHECK (statut_assignation IN ('proposee', 'acceptee', 'refusee', 'terminee')),
    assigne_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    repondu_le TIMESTAMPTZ
);

-- ==============================================================================
-- 10. PREUVES_LIVRAISON (Delivery Verification Proofs - QR, OTP, Photo, GPS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.preuves_livraison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    livraison_id UUID NOT NULL REFERENCES public.livraisons(id) ON DELETE CASCADE,
    hash_qr_code TEXT NOT NULL,
    code_otp TEXT,
    url_photo_preuve TEXT,
    latitude_validation DOUBLE PRECISION,
    longitude_validation DOUBLE PRECISION,
    valide_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. TRANSACTIONS_PAIEMENT (Payment Log Executed via api-unique.ts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions_paiement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES public.commandes(id),
    reference_externe TEXT NOT NULL UNIQUE,
    montant NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
    devise TEXT NOT NULL DEFAULT 'XOF',
    type_operation TEXT NOT NULL CHECK (type_operation IN ('initiation', 'blocage', 'deblocage', 'remboursement')),
    statut TEXT NOT NULL CHECK (statut IN ('initialise', 'succes', 'echec', 'annule')),
    payload_raw JSONB DEFAULT '{}',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. SEQUESTRES_PAIEMENT (Escrow Status & Hold Metadata ONLY - SOKU NEVER holds funds)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sequestres_paiement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL UNIQUE REFERENCES public.commandes(id),
    transaction_ref TEXT NOT NULL,
    montant_bloque NUMERIC(12, 2) NOT NULL CHECK (montant_bloque >= 0),
    statut_sequestre TEXT NOT NULL DEFAULT 'bloque' CHECK (statut_sequestre IN ('bloque', 'libere_vendeur', 'rembourse_acheteur', 'en_litige')),
    prestataire_externe TEXT NOT NULL, -- Abstracted payment aggregator reference ID
    bloque_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    libere_le TIMESTAMPTZ
);

-- ==============================================================================
-- 13. LITIGES (Disputes & Resolution Management)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.litiges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES public.commandes(id),
    declarant_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    motif TEXT NOT NULL,
    description TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours_investigation', 'resolu_remboursement', 'resolu_maintien_vendeur', 'ferme')),
    solution_apportee TEXT,
    ouvert_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ferme_le TIMESTAMPTZ
);

-- ==============================================================================
-- 14. EVALUATIONS_AVIS (User Ratings & Shop Reviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evaluations_avis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES public.commandes(id),
    auteur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    boutique_id UUID REFERENCES public.boutiques(id),
    livreur_id UUID REFERENCES public.utilisateurs(id),
    note INT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. HISTORIQUE_ANALYTIQUE (Aggregated Analytics Performance Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.historique_analytique (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entite_type TEXT NOT NULL CHECK (entite_type IN ('boutique', 'livreur', 'acheteur', 'plateforme')),
    entite_id UUID NOT NULL,
    metrique TEXT NOT NULL, -- e.g. "ventes_mensuelles", "taux_livraison_reussie"
    valeur NUMERIC(14, 4) NOT NULL,
    periode TEXT NOT NULL, -- e.g. "2026-04"
    calcule_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 16. NOTIFICATIONS (User Notification Queue & Delivery Status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinataire_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    type_notification TEXT NOT NULL,
    est_lue BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 17. MESSAGES_CHAT (Order & Delivery Chat Messages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
    expediteur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    destinataire_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    contenu TEXT NOT NULL,
    est_lu BOOLEAN NOT NULL DEFAULT FALSE,
    envoye_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 18. FILE_ATTENTE_HORS_LIGNE (Offline Action Synchronization Queue)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.file_attente_hors_ligne (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    statut_synchro TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_synchro IN ('en_attente', 'synchronise', 'erreur')),
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synchronise_le TIMESTAMPTZ
);

-- ==============================================================================
-- 19. PARAMETRES_ORCHESTRATEUR (Dynamic Governance Configuration Parameters)
-- Note: lib/orchestrateur.ts remains the single source of truth for logic rules.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parametres_orchestrateur (
    cle TEXT PRIMARY KEY,
    valeur JSONB NOT NULL,
    description TEXT,
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 20. JOURNAUX_EVENEMENTS (Platform Event Bus Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.journaux_evenements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_evenement TEXT NOT NULL,
    source TEXT NOT NULL,
    donnees JSONB NOT NULL,
    publie_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 21. METRIQUES_ALGORITHMES (Output Metrics & Logs for the 3 Independent Engines)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.metriques_algorithmes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moteur TEXT NOT NULL CHECK (moteur IN ('vendeur', 'acheteur', 'livreur')),
    utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
    type_constat TEXT NOT NULL,
    explication TEXT NOT NULL,
    recommandation TEXT NOT NULL,
    donnees_analysees JSONB DEFAULT '{}',
    genere_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & INDEXES
-- ==============================================================================
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livraisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignations_livreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preuves_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_paiement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequestres_paiement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litiges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_analytique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attente_hors_ligne ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_orchestrateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journaux_evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metriques_algorithmes ENABLE ROW LEVEL SECURITY;

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_produits_boutique ON public.produits(boutique_id);
CREATE INDEX IF NOT EXISTS idx_commandes_acheteur ON public.commandes(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_boutique ON public.commandes(boutique_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_commande ON public.livraisons(commande_id);
CREATE INDEX IF NOT EXISTS idx_transactions_commande ON public.transactions_paiement(commande_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_commande ON public.messages_chat(commande_id);
