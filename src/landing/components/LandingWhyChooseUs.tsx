import React from 'react';
import { motion } from 'framer-motion';
import {
  WifiOff,
  Zap,
  Layout,
  Building2,
  ShieldCheck,
  BarChart3,
  Server,
  Sparkles
} from 'lucide-react';

const advantages = [
  {
    title: 'Offline First',
    description: 'Continue selling even without an internet connection.',
    icon: WifiOff,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Lightning Fast Performance',
    description: 'Optimized workflows that reduce checkout time.',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Modern User Experience',
    description: 'Clean interface that employees learn quickly.',
    icon: Layout,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  },
  {
    title: 'Multi-Workspace Ready',
    description: 'Manage multiple businesses or branches from one account.',
    icon: Building2,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10'
  },
  {
    title: 'Secure & Reliable',
    description: 'Role-based permissions, secure authentication, and automatic backups.',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Business Insights',
    description: 'Powerful analytics to help owners make informed decisions.',
    icon: BarChart3,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Scalable Architecture',
    description: 'Designed for small businesses today and enterprise operations tomorrow.',
    icon: Server,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Continuous Improvements',
    description: 'Counter Pro evolves with regular updates and future-ready architecture.',
    icon: Sparkles,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const LandingWhyChooseUs: React.FC = () => {
  return (
    <section id="why-choose-us" className="lp-section relative z-10 bg-slate-50/50 border-t border-slate-200/50" aria-label="Why Choose Counter Pro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Why Businesses Choose Counter Pro</h2>
          <p className="lp-body-lg text-slate-500">
            Modern businesses need software that is fast, reliable, and built to scale. Counter Pro combines powerful functionality with an intuitive experience that helps owners focus on growing their business.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {advantages.map((adv, index) => {
            const Icon = adv.icon;
            return (
              <motion.article 
                key={index} 
                variants={itemVariants}
                className="group relative p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500 overflow-hidden"
              >
                {/* Subtle border glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6">
                  <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${adv.bg} ${adv.color}`}>
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{adv.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{adv.description}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingWhyChooseUs;
