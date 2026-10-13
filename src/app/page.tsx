'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { OverviewTab } from '../components/OverviewTab';
import { QuickLaunchModal } from '../components/QuickLaunchModal';
import { NLPAssistantTab } from '../components/NLPAssistantTab';
import { InvoicesTab } from '../components/InvoicesTab';
import { BillsTab } from '../components/BillsTab';
import { DebtsTab } from '../components/DebtsTab';
import { BudgetsTab } from '../components/BudgetsTab';
import { AlertsTab } from '../components/AlertsTab';
import { CardsTab } from '../components/CardsTab';
import { LoginScreen } from '../components/LoginScreen';
import { formatCentsToBRL } from '../lib/financialEngine';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuickLaunchOpen, setIsQuickLaunchOpen] = useState(false);

  // Carregar dados gerais
  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, accRes, cardRes, catRes, txRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/accounts'),
        fetch('/api/cards'),
        fetch('/api/categories'),
        fetch('/api/transactions?limit=50'),
      ]);

      const [dash, acc, card, cat, tx] = await Promise.all([
        dashRes.json(),
        accRes.json(),
        cardRes.json(),
        catRes.json(),
        txRes.json(),
      ]);

      setDashboardData(dash);
      setAccounts(Array.isArray(acc) ? acc : []);
      setCreditCards(Array.isArray(card) ? card : []);
      setCategories(Array.isArray(cat) ? cat : []);
      setTransactions(Array.isArray(tx) ? tx : []);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('fm_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('fm_user');
      }
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fm_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar de Navegação */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onQuickLaunch={() => setIsQuickLaunchOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Barra superior de contexto (apenas no desktop, no mobile usamos o app bar nativo) */}
        <header className="hidden lg:flex bg-white border-b border-slate-200/80 px-8 py-4 items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {currentTab === 'overview' && 'Visão Geral & Indicadores'}
              {currentTab === 'transactions' && 'Extrato & Lançamentos'}
              {currentTab === 'nlp_assistant' && 'Assistente Natural'}
              {currentTab === 'invoices' && 'Importação de Faturas'}
              {currentTab === 'accounts' && 'Contas & Carteiras'}
              {currentTab === 'cards' && 'Cartões de Crédito'}
              {currentTab === 'budgets' && 'Orçamentos & Metas'}
              {currentTab === 'bills' && 'Gastos Fixos & Contas'}
              {currentTab === 'debts' && 'Dívidas & Empréstimos'}
              {currentTab === 'networth' && 'Patrimônio Líquido'}
              {currentTab === 'alerts' && 'Alertas Financeiros'}
              {currentTab === 'settings' && 'Configurações'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Financeiro Master • Controle rigoroso e inteligência local
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData()}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Atualizar Dados
            </button>
            <button
              onClick={() => setIsQuickLaunchOpen(true)}
              className="text-xs font-semibold px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
            >
              + Novo Registro
            </button>
          </div>
        </header>

        {/* Corpo da Aba Selecionada */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {currentTab === 'overview' && (
            <OverviewTab
              data={dashboardData}
              loading={loading}
              onRefresh={loadData}
              onOpenQuickLaunch={() => setIsQuickLaunchOpen(true)}
              onOpenNLP={() => setCurrentTab('nlp_assistant')}
            />
          )}

          {currentTab === 'nlp_assistant' && (
            <NLPAssistantTab onTransactionCreated={loadData} />
          )}

          {currentTab === 'invoices' && (
            <InvoicesTab creditCards={creditCards} onImportComplete={loadData} />
          )}

          {currentTab === 'bills' && (
            <BillsTab accounts={accounts} categories={categories} />
          )}

          {currentTab === 'debts' && (
            <DebtsTab />
          )}

          {currentTab === 'budgets' && (
            <BudgetsTab />
          )}

          {currentTab === 'alerts' && (
            <AlertsTab metrics={dashboardData?.metrics} />
          )}

          {currentTab === 'transactions' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Todos os Lançamentos</h2>
                <span className="text-xs text-slate-400">{transactions.length} registros</span>
              </div>
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Nenhum lançamento encontrado.</p>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{tx.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.type} •{' '}
                          {tx.category?.name || 'Sem Categoria'}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'} {formatCentsToBRL(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === 'accounts' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Suas Contas e Carteiras</h2>
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{acc.name}</p>
                      <span className="text-xs text-slate-500 font-medium">{acc.type}</span>
                    </div>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatCentsToBRL(acc.currentBalance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === 'cards' && (
            <CardsTab creditCards={creditCards} onCardsUpdated={loadData} />
          )}

          {(currentTab === 'networth' || currentTab === 'settings') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto text-center py-12">
              <h3 className="font-bold text-lg text-slate-800">
                {currentTab === 'networth' ? 'Evolução Patrimonial & Projeções' : 'Configurações do Sistema'}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {currentTab === 'networth'
                  ? `Seu patrimônio líquido consolidado hoje é de ${formatCentsToBRL(
                      dashboardData?.metrics?.netWorth || 0
                    )}.`
                  : 'Sistema em execução no modo local seguro.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Lançamento Rápido */}
      <QuickLaunchModal
        isOpen={isQuickLaunchOpen}
        onClose={() => setIsQuickLaunchOpen(false)}
        onSuccess={loadData}
        accounts={accounts}
        creditCards={creditCards}
        categories={categories}
      />
    </div>
  );
}
