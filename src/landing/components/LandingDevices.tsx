import React from 'react';
import { 
  RefreshCw, 
  Cloud, 
  WifiOff, 
  ShieldCheck, 
  Zap, 
  ArrowUpCircle,
  BarChart3,
  Package,
  CreditCard,
  Bell,
  TrendingUp,
  Search,
  ShoppingCart
} from 'lucide-react';

const LandingDevices: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 overflow-hidden" aria-label="Cross-Platform Support">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="lp-container-wide">
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Your Business.<br/>Available Everywhere.</h2>
          <p className="lp-body-lg text-slate-500">
            Manage your business from the counter, your office, or on the go. Counter Pro keeps everything synchronized across your devices.
          </p>
        </div>

        {/* Central Device Composition */}
        <div className="relative h-[600px] sm:h-[700px] md:h-[800px] lg:h-[700px] w-full max-w-6xl mx-auto mb-32 lp-animate-fade-up lp-delay-200">
          
          {/* Glowing Sync Lines (Background) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <div className="w-[80%] h-[40%] border border-blue-500/20 rounded-[100px] relative">
                <div className="absolute top-0 left-1/4 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.8)] -translate-y-1.5 animate-[lp-shimmer_3s_linear_infinite]"></div>
                <div className="absolute bottom-0 right-1/4 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(129,140,248,0.8)] translate-y-1.5 animate-[lp-shimmer_4s_linear_infinite_reverse]"></div>
             </div>
          </div>

          {/* Desktop Frame (Center Back) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] h-[400px] md:h-[500px] bg-slate-900 rounded-t-3xl rounded-b-lg border-[8px] border-slate-800 shadow-2xl z-10 flex flex-col overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
             <div className="h-6 w-full bg-slate-800 flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
             </div>
             <div className="flex-1 bg-slate-50 flex flex-col">
                {/* Desktop Mockup: Analytics */}
                <div className="h-12 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
                   <div className="w-32 h-3 bg-slate-200 rounded-full"></div>
                   <div className="flex space-x-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                      <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                   </div>
                </div>
                <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                   <div className="col-span-2 flex flex-col gap-6">
                      <div className="flex gap-4">
                         {[...Array(3)].map((_, i) => (
                           <div key={i} className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-4"><BarChart3 size={14} className="text-emerald-600"/></div>
                              <div className="w-24 h-4 bg-slate-800 rounded-full mb-2"></div>
                              <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                           </div>
                         ))}
                      </div>
                      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
                         <div className="w-32 h-3 bg-slate-800 rounded-full mb-6"></div>
                         <div className="flex-1 flex items-end justify-between space-x-2">
                           {[...Array(15)].map((_, i) => (
                             <div key={i} className="w-full bg-emerald-400 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                           ))}
                         </div>
                      </div>
                   </div>
                   <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <div className="w-24 h-3 bg-slate-800 rounded-full mb-6"></div>
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                            <div>
                              <div className="w-20 h-2.5 bg-slate-700 rounded-full mb-1.5"></div>
                              <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
             {/* Desktop Stand */}
             <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-16 bg-slate-300" style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)' }}></div>
             <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-4 bg-slate-400 rounded-full"></div>
          </div>

          {/* Laptop Frame (Left) */}
          <div className="absolute top-32 lg:top-48 left-0 lg:left-[5%] w-[75%] md:w-[50%] lg:w-[45%] h-[280px] md:h-[350px] bg-slate-200 rounded-xl border-[4px] border-slate-300 shadow-2xl z-20 flex flex-col overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
             <div className="h-4 w-full bg-slate-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-500"></div>
             </div>
             <div className="flex-1 bg-slate-50 flex flex-col relative">
                {/* Laptop Mockup: Inventory */}
                <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4">
                   <div className="h-6 w-48 bg-slate-100 rounded-md flex items-center px-2">
                     <Search size={10} className="text-slate-400 mr-2" />
                     <div className="w-20 h-1.5 bg-slate-300 rounded-full"></div>
                   </div>
                </div>
                <div className="flex-1 p-4">
                   <div className="flex justify-between items-center mb-4">
                     <div className="w-32 h-3 bg-slate-800 rounded-full"></div>
                     <div className="w-20 h-6 bg-indigo-600 rounded-md"></div>
                   </div>
                   <div className="space-y-2">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                         <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center"><Package size={12} className="text-indigo-400"/></div>
                           <div>
                             <div className="w-24 h-2 bg-slate-700 rounded-full mb-1.5"></div>
                             <div className="w-16 h-1.5 bg-slate-300 rounded-full"></div>
                           </div>
                         </div>
                         <div className="w-12 h-2 bg-slate-200 rounded-full"></div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
             {/* Laptop Base */}
             <div className="h-3 w-full bg-slate-400 rounded-b-xl relative z-30">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-slate-300 rounded-b-md"></div>
             </div>
          </div>

          {/* Tablet Frame (Right) */}
          <div className="absolute top-48 lg:top-32 right-0 lg:right-[10%] w-[60%] md:w-[40%] lg:w-[35%] h-[320px] md:h-[450px] bg-slate-900 rounded-[2rem] border-[10px] border-slate-800 shadow-2xl z-30 flex flex-col overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
             <div className="flex-1 bg-slate-50 flex">
                {/* Tablet Mockup: Sales Dashboard */}
                <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-6">
                   <div className="w-8 h-8 rounded-full bg-blue-600"></div>
                   <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><CreditCard size={14} className="text-blue-600"/></div>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center"><Package size={14} className="text-slate-400"/></div>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center"><BarChart3 size={14} className="text-slate-400"/></div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <div className="w-24 h-3 bg-slate-800 rounded-full"></div>
                     <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center"><ShoppingCart size={12} className="text-slate-600"/></div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-4">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center items-center h-20">
                         <div className="w-8 h-8 rounded bg-slate-50 mb-2"></div>
                         <div className="w-16 h-1.5 bg-slate-300 rounded-full mb-1"></div>
                         <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                       </div>
                     ))}
                   </div>
                   <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                      <div className="w-20 h-2 bg-slate-800 rounded-full mb-4"></div>
                      <div className="space-y-3">
                         {[...Array(3)].map((_, i) => (
                           <div key={i} className="flex justify-between items-center">
                             <div className="flex items-center space-x-2">
                               <div className="w-6 h-6 rounded bg-slate-100"></div>
                               <div className="w-16 h-1.5 bg-slate-600 rounded-full"></div>
                             </div>
                             <div className="w-10 h-1.5 bg-slate-300 rounded-full"></div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Mobile Phone Frame (Center Front) */}
          <div className="absolute bottom-0 md:-bottom-10 left-1/2 -translate-x-1/2 w-[180px] md:w-[220px] h-[380px] md:h-[460px] bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] border-[8px] md:border-[12px] border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 flex flex-col overflow-hidden transform hover:-translate-y-4 transition-transform duration-500">
             {/* Phone Notch */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 md:h-6 bg-slate-800 rounded-b-xl z-50"></div>
             
             <div className="flex-1 bg-slate-50 flex flex-col pt-8 pb-4 px-4 relative overflow-hidden">
                {/* Mobile Mockup: Today's Sales & Actions */}
                <div className="flex justify-between items-center mb-6">
                   <div>
                     <div className="w-16 h-2 bg-slate-400 rounded-full mb-1.5"></div>
                     <div className="w-24 h-3 bg-slate-800 rounded-full"></div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                     <Bell size={12} className="text-slate-600" />
                   </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white mb-4 shadow-lg shadow-blue-500/30">
                   <div className="text-[10px] text-blue-100 mb-1">Today's Revenue</div>
                   <div className="text-xl font-bold mb-3">Rs. 45,250</div>
                   <div className="flex items-center space-x-1 text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full">
                     <TrendingUp size={10} />
                     <span>+12.5%</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2"><CreditCard size={14} className="text-blue-600"/></div>
                     <div className="w-16 h-1.5 bg-slate-600 rounded-full"></div>
                   </div>
                   <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                     <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2"><Package size={14} className="text-emerald-600"/></div>
                     <div className="w-16 h-1.5 bg-slate-600 rounded-full"></div>
                   </div>
                </div>

                <div className="flex-1 bg-white rounded-t-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border border-slate-100 -mx-4 -mb-4 p-4">
                   <div className="w-24 h-2 bg-slate-800 rounded-full mb-4"></div>
                   <div className="space-y-3">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="flex justify-between items-center">
                         <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                           <div>
                             <div className="w-16 h-1.5 bg-slate-700 rounded-full mb-1"></div>
                             <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
                           </div>
                         </div>
                         <div className="w-12 h-1.5 bg-slate-800 rounded-full"></div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
             {/* Home Indicator */}
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-300 rounded-full z-50"></div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 lp-animate-fade-up lp-delay-400">
           
           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <RefreshCw size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Real-time Sync</h4>
             <p className="text-xs text-slate-500">Instant updates across all your devices.</p>
           </article>

           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <Cloud size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Cloud Backup</h4>
             <p className="text-xs text-slate-500">Your data is safely secured in the cloud.</p>
           </article>

           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <WifiOff size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Offline Support</h4>
             <p className="text-xs text-slate-500">Keep selling even without internet.</p>
           </article>

           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <ShieldCheck size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Secure Access</h4>
             <p className="text-xs text-slate-500">Enterprise-grade security and roles.</p>
           </article>

           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <Zap size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Fast Performance</h4>
             <p className="text-xs text-slate-500">Blazing fast load times and workflows.</p>
           </article>

           <article className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <ArrowUpCircle size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Auto Updates</h4>
             <p className="text-xs text-slate-500">Always be on the latest version.</p>
           </article>

        </div>
      </div>
    </section>
  );
};

export default LandingDevices;
