import React from 'react';
import { 
  Store, 
  Building2, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Users,
  Cloud,
  RefreshCw,
  WifiOff,
  Zap,
  Server,
  BarChart3,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPlans: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 overflow-hidden bg-slate-50/50" aria-label="Pricing Plans">
      <div className="absolute inset-0 landing-bg-noise"></div>
      
      {/* Subtle Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="lp-container-wide">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Built to Grow With Your Business</h2>
          <p className="lp-body-lg text-slate-500">
            Whether you operate a single store or manage multiple branches, Counter Pro scales with your business while maintaining speed, reliability, and simplicity.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-32 relative z-10 max-w-7xl mx-auto items-stretch">
          
          {/* Single Store Plan */}
          <div className="lp-glass rounded-[2rem] border border-slate-200/60 p-8 flex flex-col group lp-hover-lift lp-animate-fade-up relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500">
                <Store size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Single Store</h3>
              <p className="text-sm text-slate-500 mb-6">Designed for retail shops, restaurants, cafés, and small businesses.</p>
              
              <div className="w-full h-px bg-slate-100 mb-6"></div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Smart Billing',
                  'Inventory',
                  'Customer Management',
                  'Reports',
                  'Offline Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto relative z-10">
              <a 
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 px-6 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 rounded-xl font-bold flex items-center justify-center transition-colors group/btn"
              >
                <span>Contact Us</span>
                <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Multi-Branch Plan (Emphasized) */}
          <div className="lp-glass-strong rounded-[2.5rem] border border-indigo-200 p-8 md:p-10 flex flex-col group lp-hover-lift lp-animate-fade-up lp-delay-100 relative overflow-hidden shadow-xl shadow-indigo-500/5 transform md:-translate-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-b-lg shadow-sm">
              Most Popular
            </div>

            <div className="relative z-10 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500">
                <Building2 size={32} strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Multi-Branch</h3>
              <p className="text-sm text-slate-500 mb-6">Designed for growing businesses managing multiple locations.</p>
              
              <div className="w-full h-px bg-slate-200 mb-6"></div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Everything in Single Store',
                  'Multi Workspace',
                  'Employee Management',
                  'Centralized Reporting',
                  'Branch Analytics',
                  'Cloud Sync'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                    <span className="text-slate-800 font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto relative z-10">
              <a 
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center transition-colors shadow-md group/btn"
              >
                <span>Contact Us</span>
                <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="lp-glass rounded-[2rem] border border-slate-200/60 p-8 flex flex-col group lp-hover-lift lp-animate-fade-up lp-delay-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500">
                <Globe size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-sm text-slate-500 mb-6">Designed for larger organizations requiring total control.</p>
              
              <div className="w-full h-px bg-slate-100 mb-6"></div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Unlimited Workspaces',
                  'Advanced Permissions',
                  'Enterprise Analytics',
                  'Dedicated Support',
                  'Custom Deployment Ready',
                  'Future Integrations'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-purple-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto relative z-10">
              <a 
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 px-6 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 rounded-xl font-bold flex items-center justify-center transition-colors group/btn"
              >
                <span>Contact Us</span>
                <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

        </div>

        {/* Enterprise Highlights Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lp-animate-fade-up">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 flex items-center justify-center space-x-3">
               <ShieldCheck className="text-indigo-600" size={32} />
               <span>Enterprise Ready</span>
            </h3>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 lp-animate-fade-up lp-delay-300">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <ShieldCheck size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Secure Auth</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <Users size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Role-Based Access</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <Cloud size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Auto Backups</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <RefreshCw size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Cloud Sync</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <WifiOff size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Offline First</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <Zap size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Fast Performance</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <Server size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Scalable Arch</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <BarChart3 size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Real-Time Reports</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
                <Rocket size={20} />
              </div>
              <span className="text-sm font-bold text-slate-800">Regular Updates</span>
            </div>
            
            {/* Empty placeholder for grid balance (xl:grid-cols-5) */}
            <div className="hidden xl:flex bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed items-center justify-center">
               <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">More Coming</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default LandingPlans;
