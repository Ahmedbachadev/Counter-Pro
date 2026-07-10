import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingCTA: React.FC = () => {
  return (
    <section className="lp-section-lg relative z-10 bg-slate-50/50 pb-32" aria-label="Call to Action">
      <div className="lp-container-wide">
        
        <div className="relative w-full rounded-[3rem] md:rounded-[4rem] p-10 md:p-20 overflow-hidden shadow-2xl lp-animate-fade-up">
          
          {/* Base Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900"></div>

          {/* Glowing Accents */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3 animate-[lp-shimmer_8s_ease-in-out_infinite_alternate]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3 animate-[lp-shimmer_12s_ease-in-out_infinite_alternate_reverse]"></div>
          
          {/* Subtle Grid / Noise Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E')] opacity-20 pointer-events-none mix-blend-overlay"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight">
              Run Your Business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">Confidence.</span>
            </h2>
            
            <p className="text-lg md:text-2xl text-blue-100/80 mb-12 max-w-3xl leading-relaxed font-medium">
              Bring billing, inventory, reporting, customers, and business management together in one modern platform designed to help your business grow.
            </p>
            
            <a 
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-900 font-bold text-lg rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-4 focus:ring-white/50"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white via-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center">
                Get in Touch
                <ArrowRight size={24} className="ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default LandingCTA;
