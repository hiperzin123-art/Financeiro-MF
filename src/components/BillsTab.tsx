'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, CheckCircle2, Repeat, Trash2 } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface BillsTabProps {
  accounts: any[];
  categories: any[];
}

export const BillsTab: React.FC<BillsTabProps> = ({ accounts, categories }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FIXED' | 'PAYABLE' | 'RECEIVABLE'

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('PAYABLE');
  const [isFixed, setIsFixed] = useState(false);
  const [recurrence, setRecurrence] = useState('MONTHLY');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount,
          dueDate,
          type,
          isFixed,
          recurrence: isFixed ? recurrence : 'NONE',
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
        }),
      });
      setTitle('');
      setAmount('');
      setIsFixed(false);
      setShowModal(false);
      loadBills();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePaid = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPaid: !currentStatus }),
      });
      loadBills();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (filterType === 'FIXED') return b.isFixed;
    if (filterType === 'PAYABLE') return b.type === 'PAYABLE' && !b.isFixed;
    if (filterType === 'RECEIVABLE') return b.type === 'RECEIVABLE';
    return true;
  });

  // Total de gastos fixos
  const totalFixedExpenses = bills
    .filter((b) => b.isFixed && b.type === 'PAYABLE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contas, Despesas Fixas & Recebimentos</h2>
          <p className="text-sm text-slate-500">
            Cadastre seus gastos fixos mensais (aluguel, internet, condomínio, academia) e compromissos variáveis.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Despesa / Conta</span>
        </button>
      </div>

      {/* Card de Resumo de Gastos Fixos */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400">Total de Gastos Fixos Mensais</span>
          <p className="text-2xl font-black mt-1 text-emerald-400">{formatCentsToBRL(totalFixedExpenses)}</p>
          <span className="text-xs text-slate-400">Compromissos recorrentes todo mês</span>
        </div>
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
          <Repeat className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'Todas as Contas' },
          { id: 'FIXED', label: '📌 Apenas Gastos Fixos' },
          { id: 'PAYABLE', label: 'Contas Variáveis a Pagar' },
          { id: 'RECEIVABLE', label: 'Valores a Receber' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === f.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Carregando...</p>
        ) : filteredBills.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nenhum compromisso cadastrado nesta categoria.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      bill.isPaid
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    {bill.isPaid && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`font-semibold text-sm ${bill.isPaid ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {bill.title}
                      </p>
                      {bill.isFixed && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                          Gasto Fixo Mensal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vencimento: Dia {new Date(bill.dueDate).getDate()} • {bill.category?.name || 'Geral'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${
                      bill.type === 'RECEIVABLE' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {bill.type === 'RECEIVABLE' ? '+' : '-'} {formatCentsToBRL(bill.amount)}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {bill.isPaid ? 'Liquidada este mês' : 'A Vencer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Conta / Gasto Fixo */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-800 text-lg">Adicionar Conta / Gasto Fixo</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('PAYABLE')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      type === 'PAYABLE' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-slate-200'
                    }`}
                  >
                    Despesa / Conta a Pagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('RECEIVABLE')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      type === 'RECEIVABLE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200'
                    }`}
                  >
                    Receita / A Receber
                  </button>
                </div>
              </div>

              {/* Opção Gasto Fixo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">É um Gasto Fixo Recorrente?</span>
                  <span className="text-[11px] text-slate-500">Ex: Aluguel, Internet, Academia, Plano de Saúde</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Título da Conta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aluguel, Internet, Netflix, Condomínio"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="150,00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Vencimento (Dia)</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
