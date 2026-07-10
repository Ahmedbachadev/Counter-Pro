import React from 'react';
import { Search, Filter, Plus, AlertTriangle, MoreHorizontal, PackageOpen, TrendingDown, Package } from 'lucide-react';

const InventoryPreview: React.FC = () => {
  const products = [
    { id: 1, name: 'Wireless Headphones', category: 'Electronics', stock: 145, status: 'In Stock', price: 'Rs. 2,999', icon: '🎧', color: 'bg-purple-100', progress: 'w-3/4', progressColor: 'bg-emerald-500' },
    { id: 2, name: 'Smart Watch Series 5', category: 'Wearables', stock: 12, status: 'Low Stock', price: 'Rs. 4,499', icon: '⌚', color: 'bg-blue-100', progress: 'w-1/6', progressColor: 'bg-amber-500' },
    { id: 3, name: 'USB-C Fast Charger', category: 'Accessories', stock: 430, status: 'In Stock', price: 'Rs. 499', icon: '🔌', color: 'bg-slate-100', progress: 'w-full', progressColor: 'bg-emerald-500' },
    { id: 4, name: 'Bluetooth Speaker', category: 'Electronics', stock: 0, status: 'Out of Stock', price: 'Rs. 1,999', icon: '🔊', color: 'bg-orange-100', progress: 'w-0', progressColor: 'bg-rose-500' },
    { id: 5, name: '10000mAh Power Bank', category: 'Accessories', stock: 56, status: 'In Stock', price: 'Rs. 1,499', icon: '🔋', color: 'bg-emerald-100', progress: 'w-1/2', progressColor: 'bg-emerald-500' },
  ];

  return (
    <div className="absolute inset-0 p-6 flex flex-col gap-4 h-full">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center space-x-3">
           <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Package size={20} /></div>
           <div>
             <div className="text-xs text-slate-500 font-medium">Total Items</div>
             <div className="text-lg font-bold text-slate-800">1,248</div>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center space-x-3">
           <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle size={20} /></div>
           <div>
             <div className="text-xs text-slate-500 font-medium">Low Stock</div>
             <div className="text-lg font-bold text-slate-800">24</div>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center space-x-3">
           <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><PackageOpen size={20} /></div>
           <div>
             <div className="text-xs text-slate-500 font-medium">Out of Stock</div>
             <div className="text-lg font-bold text-slate-800">8</div>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center space-x-3">
           <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingDown size={20} /></div>
           <div>
             <div className="text-xs text-slate-500 font-medium">Value</div>
             <div className="text-lg font-bold text-slate-800">1.2M</div>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
         <div className="flex space-x-2">
           <div className="h-9 bg-white border border-slate-200 rounded-lg flex items-center px-3 shadow-sm w-64">
             <Search size={14} className="text-slate-400 mr-2" />
             <span className="text-sm text-slate-400">Search inventory...</span>
           </div>
           <button className="h-9 px-3 bg-white border border-slate-200 rounded-lg flex items-center text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
             <Filter size={14} className="mr-2 text-slate-400" />
             Filters
           </button>
         </div>
         <button className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center transition-colors">
           <Plus size={16} className="mr-1" /> Add Product
         </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
           <div className="col-span-4 pl-2">Product</div>
           <div className="col-span-2">Category</div>
           <div className="col-span-2">Price</div>
           <div className="col-span-3">Stock Level</div>
           <div className="col-span-1 text-right pr-2">Actions</div>
        </div>
        
        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {products.map((product) => (
            <div key={product.id} className="grid grid-cols-12 gap-4 p-2 rounded-lg hover:bg-slate-50 items-center border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
              <div className="col-span-4 flex items-center space-x-3 pl-1">
                <div className={`w-10 h-10 rounded-lg ${product.color} flex items-center justify-center text-lg shadow-sm border border-white`}>
                  {product.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{product.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">SKU: PRD-{1000 + product.id}</div>
                </div>
              </div>
              
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {product.category}
                </span>
              </div>
              
              <div className="col-span-2 text-sm font-semibold text-slate-700">
                {product.price}
              </div>
              
              <div className="col-span-3 pr-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    product.status === 'In Stock' ? 'text-emerald-600' : 
                    product.status === 'Low Stock' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {product.status}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{product.stock} <span className="text-slate-400 font-normal">units</span></span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${product.progress} ${product.progressColor} rounded-full`}></div>
                </div>
              </div>
              
              <div className="col-span-1 flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryPreview;
