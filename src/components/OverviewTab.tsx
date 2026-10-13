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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
    <div className="space-y-6">
      {/* Banner de Boas-vindas e Ação de Comando Rápido */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Olá! Seu panorama financeiro está atualizado.</h2>
          <p className="text-emerald-100 text-sm mt-1">
            Motor financeiro operando com precisão monetária sem arredondamentos imperfeitos.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNLP}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium py-2 px-4 rounded-xl flex items-center space-x-2 backdrop-blur-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Assistente de Voz / Texto</span>
          </button>
          <button
            onClick={onOpenQuickLaunch}
            className="bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-semibold py-2 px-4 rounded-xl shadow transition-all"
          >
            + Lançamento
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais (12 Cards solicitados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo em Contas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo nas Contas</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.totalInAccounts)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Bancos e carteiras digitais</span>
        </div>

        {/* 2. Dinheiro Físico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dinheiro Físico</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.cashBalance)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Disponível em espécie</span>
        </div>

        {/* 3. Saldo Realmente Disponível */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Disponível</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCentsToBRL(metrics.availableBalance)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Livre de compromissos imediatos</span>
        </div>

        {/* 4. Patrimônio Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Patrimônio Líquido</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.netWorth)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Ativos - Obrigações Totais</span>
        </div>

        {/* 5. Entradas do Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entradas do Mês</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCentsToBRL(metrics.monthlyIncome)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Receitas operacionais</span>
        </div>

        {/* 6. Despesas do Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas do Mês</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{formatCentsToBRL(metrics.monthlyExpense)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Consumo total reconhecido</span>
        </div>

        {/* 7. Resultado Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resultado Líquido</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${metrics.monthlyNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCentsToBRL(metrics.monthlyNet)}
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Superávit ou déficit no mês</span>
        </div>

        {/* 8. Faturas em Aberto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Faturas em Aberto</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.openInvoicesTotal)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">A liquidar nos cartões</span>
        </div>

        {/* 9. Parcelas Futuras */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Parcelas Futuras</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.futureInstallmentsTotal)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Compromissos parcelados</span>
        </div>

        {/* 10. Dívidas Pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dívidas Pendentes</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCentsToBRL(metrics.pendingDebtsToPay)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Passivos a quitar</span>
        </div>

        {/* 11. Valores a Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valores a Receber</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCentsToBRL(metrics.pendingToReceive)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Empréstimos concedidos e créditos</span>
        </div>

        {/* 12. Saldo Comprometido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Comprometido</span>
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-2">{formatCentsToBRL(metrics.committedBalance)}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Contas do ciclo + Faturas abertas</span>
        </div>
      </div>

      {/* Seção de Contas e Cartões Cadastrados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Contas Bancárias & Carteiras</span>
            <span className="text-xs font-normal text-slate-500">{data?.accounts?.length || 0} ativas</span>
          </h3>
          <div className="space-y-3">
            {data?.accounts?.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: acc.color || '#10b981' }}
                  />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{acc.name}</p>
                    <p className="text-xs text-slate-400">{acc.type}</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900 text-sm">{formatCentsToBRL(acc.currentBalance)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cartões de Crédito */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Cartões de Crédito</span>
            <span className="text-xs font-normal text-slate-500">{data?.creditCards?.length || 0} cadastrados</span>
          </h3>
          <div className="space-y-3">
            {data?.creditCards?.map((card: any) => (
              <div key={card.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: card.color || '#6366f1' }}
                    />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{card.name}</p>
                      <p className="text-xs text-slate-400">
                        Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Limite</p>
                    <p className="font-semibold text-slate-700 text-sm">{formatCentsToBRL(card.creditLimit)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lançamentos Recentes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-4">Movimentações Recentes</h3>
        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{tx.description}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category?.name || 'Sem categoria'} •{' '}
                    {tx.account?.name || tx.creditCard?.name || tx.paymentMethod}
                  </p>
                </div>
                <p
                  className={`font-bold text-sm ${
                    tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'} {formatCentsToBRL(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">Nenhuma movimentação registrada no período.</p>
        )}
      </div>
    </div>
  );
};
