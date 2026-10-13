'use client';

import React from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onQuickLaunch: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onQuickLaunch, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'nlp_assistant', label: 'Assistente Rápido', icon: Sparkles, badge: 'IA Local' },
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

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Logotipo */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            FM
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Financeiro</h1>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Master</span>
          </div>
        </div>
      </div>

      {/* Botão Global de Ação Rápida */}
      <div className="p-4">
        <button
          onClick={onQuickLaunch}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 text-sm"
        >
          <span className="text-lg leading-none font-bold">+</span>
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Navegação */}
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

      {/* Usuário / Rodapé */}
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
  );
};
