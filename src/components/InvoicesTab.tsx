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
  Trash2,
  Calendar,
} from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface InvoicesTabProps {
  creditCards: any[];
  onImportComplete: () => void;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

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

  // Mês e Ano de Referência da fatura importada
  const [invoiceMonth, setInvoiceMonth] = useState<number>(new Date().getMonth() + 1);
  const [invoiceYear, setInvoiceYear] = useState<number>(new Date().getFullYear());

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

      // Detectar automaticamente o mês mais frequente das compras para pré-selecionar o mês da fatura
      const counts: Record<string, number> = {};
      for (const t of json.data.transactions) {
        if (t.date) {
          const parts = t.date.split('-');
          if (parts.length >= 2) {
            const k = `${parts[0]}-${parts[1]}`;
            counts[k] = (counts[k] || 0) + 1;
          }
        }
      }
      const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (best) {
        const [y, m] = best.split('-');
        setInvoiceYear(parseInt(y, 10));
        setInvoiceMonth(parseInt(m, 10));
      }
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
    if (!extractedData) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/invoices/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditCardId: selectedCardId || undefined,
          transactions: extractedData.transactions,
          bankOrIssuer: extractedData.bankOrIssuer,
          invoiceMonth,
          invoiceYear,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar transações');

      let msg = `Fatura ${result.referenceMonth.toString().padStart(2, '0')}/${result.referenceYear} com ${result.importedCount} lançamentos importada com sucesso!`;
      if (result.futureInstallmentsCount > 0) {
        msg += ` E criadas automaticamente as faturas dos próximos meses com ${result.futureInstallmentsCount} parcelas futuras agendadas (ex: próximas de 5/10).`;
      }
      setSuccessMsg(msg);

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

  const handleDeleteInvoice = async (invId: string, label: string) => {
    if (!confirm(`Tem certeza que deseja apagar a fatura "${label}" e todos os seus lançamentos?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices?id=${invId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao apagar fatura');
      }

      setSuccessMsg(`Fatura "${label}" excluída com sucesso!`);
      loadInvoicesHistory();
      onImportComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir fatura');
    }
  };

  const handleClearAllInvoices = async () => {
    if (!confirm('Deseja realmente apagar TODAS as faturas importadas no sistema e seus lançamentos de cartão?')) {
      return;
    }

    try {
      const res = await fetch('/api/invoices?all=true', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao apagar faturas');
      }

      setSuccessMsg('Todas as faturas foram apagadas com sucesso!');
      loadInvoicesHistory();
      onImportComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao apagar faturas');
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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

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
          Extraia lançamentos de faturas (Digio, Mercado Pago, Nubank, Inter, Bradesco, etc.), adicione tags personalizadas e agende automaticamente compras parceladas nas faturas dos próximos meses como nos apps de cartão.
        </p>

        {/* Escolha do Cartão de Destino */}
        <div className="mt-5 max-w-md">
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Selecione o Cartão Correspondente
          </label>
          {creditCards && creditCards.length > 0 ? (
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
          ) : (
            <div className="text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 font-medium">
              ✨ Cartão identificado automaticamente: Ao confirmar, o sistema criará ou vinculará o cartão correspondente com base no emissor da fatura.
            </div>
          )}
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
              placeholder="Cole aqui linhas da sua fatura contendo datas, descrições e valores..."
              className="w-full flex-1 p-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
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

      {/* Tabela de Revisão com TAGS Customizáveis e Mês de Referência antes de Gravar */}
      {extractedData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gravando e Agendando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Importar Todos</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Mês e Ano de Referência da Fatura */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 text-slate-700">
              <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase text-slate-600 block">Mês de Referência da Fatura</span>
                <span className="text-xs text-slate-500">
                  Todas as compras desta fatura pertencerão a este mês, e compras parceladas (ex: 5/10) criarão as próximas faturas mensais automaticamente.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-emerald-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={invoiceYear}
                onChange={(e) => setInvoiceYear(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-emerald-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
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
                            ➔ Próximas {tx.installmentTotal - tx.installmentCurrent} parcelas serão criadas nos meses seguintes
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

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveTransactions}
              disabled={submitting || extractedData.transactions.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gravando e Agendando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Importar Todos ({extractedData.transactions.length})</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Histórico: Ver Faturas Importadas, Excluir Faturas e Gerenciar Tags Existentes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <FileSearch className="w-5 h-5 text-emerald-600" />
            <span>Faturas Importadas no Sistema</span>
          </h3>

          {invoicesHistory.length > 0 && (
            <button
              onClick={handleClearAllInvoices}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
              title="Excluir todas as faturas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todas as Faturas</span>
            </button>
          )}
        </div>

        {loadingHistory ? (
          <p className="text-sm text-slate-400 text-center py-4">Carregando faturas...</p>
        ) : invoicesHistory.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma fatura importada ainda.</p>
        ) : (
          <div className="space-y-3">
            {invoicesHistory.map((inv) => {
              const isExpanded = expandedInvoiceId === inv.id;
              const isFutureInvoice =
                inv.year > currentYear || (inv.year === currentYear && inv.month > currentMonth);

              return (
                <div key={inv.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                    className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-800 text-sm">
                          {inv.creditCard?.name} — Fatura {inv.month.toString().padStart(2, '0')}/{inv.year}
                        </span>
                        {isFutureInvoice && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                            Próxima Fatura (Agendada)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Vencimento: {new Date(inv.dueDate).toLocaleDateString('pt-BR')} • {inv.transactions?.length || 0} lançamentos
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCentsToBRL(inv.totalAmount)}
                      </span>

                      {/* Botão de Excluir Fatura */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(
                            inv.id,
                            `${inv.creditCard?.name} - ${inv.month.toString().padStart(2, '0')}/${inv.year}`
                          );
                        }}
                        title="Excluir esta fatura e seus lançamentos"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

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
