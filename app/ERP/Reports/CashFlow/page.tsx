'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiAlertCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

// Types that mirror the API (string amounts in payload)
type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
};

type ChartOfAccount = {
  id: string;
  accountNo: string;
  accountName: string;
  accountType: string; // e.g., Current Asset, Expense, Equity, Long-term Liability, etc
  financialStatement: string; // "Income Statement" | "Balance Sheet"
};

type JournalEntryLine = {
  id: string;
  journalEntryId: string;
  chartOfAccountId: string;
  debitAmount: string; // string from API
  creditAmount: string; // string from API
  description: string;
  vatAmount: string;
  chartOfAccount: ChartOfAccount;
};

type JournalEntry = {
  id: string;
  transactionDate: string; // ISO
  referenceNumber: string;
  description: string;
  totalAmount: string;
  currencyId: string;
  status: string;
  journalEntryLines: JournalEntryLine[];
  currency: Currency;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: JournalEntry[];
};

type Section = 'Operating' | 'Investing' | 'Financing';

type ClassifiedRow = {
  entryId: string;
  date: string;
  reference: string;
  description: string;
  section: Section;
  cashImpact: number; // signed, +inflow / -outflow
  currency: string;
};

const CASH_ACCOUNT_HINTS = ['cash and cash equivalents', 'cash', 'bank'];

function parseAmount(s: string | number | null | undefined): number {
  if (s === null || s === undefined) return 0;
  if (typeof s === 'number') return s;
  const n = parseFloat(String(s));
  return isNaN(n) ? 0 : n;
}

function isCashLine(line: JournalEntryLine): boolean {
  const name = (line.chartOfAccount?.accountName || '').toLowerCase();
  const no = (line.chartOfAccount?.accountNo || '').toLowerCase();
  return CASH_ACCOUNT_HINTS.some((h) => name.includes(h)) || no === '1000'; // per sample
}

function classifyAccountToSection(coa: ChartOfAccount): Section {
  const fs = (coa.financialStatement || '').toLowerCase();
  const type = (coa.accountType || '').toLowerCase();
  const no = (coa.accountNo || '').trim();

  // Income statement items -> Operating
  if (fs.includes('income')) return 'Operating';

  // Balance sheet heuristics
  if (type.includes('non') && type.includes('asset')) return 'Investing';
  if (
    type.includes('fixed') ||
    type.includes('property') ||
    type.includes('equipment') ||
    type.includes('intangible')
  )
    return 'Investing';

  if (
    type.includes('equity') ||
    (type.includes('long') && type.includes('liability')) ||
    (type.includes('non') && type.includes('liability'))
  )
    return 'Financing';

  // Account number hints (typical charts: 1=Assets, 2=Liabilities, 3=Equity, 4=Revenue, 5=Expense)
  if (/^3/.test(no)) return 'Financing'; // equity
  if (/^2/.test(no) && !type.includes('current')) return 'Financing'; // long-term liabilities

  // Working capital (current assets/liabilities) -> Operating
  if (type.includes('current asset') || type.includes('current liability')) return 'Operating';

  // Fallback
  return 'Operating';
}

function toLocalDate(dateIso: string) {
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateIso;
  }
}

