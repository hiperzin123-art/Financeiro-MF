'use client';

import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCentsToBRL } from '@/lib/financialEngine';

interface AlertsTabProps {
  metrics: any;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ metrics }) => {
  const alerts: Array<{ type: 'danger' | 'warning' | 'success'; title: string; desc: string }> = [];

  if (metrics?.availableBalance < 0) {
    alerts.push({
      type: 'danger',
      title: 'Risco de Saldo Insuficiente',
      desc: `Seus compromissos imediatos (faturas abertas e contas a pagar) excedem o saldo em conta em ${formatCentsToBRL(
        Math.abs(metrics.availableBalance)
      )}.`,
    });
  }

  if (metrics?.openInvoicesTotal > 0) {
    alerts.push({
      type: 'warning',
      title: 'Faturas em Aberto Requerem Atenção',
      desc: `Você tem ${formatCentsToBRL(metrics.openInvoicesTotal)} em faturas de cartão aguardando pagamento.`,
    });
  }

  if (metrics?.pendingDebtsToPay > 0) {
    alerts.push({
      type: 'warning',
      title: 'Dívidas Pendentes',
      desc: `Existe um total de ${formatCentsToBRL(metrics.pendingDebtsToPay)} em dívidas registradas pendentes.`,
    });
  }

  if (metrics?.availableBalance > 0 && alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: 'Saúde Financeira Equilibrada',
      desc: `Seu saldo disponível está positivo em ${formatCentsToBRL(
        metrics.availableBalance
      )} com todas as obrigações imediatas cobertas.`,
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800">Alertas, Riscos & Vencimentos</h2>
        <p className="text-sm text-slate-500">
          Diagnóstico contínuo do seu fluxo de caixa e compromissos críticos.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border flex items-start space-x-4 ${
              a.type === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : a.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {a.type === 'danger' && <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
            {a.type === 'warning' && <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
            {a.type === 'success' && <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
            <div>
              <h4 className="font-bold text-base">{a.title}</h4>
              <p className="text-sm mt-1 opacity-90">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
