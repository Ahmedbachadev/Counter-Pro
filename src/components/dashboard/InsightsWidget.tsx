import React from 'react';
import { Lightbulb, TrendingUp } from 'lucide-react';

export const InsightsWidget: React.FC<{ sales: any[], products: any[] }> = ({ sales, products }) => {
  const lowStock = products.filter(p => p.stock <= p.minStock).length;
  
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-yellow-300 h-5 w-5" />
        <h3 className="font-bold">Business Insights</h3>
      </div>
      <div className="space-y-4">
        <p className="text-blue-100 text-sm">
          {lowStock > 0 ? `Alert: ${lowStock} items need restocking.` : "Inventory is fully stocked."}
        </p>
        <div className="flex items-center gap-2 text-sm font-medium bg-white/10 p-2 rounded-lg">
          <TrendingUp className="h-4 w-4" />
          <span>Sales are up 12% today</span>
        </div>
      </div>
    </div>
  );
};