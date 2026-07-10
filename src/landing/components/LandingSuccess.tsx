import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  WifiOff, 
  Cloud, 
  Users, 
  Zap, 
  RefreshCw,
  BadgeCheck
} from 'lucide-react';

// Simple Hook for Count Up Animation
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return { count, elementRef };
};

const AnimatedCounter: React.FC<{ end: number; suffix?: string; prefix?: string }> = ({ end, suffix = '', prefix = '' }) => {
  const { count, elementRef } = useCountUp(end);
  return (
    <div ref={elementRef} className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};

const LandingSuccess: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 overflow-hidden bg-white" aria-label="Success Stories and Impact">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <div className="lp-container-wide">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Businesses That Run Better with Counter Pro</h2>
          <p className="lp-body-lg text-slate-500">
            From local retailers to growing multi-branch businesses, Counter Pro helps owners save time, improve accuracy, and make better decisions with real-time business insights.
          </p>
        </div>

        {/* Featured Success Story */}
        <div className="w-full lp-glass rounded-[2rem] border border-slate-200/60 p-8 md:p-12 mb-8 relative overflow-hidden lp-animate-fade-up lp-delay-100 lp-hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            {/* Quote Side */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold w-fit mb-6 border border-emerald-100">
                <Building2 size={14} />
                <span>Supermarket Chain</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-slate-800 leading-snug mb-8">
                "Counter Pro transformed how we manage our inventory across all branches. The real-time sync is flawless, and the analytics dashboard gives us insights we never had before."
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold">
                  OM
                </div>
                <div>
                  <div className="font-bold text-slate-900">Operations Manager</div>
                  <div className="text-sm text-slate-500">Multi-Location Grocery Business</div>
                </div>
              </div>
            </div>

            {/* Metrics Side */}
            <div className="lg:w-5/12 bg-white/60 rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">XX% Faster</div>
                  <div className="text-sm text-slate-500">Checkout times improved across all lanes.</div>
                </div>
              </div>
              <div className="w-full h-px bg-slate-100"></div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">XX% Reduced</div>
                  <div className="text-sm text-slate-500">Inventory tracking errors and stockouts.</div>
                </div>
              </div>
              <div className="w-full h-px bg-slate-100"></div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">XX Hours Saved</div>
                  <div className="text-sm text-slate-500">Weekly administration and reporting time.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 lp-animate-fade-up lp-delay-200">
          
          <div className="lp-glass rounded-3xl p-8 border border-slate-200/60 flex flex-col lp-hover-lift relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
             <div className="flex items-center space-x-1 mb-6 text-amber-400 relative z-10">
               <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
             </div>
             <p className="text-slate-600 leading-relaxed mb-8 flex-1 relative z-10">
               "The intuitive POS interface means my new staff can start billing within minutes of training. It's incredibly fast and reliable even during our busiest hours."
             </p>
             <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">RO</div>
                 <div>
                   <div className="text-sm font-bold text-slate-900">Retail Owner</div>
                   <div className="text-xs text-slate-500">Clothing Boutique</div>
                 </div>
               </div>
               <BadgeCheck size={20} className="text-blue-500" />
             </div>
          </div>

          <div className="lp-glass rounded-3xl p-8 border border-slate-200/60 flex flex-col lp-hover-lift relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
             <div className="flex items-center space-x-1 mb-6 text-amber-400 relative z-10">
               <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
             </div>
             <p className="text-slate-600 leading-relaxed mb-8 flex-1 relative z-10">
               "Managing ingredients and tracking sales has never been easier. The analytics help me understand our peak times and best-selling items instantly."
             </p>
             <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">RM</div>
                 <div>
                   <div className="text-sm font-bold text-slate-900">Restaurant Manager</div>
                   <div className="text-xs text-slate-500">Local Café</div>
                 </div>
               </div>
               <BadgeCheck size={20} className="text-blue-500" />
             </div>
          </div>

          <div className="lp-glass rounded-3xl p-8 border border-slate-200/60 flex flex-col lp-hover-lift relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
             <div className="flex items-center space-x-1 mb-6 text-amber-400 relative z-10">
               <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
             </div>
             <p className="text-slate-600 leading-relaxed mb-8 flex-1 relative z-10">
               "Expiration date tracking and batch management are critical for us. Counter Pro handles complex inventory requirements seamlessly."
             </p>
             <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">PO</div>
                 <div>
                   <div className="text-sm font-bold text-slate-900">Pharmacy Owner</div>
                   <div className="text-xs text-slate-500">Medical Store</div>
                 </div>
               </div>
               <BadgeCheck size={20} className="text-blue-500" />
             </div>
          </div>

        </div>

        {/* Business Impact Strip */}
        <div className="w-full bg-slate-900 rounded-[2rem] p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden lp-animate-fade-up lp-delay-300">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E')] opacity-30 pointer-events-none mix-blend-overlay"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-slate-800 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                 <AnimatedCounter end={5000} suffix="+" />
              </div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Businesses Using<br/>Counter Pro</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                 <AnimatedCounter end={10} suffix="M+" />
              </div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Transactions<br/>Processed</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                 <AnimatedCounter end={25} suffix="M+" />
              </div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Products<br/>Managed</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2 tracking-tight">
                 <AnimatedCounter end={99} suffix=".9%" />
              </div>
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Average System<br/>Uptime</div>
            </div>
          </div>
        </div>

        {/* Trust Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 lp-animate-fade-up lp-delay-400">
           
           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <ShieldCheck size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Secure Cloud</h4>
             <p className="text-xs text-slate-500">Enterprise-grade infrastructure.</p>
           </div>

           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <WifiOff size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Offline Support</h4>
             <p className="text-xs text-slate-500">Operate without internet.</p>
           </div>

           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <Cloud size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Auto Backups</h4>
             <p className="text-xs text-slate-500">Your data is always safe.</p>
           </div>

           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <Users size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Role Permissions</h4>
             <p className="text-xs text-slate-500">Granular access control.</p>
           </div>

           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <Zap size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Fast Performance</h4>
             <p className="text-xs text-slate-500">Optimized for high volume.</p>
           </div>

           <div className="flex flex-col items-center text-center p-4 lp-glass rounded-2xl border border-slate-200/50 group hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-100 group-hover:scale-110 transition-all">
               <RefreshCw size={18} />
             </div>
             <h4 className="text-sm font-bold text-slate-800 mb-1">Regular Updates</h4>
             <p className="text-xs text-slate-500">Continuous improvements.</p>
           </div>

        </div>

      </div>
    </section>
  );
};

export default LandingSuccess;
