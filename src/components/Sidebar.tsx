'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileUp,
  Landmark,
  CreditCard,
  PieChart,
  CalendarCheck,
  HandCoins,
  ShieldAlert,
  Wallet,
  Settings,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onQuickLaunch: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onQuickLaunch, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'nlp_assistant', label: 'Assistente Rápido', icon: Sparkles, badge: 'IA' },
    { id: 'invoices', label: 'Importar Faturas', icon: FileUp },
    { id: 'accounts', label: 'Contas & Carteiras', icon: Landmark },
    { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'budgets', label: 'Orçamentos & Metas', icon: PieChart },
    { id: 'bills', label: 'Gastos Fixos & Contas', icon: CalendarCheck },
    { id: 'debts', label: 'Dívidas & Empréstimos', icon: HandCoins },
    { id: 'networth', label: 'Patrimônio & Projeção', icon: Wallet },
    { id: 'alerts', label: 'Alertas & Riscos', icon: ShieldAlert },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* BARRA SUPERIOR MOBILE (Estilo App Nativo iOS) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            FM
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 leading-none text-sm">Financeiro</h1>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Master</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onQuickLaunch}
            className="bg-emerald-600 active:scale-95 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xs"
          >
            + Novo
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* DRAWER / MENU LATERAL EXPANSÍVEL NO MOBILE */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  FM
                </div>
                <span className="font-extrabold text-slate-800 text-sm">Menu do App</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {onLogout && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{currentUser?.name}</span>
                <button
                  onClick={onLogout}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              FM
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">Financeiro</h1>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Master</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={onQuickLaunch}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Novo Lançamento</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'Administrador'}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold truncate uppercase">
                {currentUser?.role || 'ADMIN'}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair da Conta"
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 px-2 py-1 hover:bg-rose-50 rounded-lg transition-all"
            >
              Sair
            </button>
          )}
        </div>
      </aside>

      {/* BOTTOM TAB BAR NATIVA PARA SMARTPHONE (Estilo iOS App) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-3 flex items-center justify-around shadow-lg">
        {[
          { id: 'overview', label: 'Início', icon: LayoutDashboard },
          { id: 'transactions', label: 'Extrato', icon: ArrowLeftRight },
          { id: 'invoices', label: 'Faturas', icon: FileUp },
          { id: 'bills', label: 'Fixos', icon: CalendarCheck },
          { id: 'cards', label: 'Cartões', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
