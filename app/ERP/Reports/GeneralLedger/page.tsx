'use client'
import { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiRefreshCw, 
  FiChevronLeft, 
  FiChevronRight, 
  FiLoader, 
  FiCheck, 
  FiArrowLeft, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiDownload
} from 'react-icons/fi';
import ERP from '../../page';
import Link from 'next/link';
import * as XLSX from 'xlsx';

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type ChartOfAccount = {
  id: string;
  accountNo: string;
  accountName: string;
  accountType: string;
  financialStatement: string;
  notes: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type JournalEntryLine = {
  id: string;
  journalEntryId: string;
  chartOfAccountId: string;
  debitAmount: string;
  creditAmount: string;
  description: string;
  vatAmount: string;
  createdAt: string;
  chartOfAccount: ChartOfAccount;
};

type JournalEntry = {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  description: string;
  totalAmount: string;
  currencyId: string;
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  journalEntryLines: JournalEntryLine[];
  currency: Currency;
  createdBy: User;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: JournalEntry[];
};

const GeneralLedger = () => {
  const [exporting, setExporting] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [accountFilter, setAccountFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchGeneralLedger = async () => {
      try {
        setLoading(true);
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        console.log(token);

        const response = await fetch('https://nvccz-pi.vercel.app/api/accounting/journal-entries', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        if (data.success && data.data) {
          setJournalEntries(data.data);
          setFilteredEntries(data.data);
          const totalLines = data.data.reduce((sum, entry) => 
            sum + (entry.journalEntryLines?.length || 0), 0);
          setTotalEntries(totalLines);
        }
      } catch (error) {
        console.error('Error fetching general ledger:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralLedger();
  }, []);



  useEffect(() => {
    const filtered = journalEntries.filter(entry => {
      // Search term filter
      const matchesSearch = 
        !searchTerm ||
        entry.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date range filter
      const entryDate = new Date(entry.transactionDate);
      const matchesDateRange = 
        (!dateRange.start || new Date(dateRange.start) <= entryDate) &&
        (!dateRange.end || new Date(dateRange.end) >= entryDate);

      // Account filter
      const matchesAccount = 
        !accountFilter ||
        entry.journalEntryLines?.some(line => 
          `${line.chartOfAccount?.accountNo} - ${line.chartOfAccount?.accountName}` === accountFilter
        );

      // Status filter
      const matchesStatus = 
        !statusFilter ||
        entry.status === statusFilter;

      return matchesSearch && matchesDateRange && matchesAccount && matchesStatus;
    });

    setFilteredEntries(filtered);
    setCurrentPage(1);
    const totalLines = filtered.reduce((sum, entry) => 
      sum + (entry.journalEntryLines?.length || 0), 0);
    setTotalEntries(totalLines);
  }, [journalEntries, searchTerm, dateRange, accountFilter, statusFilter]);

  const postJournalEntry = async (id: string) => {
    try {
      setPostingId(id);
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const response = await fetch(`https://nvccz-pi.vercel.app/api/accounting/journal-entries/${id}/post`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'POSTED' })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post journal entry');
      }
  
      const data = await response.json();
      if (data.success) {
        const refreshResponse = await fetch('https://nvccz-pi.vercel.app/api/accounting/journal-entries', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (refreshResponse.ok) {
          const refreshData: ApiResponse = await refreshResponse.json();
          if (refreshData.success && refreshData.data) {
            setJournalEntries(refreshData.data);
            setFilteredEntries(refreshData.data);
            const totalLines = refreshData.data.reduce((sum, entry) => 
              sum + (entry.journalEntryLines?.length || 0), 0);
            setTotalEntries(totalLines);
          }
        }
      }
    } catch (error) {
      console.error('Error posting journal entry:', error);
    } finally {
      setPostingId(null);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      // Prepare the data for export
      const dataToExport = flattenedEntries.map(({ entry, line }) => {
        const account = getAccountInfo(line);
        return {
          'Date': formatDate(entry.transactionDate),
          'Reference': entry.referenceNumber || 'N/A',
          'Description': line.description || entry.description || 'No description',
          'Account Code': account.code,
          'Account Name': account.name,
          'Account Type': account.type,
          'Debit': line.debitAmount !== "0" ? parseFloat(line.debitAmount) : 0,
          'Credit': line.creditAmount !== "0" ? parseFloat(line.creditAmount) : 0,
          'Status': entry.status,
          'Currency': entry.currency?.code || 'USD',
          'Created By': `${entry.createdBy?.firstName} ${entry.createdBy?.lastName}`,
          'Created At': formatDate(entry.createdAt)
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "General Ledger");
      
      // Generate file name with current date
      const fileName = `General_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Export the file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  
  const handlePostClick = async (id: string, currentStatus: string) => {
    if (currentStatus === 'POSTED') return;
    
    if (confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
      await postJournalEntry(id);
    }
  };

  const getFlattenedEntries = () => {
    return filteredEntries.flatMap(entry => 
      entry.journalEntryLines?.map(line => ({ entry, line })) || []);
  };

  const flattenedEntries = getFlattenedEntries();
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = flattenedEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: string, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(parseFloat(amount));
    } catch {
      return amount;
    }
  };

  const getAccountInfo = (line: JournalEntryLine) => {
    return {
      name: line.chartOfAccount?.accountName || 'Unknown Account',
      code: line.chartOfAccount?.accountNo || 'N/A',
      type: line.chartOfAccount?.accountType || 'Unknown'
    };
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      POSTED: 'bg-green-100 text-green-800',
      PENDING: 'bg-amber-100 text-amber-800',
      DRAFT: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    };

    const className = statusClasses[status as keyof typeof statusClasses] || statusClasses.default;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-light ${className}`}>
        {status || 'UNKNOWN'}
      </span>
    );
  };

  const allAccounts = Array.from(new Set(
    journalEntries.flatMap(entry => 
      entry.journalEntryLines?.map(line => 
        `${line.chartOfAccount?.accountNo} - ${line.chartOfAccount?.accountName}`
      ) || []
    )
  )).filter(Boolean) as string[];

  const allStatuses = Array.from(new Set(
    journalEntries.map(entry => entry.status)
  )).filter(Boolean) as string[];

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setAccountFilter('');
    setStatusFilter('');
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/ERP/Reports" 
              className="group relative flex items-center px-3 py-2 rounded-lg transition-all duration-300 hover:bg-navy-50/50"
            >
              <div className="absolute inset-0 rounded-lg bg-navy-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FiArrowLeft className="mr-2 text-gray-600 group-hover:text-navy-700 transition-all duration-300 group-hover:translate-x-1" />
              <span className="font-light text-gray-600 group-hover:text-navy-700 transition-all duration-300">
                Back to Reports
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-navy-600 transition-all duration-500 group-hover:w-full"></span>
              </span>
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-800 tracking-tight">General Ledger</h1>
              <p className="text-gray-500 font-light">Complete transaction history with debit/credit balances</p>
            </div>
          </div>
          <button 
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => window.location.reload()}
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button 
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 shadow-sm ${
              exporting || flattenedEntries.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#217346] text-white hover:bg-[#1a5f38] hover:shadow-md transform hover:-translate-y-0.5'
            }`}
            onClick={exportToExcel}
            disabled={exporting || flattenedEntries.length === 0}
          >
            {exporting ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                <span className="font-medium">Exporting...</span>
              </>
            ) : (
              <>
                <svg 
                  className="w-5 h-5 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M20 15V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V15" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M12 4V16M12 16L8 12M12 16L16 12" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">Export to Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200/50 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by reference or description..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-navy-500 focus:border-navy-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Account</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                >
                  <option value="">All Accounts</option>
                  {allAccounts.map(account => (
                    <option key={account} value={account}>{account}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Status</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {allStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FiX className="mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 text-sm font-light text-gray-500">
          Showing {filteredEntries.length} of {journalEntries.length} journal entries
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200/50">
                  {currentEntries.map(({ entry, line }, index) => {
                    const account = getAccountInfo(line);
                    const isBeingPosted = postingId === entry.id;
                    return (
                      <tr 
                        key={`${entry.id}-${line.id}-${index}`} 
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-gray-400" />
                            {formatDate(entry.transactionDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-900">
                          {entry.referenceNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-light text-gray-900 max-w-xs truncate">
                          {line.description || entry.description || 'No description'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-normal">{account.name}</span>
                            <span className="text-gray-500 text-xs">{account.code} ({account.type})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-red-600">
                          {line.debitAmount !== "0" ? formatCurrency(line.debitAmount, entry.currency?.code || 'USD') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-green-600">
                          {line.creditAmount !== "0" ? formatCurrency(line.creditAmount, entry.currency?.code || 'USD') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusBadge(entry.status)}
                            {entry.status !== 'POSTED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostClick(entry.id, entry.status);
                                }}
                                disabled={isBeingPosted || postingId !== null}
                                className={`ml-2 px-3 py-1 text-xs rounded-md flex items-center ${
                                  isBeingPosted 
                                  ? 'bg-gray-100 text-gray-500' 
                                  : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                                }`}
                              >
                                {isBeingPosted ? (
                                  <>
                                    <FiLoader className="animate-spin mr-1" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="mr-1" />
                                    Post
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200/50">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-light rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-light rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-light text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstEntry + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastEntry, totalEntries)}</span> of{' '}
                    <span className="font-medium">{totalEntries}</span> entries
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-light text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-light
                          ${currentPage === page 
                            ? 'bg-navy-600 text-white border-navy-600' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-light text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GeneralLedger;