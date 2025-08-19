'use client'

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiMoreVertical, FiArrowLeft } from 'react-icons/fi';
import ERP from '../../page';
import { useRouter } from 'next/navigation';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Currency[];
  message?: string;
}

// Predefined currency list for quick selection
const PREDEFINED_CURRENCIES: Array<Pick<Currency, 'code' | 'name' | 'symbol'>> = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'ZWL$' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

const Currencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const router = useRouter();
  const handleBackClick = () => {
    router.push('/ERP/Tools');
  };

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    isDefault: false,
  });

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('https://nvccz-pi.vercel.app/api/accounting/currencies', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: ApiResponse = await response.json();
        if (data.success) {
          setCurrencies(data.data);
        } else {
          setError(data.message || 'Failed to fetch currencies');
        }
      } catch (err) {
        setError('An error occurred while fetching currencies');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  const toggleDropdown = (id: string) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleEditClick = (currency: Currency) => {
    setCurrentCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isDefault: currency.isDefault,
    });
    setIsEditModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this currency?')) {
      try {
        setDeletingId(id);
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`https://nvccz-pi.vercel.app/api/accounting/currencies/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (result.success) {
          setCurrencies((prev) => prev.filter((currency) => currency.id !== id));
        } else {
          alert(result.message || 'Failed to delete currency');
        }
      } catch (err) {
        alert('An error occurred while deleting the currency');
      } finally {
        setDeletingId(null);
      }
    }
    setDropdownOpen(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Quick-select handler to auto-fill fields from predefined list
  const handlePredefinedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (!code) return;
    const preset = PREDEFINED_CURRENCIES.find((c) => c.code === code);
    if (preset) {
      setFormData((prev) => ({ ...prev, code: preset.code, name: preset.name, symbol: preset.symbol }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = currentCurrency
      ? `https://nvccz-pi.vercel.app/api/accounting/currencies/${currentCurrency.id}`
      : 'https://nvccz-pi.vercel.app/api/accounting/currencies';

    const method = currentCurrency ? 'PUT' : 'POST';

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        if (method === 'POST') {
          setCurrencies((prev: Currency[]) => [...prev, result.data]);
        } else {
          setCurrencies((prev: Currency[]) => prev.map((c) => (c.id === currentCurrency?.id ? result.data : c)));
        }
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      {/* Header with Add Currency Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBackClick}
          className="group flex items-center space-x-1.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:from-blue-100 hover:to-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:from-blue-900/30 dark:to-blue-800/30 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40"
        >
          <FiArrowLeft className="h-5 w-5 text-blue-600 transition-transform duration-300 group-hover:-translate-x-1 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-200">Back</span>
        </button>

        <h1 className="text-2xl font-semibold tracking-tight">Currencies</h1>

        <button
          onClick={() => {
            setCurrentCurrency(null);
            setFormData({ code: '', name: '', symbol: '', isDefault: false });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-white shadow-sm transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <FiPlus className="h-5 w-5" />
          <span className="font-medium">Add Currency</span>
        </button>
      </div>

      {/* Currencies Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No currencies found</td>
                </tr>
              ) : (
                currencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{currency.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{currency.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{currency.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(currency.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        currency.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {currency.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        currency.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currency.isDefault ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      <button
                        onClick={() => toggleDropdown(currency.id)}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={deletingId === currency.id}
                      >
                        {deletingId === currency.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                        ) : (
                          <FiMoreVertical />
                        )}
                      </button>
                      {dropdownOpen === currency.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleEditClick(currency)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <FiEdit2 className="mr-2" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(currency.id)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <FiTrash2 className="mr-2" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Currency Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-md">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Add Currency</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  disabled={submitting}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Predefined dropdown */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Quick select</label>
                  <select
                    onChange={handlePredefinedChange}
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    disabled={submitting}
                  >
                    <option value="" disabled>
                      Choose a currency…
                    </option>
                    {PREDEFINED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Selecting will auto-fill the fields below (you can still edit).</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="code">
                    Code*
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                    Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="symbol">
                    Symbol*
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label htmlFor="isDefault" className="text-sm text-slate-700">
                    Set as default currency
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white/60 px-4 py-2 text-slate-700 shadow-sm transition hover:bg-white"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:shadow-lg disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <FiPlus className="h-5 w-5" /> Add Currency
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Currency Modal */}
      {isEditModalOpen && currentCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-md">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Edit Currency</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  disabled={submitting}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Optional: allow switching to another preset while editing */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Quick select</label>
                  <select
                    onChange={handlePredefinedChange}
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    disabled={submitting}
                  >
                    <option value="" disabled>
                      Choose a currency…
                    </option>
                    {PREDEFINED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="code">
                    Code*
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                    Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="symbol">
                    Symbol*
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <label htmlFor="isDefault" className="text-sm text-slate-700">
                    Set as default currency
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white/60 px-4 py-2 text-slate-700 shadow-sm transition hover:bg-white"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex min-w-28 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:shadow-lg disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Currencies;
