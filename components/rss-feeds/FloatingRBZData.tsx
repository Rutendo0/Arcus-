'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import useSWR from 'swr';
import { BankRatesResponse } from '@/types.db';

interface BankRate {
  currency: string;
  /** Display the quoted pair (e.g., "1USD-ZiG") */
  symbol: string;
  buy_rate: number;
  sell_rate: number;
  mid_rate: number;
  change: number;
  change_percent: number;
  /** ISO date string from response (date_iso) */
  last_updated: string;
}

const fetcher = async (url: string) => await fetch(url).then((res) => res.json());

// Sidebar prefs (kept in ERP layout)
const SIDEBAR_COLLAPSE_KEY = 'erp.sidebar.collapsed';
const COLLAPSED_PX = 76; // ~ w-[4.75rem]
const EXPANDED_PX = 256; // w-64

const useSidebarOffset = () => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const compute = () => {
      const isLarge = window.matchMedia('(min-width: 1024px)').matches; // lg breakpoint
      if (!isLarge) return setLeft(0);
      const collapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1';
      setLeft(collapsed ? COLLAPSED_PX : EXPANDED_PX);
    };
    compute();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSE_KEY) compute();
    };
    window.addEventListener('resize', compute);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return left;
};

const FloatingRBZData = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const leftOffset = useSidebarOffset();

  // Bank rates (auto-refresh)
  const { data: bankRatesData, error, isLoading } = useSWR<BankRatesResponse>(
    mounted ? '/api/bankRates' : null,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
    }
  );

  useEffect(() => setMounted(true), []);

  const rates: BankRate[] = useMemo(
    () =>
      bankRatesData?.exchange_rates?.map((rate) => ({
        currency: rate.currency,           // e.g. "Zimbabwe Gold"
        symbol: rate.pair,                 // e.g. "1USD-ZiG"
        buy_rate: rate.we_buy,
        sell_rate: rate.we_sell,
        mid_rate: rate.mid_rate,
        change: 0,
        change_percent: 0,
        last_updated: bankRatesData?.date_iso ?? new Date().toISOString(),
      })) ?? [],
    [bankRatesData]
  );

  // rotate through rates
  useEffect(() => {
    if (rates.length === 0) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i >= rates.length - 1 ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [rates.length]);

  // --- UI shell --------------------------------------------------------------
  const BarShell = ({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'red' | 'yellow' }) => {
    const toneClasses = {
      blue: 'from-sky-900/80 via-sky-800/80 to-sky-900/80 border-sky-600/30',
      red: 'from-rose-900/80 via-rose-800/80 to-rose-900/80 border-rose-600/30',
      yellow: 'from-amber-900/80 via-amber-800/80 to-amber-900/80 border-amber-600/30',
    }[tone];

    return (
      <div
        className={`relative overflow-hidden border-y ${toneClasses} bg-gradient-to-r backdrop-blur-xl shadow-[0_8px_30px_rgba(2,6,23,0.35)]`}
        style={{
          position: 'fixed',
          top: 64, // ~ top-16
          left: leftOffset,
          right: 0,
          zIndex: 40,
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {/* gentle light sweep */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />
        {children}
      </div>
    );
  };

  if (!mounted) {
    return (
      <BarShell tone="blue">
        <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-sky-300" />
          <span className="text-xs text-sky-200">Loading exchange rates…</span>
        </div>
      </BarShell>
    );
  }

  if (error) {
    return (
      <BarShell tone="red">
        <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 shadow">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-medium text-rose-100">RBZ Exchange Rates — API Error</span>
          <span className="text-[11px] text-rose-200">• OFFLINE</span>
        </div>
      </BarShell>
    );
  }

  if (isLoading || rates.length === 0) {
    return (
      <BarShell tone="yellow">
        <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-amber-300" />
          <span className="text-xs text-amber-100">Fetching live exchange rates from RBZ…</span>
        </div>
      </BarShell>
    );
  }

  const r = rates[currentIndex];
  if (!r) return null;

  return (
    <BarShell tone="blue">
      <div className="relative mx-auto max-w-7xl px-2 sm:px-3">
        <div className="relative flex items-center justify-between gap-3 py-2.5">
          {/* Left cluster */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600 shadow">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="truncate text-xs font-medium text-sky-100">
              RBZ Exchange Rates <span className="ml-1 text-[11px] text-emerald-300">• LIVE</span>
            </p>
          </div>

          {/* Middle cluster */}
          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 backdrop-blur-md sm:gap-3 sm:px-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-sm font-semibold leading-none text-white sm:text-base">{r.symbol}</span>
              <span className="truncate text-[11px] text-sky-200 sm:text-xs">{r.currency}</span>
            </div>
            <div className="hidden h-4 w-px rounded bg:white/10 sm:block bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] text-sky-300">BUY</div>
              <div className="text-xs font-semibold text-white sm:text-sm">{r.buy_rate.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-sky-300">SELL</div>
              <div className="text-xs font-semibold text-white sm:text-sm">{r.sell_rate.toFixed(2)}</div>
            </div>
            <div className="hidden text-center sm:block">
              <div className="text-[10px] text-sky-300">MID</div>
              <div className="text-xs font-semibold text-white sm:text-sm">{r.mid_rate.toFixed(3)}</div>
            </div>
            <div className="hidden h-4 w-px rounded bg-white/10 sm:block" />
            <div className="flex items-center gap-1">
              {r.change >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              <span className={`text-xs font-medium ${r.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {r.change === 0 ? 'N/A' : `${r.change >= 0 ? '+' : ''}${r.change_percent.toFixed(2)}%`}
              </span>
            </div>
          </div>

          {/* Right cluster */}
          <div className="hidden items-center gap-2 text-sky-100 sm:flex">
            <span className="text-[11px]">{currentIndex + 1}/{rates.length}</span>
          </div>
        </div>
        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-900/50">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000"
            style={{ width: `${((currentIndex + 1) / rates.length) * 100}%` }}
          />
        </div>
      </div>
    </BarShell>
  );
};

export default FloatingRBZData;
