import React from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Coffee, 
  Pill, 
  Shirt, 
  Laptop, 
  Wrench, 
  ShoppingCart, 
  Scissors, 
  PackageSearch, 
  Store 
} from 'lucide-react';

const industries = [
  { name: 'Retail Stores', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Restaurants', icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Cafés', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { name: 'Pharmacies', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Clothing Stores', icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { name: 'Electronics', icon: Laptop, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Hardware Stores', icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-500/10' },
  { name: 'Supermarkets', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-500/10' },
  { name: 'Salons', icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { name: 'Warehouses', icon: PackageSearch, color: 'text-amber-700', bg: 'bg-amber-700/10' },
  { name: 'Wholesale', icon: Store, color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

const LandingTrust: React.FC = () => {
  return (
    <section className="lp-section relative z-10 overflow-hidden">
      <div className="lp-container">
        <div className="flex flex-col items-center justify-center text-center mb-12 lp-animate-fade-up">
          <h2 className="lp-heading-md mb-4">Trusted by Businesses Across Pakistan</h2>
          <p className="lp-body max-w-2xl text-slate-500">
            Counter Pro is built for businesses of all sizes, from small neighborhood shops to growing retail chains.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto lp-animate-fade-up lp-delay-200">
          {industries.map((industry, idx) => {
            const Icon = industry.icon;
            return (
              <div 
                key={idx} 
                className="group flex items-center gap-3 px-5 py-3 lp-glass lp-radius-full hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-default"
              >
                <div className={`p-2 rounded-full ${industry.bg} transition-colors duration-300 group-hover:bg-opacity-20`}>
                  <Icon className={`w-4 h-4 ${industry.color}`} strokeWidth={2.5} />
                </div>
                <span className="font-medium text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {industry.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingTrust;
