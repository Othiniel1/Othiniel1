'use client';

import { useState } from 'react';
import { Star, CheckCircle, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  commandeId: string;
  onConfirm: (note: number, commentaire: string) => void;
}

export function FeedbackModal({ isOpen, onClose, commandeId, onConfirm }: FeedbackModalProps) {
  const [note, setNote] = useState<number>(5);
  const [commentaire, setCommentaire] = useState<string>('');

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
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Confirmer la Réception de Commande
          </h3>
          <p className="text-slate-500 text-[11px]">
            Commande #{commandeId} — La confirmation débloque les fonds sous séquestre au vendeur.
          </p>
        </div>

        {/* Rating selection */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800">
            Quelle note donnez-vous aux articles reçus ?
          </label>
          <div className="flex gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNote(s)}
                className="p-1.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 ${
                    s <= note ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment field */}
        <div className="space-y-1">
          <label className="block font-bold text-slate-800">
            Avis / Commentaire (optionnel) :
          </label>
          <textarea
            rows={3}
            placeholder="Produit frais, bien emballé et livré dans les temps..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(note, commentaire);
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Confirmer Réception
          </button>
        </div>
      </div>
    </div>
  );
}
