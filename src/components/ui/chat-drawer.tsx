'use client';

import { useState, useEffect } from 'react';
import { messagerieService } from '@/lib/services/communication';
import { MessageSOKU } from '@/lib/services/communication-interfaces';
import { MessageSquare, Send, X } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commandeId: string;
  utilisateurCourant: { id: string; nom: string; role: 'ACHETEUR' | 'VENDEUR' | 'LIVREUR' };
  destinataireId: string;
  destinataireNom: string;
}

export function ChatDrawer({
  isOpen,
  onClose,
  commandeId,
  utilisateurCourant,
  destinataireId,
  destinataireNom,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<MessageSOKU[]>([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && commandeId) {
      messagerieService.obtenirConversationParCommande(commandeId).then((conv) => {
        if (conv) {
          setConversationId(conv.id);
          setMessages(messagerieService.obtenirMessages(conv.id));
        }
      });
    }
  }, [isOpen, commandeId]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !conversationId) return;

    await messagerieService.envoyerMessage(
      conversationId,
      utilisateurCourant.id,
      utilisateurCourant.nom,
      utilisateurCourant.role,
      destinataireId,
      nouveauMessage
    );

    setMessages([...messagerieService.obtenirMessages(conversationId)]);
    setNouveauMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between text-xs">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm">MessagerieCommande #{commandeId}</h3>
              <p className="text-[10px] text-slate-400">Échange direct avec {destinataireNom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="p-4 flex-grow overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <p className="text-center text-slate-400 italic py-8">Aucun message pour le moment.</p>
          ) : (
            messages.map((msg) => {
              const estMoi = msg.expediteurId === utilisateurCourant.id;
              return (
                <div key={msg.id} className={`flex flex-col ${estMoi ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-slate-400 font-semibold mb-0.5">{msg.expediteurNom}</span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      estMoi
                        ? 'bg-amber-500 text-slate-950 font-bold rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 shadow-xs rounded-bl-none'
                    }`}
                  >
                    {msg.contenu}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Input */}
        <form onSubmit={envoyer} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            placeholder="Écrivez votre message..."
            value={nouveauMessage}
            onChange={(e) => setNouveauMessage(e.target.value)}
            className="flex-grow bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl font-bold shadow-xs">
            <Send className="w-4 h-4 text-amber-400" />
          </button>
        </form>
      </div>
    </div>
  );
}
