import React from 'react';
import { LucideIcon } from 'lucide-react';
import KpiCard from '../KpiCard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  // Map color bg-x text-x classes to KpiCard format
  const mappedIconColor = `${color.replace('bg-', 'bg-').replace('text-', 'text-')} bg-opacity-10`;

  // Map trend to trend object
  const mappedTrend = trend ? {
    value: trend,
    type: trend.includes('-') || trend.toLowerCase().includes('down') || trend.toLowerCase().includes('negative') ? 'negative' as const : 'positive' as const
  } : undefined;

  return (
    <KpiCard
      title={title}
      value={value}
      icon={Icon}
      iconColor={mappedIconColor}
      trend={mappedTrend}
      comparisonText="from last month"
    />
  );
};