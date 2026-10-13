'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

export const BudgetsTab: React.FC = () => {
  const [data, setData] = useState<{ goals: any[]; budgets: any[] }>({ goals: [], budgets: [] });
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/budgets');
      const d = await res.json();
      setData({ goals: d.goals || [], budgets: d.budgets || [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'goal',
          title,
          targetAmount,
          currentAmount,
        }),
      });
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setShowGoalModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Orçamentos & Metas Financeiras</h2>
          <p className="text-sm text-slate-500">
            Defina objetivos de poupança e planeje o crescimento do seu patrimônio.
          </p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Grid de Metas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-emerald-600" />
          <span>Suas Metas Financeiras</span>
        </h3>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Carregando...</p>
        ) : data.goals.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nenhuma meta cadastrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {data.goals.map((g) => {
              const progress = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
              return (
                <div key={g.id} className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{g.title}</span>
                    <span className="text-xs font-semibold text-emerald-700">{progress}% atingido</span>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <span>Atual: {formatCentsToBRL(g.currentAmount)}</span>
                    <span>Objetivo: {formatCentsToBRL(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Nova Meta Financeira</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Título da Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Viagem, Carro"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Valor Alvo (R$)</label>
                <input
                  type="text"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="10.000,00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Valor Já Acumulado (R$)</label>
                <input
                  type="text"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="1.000,00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
