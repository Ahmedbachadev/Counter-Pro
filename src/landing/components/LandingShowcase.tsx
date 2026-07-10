import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Package,
  Users,
  BarChart3,
  UserCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Search,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Clock,
  Receipt
} from 'lucide-react';
import BillingPreview from './previews/BillingPreview';
import InventoryPreview from './previews/InventoryPreview';
import CustomersPreview from './previews/CustomersPreview';
import ReportsPreview from './previews/ReportsPreview';
import EmployeePreview from './previews/EmployeePreview';
import WorkspacePreview from './previews/WorkspacePreview';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';

const steps = [
  {
    id: 'billing',
    title: 'Billing & POS',
    description: 'Process transactions blazingly fast with a modern point-of-sale interface designed for high-volume retail environments.',
    features: ['Quick product search', 'Multiple payment methods', 'Tax & discount calculation', 'Digital receipts'],
    icon: CreditCard,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  {
    id: 'inventory',
    title: 'Inventory Control',
    description: 'Maintain perfect stock accuracy across all your locations with real-time tracking and automated low-stock alerts.',
    features: ['Barcode scanning support', 'Category management', 'Stock valuation', 'Supplier tracking'],
    icon: Package,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20'
  },
  {
    id: 'customers',
    title: 'Customer Relations',
    description: 'Build lasting relationships by understanding purchasing habits and rewarding your most loyal customers.',
    features: ['Purchase history tracking', 'Outstanding balances', 'Loyalty points system', 'Customer profiling'],
    icon: Users,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20'
  },
  {
    id: 'analytics',
    title: 'Reports & Analytics',
    description: 'Make data-driven decisions with beautifully visualized metrics that give you a clear picture of your business health.',
    features: ['Revenue tracking', 'Top-selling products', 'Profit margins', 'Store comparisons'],
    icon: BarChart3,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20'
  },
  {
    id: 'employees',
    title: 'Employee Management',
    description: 'Keep your team aligned and accountable with granular permissions and performance tracking.',
    features: ['Role-based access', 'Shift tracking', 'Sales leaderboards', 'Activity timelines'],
    icon: UserCircle,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20'
  },
  {
    id: 'workspace',
    title: 'Multi-Workspace',
    description: 'Running a chain of stores? Manage all your business locations from a single master account with seamless switching.',
    features: ['One-click switching', 'Aggregated reporting', 'Shared catalogs', 'Location specific pricing'],
    icon: Building2,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20'
  }
];

const previewVariants = {
  initial: { opacity: 0, y: 30, scale: 0.98, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, scale: 0.98, filter: 'blur(4px)' }
};

const PreviewRenderer: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  const getPreviewComponent = () => {
    switch (activeStep) {
      case 0: return <BillingPreview />;
      case 1: return <InventoryPreview />;
      case 2: return <CustomersPreview />;
      case 3: return <ReportsPreview />;
      case 4: return <EmployeePreview />;
      case 5: return <WorkspacePreview />;
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={activeStep}
        variants={previewVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 w-full h-full"
      >
        {getPreviewComponent()}
      </motion.div>
    </AnimatePresence>
  );
};

const LandingShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const rawParallaxY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const parallaxY = useSpring(rawParallaxY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      let step = Math.floor(latest * steps.length);
      step = Math.max(0, Math.min(step, steps.length - 1));
      setActiveStep(step);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const glowColors = [
    "rgba(59, 130, 246, 0.15)", // blue
    "rgba(99, 102, 241, 0.15)", // indigo
    "rgba(236, 72, 153, 0.15)", // pink
    "rgba(16, 185, 129, 0.15)", // emerald
    "rgba(6, 182, 212, 0.15)",  // cyan
    "rgba(245, 158, 11, 0.15)"  // amber
  ];

  // UI Previews
  const renderPreview = () => {
    return (
      <div className="relative w-full h-[500px] lp-glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-slate-50/50 flex flex-col transition-all duration-700 ease-in-out">
        {/* Fake Window Header */}
        <div className="h-12 border-b border-slate-200/50 flex items-center px-4 space-x-2 bg-white/50 backdrop-blur-md z-50 relative">
          <div className="w-3 h-3 rounded-full bg-slate-200"></div>
          <div className="w-3 h-3 rounded-full bg-slate-200"></div>
          <div className="w-3 h-3 rounded-full bg-slate-200"></div>
          <div className="mx-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-24 py-1 rounded-md">app.counterpro.com</div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-slate-50/30">
          <PreviewRenderer activeStep={activeStep} />
        </div>
      </div>
    );
  };

  return (
    <section className="lp-section-lg relative z-10 bg-white" aria-label="Interactive Product Showcase">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-24 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">One Platform.<br /><span className="lp-text-gradient">Every Business Operation.</span></h2>
          <p className="lp-body-lg text-slate-500">
            From billing customers to tracking inventory, managing employees, monitoring analytics, and running multiple stores, everything happens in one beautifully designed platform.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row relative items-start gap-12 lg:gap-20" ref={containerRef}>
          {/* Left Side: Scrollable Text Content */}
          <div className="w-full lg:w-5/12 relative z-10 lg:py-[20vh] flex flex-col">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isLast = index === steps.length - 1;

              return (
                <article
                  key={step.id}
                  data-index={index}
                  className={`relative flex flex-row items-start gap-6 lg:gap-8 ${isLast ? '' : 'pb-16 lg:pb-32'} transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                >
                  {/* Progress Line connecting steps */}
                  {!isLast && (
                    <div className="absolute left-[23px] top-6 h-full w-[2px] bg-slate-100 -z-10">
                      <div className={`w-full bg-blue-500 transition-all duration-700 origin-top ${activeStep > index ? 'h-full' : activeStep === index ? 'h-1/2' : 'h-0'}`}></div>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`relative z-10 shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-500 ${isActive ? step.bg + ' ' + step.color : 'bg-slate-100 text-slate-400'}`}>
                    <Icon size={24} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5">
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">{step.title}</h3>
                    <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                      {step.description}
                    </p>

                    <ul className="space-y-4">
                      {step.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <div className={`shrink-0 w-5 h-5 mt-0.5 rounded-full flex items-center justify-center ${isActive ? step.bg + ' ' + step.color : 'bg-slate-100 text-slate-300'}`}>
                            <CheckCircle2 size={12} />
                          </div>
                          <span className={`text-sm font-medium ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right Side: Sticky App Preview */}
          <div className="hidden lg:flex w-full lg:w-7/12 sticky top-0 h-screen items-center justify-center">
            <motion.div 
              className="w-full relative"
              style={{ y: parallaxY }}
            >
              {/* Animated Glow Background */}
              <motion.div
                className="absolute inset-0 -inset-y-10 blur-[80px] rounded-full -z-10"
                animate={{ backgroundColor: glowColors[activeStep] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              {renderPreview()}
            </motion.div>
          </div>

          {/* Mobile Preview Inject */}
          <div className="w-full lg:hidden pb-12">
             <motion.div style={{ y: parallaxY }} className="relative">
               <motion.div
                 className="absolute inset-0 -inset-y-10 blur-[60px] rounded-full -z-10"
                 animate={{ backgroundColor: glowColors[activeStep] }}
                 transition={{ duration: 0.8, ease: "easeInOut" }}
               />
               {renderPreview()}
             </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingShowcase;
