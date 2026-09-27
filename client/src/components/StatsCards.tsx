'use client';

import React from 'react';
import { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const cards = [
    { title: 'जम्मा रेकर्ड', value: stats.total_records },
    { title: 'मृत्यु', value: stats.total_deaths },
    { title: 'बेपत्ता', value: stats.total_missing },
    { title: 'घाइते / अपाङ्गता', value: stats.total_injured },
    { title: 'अन्य घटना', value: stats.total_other },
    { title: 'बालबालिका (< १८)', value: stats.total_children },
    { title: 'प्रभावित महिला', value: stats.total_women },
    { title: 'प्रमाणीत', value: stats.total_verified },
    { title: 'प्रमाणीकरण बाँकी', value: stats.total_pending },
    { title: 'पहिचान नखुलेका', value: stats.total_unidentified },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-lg bg-white border border-[#D8E2E8] px-3 py-1.5 flex items-center justify-between animate-pulse"
          >
            <div className="h-3.5 bg-[#E8F3F6] rounded w-1/2"></div>
            <div className="h-3.5 bg-[#E8F3F6] rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg border border-[#D8E2E8] px-3 py-2 shadow-2xs hover:border-[#176B87]/50 hover:bg-[#F4F8FA]/50 transition-colors flex items-center justify-between gap-2"
        >
          <span className="text-xs sm:text-[13px] font-medium text-[#64748B] truncate" title={card.title}>
            {card.title}
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#123B5D] shrink-0">
            {card.value.toLocaleString('ne-NP')}
          </span>
        </div>
      ))}
    </div>
  );
}
