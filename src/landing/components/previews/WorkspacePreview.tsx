import React from 'react';
import { Building2, CheckCircle2, Cloud, ArrowRightLeft, Store, Utensils, Cross, Package, MapPin, Plus } from 'lucide-react';

const WorkspacePreview: React.FC = () => {
  const workspaces = [
    { id: 1, name: 'Mumbai Retail Hub', type: 'Retail', address: 'Bandra West, Mumbai', active: true, icon: Store, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 2, name: 'Spice Route Cafe', type: 'Restaurant', address: 'Connaught Place, Delhi', active: false, icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-transparent hover:border-slate-200' },
    { id: 3, name: 'City MedPlus', type: 'Pharmacy', address: 'Indiranagar, Bangalore', active: false, icon: Cross, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-transparent hover:border-slate-200' },
    { id: 4, name: 'Central Warehouse', type: 'Warehouse', address: 'Navi Mumbai', active: false, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-transparent hover:border-slate-200' },
  ];

  return (
    <div className="absolute inset-0 p-6 flex items-center justify-center gap-6 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100/50 via-slate-50/20 to-transparent">
      
      {/* Central Interactive Switcher */}
      <div className="w-80 bg-white rounded-3xl shadow-xl border border-slate-200/60 flex flex-col relative z-20">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Building2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Workspaces</div>
              <div className="text-[10px] text-slate-500 font-medium">Select a branch to manage</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
            <ArrowRightLeft size={14} className="text-slate-500" />
          </div>
        </div>

        {/* Workspace List */}
        <div className="p-2.5 space-y-1.5 overflow-hidden">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <div key={ws.id} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer group ${ws.active ? 'bg-slate-50 shadow-sm border-blue-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${ws.bg} ${ws.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className={`text-sm font-bold truncate ${ws.active ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>{ws.name}</div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{ws.type}</span>
                    <span className="text-[10px] text-slate-400 truncate flex items-center"><MapPin size={8} className="mr-0.5" /> {ws.address}</span>
                  </div>
                </div>
                {ws.active && (
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Add Workspace Button & Sync Status */}
        <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
          <button className="w-full py-2.5 mb-3 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm font-semibold flex items-center justify-center hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Plus size={16} className="mr-1.5" /> Add Workspace
          </button>
          
          <div className="flex items-center justify-center text-[10px] font-medium text-slate-400 space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <Cloud size={12} className="text-slate-400" />
            <span>All branches synced to cloud</span>
          </div>
        </div>
      </div>

      {/* Floating Summary Cards (Decorative) */}
      <div className="absolute right-8 top-16 w-48 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 transform rotate-2 z-10 hidden sm:block pointer-events-none">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Mumbai Retail Hub</div>
        <div className="text-2xl font-bold text-slate-800 mb-1">Rs. 1.2M</div>
        <div className="text-xs text-emerald-600 font-bold">+15% this week</div>
      </div>
      
      <div className="absolute left-8 bottom-16 w-48 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 transform -rotate-3 z-10 hidden sm:block pointer-events-none">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Central Warehouse</div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-bold text-slate-800">Stock Items</span>
          <span className="text-sm font-bold text-blue-600">8,452</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
    </div>
  );
};

export default WorkspacePreview;
