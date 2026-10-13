'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Mic, HelpCircle } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface NLPAssistantTabProps {
  onTransactionCreated: () => void;
}

export const NLPAssistantTab: React.FC<NLPAssistantTabProps> = ({ onTransactionCreated }) => {
  const [inputText, setInputText] = useState('');
  const [interpretation, setInterpretation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const examples = [
    'Gastei 35 reais no almoço em dinheiro.',
    'Paguei 120 reais de combustível no Pix.',
    'Recebi 500 reais de comissão.',
    'Anota 89,90 de mercado no cartão Nubank.',
    'Emprestei 200 reais para João.',
    'Paguei 150 reais da minha dívida.',
  ];

  const handleInterpret = async (textToParse?: string) => {
    const text = textToParse || inputText;
    if (!text.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao interpretar texto');

      setInterpretation(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na interpretação');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!interpretation) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { parsed, suggestedCategoryId, suggestedAccountId, suggestedCreditCardId } = interpretation;

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: parsed.type,
          description: parsed.description,
          amount: parsed.amount,
          categoryId: suggestedCategoryId,
          accountId: parsed.type === 'CREDIT_CARD_EXPENSE' ? undefined : suggestedAccountId,
          creditCardId: parsed.type === 'CREDIT_CARD_EXPENSE' ? suggestedCreditCardId : undefined,
          paymentMethod: parsed.paymentMethod,
          relatedPerson: parsed.relatedPerson,
          notes: `Registrado via assistente: "${parsed.rawText}"`,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar transação');
      }

      setSuccessMsg(`Lançamento de ${formatCentsToBRL(interpretation.parsed.amount)} registrado com sucesso!`);
      setInterpretation(null);
      setInputText('');
      onTransactionCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao confirmar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Assistente Inteligente em Linguagem Natural</h2>
            <p className="text-sm text-slate-500">
              Digite ou fale naturalmente como você fala no dia a dia. Funciona 100% local, seguro e sem custos de API.
            </p>
          </div>
        </div>

        {/* Campo de Entrada */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Exemplo: Gastei 45 reais no lanche em dinheiro..."
              className="w-full p-4 pr-12 border border-slate-200 rounded-2xl text-slate-800 focus:outline-emerald-500 text-sm resize-none shadow-xs"
            />
            <button
              onClick={() => {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                  const SpeechRecognition =
                    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  const recognition = new SpeechRecognition();
                  recognition.lang = 'pt-BR';
                  recognition.start();
                  recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInputText(transcript);
                    handleInterpret(transcript);
                  };
                } else {
                  alert('Reconhecimento de voz não suportado neste navegador. Digite seu comando.');
                }
              }}
              title="Ditado por voz (se suportado pelo navegador)"
              className="absolute right-3 bottom-4 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Pressione Interpretar para validar antes de gravar</span>
            <button
              onClick={() => handleInterpret()}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
            >
              <span>{loading ? 'Interpretando...' : 'Interpretar Comando'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exemplos Rápidos */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Exemplos que você pode clicar para testar:
          </span>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(ex);
                  handleInterpret(ex);
                }}
                className="text-xs bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 py-1.5 px-3 rounded-lg border border-slate-200/60 transition-all text-left"
              >
                "{ex}"
              </button>
            ))}
          </div>
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
          <HelpCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Caixa de Confirmação Resumida (Não grava silenciosamente!) */}
      {interpretation && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/50 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">Confirmação de Registro Financeiro</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              Pronto para gravar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-5">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Tipo</span>
              <span className="text-sm font-bold text-slate-800">{interpretation.parsed.type}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Valor Identificado</span>
              <span className="text-base font-extrabold text-emerald-600">
                {formatCentsToBRL(interpretation.parsed.amount)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Descrição</span>
              <span className="text-sm font-semibold text-slate-800 truncate block">
                {interpretation.parsed.description}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Categoria Sugerida</span>
              <span className="text-sm font-semibold text-slate-800">{interpretation.parsed.categoryGuess}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">Método</span>
              <span className="text-sm font-semibold text-slate-800">{interpretation.parsed.paymentMethod}</span>
            </div>

            {interpretation.parsed.relatedPerson && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Pessoa Relacionada</span>
                <span className="text-sm font-semibold text-slate-800">{interpretation.parsed.relatedPerson}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setInterpretation(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Descartar
            </button>
            <button
              onClick={handleConfirmAndSave}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center space-x-2"
            >
              <span>{submitting ? 'Gravando...' : 'Confirmar e Salvar no Banco'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
