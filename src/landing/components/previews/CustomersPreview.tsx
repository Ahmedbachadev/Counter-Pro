import React from 'react';
import { Search, MapPin, Phone, Mail, Award, Clock, ShoppingBag, CreditCard, ChevronRight, Star } from 'lucide-react';

const CustomersPreview: React.FC = () => {
  const customers = [
    { id: 1, name: 'Arjun Mehta', phone: '+91 98765 43210', initial: 'A', color: 'bg-pink-100 text-pink-600', active: true },
    { id: 2, name: 'Priya Sharma', phone: '+91 98765 43211', initial: 'P', color: 'bg-indigo-100 text-indigo-600', active: false },
    { id: 3, name: 'Rahul Desai', phone: '+91 98765 43212', initial: 'R', color: 'bg-emerald-100 text-emerald-600', active: false },
    { id: 4, name: 'Neha Gupta', phone: '+91 98765 43213', initial: 'N', color: 'bg-amber-100 text-amber-600', active: false },
    { id: 5, name: 'Vikram Singh', phone: '+91 98765 43214', initial: 'V', color: 'bg-blue-100 text-blue-600', active: false },
    { id: 6, name: 'Anjali Patel', phone: '+91 98765 43215', initial: 'A', color: 'bg-purple-100 text-purple-600', active: false },
  ];

  return (
    <div className="absolute inset-0 p-6 flex gap-6 h-full">
      {/* Customer List Side Panel */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-9 bg-white border border-slate-200 rounded-lg flex items-center px-3 shadow-sm">
            <Search size={14} className="text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Search customers...</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {customers.map((c) => (
            <div key={c.id} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${c.active ? 'bg-pink-50 border border-pink-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-white ${c.color}`}>
                {c.initial}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={`text-sm font-bold truncate ${c.active ? 'text-pink-900' : 'text-slate-800'}`}>{c.name}</div>
                <div className={`text-xs truncate ${c.active ? 'text-pink-600/70' : 'text-slate-500'}`}>{c.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Profile Details */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-3xl font-bold shadow-inner border-4 border-white ring-2 ring-pink-50">
                A
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Arjun Mehta</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center"><Phone size={14} className="mr-1.5 text-slate-400" /> +91 98765 43210</span>
                  <span className="flex items-center"><Mail size={14} className="mr-1.5 text-slate-400" /> arjun@example.com</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center shadow-sm">
              <Star size={12} className="mr-1 fill-amber-500 text-amber-500" /> VIP Member
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center text-slate-500 mb-1">
                <ShoppingBag size={14} className="mr-1.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Total Spent</span>
              </div>
              <div className="text-xl font-bold text-slate-800">Rs. 45,250</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
              <div className="flex items-center text-pink-600 mb-1">
                <Award size={14} className="mr-1.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Loyalty Pts</span>
              </div>
              <div className="text-xl font-bold text-pink-700">1,250</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <div className="flex items-center text-rose-600 mb-1">
                <CreditCard size={14} className="mr-1.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Due Balance</span>
              </div>
              <div className="text-xl font-bold text-rose-700">Rs. 3,500</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm font-bold text-slate-800">Recent Purchase History</span>
            <span className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">View All</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
              
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white"></div>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold text-slate-800">Order #ORD-8439</div>
                  <div className="text-sm font-bold text-blue-600">Rs. 5,069</div>
                </div>
                <div className="flex items-center text-xs text-slate-500 mb-2">
                  <Clock size={12} className="mr-1" /> Today, 2:45 PM
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                  Wireless Headphones, USB-C Cable (x2), Phone Case
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold text-slate-800">Order #ORD-7211</div>
                  <div className="text-sm font-bold text-slate-600">Rs. 12,499</div>
                </div>
                <div className="flex items-center text-xs text-slate-500 mb-2">
                  <Clock size={12} className="mr-1" /> Aug 12, 11:20 AM
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                  Smart Watch Series 5, Screen Protector
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white"></div>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold text-slate-800">Payment Pending</div>
                  <div className="text-sm font-bold text-rose-600">Rs. 3,500</div>
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <Clock size={12} className="mr-1" /> Aug 01, 10:00 AM
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPreview;
