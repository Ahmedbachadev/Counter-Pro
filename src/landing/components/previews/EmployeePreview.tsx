import React from 'react';
import { Search, Filter, Shield, Clock, TrendingUp, ChevronRight, UserCircle, Settings } from 'lucide-react';

const EmployeePreview: React.FC = () => {
  const employees = [
    { id: 1, name: 'Sarah Connor', role: 'Store Manager', status: 'Clocked In', time: '08:45 AM', sales: 'Rs. 45,200', performance: 98, initial: 'S', color: 'bg-purple-100 text-purple-700' },
    { id: 2, name: 'John Smith', role: 'Cashier', status: 'Clocked In', time: '09:00 AM', sales: 'Rs. 28,400', performance: 85, initial: 'J', color: 'bg-blue-100 text-blue-700' },
    { id: 3, name: 'Emma Davis', role: 'Sales Rep', status: 'On Break', time: '12:30 PM', sales: 'Rs. 32,100', performance: 92, initial: 'E', color: 'bg-emerald-100 text-emerald-700' },
    { id: 4, name: 'Michael Brown', role: 'Inventory', status: 'Clocked Out', time: '05:00 PM', sales: '-', performance: 88, initial: 'M', color: 'bg-orange-100 text-orange-700' },
    { id: 5, name: 'Lisa Wong', role: 'Cashier', status: 'Clocked In', time: '10:15 AM', sales: 'Rs. 15,600', performance: 78, initial: 'L', color: 'bg-pink-100 text-pink-700' },
  ];

  return (
    <div className="absolute inset-0 p-6 flex gap-6 h-full">
      {/* Employee List / Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header & Actions */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex space-x-2">
            <div className="h-9 bg-white border border-slate-200 rounded-lg flex items-center px-3 shadow-sm w-48">
              <Search size={14} className="text-slate-400 mr-2" />
              <span className="text-sm text-slate-400">Search staff...</span>
            </div>
            <button className="h-9 px-3 bg-white border border-slate-200 rounded-lg flex items-center text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
              <Filter size={14} className="mr-2 text-slate-400" />
              Filter
            </button>
          </div>
          <button className="h-9 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center transition-colors">
            <UserCircle size={16} className="mr-1.5" /> Add Staff
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
           <div className="col-span-4 pl-2">Employee</div>
           <div className="col-span-3">Role & Access</div>
           <div className="col-span-3">Status</div>
           <div className="col-span-2 text-right pr-2">Performance</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {employees.map((emp) => (
            <div key={emp.id} className="grid grid-cols-12 gap-4 p-2 rounded-xl hover:bg-slate-50 items-center border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
              <div className="col-span-4 flex items-center space-x-3 pl-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white ${emp.color}`}>
                  {emp.initial}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{emp.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center">
                    ID: EMP-{1000 + emp.id}
                  </div>
                </div>
              </div>
              
              <div className="col-span-3">
                <div className="flex items-center space-x-1.5">
                  <Shield size={12} className={emp.role === 'Store Manager' ? 'text-cyan-600' : 'text-slate-400'} />
                  <span className="text-xs font-semibold text-slate-700">{emp.role}</span>
                </div>
              </div>
              
              <div className="col-span-3">
                <div className="flex flex-col items-start justify-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                    emp.status === 'Clocked In' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    emp.status === 'On Break' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    <Clock size={10} className="mr-1" /> {emp.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium pl-1">{emp.time}</span>
                </div>
              </div>
              
              <div className="col-span-2 pr-2 flex flex-col items-end justify-center">
                <div className="text-sm font-bold text-slate-800 mb-1">{emp.performance}%</div>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${emp.performance > 90 ? 'bg-emerald-400' : emp.performance > 80 ? 'bg-blue-400' : 'bg-amber-400'}`} style={{ width: `${emp.performance}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Leaderboard & Details */}
      <div className="w-64 flex flex-col gap-4">
        {/* Sales Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <TrendingUp size={16} className="text-cyan-600" />
            <span className="text-sm font-bold text-slate-800">Today's Top Sales</span>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {employees.filter(e => e.sales !== '-').sort((a, b) => parseInt(b.sales.replace(/\D/g,'')) - parseInt(a.sales.replace(/\D/g,''))).map((emp, i) => (
              <div key={emp.id} className="flex items-center space-x-3 relative">
                <div className={`text-xs font-bold w-4 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                  #{i + 1}
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white ${emp.color}`}>
                  {emp.initial}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">{emp.name}</div>
                  <div className="text-[10px] font-medium text-slate-500">{emp.sales}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Employee Quick Action */}
        <div className="bg-cyan-50 rounded-2xl shadow-sm border border-cyan-100 p-4 relative overflow-hidden group cursor-pointer hover:bg-cyan-100 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-200/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
               <div className="text-xs text-cyan-600 font-bold mb-1 uppercase tracking-wider flex items-center"><Settings size={12} className="mr-1" /> Configuration</div>
               <div className="text-sm font-bold text-cyan-900">Manage Roles & Permissions</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center">
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePreview;
