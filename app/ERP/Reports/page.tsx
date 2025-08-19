import ERP from "../page";
import { FiBook, FiPieChart, FiDollarSign, FiTrendingUp, FiTrendingDown, FiBarChart2 } from 'react-icons/fi';
import Link from 'next/link';

const Reports = () => {
    const reports = [
        {
            id: 'general-ledger',
            title: 'General Ledger',
            description: 'Complete transaction history with debit/credit balances',
            icon: <FiBook className="text-navy-600" size={24} />,
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            path: '/ERP/Reports/GeneralLedger'
        },
        {
            id: 'chart-of-accounts',
            title: 'Chart of Accounts',
            description: 'Hierarchical view of all accounts in your accounting system',
            icon: <FiBarChart2 className="text-navy-600" size={24} />,
            bgColor: 'bg-purple-50',
            hoverColor: 'hover:bg-purple-100',
            path: '/ERP/Reports/ChartofAccounts'
        },
        {
            id: 'balance-sheet',
            title: 'Balance Sheet',
            description: 'Snapshot of assets, liabilities, and equity at a point in time',
            icon: <FiDollarSign className="text-navy-600" size={24} />,
            bgColor: 'bg-green-50',
            hoverColor: 'hover:bg-green-100',
            path: '/ERP/Reports/BalanceSheet'
        },
        {
            id: 'cash-flow',
            title: 'Cash Flow Statement',
            description: 'Track cash inflows and outflows across operating activities',
            icon: <FiTrendingUp className="text-navy-600" size={24} />,
            bgColor: 'bg-teal-50',
            hoverColor: 'hover:bg-teal-100',
                  path: '/ERP/Reports/CashFlow'
        },
        {
            id: 'profit-loss',
            title: 'Profit & Loss',
            description: 'Revenue, costs, and expenses during a specific period',
            icon: <FiTrendingDown className="text-navy-600" size={24} />,
            bgColor: 'bg-amber-50',
            hoverColor: 'hover:bg-amber-100',
            path: '/ERP/Reports/ProfitLoss'
        }
    ];

    return (
      
            <div className="p-6">
                <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-tight">Financial Reports</h1>
                <p className="text-gray-500 mb-8 font-light">Access all critical financial statements and accounting masters</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        report.path ? (
                            <Link href={report.path} key={report.id} passHref>
                                <div 
                                    className={`${report.bgColor} ${report.hoverColor} rounded-xl p-6 border border-gray-200/50 transition-all duration-300 ease-in-out hover:shadow-md hover:border-gray-300/50 group cursor-pointer`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-xs mb-4 group-hover:scale-105 transition-transform">
                                                {report.icon}
                                            </div>
                                            <h3 className="text-xl font-light text-gray-800 tracking-tight mb-1 group-hover:text-navy-700 transition-colors">
                                                {report.title}
                                            </h3>
                                            <p className="text-gray-500 font-light text-sm">
                                                {report.description}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                            <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200/50 group-hover:border-gray-300/50 transition-colors">
                                        <span className="text-xs font-light text-navy-600 tracking-wide">VIEW REPORT →</span>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div 
                                key={report.id}
                                className={`${report.bgColor} ${report.hoverColor} rounded-xl p-6 border border-gray-200/50 transition-all duration-300 ease-in-out hover:shadow-md hover:border-gray-300/50 group cursor-pointer`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-xs mb-4 group-hover:scale-105 transition-transform">
                                            {report.icon}
                                        </div>
                                        <h3 className="text-xl font-light text-gray-800 tracking-tight mb-1 group-hover:text-navy-700 transition-colors">
                                            {report.title}
                                        </h3>
                                        <p className="text-gray-500 font-light text-sm">
                                            {report.description}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200/50 group-hover:border-gray-300/50 transition-colors">
                                    <span className="text-xs font-light text-navy-600 tracking-wide">VIEW REPORT →</span>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        
    );
}
 
export default Reports;