const CashFlow: React.FC = () => {
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('https://nvccz-pi.vercel.app/api/accounting/journal-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const json: ApiResponse = await response.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error(json.message || 'Failed to fetch');

      setEntries(json.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = useMemo(() => {
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T23:59:59');
    return entries.filter((e) => {
      const t = new Date(e.transactionDate);
      return t >= start && t <= end;
    });
  }, [entries, fromDate, toDate]);

  // Build cash-flow rows:
  // 1) Identify the cash line in each entry.
  // 2) cashImpact = debit - credit on cash line (assets: debit increases -> inflow).
  // 3) Attribute the entire cashImpact to the single largest non-cash line (dominant driver) to avoid double-counting.
  const rows: ClassifiedRow[] = useMemo(() => {
    const r: ClassifiedRow[] = [];
    for (const je of filtered) {
      const cash = je.journalEntryLines.find(isCashLine);
      if (!cash) continue; // no cash movement

      const debit = parseAmount(cash.debitAmount);
      const credit = parseAmount(cash.creditAmount);
      const cashImpact = debit - credit; // +inflow, -outflow

      const nonCash = je.journalEntryLines.filter((l) => !isCashLine(l));
      if (nonCash.length === 0) continue;

      const dominant = nonCash.reduce((max, cur) => {
        const curAmt = Math.max(parseAmount(cur.debitAmount), parseAmount(cur.creditAmount));
        const maxAmt = Math.max(parseAmount(max.debitAmount), parseAmount(max.creditAmount));
        return curAmt > maxAmt ? cur : max;
      }, nonCash[0]);

      const section = classifyAccountToSection(dominant.chartOfAccount);

      r.push({
        entryId: je.id,
        date: je.transactionDate,
        reference: je.referenceNumber,
        description: je.description,
        section,
        cashImpact,
        currency: je.currency?.code || '—',
      });
    }
    return r.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  const totals = useMemo(() => {
    const t = { Operating: 0, Investing: 0, Financing: 0 } as Record<Section, number>;
    for (const row of rows) t[row.section] += row.cashImpact;
    const net = t.Operating + t.Investing + t.Financing;
    return { ...t, NetChange: net };
  }, [rows]);

  const currencyHint = useMemo(() => {
    if (rows.length > 0) return rows[0].currency;
    if (entries.length > 0) return entries[0].currency?.code || '';
    return '';
  }, [rows, entries]);

  // Export to Excel using SheetJS
  const exportToExcel = () => {
    const statement = [
      ['Cash Flow Statement'],
      [`Period: ${fromDate} to ${toDate}`],
      [''],
      ['Section', 'Amount'],
      ['Operating Activities', totals.Operating],
      ['Investing Activities', totals.Investing],
      ['Financing Activities', totals.Financing],
      ['Net Change in Cash', totals.NetChange],
    ];

    const detailsHeader = ['Date', 'Reference', 'Description', 'Section', 'Cash Impact', 'Currency'];
    const details = rows.map((r) => [
      toLocalDate(r.date),
      r.reference,
      r.description,
      r.section,
      r.cashImpact,
      r.currency,
    ]);

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(statement);
    const ws2 = XLSX.utils.aoa_to_sheet([detailsHeader, ...details]);

    XLSX.utils.book_append_sheet(wb, ws1, 'Statement');
    XLSX.utils.book_append_sheet(wb, ws2, 'Details');

    XLSX.writeFile(wb, `CashFlow_${fromDate}_to_${toDate}.xlsx`);
  };

  const formatMoney = (n: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyHint || 'USD' }).format(n);
    } catch {
      return n.toFixed(2);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ERP/Reports')}
            className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-800 tracking-tight">Cash Flow Statement</h1>
            <p className="text-gray-500 font-light">
              Modern, direct-method cash flows derived from the general ledger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          <button
            onClick={exportToExcel}
            disabled={rows.length === 0}
            className={`flex items-center px-4 py-2 rounded-lg text-white ${
              rows.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-900'
            }`}
          >
            <FiDownload className="mr-2" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3 text-gray-700">
          <FiFilter />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 p-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 p-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchEntries()}
              className="w-full md:w-auto px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Operating Activities</p>
          <p className="text-2xl font-semibold">{formatMoney(totals.Operating)}</p>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Investing Activities</p>
          <p className="text-2xl font-semibold">{formatMoney(totals.Investing)}</p>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Financing Activities</p>
          <p className="text-2xl font-semibold">{formatMoney(totals.Financing)}</p>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Net Change in Cash</p>
          <p className={`text-2xl font-semibold ${totals.NetChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatMoney(totals.NetChange)}
          </p>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Statement (Direct Method)</h2>
          <p className="text-xs text-gray-500">
            Amounts reflect cash-impacting journal entries only. Positive = inflow; Negative = outflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Operating Activities</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Total</span>
              <span>{formatMoney(totals.Operating)}</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Investing Activities</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Total</span>
              <span>{formatMoney(totals.Investing)}</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Financing Activities</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Total</span>
              <span>{formatMoney(totals.Financing)}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">Net Change in Cash</span>
          <span
            className={`text-sm font-semibold ${totals.NetChange >= 0 ? 'text-green-700' : 'text-red-700'}`}
          >
            {formatMoney(totals.NetChange)}
          </span>
        </div>
      </div>

      {/* Detailed Movements */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Cash Movements (Details)</h2>
            <p className="text-xs text-gray-500">
              Derived by detecting entries that touch a cash/bank account and attributing the impact to the dominant
              counter account.
            </p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <FiAlertCircle /> Heuristics-based classification
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash Impact ({currencyHint || '—'})
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No cash movements in this period.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.entryId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{toLocalDate(r.date)}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{r.reference}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 max-w-lg truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          r.section === 'Operating'
                            ? 'bg-blue-100 text-blue-800'
                            : r.section === 'Investing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.section}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-3 text-sm text-right ${
                        r.cashImpact >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {formatMoney(r.cashImpact)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
    </div>
  );
};

export default CashFlow;
