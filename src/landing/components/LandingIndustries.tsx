import React from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Coffee, 
  Pill, 
  Shirt, 
  Laptop, 
  ShoppingCart, 
  Scissors, 
  PackageSearch, 
  Store,
  Wrench,
  Barcode,
  PieChart,
  Tag,
  Stethoscope,
  ScissorsLineDashed,
  Cpu,
  Boxes
} from 'lucide-react';

const industries = [
  {
    id: 'retail',
    name: 'Retail Stores',
    description: 'Fast barcode scanning and intelligent stock alerts keep your shelves full.',
    icon: ShoppingBag,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    borderColor: 'group-hover:border-blue-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    previewIcon: Barcode
  },
  {
    id: 'restaurant',
    name: 'Restaurants',
    description: 'Manage tables, kitchen tickets, and split bills with intuitive workflows.',
    icon: UtensilsCrossed,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    borderColor: 'group-hover:border-orange-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]',
    previewIcon: PieChart
  },
  {
    id: 'cafe',
    name: 'Cafés',
    description: 'Process hundreds of morning orders instantly with quick-tap modifiers.',
    icon: Coffee,
    color: 'text-amber-600',
    bg: 'bg-amber-600/10',
    borderColor: 'group-hover:border-amber-600/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(217,119,6,0.3)]',
    previewIcon: Store
  },
  {
    id: 'pharmacy',
    name: 'Pharmacies',
    description: 'Track expiration dates and batch numbers for total compliance.',
    icon: Pill,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    borderColor: 'group-hover:border-emerald-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
    previewIcon: Stethoscope
  },
  {
    id: 'clothing',
    name: 'Clothing Stores',
    description: 'Organize inventory by size, color, and season with variant matrices.',
    icon: Shirt,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    borderColor: 'group-hover:border-pink-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]',
    previewIcon: Tag
  },
  {
    id: 'electronics',
    name: 'Electronics Shops',
    description: 'Track serial numbers and manage warranty periods effortlessly.',
    icon: Laptop,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    borderColor: 'group-hover:border-indigo-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]',
    previewIcon: Cpu
  },
  {
    id: 'supermarket',
    name: 'Supermarkets',
    description: 'Handle massive catalogs and high-speed multi-lane checkouts.',
    icon: ShoppingCart,
    color: 'text-green-600',
    bg: 'bg-green-600/10',
    borderColor: 'group-hover:border-green-600/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(22,163,74,0.3)]',
    previewIcon: ShoppingBag
  },
  {
    id: 'salon',
    name: 'Salons & Spas',
    description: 'Manage appointments, staff commissions, and service packages.',
    icon: Scissors,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    borderColor: 'group-hover:border-rose-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]',
    previewIcon: ScissorsLineDashed
  },
  {
    id: 'warehouse',
    name: 'Warehouses',
    description: 'Streamline picking, packing, and dispatching operations.',
    icon: PackageSearch,
    color: 'text-amber-700',
    bg: 'bg-amber-700/10',
    borderColor: 'group-hover:border-amber-700/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(180,83,9,0.3)]',
    previewIcon: Boxes
  },
  {
    id: 'wholesale',
    name: 'Wholesale Businesses',
    description: 'Implement custom pricing tiers and bulk order management.',
    icon: Store,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    borderColor: 'group-hover:border-violet-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]',
    previewIcon: PackageSearch
  },
  {
    id: 'hardware',
    name: 'Hardware Stores',
    description: 'Create custom assemblies and manage thousands of small SKUs.',
    icon: Wrench,
    color: 'text-slate-600',
    bg: 'bg-slate-600/10',
    borderColor: 'group-hover:border-slate-600/30',
    glowColor: 'group-hover:shadow-[0_0_30px_-5px_rgba(71,85,105,0.3)]',
    previewIcon: Wrench
  }
];

const LandingIndustries: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 overflow-hidden bg-slate-50/50" aria-label="Supported Industries">
      <div className="absolute inset-0 landing-bg-noise"></div>
      
      <div className="lp-container-wide">
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Built for Every Type of Business</h2>
          <p className="lp-body-lg text-slate-500">
            Whether you're running a single shop or managing multiple branches, Counter Pro adapts to the way your business operates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            const PreviewIcon = industry.previewIcon;
            
            return (
              <article 
                key={industry.id} 
                className={`group lp-glass rounded-3xl p-6 border border-slate-200/60 transition-all duration-500 ease-out cursor-default relative overflow-hidden flex flex-col lp-animate-fade-up lp-hover-lift ${industry.glowColor} ${industry.borderColor}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 ${industry.bg} ${industry.color}`}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{industry.name}</h3>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">
                    {industry.description}
                  </p>
                </div>

                {/* Micro UI Preview Area */}
                <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300">
                     <PreviewIcon size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                     <div className="w-16 h-1.5 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors"></div>
                   </div>
                   <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                     <div className={`w-2 h-2 rounded-full bg-current ${industry.color}`}></div>
                   </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingIndustries;
