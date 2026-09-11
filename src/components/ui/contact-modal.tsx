'use client';

import React from 'react';
import { Phone, ShieldCheck, X, UserCheck } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinataireNom: string;
  destinataireRole: 'LIVREUR' | 'CLIENT';
  destinataireTelephone: string;
  commandeId: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  destinataireNom,
  destinataireRole,
  destinataireTelephone,
  commandeId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full text-slate-500 hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 text-emerald-700 font-extrabold text-base border-b border-slate-100 pb-3">
          <Phone className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>Contact Direct Opérationnel</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-800">
          <div className="flex items-center justify-between font-extrabold text-slate-900 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {destinataireRole === 'LIVREUR' ? 'Livreur Partenaire' : 'Destinataire Client'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-bold">
              Commande #{commandeId}
            </span>
          </div>

          <p><strong>Nom :</strong> {destinataireNom}</p>
          <p><strong>Téléphone :</strong> {destinataireTelephone}</p>
        </div>

        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            Lien Opérationnel Sécurisé SOKU
          </p>
          <p className="text-emerald-800 leading-snug">
            Ce canal direct est activé uniquement pendant la durée de livraison active de la sous-commande.
          </p>
        </div>

        <p className="text-[10px] text-slate-400 italic text-center">
          Prototype SOKU : L&apos;action déclenche une simulation d&apos;appel direct sécurisé.
        </p>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
          >
            Fermer
          </button>
          <a
            href={`tel:${destinataireTelephone}`}
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Phone className="w-4 h-4" /> Lancer l&apos;appel
          </a>
        </div>
      </div>
    </div>
  );
};
