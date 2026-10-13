'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface QuickLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: any[];
  creditCards: any[];
  categories: any[];
}

export const QuickLaunchModal: React.FC<QuickLaunchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  creditCards,
  categories,
}) => {
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    if (!creditCardId && creditCards.length > 0) {
      setCreditCardId(creditCards[0].id);
    }
  }, [accounts, creditCards, accountId, creditCardId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          amount,
          date,
          categoryId: categoryId || undefined,
          accountId: type === 'CREDIT_CARD_EXPENSE' ? undefined : accountId || undefined,
          destinationAccountId: type === 'TRANSFER' ? destinationAccountId : undefined,
          creditCardId: type === 'CREDIT_CARD_EXPENSE' ? creditCardId : undefined,
          paymentMethod,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar');
      }

      // Limpar formulário e fechar
      setDescription('');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar lançamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Novo Lançamento</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100">{error}</div>}

          {/* Seletor de Tipo */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo de Movimentação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType('CREDIT_CARD_EXPENSE')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'CREDIT_CARD_EXPENSE'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cartão de Crédito
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Transferência
              </button>
              <button
                type="button"
                onClick={() => setType('INVOICE_PAYMENT')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'INVOICE_PAYMENT'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pagar Fatura
              </button>
            </div>
          </div>

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Almoço, Supermercado"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Valor (R$)</label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 85,90"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Data e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 bg-white"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conta / Cartão de Destino */}
          {type === 'CREDIT_CARD_EXPENSE' ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cartão de Crédito</label>
              <select
                value={creditCardId}
                onChange={(e) => setCreditCardId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 bg-white"
              >
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                {type === 'TRANSFER' ? 'Conta de Origem' : 'Conta / Carteira'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Conta de Destino</label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 bg-white"
              >
                <option value="">Selecione a conta destino</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Método de Pagamento */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Método</label>
            <div className="flex flex-wrap gap-2">
              {['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Boleto', 'Ted'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                    paymentMethod === m
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all flex items-center space-x-2"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Lançamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
