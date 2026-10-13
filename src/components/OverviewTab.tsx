'use client';

import React from 'react';
import {
  Wallet,
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface OverviewTabProps {
  data: any;
  loading: boolean;
  onRefresh: () => void;
  onOpenQuickLaunch: () => void;
  onOpenNLP: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  loading,
  onRefresh,
  onOpenQuickLaunch,
  onOpenNLP,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalInAccounts: 0,
    cashBalance: 0,
    availableBalance: 0,
    committedBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyNet: 0,
    openInvoicesTotal: 0,
    futureInstallmentsTotal: 0,
    pendingDebtsToPay: 0,
    pendingToReceive: 0,
    netWorth: 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* CARD PRINCIPAL DE DESTAQUE MOBILE (Estilo NuBank / Apple Wallet) */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Saldo Disponível</span>
            <p className="text-3xl sm:text-4xl font-black mt-1 tracking-tight">
              {formatCentsToBRL(metrics.availableBalance)}
            </p>
          </div>
          <button
            onClick={onOpenNLP}
            className="p-2.5 bg-white/15 hover:bg-white/25 rounded-2xl backdrop-blur-xs transition-all"
            title="Assistente de Voz/Texto"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-emerald-200 font-medium block">Entradas do Mês</span>
            <span className="text-base font-extrabold text-emerald-300">
              +{formatCentsToBRL(metrics.monthlyIncome)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-200 font-medium block">Despesas do Mês</span>
            <span className="text-base font-extrabold text-rose-300">
              -{formatCentsToBRL(metrics.monthlyExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* GRID DE CARDS RESPONSIVOS (2 colunas em mobile e 4 em desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Saldo em Contas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Contas</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.totalInAccounts)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Bancos e carteiras</span>
        </div>

        {/* 2. Dinheiro Físico */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Em Espécie</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.cashBalance)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Dinheiro na carteira</span>
        </div>

        {/* 3. Faturas em Aberto */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Faturas</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.openInvoicesTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Nos cartões</span>
        </div>

        {/* 4. Patrimônio Líquido */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Patrimônio</span>
            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.netWorth)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Ativos - Passivos</span>
        </div>

        {/* 5. Parcelas Futuras */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Parcelas Futuras</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.futureInstallmentsTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Próximos meses</span>
        </div>

        {/* 6. Dívidas Pendentes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Dívidas</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <HandCoins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatCentsToBRL(metrics.pendingDebtsToPay)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Passivos a quitar</span>
        </div>

        {/* 7. Valores a Receber */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">A Receber</span>
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-emerald-600 mt-2 truncate">
            {formatCentsToBRL(metrics.pendingToReceive)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Empréstimos concedidos</span>
        </div>

        {/* 8. Saldo Comprometido */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Comprometido</span>
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold text-rose-500 mt-2 truncate">
            {formatCentsToBRL(metrics.committedBalance)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Faturas + Contas</span>
        </div>
      </div>

      {/* Contas e Cartões Cadastrados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span>Contas Bancárias</span>
            <span className="text-xs font-semibold text-slate-400">{data?.accounts?.length || 0}</span>
          </h3>
          <div className="space-y-2.5">
            {data?.accounts?.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color || '#10b981' }}
                  />
                  <span className="font-bold text-slate-800 text-xs truncate">{acc.name}</span>
                </div>
                <span className="font-extrabold text-slate-900 text-xs shrink-0">
                  {formatCentsToBRL(acc.currentBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cartões de Crédito */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span>Cartões de Crédito</span>
            <span className="text-xs font-semibold text-slate-400">{data?.creditCards?.length || 0}</span>
          </h3>
          <div className="space-y-2.5">
            {data?.creditCards?.map((card: any) => (
              <div key={card.id} className="p-3 bg-slate-50/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: card.color || '#6366f1' }}
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs truncate block">{card.name}</span>
                    <span className="text-[10px] text-slate-400">Vence dia {card.dueDay}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-800 text-xs">
                    {formatCentsToBRL(card.creditLimit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
