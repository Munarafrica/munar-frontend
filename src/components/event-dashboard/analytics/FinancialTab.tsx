import React from 'react';
import { BarChart3, Wallet } from 'lucide-react';
import { Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, BarChart } from 'recharts';
import { EventAnalytics } from '../../../types/analytics';
import { SectionCard } from './SectionCard';

interface FinancialTabProps {
  analytics: EventAnalytics;
  currency: string;
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

export const FinancialTab: React.FC<FinancialTabProps> = ({ analytics, currency }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Revenue streams" description="Tickets, merch, voting, sponsorships">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.financial.revenueStreams}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Cost breakdown" description="Event spend overview">
          <div className="space-y-3">
            {analytics.financial.costBreakdown.map((cost) => (
              <div key={cost.category} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-4 py-3">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{cost.category}</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(cost.amount, currency)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="ROI overview" description="Revenue vs cost">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(analytics.financial.totalRevenue, currency)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total cost</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(analytics.financial.totalCost, currency)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">ROI</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics.financial.roiPercent}%</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
