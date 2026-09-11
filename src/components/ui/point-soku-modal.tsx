'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MockPointSOKU, MOCK_POINT_SOKU } from '@/lib/mock-data';
import { MapPin, Camera, Info, Check, X, ShieldAlert } from 'lucide-react';

interface PointSokuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPointSoku: (point: MockPointSOKU & { instructionAcheteur?: string }) => void;
  pointSokuActuel?: MockPointSOKU & { instructionAcheteur?: string };
}

export const PointSokuModal: React.FC<PointSokuModalProps> = ({
  isOpen,
  onClose,
  onSelectPointSoku,
  pointSokuActuel,
}) => {
  const [pointSelectionne, setPointSelectionne] = useState<MockPointSOKU>(
    pointSokuActuel || MOCK_POINT_SOKU
  );
  const [instruction, setInstruction] = useState<string>(
    pointSokuActuel?.instructionAcheteur || 'Déposer auprès du gérant du kiosque en mentionnant le code SOKU.'
  );

  if (!isOpen) return null;

  const pointsSimules: MockPointSOKU[] = [
    MOCK_POINT_SOKU,
    {
      id: 'point_soku_002',
      nom: 'Point SOKU - Plateau Pharmacie Centrale',
      quartier: 'Plateau',
      repereVisuel: 'Devant la Pharmacie Centrale, grand parasol jaune SOKU',
      latitude: 5.325,
      longitude: -4.0201,
    },
    {
      id: 'point_soku_003',
      nom: 'Point SOKU - Marcory Zone 4 (Super Hayat)',
      quartier: 'Marcory',
      repereVisuel: 'Kiosque SOKU à côté de la station Shell Super Hayat',
      latitude: 5.298,
      longitude: -3.985,
    },
  ];

  const handleConfirmer = () => {
    onSelectPointSoku({
      ...pointSelectionne,
      instructionAcheteur: instruction,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full text-slate-500 hover:text-slate-800 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-slate-100 pb-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase mb-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600" /> Information Opérationnelle Partagée
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Configuration du Point SOKU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sélectionnez un point d&apos;arrêt et fournissez un repère visuel précis pour votre livreur.
          </p>
        </div>

        {/* List of Available Simulated Points SOKU */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Choisir un Point SOKU dans votre zone :
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {pointsSimules.map((pt) => {
              const isSelected = pointSelectionne.id === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => setPointSelectionne(pt)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/50'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900">{pt.nom}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-600">{pt.repereVisuel}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    GPS Simulée: {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Visual Landmark Simulation */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-amber-500" />
            Photo Repère Visuel Simulée
          </label>
          <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <Image
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
              alt="Repère Visuel Point SOKU"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 text-center text-white">
              <span className="text-[11px] font-bold bg-slate-900/80 px-3 py-1 rounded-full border border-amber-400/50">
                Photo repère de démonstration (Kiosque Jaune SOKU)
              </span>
            </div>
          </div>
        </div>

        {/* Buyer Delivery Instruction Input */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-500" />
            Instruction spécifique pour le livreur :
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex: Déposer au Kiosque auprès de Maman Ami..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[70px]"
          />
        </div>

        {/* Simulation Honest Notice */}
        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Prototype : Les données GPS et repères visuels sont des données simulées transmises directement au tableau de bord Livreur.
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmer}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4 text-amber-400" />
            Valider ce Point SOKU
          </button>
        </div>
      </div>
    </div>
  );
};
