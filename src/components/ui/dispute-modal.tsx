'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  commandeId: string;
  onConfirmDispute: (motif: string, description: string) => void;
}

export function DisputeModal({ isOpen, onClose, commandeId, onConfirmDispute }: DisputeModalProps) {
  const [motif, setMotif] = useState<string>('Produit non conforme ou endommagé');
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 relative text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Ouvrir un Litige SOKU
          </h3>
          <p className="text-slate-500 text-[11px]">
            Commande #{commandeId} — L&apos;ouverture d&apos;un litige bloque immédiatement le déblocage des fonds sous séquestre.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Motif du litige :
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="Produit non conforme ou endommagé">Produit non conforme ou endommagé</option>
              <option value="Articles manquants dans le colis">Articles manquants dans le colis</option>
              <option value="Colis non livré au Point SOKU">Colis non livré au Point SOKU</option>
              <option value="Autre problème de qualité">Autre problème de qualité</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Détails du problème :
            </label>
            <textarea
              rows={3}
              required
              placeholder="Décrivez précisément l'état de l'article ou le problème constaté lors du retrait..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-950 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            L&apos;Orchestrateur Central SOKU instruira le litige. Les fonds restent sécurisés jusqu&apos;à résolution par l&apos;équipe support.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!description.trim()}
            onClick={() => {
              onConfirmDispute(motif, description);
              onClose();
            }}
            className={`px-4 py-2 font-bold rounded-xl shadow-xs flex items-center gap-1.5 ${
              description.trim() ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Confirmer l&apos;Ouverture de Litige
          </button>
        </div>
      </div>
    </div>
  );
}
