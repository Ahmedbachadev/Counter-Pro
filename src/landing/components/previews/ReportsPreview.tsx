import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, Calendar, ChevronDown, BarChart3, PieChart } from 'lucide-react';

const ReportsPreview: React.FC = () => {
  const kpis = [
    { title: 'Total Revenue', value: 'Rs. 4.2M', change: '+12.5%', isUp: true, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Sales', value: '1,248', change: '+8.2%', isUp: true, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Avg. Order', value: 'Rs. 3,365', change: '-2.4%', isUp: false, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const bestSellers = [
    { name: 'Wireless Headphones', sales: 342, revenue: 'Rs. 1.02M', progress: 'w-full' },
    { name: 'Smart Watch Series 5', sales: 215, revenue: 'Rs. 967K', progress: 'w-4/5' },
    { name: '10000mAh Power Bank', sales: 489, revenue: 'Rs. 733K', progress: 'w-3/4' },
    { name: 'Bluetooth Speaker', sales: 156, revenue: 'Rs. 311K', progress: 'w-1/3' },
  ];

  return (
    <div className="absolute inset-0 p-6 flex flex-col gap-4 h-full overflow-hidden">
      {/* Top Bar & Filters */}
      <div className="flex justify-between items-center">
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button className="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-800">Weekly</button>
          <button className="px-3 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-800">Monthly</button>
          <button className="px-3 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-800">Yearly</button>
        </div>
        <button className="h-8 px-3 bg-white border border-slate-200 rounded-lg flex items-center text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
          <Calendar size={12} className="mr-2 text-slate-400" />
          Oct 1 - Oct 7 <ChevronDown size={12} className="ml-2" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative overflow-hidden group hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {kpi.isUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-medium mb-1">{kpi.title}</div>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Main Chart Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Revenue Overview</h3>
              <p className="text-xs text-slate-400">Daily revenue for the last 7 days</p>
            </div>
            <div className="flex space-x-2">
              <button className="p-1.5 rounded-md bg-slate-100 text-slate-600"><BarChart3 size={14} /></button>
              <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-50"><PieChart size={14} /></button>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between space-x-2 pb-6 relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between z-0 pb-6 pointer-events-none">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="w-full border-t border-dashed border-slate-100 h-0"></div>
               ))}
            </div>
            
            {/* Bars */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [40, 65, 45, 80, 55, 95, 75];
              const h = heights[i];
              return (
                <div key={i} className="w-full flex flex-col items-center group/bar cursor-pointer z-10 h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 absolute transform -translate-y-full whitespace-nowrap pointer-events-none">
                    Rs. {(h * 1234).toLocaleString()}
                  </div>
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-md relative overflow-hidden group-hover/bar:bg-emerald-50 transition-colors flex items-end" style={{ height: '100%' }}>
                    <div className="w-full bg-emerald-400 rounded-t-md transition-all duration-1000 group-hover/bar:bg-emerald-500" style={{ height: `${h}%` }}></div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-2">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="w-72 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-sm font-bold text-slate-800">Top Products</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
             {bestSellers.map((item, i) => (
               <div key={i}>
                 <div className="flex justify-between items-end mb-1">
                   <div className="text-xs font-bold text-slate-700 truncate pr-2">{item.name}</div>
                   <div className="text-xs font-bold text-emerald-600">{item.revenue}</div>
                 </div>
                 <div className="flex justify-between items-center mb-1.5">
                   <div className="text-[10px] text-slate-400">{item.sales} sales</div>
                 </div>
                 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full bg-emerald-400 rounded-full ${item.progress}`}></div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPreview;
