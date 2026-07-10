import React from 'react';
import { 
  CreditCard, 
  Receipt, 
  Package, 
  BarChart3, 
  Building2, 
  Users, 
  UserCircle, 
  WifiOff, 
  CloudRain, 
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  Cloud
} from 'lucide-react';

const LandingFeatures: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 overflow-hidden">
      {/* Background Glows for the section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="lp-container-wide">
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Everything You Need to Run Your Business</h2>
          <p className="lp-body-lg text-slate-500">
            Counter Pro combines billing, inventory, reporting, customer management, analytics, and multi-workspace support into one beautifully designed platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-[300px]">
          
          {/* Smart Billing (Large) */}
          <article className="col-span-1 md:col-span-2 xl:col-span-2 row-span-2 lp-glass rounded-[2rem] p-8 relative group overflow-hidden flex flex-col justify-between lp-hover-lift">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-600">
                <Receipt size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Retail Billing</h3>
              <p className="text-slate-500 max-w-sm">Fast POS checkout experience with receipt previews, discounts, taxes, and multiple offline-ready payment methods.</p>
            </div>
            
            <div className="relative z-10 mt-8 w-full flex-1 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 shadow-sm p-4 overflow-hidden group-hover:shadow-md transition-shadow">
              {/* Fake UI */}
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-3 mb-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="text-xs font-medium text-slate-400">Checkout</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                    <div>
                      <div className="w-24 h-2.5 bg-slate-200 rounded-full mb-1.5"></div>
                      <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-12 h-3 bg-slate-200 rounded-full"></div>
                </div>
                <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                    <div>
                      <div className="w-20 h-2.5 bg-slate-200 rounded-full mb-1.5"></div>
                      <div className="w-12 h-2 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-10 h-3 bg-slate-200 rounded-full"></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white shadow-lg border border-slate-100 rounded-xl p-4 transform translate-y-2 group-hover:-translate-y-0 opacity-90 group-hover:opacity-100 transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="font-bold text-slate-800">Rs. 4,500</span>
                </div>
                <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center space-x-2 group/btn relative overflow-hidden">
                  <span>Process Payment</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 rounded-lg"></div>
                </button>
              </div>
            </div>
          </article>

          {/* Inventory Management (Wide/Medium) */}
          <article className="col-span-1 md:col-span-2 xl:col-span-2 row-span-1 lp-glass rounded-[2rem] p-8 relative group overflow-hidden lp-hover-lift flex flex-col md:flex-row gap-6">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-600">
                <Package size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Inventory Tracking</h3>
              <p className="text-sm text-slate-500 mb-4">Powerful inventory management software with real-time stock indicators, low stock alerts, and quick search capabilities across categories.</p>
            </div>
            <div className="relative z-10 flex-1 bg-slate-50/80 rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-center overflow-hidden">
               <div className="flex items-center space-x-2 mb-4 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <Search size={14} className="text-slate-300" />
                 <div className="w-24 h-2 bg-slate-100 rounded-full"></div>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-indigo-100"></div>
                      <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">In Stock</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-rose-100"></div>
                      <div className="w-20 h-2 bg-slate-200 rounded-full"></div>
                    </div>
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">Low Stock</span>
                 </div>
               </div>
            </div>
          </article>

          {/* Analytics (Wide/Medium) */}
          <article className="col-span-1 md:col-span-2 xl:col-span-2 row-span-1 lp-glass rounded-[2rem] p-8 relative group overflow-hidden lp-hover-lift flex flex-col md:flex-row-reverse gap-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Business Analytics Dashboard</h3>
              <p className="text-sm text-slate-500">Elegant charts tracking revenue trends, daily retail sales, and best-selling products.</p>
            </div>
            <div className="relative z-10 flex-1 bg-slate-50/80 rounded-xl border border-slate-100 p-4 shadow-sm flex items-end space-x-2 h-32">
               <div className="w-1/5 bg-slate-200 rounded-t-sm h-1/3 group-hover:h-2/5 transition-all duration-500 delay-75"></div>
               <div className="w-1/5 bg-slate-200 rounded-t-sm h-2/5 group-hover:h-3/5 transition-all duration-500 delay-100"></div>
               <div className="w-1/5 bg-slate-300 rounded-t-sm h-1/2 group-hover:h-4/5 transition-all duration-500 delay-150"></div>
               <div className="w-1/5 bg-emerald-400 rounded-t-sm h-3/5 group-hover:h-full transition-all duration-500 delay-200 relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity delay-300">+24%</div>
               </div>
               <div className="w-1/5 bg-emerald-500 rounded-t-sm h-4/5 group-hover:h-[90%] transition-all duration-500 delay-300"></div>
            </div>
          </article>

          {/* Multi Workspace (Tall) */}
          <article className="col-span-1 xl:col-span-1 row-span-2 lp-glass rounded-[2rem] p-8 relative group overflow-hidden lp-hover-lift flex flex-col">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600">
                  <Building2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Branch POS</h3>
                <p className="text-sm text-slate-500 mb-6">Manage multiple businesses and retail store locations from a single software account.</p>
             </div>
             <div className="relative z-10 flex-1 flex flex-col gap-3 mt-auto">
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex items-center space-x-3 cursor-pointer hover:border-amber-200 transition-colors">
                   <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">M</div>
                   <div>
                     <div className="text-xs font-bold text-slate-800">Main Branch</div>
                     <div className="text-[10px] text-slate-400">Active Workspace</div>
                   </div>
                   <CheckCircle2 size={14} className="text-amber-500 ml-auto" />
                </div>
                <div className="bg-white/50 border border-slate-100 p-3 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-white transition-colors group/ws">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">D</div>
                   <div>
                     <div className="text-xs font-bold text-slate-600 group-hover/ws:text-slate-800 transition-colors">Downtown Store</div>
                   </div>
                </div>
                <div className="bg-white/50 border border-slate-100 p-3 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-white transition-colors group/ws">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">W</div>
                   <div>
                     <div className="text-xs font-bold text-slate-600 group-hover/ws:text-slate-800 transition-colors">Warehouse</div>
                   </div>
                </div>
             </div>
          </article>

          {/* Customers (Medium) */}
          <article className="col-span-1 md:col-span-2 xl:col-span-2 row-span-1 lp-glass rounded-[2rem] p-8 relative group overflow-hidden lp-hover-lift flex flex-col md:flex-row gap-6">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 text-pink-600">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Customer Management</h3>
              <p className="text-sm text-slate-500">Track purchase history, loyalty points, and outstanding balances with ease.</p>
            </div>
            <div className="relative z-10 flex-1 bg-slate-50/80 rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-center space-y-3">
               <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm border border-slate-50">
                 <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">JD</div>
                 <div className="flex-1">
                   <div className="text-xs font-bold text-slate-700">John Doe</div>
                   <div className="text-[10px] text-slate-400">12 Purchases</div>
                 </div>
                 <div className="text-xs font-bold text-pink-600">450 pts</div>
               </div>
               <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm border border-slate-50 opacity-70">
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">AS</div>
                 <div className="flex-1">
                   <div className="w-16 h-2 bg-slate-200 rounded-full mb-1"></div>
                   <div className="w-10 h-1.5 bg-slate-100 rounded-full"></div>
                 </div>
               </div>
            </div>
          </article>

          {/* Offline Ready (Small) */}
          <article className="col-span-1 xl:col-span-1 row-span-1 lp-glass rounded-[2rem] p-6 relative group overflow-hidden lp-hover-lift flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
               <WifiOff size={24} className="text-slate-600" />
               <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Offline POS Setup</h3>
            <p className="text-xs text-slate-500">Keep selling even when your internet drops.</p>
          </article>

          {/* Employee Management (Medium) */}
          <article className="col-span-1 md:col-span-2 xl:col-span-2 row-span-1 lp-glass rounded-[2rem] p-8 relative group overflow-hidden lp-hover-lift flex flex-col md:flex-row gap-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-600">
                <UserCircle size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Employee Tracking Software</h3>
              <p className="text-sm text-slate-500">Granular staff permissions, roles, attendance, and sales performance tracking.</p>
            </div>
            <div className="relative z-10 flex-1 bg-slate-50/80 rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-center">
               <div className="flex -space-x-3 overflow-hidden p-2 group-hover:space-x-1 transition-all duration-300">
                 <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shadow-sm z-30">A</div>
                 <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm z-20">M</div>
                 <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm z-10">S</div>
               </div>
            </div>
          </article>

          {/* Cloud Sync (Small) */}
          <article className="col-span-1 xl:col-span-1 row-span-1 lp-glass rounded-[2rem] p-6 relative group overflow-hidden lp-hover-lift flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-sky-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform duration-500">
               <Cloud size={24} className="text-blue-500" />
               <RefreshCw size={12} className="text-blue-600 absolute bottom-3 right-3 animate-spin duration-3000" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Cloud Sync POS</h3>
            <p className="text-xs text-slate-500">Real-time syncing across all connected devices.</p>
          </article>

        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
