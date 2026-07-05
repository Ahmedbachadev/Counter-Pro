import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Package,
  ShoppingCart,
  Plus,
  Calendar,
  BarChart3,
  Layers,
  Activity,
  Zap,
  ArrowUpRight,
  CreditCard,
  Percent,
  Wallet,
  Medal,
  UserPlus,
  Truck,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { usePOSStore } from '../stores/posStore';
import { useCustomerStore } from '../stores/customersStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useExpensesStore } from '../stores/expensesStore';
import { useSupplierStore } from '../stores/supplierStore';
import { 
  format, 
  isSameDay, 
  subDays, 
  isSameMonth,
  subMonths,
  formatDistanceToNow
} from 'date-fns';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';

type TimeFilter = 'today' | '7days' | '30days' | '12months';

interface ActivityItem {
  id: string;
  type: 'sale' | 'product_add' | 'product_update' | 'expense' | 'customer' | 'supplier';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  
  // Stores data hooks
  const { sales } = usePOSStore();
  const { customers } = useCustomerStore();
  const { products, categories, getLowStockProducts } = useInventoryStore();
  const { expenses } = useExpensesStore();
  const { suppliers } = useSupplierStore();

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('7days');
  const today = new Date();

  // ================= STATISTICS LOGIC =================
  const todaySales = useMemo(() => sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return isSameDay(saleDate, today);
  }), [sales, today]);

  const todayRevenue = useMemo(() => todaySales.reduce((total, sale) => total + sale.finalAmount, 0), [todaySales]);
  const totalRevenue = useMemo(() => sales.reduce((total, sale) => total + sale.finalAmount, 0), [sales]);

  const todayProfit = useMemo(() => todaySales.reduce((totalProfit, sale) => {
    return totalProfit + (sale.finalAmount - (sale.total * 0.7));
  }, 0), [todaySales]);

  const todayExpensesAmount = useMemo(() => expenses
    .filter(exp => isSameDay(new Date(exp.createdAt), today))
    .reduce((total, exp) => total + exp.amount, 0), [expenses, today]);

  const totalCustomersCount = customers.length;
  const lowStockProductsList = useMemo(() => getLowStockProducts(), [getLowStockProducts, products]);

  const todayCreditSalesAmount = useMemo(() => todaySales
    .filter(sale => sale.paymentMethod === 'credit')
    .reduce((total, sale) => total + sale.dueAmount, 0), [todaySales]);

  const averageSaleValue = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  // ================= INTERACTIVE CHART LOGIC =================
  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return { labels: [], datasets: [{ data: [] }] };

    if (activeFilter === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const dataPoints = hours.map(() => 0);
      
      todaySales.forEach(sale => {
        const hour = new Date(sale.createdAt).getHours();
        if (hour >= 0 && hour < 24) dataPoints[hour] += sale.finalAmount;
      });

      return {
        labels: hours.map(h => `${h}:00`),
        datasets: [{ label: 'Revenue', data: dataPoints }]
      };
    }

    if (activeFilter === '7days') {
      const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
      const dataPoints = days.map(() => 0);

      sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        days.forEach((day, index) => {
          if (isSameDay(saleDate, day)) dataPoints[index] += sale.finalAmount;
        });
      });

      return {
        labels: days.map(d => format(d, 'EEE, MMM dd')),
        datasets: [{ label: 'Revenue', data: dataPoints }]
      };
    }

    if (activeFilter === '30days') {
      const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
      const dataPoints = days.map(() => 0);

      sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        days.forEach((day, index) => {
          if (isSameDay(saleDate, day)) dataPoints[index] += sale.finalAmount;
        });
      });

      return {
        labels: days.map((d, i) => i % 5 === 0 ? format(d, 'MMM dd') : format(d, 'dd')),
        datasets: [{ label: 'Revenue', data: dataPoints }]
      };
    }

    if (activeFilter === '12months') {
      const months = Array.from({ length: 12 }, (_, i) => subMonths(today, 11 - i));
      const dataPoints = months.map(() => 0);

      sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        months.forEach((month, index) => {
          if (isSameMonth(saleDate, month)) dataPoints[index] += sale.finalAmount;
        });
      });

      return {
        labels: months.map(m => format(m, 'MMM yyyy')),
        datasets: [{ label: 'Revenue', data: dataPoints }]
      };
    }

    return { labels: [], datasets: [{ data: [] }] };
  }, [activeFilter, sales, todaySales, today]);

  const filterSummary = useMemo(() => {
    const dataPoints = chartData.datasets[0].data;
    const totalFilteredRevenue = dataPoints.reduce((sum, val) => sum + val, 0);
    const maxVal = dataPoints.length > 0 ? Math.max(...dataPoints) : 0;
    return {
      total: totalFilteredRevenue,
      max: maxVal || 1
    };
  }, [chartData]);

  // ================= TOP SELLING PRODUCTS LOGIC =================
  const topSellingProducts = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const aggregations: Record<number, { quantity: number; revenue: number }> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.product || !item.product.id) return;
        const pid = item.product.id;
        if (!aggregations[pid]) {
          aggregations[pid] = { quantity: 0, revenue: 0 };
        }
        aggregations[pid].quantity += item.quantity;
        aggregations[pid].revenue += item.subtotal;
      });
    });

    const calculatedProducts = Object.keys(aggregations).map(idStr => {
      const id = parseInt(idStr, 10);
      const storeProduct = products.find(p => p.id === id);
      const categoryName = storeProduct 
        ? categories.find(c => c.id === storeProduct.categoryId)?.name || 'General'
        : 'General';

      return {
        id,
        name: storeProduct?.name || `Product #${id}`,
        category: categoryName,
        image: storeProduct?.image,
        quantitySold: aggregations[id].quantity,
        revenueGenerated: aggregations[id].revenue,
      };
    });

    const sortedProducts = calculatedProducts.sort((a, b) => b.quantitySold - a.quantitySold);
    const topFive = sortedProducts.slice(0, 5);
    const maxQuantity = topFive.length > 0 ? topFive[0].quantitySold : 1;

    return topFive.map(item => ({
      ...item,
      percentageContribution: totalRevenue > 0 ? (item.revenueGenerated / totalRevenue) * 100 : 0,
      performanceRatio: (item.quantitySold / maxQuantity) * 100
    }));
  }, [sales, products, categories, totalRevenue]);

  // ================= SECTION 1: RECENT ACTIVITIES SCALABLE FEED =================
  const dynamicActivitiesFeed = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    // Parse completed checkout sales
    sales.forEach(sale => {
      list.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: `Sale Completed (#${sale.id})`,
        description: `Order processed with ${sale.items.length} items totaling Rs. ${sale.finalAmount.toLocaleString()}`,
        timestamp: new Date(sale.createdAt),
        icon: ShoppingCart,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40'
      });
    });

    // Parse product catalogue creations and edits
    products.forEach(prod => {
      const createdTime = prod.createdAt ? new Date(prod.createdAt) : new Date();
      const updatedTime = prod.updatedAt ? new Date(prod.updatedAt) : null;

      list.push({
        id: `prod-add-${prod.id}`,
        type: 'product_add',
        title: 'New Product Catalogued',
        description: `Product "${prod.name}" initialized at standard rate of Rs. ${prod.price.toLocaleString()}`,
        timestamp: createdTime,
        icon: Package,
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40'
      });

      if (updatedTime && updatedTime.getTime() !== createdTime.getTime()) {
        list.push({
          id: `prod-upd-${prod.id}-${updatedTime.getTime()}`,
          type: 'product_update',
          title: 'Product Stock/Metadata Sync',
          description: `Properties updated for "${prod.name}". Core stock variant now resting at ${prod.stock} units.`,
          timestamp: updatedTime,
          icon: Layers,
          colorClass: 'text-amber-600 dark:text-amber-400',
          bgClass: 'bg-amber-50 dark:bg-amber-950/40'
        });
      }
    });

    // Parse operational cash outlays
    expenses.forEach(exp => {
      list.push({
        id: `exp-${exp.id}`,
        type: 'expense',
        title: 'Operational Expense Registered',
        description: `${exp.description || 'Business outflow logging'} tracking deduction of Rs. ${exp.amount.toLocaleString()}`,
        timestamp: new Date(exp.createdAt),
        icon: CreditCard,
        colorClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40'
      });
    });

    // Parse customer registrations
    customers.forEach(cust => {
      list.push({
        id: `cust-${cust.id}`,
        type: 'customer',
        title: 'Customer Ledger Opened',
        description: `Profile verified for client account "${cust.name}" inside CRM environment.`,
        timestamp: cust.createdAt ? new Date(cust.createdAt) : new Date(),
        icon: UserPlus,
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-50 dark:bg-purple-950/40'
      });
    });

    // Parse verified supplier account entities
    suppliers.forEach(supp => {
      list.push({
        id: `supp-${supp.id}`,
        type: 'supplier',
        title: 'Supplier Account Integrated',
        description: `B2B tracking record configured for partner firm "${supp.name}".`,
        timestamp: supp.createdAt ? new Date(supp.createdAt) : new Date(),
        icon: Truck,
        colorClass: 'text-teal-600 dark:text-teal-400',
        bgClass: 'bg-teal-50 dark:bg-teal-950/40'
      });
    });

    // Sort timeline across absolute chronological descending order
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }, [sales, products, expenses, customers, suppliers]);

  // ================= SECTION 2: SORTED TOP 5 LOW STOCK MATRIX =================
  const processLowStockAlerts = useMemo(() => {
    return lowStockProductsList
      .map(prod => {
        const categoryName = categories.find(c => c.id === prod.categoryId)?.name || 'General';
        let stockStatus: 'critical' | 'low' | 'healthy' = 'healthy';

        if (prod.stock <= 0) {
          stockStatus = 'critical';
        } else if (prod.stock <= prod.minStock) {
          stockStatus = 'low';
        }

        return {
          ...prod,
          categoryName,
          stockStatus
        };
      })
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }, [lowStockProductsList, categories]);

  // Handle system level router macro redirects simulated cleanly via DOM location triggers
  const navigateToTerminalView = (path: string) => {
    window.location.hash = path;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Standardized Page Header */}
      <PageHeader
        title={t('common.dashboard')}
        subtitle="Welcome back! Here's an overview of your commercial POS system performance today."
        breadcrumbs={[
          { label: 'Home', onClick: () => window.location.hash = '#/' },
          { label: 'Dashboard' }
        ]}
        actions={[
          {
            label: 'Launch POS Terminal',
            onClick: () => navigateToTerminalView('/pos'),
            icon: Plus,
            variant: 'primary'
          }
        ]}
      >
        <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm shrink-0">
          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span>{format(today, 'MMMM dd, yyyy')}</span>
        </div>
      </PageHeader>

      {/* 2. Statistics Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Today's Sales"
          value={todaySales.length}
          icon={ShoppingCart}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
          trend={{ value: "+12%", type: "positive" }}
          comparisonText="Completed orders"
        />

        <KpiCard
          title="Today's Revenue"
          value={`Rs. ${todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
          trend={{ value: "Live", type: "neutral" }}
          comparisonText="Gross intake"
        />

        <KpiCard
          title="Today's Profit"
          value={`Rs. ${todayProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          icon={TrendingUp}
          iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
          trend={{ value: "Stable", type: "neutral" }}
          comparisonText="Net margin estimate"
        />

        <KpiCard
          title="Today's Expenses"
          value={`Rs. ${todayExpensesAmount.toLocaleString()}`}
          icon={CreditCard}
          iconColor="text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400"
          trend={{ value: "Tracked", type: "neutral" }}
          comparisonText="Payout logs"
        />

        <KpiCard
          title="Total Customers"
          value={totalCustomersCount}
          icon={Users}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400"
          trend={{ value: "Active", type: "positive" }}
          comparisonText="Registered CRM Profiles"
        />

        <KpiCard
          title="Low Stock Products"
          value={lowStockProductsList.length}
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
          trend={{
            value: lowStockProductsList.length > 0 ? "Action Required" : "Healthy",
            type: lowStockProductsList.length > 0 ? "negative" : "positive"
          }}
          comparisonText="Requires replenishment"
        />

        <KpiCard
          title="Credit Sales Today"
          value={`Rs. ${todayCreditSalesAmount.toLocaleString()}`}
          icon={Wallet}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400"
          trend={{ value: "Khata Dues", type: "neutral" }}
          comparisonText="Outstanding balance ledger"
        />

        <KpiCard
          title="Average Sale"
          value={`Rs. ${averageSaleValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          icon={Percent}
          iconColor="text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400"
          trend={{ value: "Analytics", type: "neutral" }}
          comparisonText="Value per checkout ticket"
        />
      </div>

      {/* Main Core Dashboard Layout Grid splitting Chart and Side Context Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column Span (Revenue Chart & Top Products) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. Revenue Chart Section */}
          <ContentCard
            title="Revenue Performance Timeline"
            subtitle="Filter aggregate intake logs and transaction summaries over scheduled metrics."
            actions={
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                {(['today', '7days', '30days', '12months'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activeFilter === filter
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                        : 'text-gray-505 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : filter === '12months' ? '12 Months' : filter}
                  </button>
                ))}
              </div>
            }
          >

            {/* Scale/Metrics Aggregation Value Header */}
            <div className="mb-6">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Filtered Total Revenue</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Rs. {filterSummary.total.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Calculated Log</span>
                </span>
              </div>
            </div>

            {/* Interactive Visual Bar Representation Component Chart Container */}
            {chartData.labels.length === 0 || filterSummary.total === 0 ? (
              <div className="bg-gray-50/50 dark:bg-gray-950/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl h-72 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-full shadow-sm mb-3 border border-gray-100 dark:border-gray-800">
                  <Layers className="text-gray-300 dark:text-gray-600 h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Sales Volume Recorded</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
                  There are no qualifying transaction ledgers detected within the selected window criteria.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/80 rounded-xl p-4">
                <div className="h-64 flex items-end gap-1.5 sm:gap-3 px-2 pt-4 relative">
                  
                  {/* Chart Columns Bars */}
                  {chartData.datasets[0].data.map((value, index) => {
                    const heightPercent = Math.max(8, (value / filterSummary.max) * 100);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                        
                        {/* Tooltip Hover Overlay Info */}
                        <div className="absolute top-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-all bg-gray-900 dark:bg-gray-800 text-white text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-lg shadow-xl z-10 border border-gray-700/50 transform -translate-y-2">
                          {chartData.labels[index]}: <span className="font-bold text-blue-400">Rs. {value.toLocaleString()}</span>
                        </div>

                        {/* Interactive Bar Column Canvas fill */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-600/90 dark:to-blue-500 rounded-t-md transition-all duration-500 group-hover:from-blue-500 group-hover:to-blue-300 relative"
                        >
                          {value > 0 && (
                            <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {Math.round(value/1000)}k
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Tick Labels Layout Row */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider overflow-x-hidden">
                  {chartData.labels.map((label, idx) => {
                    if (activeFilter === '30days' && idx % 4 !== 0) return null;
                    if (activeFilter === 'today' && idx % 3 !== 0) return null;
                    return (
                      <span key={idx} className="flex-1 text-center truncate px-0.5">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </ContentCard>

          {/* 4. Top Selling Products Section */}
          <ContentCard
            title="Top Performing Products Catalog"
            subtitle="Ranked by Volume"
          >
            
            {topSellingProducts.length === 0 ? (
              <div className="bg-gray-50/50 dark:bg-gray-950/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl h-56 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-full shadow-sm mb-3 border border-gray-100 dark:border-gray-800">
                  <Medal className="text-gray-300 dark:text-gray-600 h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Catalog Item Velocity Matrix</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
                  Product item matrices automatically evaluate and populate here once sales transactions are registered.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topSellingProducts.map((item, index) => {
                  const rankColors = [
                    'bg-amber-500 text-white shadow-amber-500/20',
                    'bg-slate-400 text-white shadow-slate-400/20',
                    'bg-amber-700 text-white shadow-amber-700/20',
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  ];

                  return (
                    <div 
                      key={item.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 gap-4"
                    >
                      {/* Left Block: Rank & Identity Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${rankColors[index] || rankColors[3]}`}>
                          #{index + 1}
                        </div>
                        
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="h-10 w-10 rounded-lg object-cover border border-gray-100 dark:border-gray-800 bg-gray-50"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">
                            {item.name.slice(0, 2)}
                          </div>
                        )}

                        <div className="truncate flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </h4>
                          <span className="inline-block text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Right Block: Data Matrix Progress Fields */}
                      <div className="flex items-center gap-6 sm:w-2/3 md:w-1/2 lg:w-3/5 xl:w-1/2 justify-between sm:justify-end">
                        {/* Progress Bar & Volume Sold tracking */}
                        <div className="flex-1 max-w-[160px] hidden sm:block">
                          <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                            <span>{item.quantitySold} units</span>
                            <span className="text-gray-400">{Math.round(item.performanceRatio)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${item.performanceRatio}%` }} 
                              className="h-full bg-blue-500 dark:bg-blue-600 rounded-full group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-all duration-500"
                            />
                          </div>
                        </div>

                        {/* Financial Allocation metrics */}
                        <div className="text-right min-w-[100px]">
                          <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                            Rs. {item.revenueGenerated.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {item.percentageContribution.toFixed(1)}% share
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </ContentCard>

        </div>

        {/* Right Column Span (Low Stock, Recent Activities, Quick Actions) */}
        <div className="space-y-8">
          
          {/* 5. SECTION 2: LOW STOCK ALERTS VIEW */}
          <ContentCard
            title="Inventory Supply Warnings"
            subtitle="Low stock alerts and critical supply indicators"
            actions={lowStockProductsList.length > 5 ? (
              <button 
                onClick={() => navigateToTerminalView('/inventory')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : undefined}
          >
            {processLowStockAlerts.length === 0 ? (
              <div className="bg-gray-50/50 dark:bg-gray-950/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl h-44 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm mb-2">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Inventory Levels Stable</p>
                <p className="text-xs text-gray-400 dark:text-gray-505 mt-0.5 max-w-[220px]">
                  All tracked product items match or exceed target buffer points safely.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {processLowStockAlerts.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.image ? (
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="h-9 w-9 rounded-lg object-cover bg-gray-50 border border-gray-100 dark:border-gray-800"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-505 text-xs font-bold uppercase">
                          {prod.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                          {prod.categoryName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1 pl-2">
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {prod.stock} <span className="text-[10px] font-normal text-gray-400">/ {prod.minStock}</span>
                      </span>
                      <span className={`text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md ${
                        prod.stockStatus === 'critical' 
                          ? 'bg-rose-105 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400' 
                          : 'bg-amber-105 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                      }`}>
                        {prod.stockStatus === 'critical' ? 'Out of Stock' : 'Low Variant'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>

          {/* 6. SECTION 1: LIVE RECENT ACTIVITIES TIMELINE VIEW */}
          <ContentCard
            title="Live Operations Log"
            subtitle="Real-time operational log and trace audit feed"
          >
            {dynamicActivitiesFeed.length === 0 ? (
              <div className="bg-gray-50/50 dark:bg-gray-950/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl h-48 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white dark:bg-gray-900 p-2.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm mb-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Operations Indexed</p>
                <p className="text-xs text-gray-400 dark:text-gray-505 mt-0.5 max-w-[200px]">
                  Real-time operational logs trace here upon transactional modifications.
                </p>
              </div>
            ) : (
              <div className="relative pl-4 border-l border-gray-100 dark:border-gray-800 space-y-5">
                {dynamicActivitiesFeed.map(act => {
                  const IconComp = act.icon;
                  return (
                    <div key={act.id} className="relative group flex items-start gap-3">
                      {/* Node Bullet Anchor */}
                      <div className={`absolute -left-[25px] top-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center p-0.5 shadow-sm ${act.bgClass} ${act.colorClass}`}>
                        <IconComp className="h-2 w-2" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {act.title}
                          </h4>
                          <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-505 whitespace-nowrap pt-0.5">
                            {formatDistanceToNow(act.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-505 dark:text-gray-400 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ContentCard>

          {/* 7. SECTION 3: QUICK ACTIONS INTERACTIVE MACRO SHORTCUTS */}
          <ContentCard
            title="Terminal Panel Shortcuts"
            subtitle="Quick operational actions and utility panels"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'New Sale', route: '/pos', desc: 'Open register checkout', icon: ShoppingCart, bg: 'hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10' },
                { label: 'Add Product', route: '/inventory', desc: 'Log item variants', icon: Package, bg: 'hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10' },
                { label: 'Add Customer', route: '/customers', desc: 'Register CRM khata', icon: UserPlus, bg: 'hover:border-purple-200 dark:hover:border-purple-900/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/10' },
                { label: 'Add Supplier', route: '/suppliers', desc: 'Configure B2B vendors', icon: Truck, bg: 'hover:border-teal-200 dark:hover:border-teal-900/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/10' },
                { label: 'Add Expense', route: '/expenses', desc: 'Deduct cash layout', icon: CreditCard, bg: 'hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/10' },
                { label: 'View Reports', route: '/reports', desc: 'Review audit matrices', icon: FileText, bg: 'hover:border-amber-200 dark:hover:border-amber-900/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10' },
              ].map((act, i) => {
                const ActionIcon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigateToTerminalView(act.route)}
                    className={`flex flex-col items-start p-3 text-left rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 group ${act.bg}`}
                  >
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700 rounded-lg shadow-sm mb-2 transition-colors">
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      <span>{act.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 leading-tight font-medium">
                      {act.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </ContentCard>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;