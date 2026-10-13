'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PartyPopper,
  Sparkles,
  Tag,
  FileSearch,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface InvoicesTabProps {
  creditCards: any[];
  onImportComplete: () => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ creditCards, onImportComplete }) => {
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [celebrationList, setCelebrationList] = useState<Array<{ description: string; totalInstallments: number }>>([]);

  // Histórico de faturas salvas
  const [invoicesHistory, setInvoicesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!selectedCardId && creditCards.length > 0) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  const loadInvoicesHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoicesHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadInvoicesHistory();
  }, []);

  const handleParse = async () => {
    if (!file && !pastedText.trim()) {
      setErrorMsg('Selecione um arquivo PDF ou cole o texto da fatura.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCelebrationList([]);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (pastedText) {
        formData.append('text', pastedText);
      }

      const res = await fetch('/api/invoices/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao processar fatura');

      if (!json.data || json.data.transactions.length === 0) {
        throw new Error('Nenhuma movimentação identificada no documento. Verifique se é uma fatura com datas e valores.');
      }

      setExtractedData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (index: number, newTag: string) => {
    if (!extractedData) return;
    const updated = { ...extractedData };
    updated.transactions[index].tag = newTag;
    setExtractedData(updated);
  };

  const handleSaveTransactions = async () => {
    if (!extractedData || !selectedCardId) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/invoices/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditCardId: selectedCardId,
          transactions: extractedData.transactions,
          bankOrIssuer: extractedData.bankOrIssuer,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar transações');

      setSuccessMsg(
        `${result.importedCount} lançamentos da fatura foram importados! As parcelas futuras em andamento já foram agendadas como compromisso para o próximo mês.`
      );

      // Notificação festiva quando uma dívida parcelada acabou
      if (result.finishedDebts && result.finishedDebts.length > 0) {
        setCelebrationList(result.finishedDebts);
      }

      setExtractedData(null);
      setFile(null);
      setPastedText('');
      onImportComplete();
      loadInvoicesHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gravar itens da fatura');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHistoricalTag = async (txId: string) => {
    try {
      await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: txId,
          tag: tagInput,
        }),
      });
      setEditingTxId(null);
      setTagInput('');
      loadInvoicesHistory();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Notificação Especial: PARABÉNS DÍVIDA QUITADA! */}
      {celebrationList.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg animate-in bounce-in duration-500 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <PartyPopper className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold flex items-center gap-2">
                <span>🎉 PARABÉNS! VOCÊ QUITOU PARCELAMENTOS!</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </h3>
              <p className="text-emerald-100 text-sm">
                Uma ou mais compras parceladas no cartão chegaram à última parcela e estão finalizadas! Menos despesas nos próximos meses!
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 divide-y divide-white/10">
            {celebrationList.map((item, idx) => (
              <div key={idx} className="py-1.5 flex justify-between items-center text-sm font-semibold">
                <span>{item.description}</span>
                <span className="bg-amber-400 text-slate-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {item.totalInstallments}x Quitadas!
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Formulário de Importação */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800">Importador Inteligente de Faturas em PDF</h2>
        <p className="text-sm text-slate-500 mt-1">
          Extraia lançamentos de faturas (Digio, Mercado Pago, Nubank, Inter, etc.), coloque tags personalizadas em compras (ex: Shopee ➔ Presente dia das crianças) e visualize todas as faturas salvas.
        </p>

        {/* Escolha do Cartão de Destino */}
        <div className="mt-5 max-w-md">
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Selecione o Cartão Correspondente
          </label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-emerald-500 bg-white"
          >
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zona de Upload */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 transition-colors">
            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Arraste ou selecione o PDF da fatura</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">Extensão .pdf</p>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) setPastedText('');
              }}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {file && <p className="text-xs font-semibold text-emerald-700 mt-2 font-mono">{file.name}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1">
              Ou cole o texto copiado da fatura
            </label>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                if (e.target.value) setFile(null);
              }}
              placeholder="Cole aqui linhas da fatura..."
              className="flex-1 p-3 border border-slate-200 rounded-2xl text-xs resize-none focus:outline-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleParse}
            disabled={loading || (!file && !pastedText.trim())}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
          >
            <span>{loading ? 'Extraindo dados...' : 'Extrair Lançamentos'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Tabela de Revisão com TAGS Customizáveis antes de Gravar */}
      {extractedData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Pré-visualização: {extractedData.bankOrIssuer}
              </h3>
              <p className="text-xs text-slate-500">
                {extractedData.transactions.length} transações identificadas • Total de{' '}
                <strong className="text-slate-800">{formatCentsToBRL(extractedData.totalAmount)}</strong>
              </p>
            </div>
            <button
              onClick={handleSaveTransactions}
              disabled={submitting || extractedData.transactions.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
            >
              <span>{submitting ? 'Gravando e Agendando...' : 'Confirmar e Importar Todos'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100">
            {extractedData.transactions.map((tx: any, idx: number) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="flex items-start sm:items-center space-x-3">
                  <span className="text-xs text-slate-400 font-mono mt-0.5 sm:mt-0">{tx.date}</span>
                  <div>
                    <p className="font-medium text-slate-800">{tx.description}</p>
                    {tx.installmentCurrent && (
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold inline-block mt-0.5">
                        Parcela {tx.installmentCurrent} de {tx.installmentTotal}
                        {tx.installmentCurrent < tx.installmentTotal && (
                          <span className="text-emerald-700 ml-1.5 font-bold">
                            ➔ Próxima parcela será agendada
                          </span>
                        )}
                        {tx.installmentCurrent === tx.installmentTotal && (
                          <span className="text-purple-700 ml-1.5 font-bold">
                            ➔ Última parcela! 🎉
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 pl-7 sm:pl-0">
                  {/* Campo de TAG / Descrição personalizada */}
                  <div className="relative">
                    <input
                      type="text"
                      value={tx.tag || ''}
                      onChange={(e) => handleTagChange(idx, e.target.value)}
                      placeholder="+ Adicionar Tag (Ex: Presente)"
                      className="px-2.5 py-1 text-xs border border-dashed border-slate-300 hover:border-emerald-500 focus:border-emerald-500 rounded-lg focus:outline-hidden w-48 bg-slate-50/50"
                    />
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">{formatCentsToBRL(tx.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico: Ver Faturas Importadas e Gerenciar Tags Existentes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
          <FileSearch className="w-5 h-5 text-emerald-600" />
          <span>Faturas Importadas no Sistema</span>
        </h3>

        {loadingHistory ? (
          <p className="text-sm text-slate-400 text-center py-4">Carregando faturas...</p>
        ) : invoicesHistory.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma fatura importada ainda.</p>
        ) : (
          <div className="space-y-3">
            {invoicesHistory.map((inv) => {
              const isExpanded = expandedInvoiceId === inv.id;
              return (
                <div key={inv.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                    className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 text-sm">
                        {inv.creditCard?.name} — Fatura {inv.month.toString().padStart(2, '0')}/{inv.year}
                      </span>
                      <p className="text-xs text-slate-400">
                        Vencimento: {new Date(inv.dueDate).toLocaleDateString('pt-BR')} • {inv.transactions?.length || 0} lançamentos
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCentsToBRL(inv.totalAmount)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes da Fatura com Edição de Tags */}
                  {isExpanded && (
                    <div className="p-4 bg-white divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {inv.transactions && inv.transactions.length > 0 ? (
                        inv.transactions.map((tx: any) => (
                          <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-slate-800">{tx.description}</p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                {tx.notes && <span className="ml-2 text-emerald-600 font-medium">{tx.notes}</span>}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              {editingTxId === tx.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Ex: Presente Dia das Crianças"
                                    className="px-2 py-0.5 text-xs border border-slate-300 rounded"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveHistoricalTag(tx.id)}
                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEditingTxId(null)}
                                    className="px-2 py-0.5 text-slate-400"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingTxId(tx.id);
                                    setTagInput(tx.notes?.replace(/^\[Tag: |\]/g, '') || '');
                                  }}
                                  className="text-slate-400 hover:text-emerald-600 flex items-center space-x-1 p-1 hover:bg-slate-100 rounded"
                                  title="Adicionar ou editar tag"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  <span>Tag</span>
                                </button>
                              )}
                              <span className="font-bold text-slate-900">{formatCentsToBRL(tx.amount)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-2">Nenhum item nesta fatura.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
