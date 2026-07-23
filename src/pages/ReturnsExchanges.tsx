import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Receipt, ArrowRight, RotateCcw, Check, Calendar, User, 
  DollarSign, FileText, AlertCircle, HelpCircle, Eye, Printer, 
  Sparkles, RefreshCw, ShoppingBag, Undo2, ArrowUpRight, BarChart3, Download, Filter, Coins, X, History
} from 'lucide-react';
import { usePOSStore, Sale } from '../stores/posStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCustomerStore } from '../stores/customersStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useReturnsStore, ReturnRecord } from '../stores/returnsStore';
import { generatePDFReturnReceipt } from '../utils/pdfReturnReceiptGenerator';
import { format, isWithinInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

const ReturnsExchanges: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();

  const { products } = useInventoryStore();
  const { getCustomerById } = useCustomerStore();
  const { settings } = useSettingsStore();
  
  const { 
    returns, 
    initializeReturns 
  } = useReturnsStore();

  // Load return records on mount
  useEffect(() => {
    initializeReturns();
  }, [initializeReturns]);

  // Tab State: 'dashboard' | 'history' | 'refund_ledger'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'refund_ledger'>('dashboard');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [refundStatusFilter, setRefundStatusFilter] = useState<'All' | 'completed' | 'pending'>('All');

  // Past Return Detail Modal
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);

  // --- Filtering Returns records ---
  const filteredReturns = useMemo(() => {
    return returns.filter(rec => {
      const customer = rec.customerId ? getCustomerById(rec.customerId) : null;
      const matchText = rec.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.originalSaleId.toString().includes(searchTerm) ||
        (rec.customerName && rec.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date Range Filter
      let matchDate = true;
      if (startDate || endDate) {
        const recDate = new Date(rec.createdAt);
        if (startDate && endDate) {
          matchDate = isWithinInterval(recDate, { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') });
        } else if (startDate) {
          matchDate = recDate >= new Date(startDate);
        } else if (endDate) {
          matchDate = recDate <= new Date(endDate + 'T23:59:59');
        }
      }

      // Method Filter
      const matchMethod = methodFilter === 'All' || rec.paymentMethod === methodFilter;

      // Status (store credits are sometimes pending adjustment, or all credit cash outs)
      const status = rec.paymentMethod === 'credit' ? 'pending' : 'completed';
      const matchStatus = refundStatusFilter === 'All' || status === refundStatusFilter;

      return matchText && matchDate && matchMethod && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [returns, searchTerm, startDate, endDate, methodFilter, refundStatusFilter, getCustomerById]);

  // --- Dashboard Aggregations ---
  const stats = useMemo(() => {
    let totalRefunds = 0;
    let totalExchanged = 0;
    let netPayout = 0;
    let returnsCount = 0;
    let exchangeCount = 0;

    filteredReturns.forEach(r => {
      totalRefunds += r.refundAmount;
      totalExchanged += r.exchangeAmount;
      netPayout += r.netRefund;
      if ((r.items?.length || 0) > 0) returnsCount += 1;
      if (r.exchangeItems && r.exchangeItems.length > 0) exchangeCount += 1;
    });

    // Reason frequency
    const reasonsMap: Record<string, number> = {};
    filteredReturns.forEach(r => {
      r.items.forEach(item => {
        const reason = item.reason || 'Not specified';
        reasonsMap[reason] = (reasonsMap[reason] || 0) + item.quantity;
      });
    });

    const topReason = Object.entries(reasonsMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return {
      totalRefunds,
      totalExchanged,
      netPayout,
      count: filteredReturns.length,
      returnsCount,
      exchangeCount,
      topReason
    };
  }, [filteredReturns]);

  // Re-print Receipt
  const handlePrintReceipt = (record: ReturnRecord) => {
    generatePDFReturnReceipt({
      returnRecord: record,
      shopInfo: {
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email
      }
    });
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Return ID', 'Original Invoice', 'Date', 'Customer', 'Refund Amount', 'Exchange Amount', 'Net Refund Payout', 'Method', 'Notes'];
    const rows = filteredReturns.map(r => [
      r.id,
      `#${r.originalSaleId}`,
      format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
      r.customerName,
      r.refundAmount.toFixed(2),
      r.exchangeAmount.toFixed(2),
      r.netRefund.toFixed(2),
      r.paymentMethod.toUpperCase(),
      r.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `returns_exchanges_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Standardized Page Header */}
      <PageHeader
        title={isUrdu ? 'واپسی اور تبادلہ سینٹر' : 'Returns & Exchanges Registry'}
        subtitle={isUrdu 
          ? 'صارفین کی سیلز واپسی، متبادل اشیاء، اسٹاک بحالی اور ری فنڈز کے آڈٹ کی تفصیلی رپورٹ' 
          : 'Audit returns, manage store exchanges, inspect restocking logs, and analyze refund ratios'}
        icon={Undo2}
        breadcrumbs={[
          { label: isUrdu ? 'ہوم' : 'Home', onClick: () => window.location.hash = '#/' },
          { label: isUrdu ? 'واپسی اور تبادلہ' : 'Returns & Exchanges' }
        ]}
        actions={[
          {
            label: isUrdu ? 'سیلز پیج پر جائیں' : 'Go to Sales',
            onClick: () => navigate('/sales'),
            icon: ArrowRight,
            variant: 'primary'
          },
          {
            label: isUrdu ? 'CSV ڈاؤن لوڈ کریں' : 'Export CSV',
            onClick: handleExportCSV,
            icon: Download,
            variant: 'secondary'
          }
        ]}
      />

      {/* Info notice bar */}
      <div className="bg-blue-50/50 border border-blue-205/50 border-blue-200/50 rounded-2xl p-4 dark:bg-blue-955/20 dark:bg-blue-950/20 dark:border-blue-900/60 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-755 dark:text-blue-300 space-y-1.5">
          <p className="font-extrabold text-blue-900 dark:text-blue-200">
            {isUrdu ? 'توجہ فرمائیں: واپسی اور تبادلہ کا نیا طریقہ کار' : 'Notice: Integrated POS Returns Workflow'}
          </p>
          <p className="leading-relaxed">
            {isUrdu 
              ? 'واپسی اور تبادلہ کا عمل اب لازمی طور پر مکمل سیلز انوائس سے شروع ہوتا ہے۔ براہ کرم سیلز ہسٹری ٹیب میں جا کر متعلقہ بل پر "واپسی / تبادلہ" بٹن دبائیں۔ یہ پیج اب صرف رپورٹنگ اور آڈٹ کے لیے ہے۔' 
              : 'To comply with retail POS audit requirements, returns must always originate from an existing invoice. Please locate the invoice under the Sales Management page and select the Return/Exchange action.'
            }
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-gray-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === 'dashboard'
                ? 'text-rose-600 dark:text-rose-500 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>{isUrdu ? 'خلاصہ تجزیہ' : 'Returns Analytics'}</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === 'history'
                ? 'text-rose-600 dark:text-rose-500 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>{isUrdu ? 'ٹرانزیکشن ہسٹری' : 'Return Logs & Swaps'}</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('refund_ledger')}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === 'refund_ledger'
                ? 'text-rose-600 dark:text-rose-500 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-355'
            }`}
          >
            <span className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>{isUrdu ? 'ادائیگی لیجر' : 'Refund Ledger (Pending/Completed)'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-900 dark:text-white">
            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'کل واپسی تعداد' : 'Total Returns Count'}</span>
              <h4 className="text-xl font-black mt-1">{stats.returnsCount}</h4>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'کل تبادلہ تعداد' : 'Total Exchanges Count'}</span>
              <h4 className="text-xl font-black mt-1">{stats.exchangeCount}</h4>
            </div>

            <div className="bg-white dark:bg-gray-805 dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'کل ری فنڈ رقم' : 'Gross Refunds'}</span>
              <h4 className="text-xl font-black mt-1 text-rose-650">Rs. {stats.totalRefunds.toLocaleString()}</h4>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'خالص پے آؤٹ ری فنڈ' : 'Net Refund Payout'}</span>
              <h4 className="text-xl font-black mt-1 text-rose-650">Rs. {stats.netPayout.toLocaleString()}</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Return Reasons Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2 border-slate-50 dark:border-gray-750">
                {isUrdu ? 'واپسی کی بنیادی وجوہات' : 'Primary Return Reasons'}
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isUrdu ? 'سب سے اہم وجہ' : 'Most Frequent Reason'}</span>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1 text-sm">{stats.topReason}</p>
                </div>
                
                <div className="border-t border-slate-100 dark:border-gray-750 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isUrdu ? 'کل واپسی ٹرانزیکشنز' : 'Cumulative Registry Returns'}</span>
                  <p className="font-extrabold text-slate-800 dark:text-white mt-1 text-sm">{stats.count} transactions logged</p>
                </div>
              </div>
            </div>

            {/* Quick Actions / Restocking Notice */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 border-b pb-2 border-slate-50 dark:border-gray-750">
                {isUrdu ? 'اسٹاک بحالی آڈٹ معلومات' : 'Restocking & Inventory Policies'}
              </h3>
              <ul className="text-xs space-y-2.5 font-semibold text-slate-550 dark:text-slate-400 leading-relaxed">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Resellable returned items automatically increment product stock levels.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Damaged, expired, or defective products are logged but isolated from stock updates.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Exchange replacement items instantly decrement product stock counts.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: History Log */}
      {(activeTab === 'history' || activeTab === 'refund_ledger') && (
        <div className="space-y-4">
          
          {/* Filters Deck */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 space-y-4 shadow-sm text-xs font-semibold text-slate-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Search Query</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search ID, customer, invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-2">Payout Method</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card / Bank</option>
                  <option value="credit">Store Credit</option>
                </select>
              </div>
            </div>
            
            {activeTab === 'refund_ledger' && (
              <div className="border-t border-slate-100 dark:border-gray-750 pt-3.5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Refund Status Filter</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRefundStatusFilter('All')} 
                    className={`px-3 py-1 rounded-lg border transition-all ${refundStatusFilter === 'All' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-955/20' : 'bg-white border-slate-200 dark:bg-gray-800 dark:border-gray-700'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setRefundStatusFilter('completed')} 
                    className={`px-3 py-1 rounded-lg border transition-all ${refundStatusFilter === 'completed' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-955/20' : 'bg-white border-slate-200 dark:bg-gray-800'}`}
                  >
                    Completed (Cash/Card Payouts)
                  </button>
                  <button 
                    onClick={() => setRefundStatusFilter('pending')} 
                    className={`px-3 py-1 rounded-lg border transition-all ${refundStatusFilter === 'pending' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-955/20' : 'bg-white border-slate-200 dark:bg-gray-800'}`}
                  >
                    Pending Adjustment (Ledger Credits)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table list */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">Return ID</th>
                    <th className="px-6 py-4">Original Invoice</th>
                    <th className="px-6 py-4">Date Logged</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-center">Items count</th>
                    <th className="px-6 py-4 text-right">Refund Amount</th>
                    <th className="px-6 py-4 text-right">Exchange Amount</th>
                    {activeTab === 'refund_ledger' && <th className="px-6 py-4 text-center">Status</th>}
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'refund_ledger' ? 9 : 8} className="px-6 py-12 text-center text-slate-400 italic">
                        No return records logged matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map(rec => {
                      const status = rec.paymentMethod === 'credit' ? 'pending' : 'completed';
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-gray-750/30 transition-colors">
                          <td className="px-6 py-4 text-rose-600 font-bold">{rec.id}</td>
                          <td className="px-6 py-4">#{rec.originalSaleId}</td>
                          <td className="px-6 py-4 text-slate-505">{format(new Date(rec.createdAt), 'yyyy-MM-dd HH:mm')}</td>
                          <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{rec.customerName || 'Walk-In'}</td>
                          <td className="px-6 py-4 text-center">{(rec.items?.length || 0) + (rec.exchangeItems?.length || 0)}</td>
                          <td className="px-6 py-4 text-right text-rose-605 font-bold">Rs. {rec.refundAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">Rs. {rec.exchangeAmount.toFixed(2)}</td>
                          {activeTab === 'refund_ledger' && (
                            <td className="px-6 py-4 text-center">
                              {status === 'completed' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400">
                                  Payout Cleared
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-955/20 dark:text-amber-400">
                                  Ledger Credit
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedReturn(rec)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-750 rounded transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handlePrintReceipt(rec)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-750 rounded transition-colors"
                                title="Print Receipt"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Return details view Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative border border-slate-200 dark:border-gray-700">
            <button 
              onClick={() => setSelectedReturn(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-gray-750 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-1.5 border-b pb-3 border-slate-100 dark:border-gray-700">
              <Receipt className="h-4.5 w-4.5 text-rose-500" />
              <span>Return Registry Details - {selectedReturn.id}</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-5 text-xs text-slate-800 dark:text-slate-200 select-none">
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40 dark:border-gray-750">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Original Invoice Reference</span>
                <p className="font-extrabold text-sm mt-0.5">#{selectedReturn.originalSaleId}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40 dark:border-gray-750">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Customer Name</span>
                <p className="font-extrabold text-sm mt-0.5">{selectedReturn.customerName || 'Walk-In'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40 dark:border-gray-750">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Transaction Date</span>
                <p className="font-extrabold text-sm mt-0.5">{format(new Date(selectedReturn.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40 dark:border-gray-750">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Refund Method</span>
                <p className="font-extrabold text-sm mt-0.5 capitalize">{selectedReturn.paymentMethod}</p>
              </div>
            </div>

            {/* Returned Items list */}
            <div className="space-y-2.5 mb-5">
              <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{isUrdu ? 'واپس شدہ آئٹمز' : 'Returned Products'}</h4>
              {selectedReturn.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-rose-50/10 border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/30 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex justify-between">
                  <div>
                    <p>{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Rs. {item.price.toFixed(2)} × {item.quantity} units</p>
                  </div>
                  <div className="text-right">
                    <p>Rs. {(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-[10px] text-rose-500 font-medium mt-0.5">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Exchange Replacements list */}
            {selectedReturn.exchangeItems && selectedReturn.exchangeItems.length > 0 && (
              <div className="space-y-2.5 mb-5">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{isUrdu ? 'تبادلہ شدہ آئٹمز' : 'Exchanged Replacement Products'}</h4>
                {selectedReturn.exchangeItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50/10 border border-indigo-150/50 dark:bg-indigo-950/10 dark:border-indigo-900/30 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex justify-between">
                    <div>
                      <p>{item.productName}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Rs. {item.price.toFixed(2)} × {item.quantity} units</p>
                    </div>
                    <p className="font-extrabold text-slate-900 dark:text-white">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {selectedReturn.notes && (
              <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-gray-800 text-xs text-slate-500">
                <span className="font-bold block mb-1">Return Notes:</span>
                {selectedReturn.notes}
              </div>
            )}

            {/* Math audit */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/50 dark:border-gray-700 text-xs font-bold text-slate-500 space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Total Return Value:</span>
                <span>Rs. {selectedReturn.refundAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Exchange Value:</span>
                <span>Rs. {selectedReturn.exchangeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-slate-200/60 dark:border-gray-600 pt-2.5 text-slate-900 dark:text-white">
                <span>Net Refund Paid:</span>
                <span className={selectedReturn.netRefund >= 0 ? 'text-green-600' : 'text-amber-500'}>
                  Rs. {Math.abs(selectedReturn.netRefund).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handlePrintReceipt(selectedReturn)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Re-print Receipt</span>
              </button>

              <button
                onClick={() => setSelectedReturn(null)}
                className="w-24 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-655 text-slate-700 dark:text-gray-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReturnsExchanges;
