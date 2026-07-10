import React from 'react';
import { Search, ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle2, ChevronRight, ScanLine } from 'lucide-react';

const BillingPreview: React.FC = () => {
  const products = [
    { id: 1, name: 'Wireless Headphones', price: 'Rs. 2,999', icon: '🎧', color: 'bg-purple-100' },
    { id: 2, name: 'Smart Watch', price: 'Rs. 4,499', icon: '⌚', color: 'bg-blue-100' },
    { id: 3, name: 'USB-C Cable', price: 'Rs. 499', icon: '🔌', color: 'bg-slate-100' },
    { id: 4, name: 'Power Bank', price: 'Rs. 1,499', icon: '🔋', color: 'bg-emerald-100' },
    { id: 5, name: 'Phone Case', price: 'Rs. 299', icon: '📱', color: 'bg-pink-100' },
    { id: 6, name: 'Bluetooth Speaker', price: 'Rs. 1,999', icon: '🔊', color: 'bg-orange-100' },
  ];

  return (
    <div className="absolute inset-0 p-6 flex gap-6 h-full">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4">
          <Search size={16} className="text-slate-400 mr-2" />
          <span className="text-sm text-slate-400">Search products...</span>
          <div className="ml-auto flex space-x-2">
            <div className="p-1 bg-slate-100 rounded text-slate-500 hover:bg-slate-200 cursor-pointer transition-colors"><ScanLine size={14} /></div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-3 gap-3 flex-1 overflow-hidden">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col items-center text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
              <div className={`w-full h-16 ${product.color} rounded-lg mb-2 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform`}>
                {product.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate w-full">{product.name}</span>
              <span className="text-xs font-bold text-blue-600 mt-auto">{product.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-64 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={16} className="text-slate-600" />
            <span className="text-sm font-bold text-slate-800">Current Order</span>
          </div>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">3 Items</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-start group">
            <div>
              <div className="text-sm font-semibold text-slate-700">Wireless Headphones</div>
              <div className="text-xs text-slate-500">1 x Rs. 2,999</div>
            </div>
            <div className="text-sm font-bold text-slate-900">Rs. 2,999</div>
          </div>
          <div className="flex justify-between items-start group">
            <div>
              <div className="text-sm font-semibold text-slate-700">USB-C Cable</div>
              <div className="text-xs text-slate-500">2 x Rs. 499</div>
            </div>
            <div className="text-sm font-bold text-slate-900">Rs. 998</div>
          </div>
          <div className="flex justify-between items-start group">
            <div>
              <div className="text-sm font-semibold text-slate-700">Phone Case</div>
              <div className="text-xs text-slate-500">1 x Rs. 299</div>
            </div>
            <div className="text-sm font-bold text-slate-900">Rs. 299</div>
          </div>
        </div>

        {/* Payment & Checkout */}
        <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
            <span>Subtotal</span>
            <span>Rs. 4,296</span>
          </div>
          <div className="flex justify-between items-center mb-3 text-xs text-slate-500">
            <span>Tax (18%)</span>
            <span>Rs. 773</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-lg font-bold text-blue-600">Rs. 5,069</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
              <Banknote size={14} className="mb-1" />
              <span className="text-[10px] font-medium">Cash</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <CreditCard size={14} className="mb-1" />
              <span className="text-[10px] font-bold">Card</span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
              <Smartphone size={14} className="mb-1" />
              <span className="text-[10px] font-medium">UPI</span>
            </button>
          </div>

          <button className="w-full h-10 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-colors relative overflow-hidden group">
            <span className="relative z-10 flex items-center">
              Charge Rs. 5,069
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPreview;
