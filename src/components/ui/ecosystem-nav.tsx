'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Store, Truck, Layers } from 'lucide-react';

export const EcosystemNav: React.FC = () => {
  const pathname = usePathname();

  const apps = [
    {
      id: 'acheteur',
      href: '/acheteur',
      label: 'SOKU Acheteur',
      subtitle: 'Acheter & Suivre',
      icon: ShoppingBag,
      color: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'vendeur',
      href: '/vendeur',
      label: 'SOKU Vendeur',
      subtitle: 'Vendre & Gérer',
      icon: Store,
      color: 'bg-indigo-600 text-white',
    },
    {
      id: 'livreur',
      href: '/livreur',
      label: 'SOKU Livreur',
      subtitle: 'Exécuter & Livrer',
      icon: Truck,
      color: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white py-2 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Ecosystem Title */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-slate-950 p-1.5 rounded-xl font-black text-xs tracking-wider flex items-center gap-1 shadow">
              <Layers className="w-4 h-4" /> SOKU
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                Écosystème Unique
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Prototype Partagé
              </span>
            </div>
          </div>
        </div>

        {/* Top App Switcher */}
        <nav className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-center">
          {apps.map((app) => {
            const isActive = pathname.startsWith(app.href);
            const Icon = app.icon;

            return (
              <Link
                key={app.id}
                href={app.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border-amber-500/50 shadow-inner'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${app.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block leading-none text-[11px]">{app.label}</span>
                  <span className="block leading-none text-[9px] text-slate-400 font-normal mt-0.5">
                    {app.subtitle}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
