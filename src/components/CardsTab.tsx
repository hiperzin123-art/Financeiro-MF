'use client';

import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface CardsTabProps {
  creditCards: any[];
  onCardsUpdated: () => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({ creditCards, onCardsUpdated }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('OUTRO');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg('');
    setMsg('');

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brand,
          creditLimit,
          closingDay: parseInt(closingDay),
          dueDay: parseInt(dueDay),
          color,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar cartão');
      }

      setName('');
      setCreditLimit('');
      setShowModal(false);
      setMsg('Cartão cadastrado com sucesso!');
      onCardsUpdated();
    } catch (err: any) {
      setErrMsg(err.message || 'Erro ao cadastrar cartão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, cardName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cartão "${cardName}"? Esta ação removerá as faturas associadas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir');
      }

      setMsg(`Cartão "${cardName}" excluído com sucesso!`);
      onCardsUpdated();
    } catch (err: any) {
      setErrMsg(err.message || 'Erro ao excluir cartão');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cartões de Crédito</h2>
          <p className="text-sm text-slate-500">
            Cadastre novos cartões, configure limites, dias de fechamento/vencimento e gerencie exclusões.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cartão</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}

      {errMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{errMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creditCards.map((card) => (
          <div
            key={card.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                  style={{ backgroundColor: card.color || '#6366f1' }}
                >
                  <CardIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{card.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">Bandeira: {card.brand}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(card.id, card.name)}
                title="Excluir Cartão"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Limite Total</span>
                <span className="text-sm font-bold text-slate-800">{formatCentsToBRL(card.creditLimit)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fechamento / Vencimento</span>
                <span className="text-sm font-bold text-slate-800">
                  Dia {card.closingDay} / Dia {card.dueDay}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Cartão */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Cadastrar Novo Cartão</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mercado Pago Visa, Nubank Ultravioleta"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Bandeira / Banco</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="NUBANK">Nubank</option>
                    <option value="INTER">Banco Inter</option>
                    <option value="ITAU">Itaú</option>
                    <option value="BRADESCO">Bradesco</option>
                    <option value="SANTANDER">Santander</option>
                    <option value="BB">Banco do Brasil</option>
                    <option value="CAIXA">Caixa</option>
                    <option value="C6">C6 Bank</option>
                    <option value="XP">XP</option>
                    <option value="OUTRO">Mercado Pago / Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Limite (R$)</label>
                  <input
                    type="text"
                    required
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="3.300,00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Dia de Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cor do Cartão</label>
                <div className="flex space-x-2">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#000000'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${
                        color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
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
                  disabled={loading}
                  className="px-5 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow"
                >
                  {loading ? 'Salvando...' : 'Salvar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
