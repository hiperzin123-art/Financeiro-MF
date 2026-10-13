'use client';

import React, { useState, useEffect } from 'react';
import { HandCoins, Plus } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

export const DebtsTab: React.FC = () => {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [personName, setPersonName] = useState('');
  const [isToReceive, setIsToReceive] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const loadDebts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debts');
      const data = await res.json();
      setDebts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          personName,
          isToReceive,
          amount,
          dueDate: dueDate || undefined,
        }),
      });
      setTitle('');
      setPersonName('');
      setAmount('');
      setShowModal(false);
      loadDebts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dívidas & Empréstimos</h2>
          <p className="text-sm text-slate-500">
            Controle valores emprestados a terceiros e passivos financeiros sob sua responsabilidade.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Registro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-emerald-700 text-sm mb-3">Empréstimos Concedidos (A Receber)</h3>
          {debts.filter((d) => d.isToReceive).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nenhum valor a receber registrado.</p>
          ) : (
            <div className="space-y-2">
              {debts
                .filter((d) => d.isToReceive)
                .map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{d.title}</p>
                      <p className="text-xs text-slate-400">Pessoa: {d.personName}</p>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">
                      {formatCentsToBRL(d.remainingAmount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Dívidas a Pagar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-rose-700 text-sm mb-3">Dívidas Pendentes (A Pagar)</h3>
          {debts.filter((d) => !d.isToReceive).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nenhuma dívida pendente registrada.</p>
          ) : (
            <div className="space-y-2">
              {debts
                .filter((d) => !d.isToReceive)
                .map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{d.title}</p>
                      <p className="text-xs text-slate-400">Credor: {d.personName}</p>
                    </div>
                    <span className="font-bold text-rose-600 text-sm">
                      {formatCentsToBRL(d.remainingAmount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Novo Registro de Dívida / Empréstimo</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsToReceive(false)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      !isToReceive ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-slate-200'
                    }`}
                  >
                    Dívida (Eu Devo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsToReceive(true)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      isToReceive ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200'
                    }`}
                  >
                    Empréstimo (A Receber)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Empréstimo Pessoal, Dívida Loja"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Pessoa / Credor</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ex: João Silva, Banco"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
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
                    placeholder="250,00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Data Limite (Opcional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
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
