import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Facebook, Instagram, Linkedin, Github, Mail, ShieldCheck, WifiOff, Building2, Activity } from 'lucide-react';
import { BRANDING } from '../../config/branding';

const FOOTER_COLUMNS = {
  product: [
    { label: 'Billing', href: '#' },
    { label: 'Inventory', href: '#' },
    { label: 'Customers', href: '#' },
    { label: 'Analytics', href: '#' },
    { label: 'Reports', href: '#' },
    { label: 'Employee Management', href: '#' },
  ],
  solutions: [
    { label: 'Retail', href: '#' },
    { label: 'Restaurant', href: '#' },
    { label: 'Café', href: '#' },
    { label: 'Pharmacy', href: '#' },
    { label: 'Supermarket', href: '#' },
    { label: 'Warehouse', href: '#' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'Release Notes', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Contact Support', href: '#' },
  ],
  company: [
    { label: 'About Counter Pro', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms & Conditions', href: '#' },
  ],
  connect: [
    { label: 'Facebook', href: '#', icon: Facebook },
    { label: 'Instagram', href: '#', icon: Instagram },
    { label: 'LinkedIn', href: '#', icon: Linkedin },
    { label: 'GitHub', href: '#', icon: Github },
    { label: 'Email', href: '#', icon: Mail },
  ]
};

const LandingFooter: React.FC = () => {
  return (
    <footer className="relative bg-[#020617] text-slate-400 overflow-hidden pt-32 pb-12" role="contentinfo">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] opacity-30 pointer-events-none"></div>
      
      {/* Radial Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>

      {/* Top Elegant Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24">
          <div className="max-w-xl">
            <Link to="/" className="inline-block mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
              <img 
                src={BRANDING.logos.primaryMonochrome} 
                alt={`${BRANDING.meta.companyName} Logo`}
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Counter Pro helps modern businesses manage billing, inventory, customers, employees, analytics, and multiple workspaces through one beautifully designed platform.
            </p>
            
            {/* Trust Row */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
              <span className="flex items-center gap-2"><WifiOff size={16} className="text-blue-400" /> Offline First</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> Secure Platform</span>
              <span className="flex items-center gap-2"><Building2 size={16} className="text-indigo-400" /> Multi-Workspace</span>
              <span className="flex items-center gap-2"><Activity size={16} className="text-pink-400" /> Real-Time Analytics</span>
            </div>
          </div>

          {/* Premium Company Info Card */}
          <div className="w-full lg:w-[380px] shrink-0 p-8 rounded-3xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              Platform Status
            </h4>
            
            <div className="space-y-5 text-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">Current Version</span>
                <span className="text-slate-200 font-medium">v4.2.0 Enterprise</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">Latest Update</span>
                <span className="text-slate-200 font-medium">Today</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">System Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-2">
                  All systems operational <CheckCircle2 size={14} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform Availability</span>
                <span className="text-slate-200 font-medium">99.99% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-8 mb-24">
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              {FOOTER_COLUMNS.product.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="group inline-flex items-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Solutions</h4>
            <ul className="space-y-4">
              {FOOTER_COLUMNS.solutions.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="group inline-flex items-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <ul className="space-y-4">
              {FOOTER_COLUMNS.resources.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="group inline-flex items-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              {FOOTER_COLUMNS.company.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="group inline-flex items-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Connect</h4>
            <ul className="space-y-4">
              {FOOTER_COLUMNS.connect.map(link => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <a href={link.href} className="group flex items-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                      <Icon size={16} className="mr-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-blue-400" />
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm">
            &copy; {BRANDING.meta.year} {BRANDING.meta.companyName}. All Rights Reserved.
          </div>
          
          <div className="text-sm text-slate-500 text-center md:text-left">
            Made with precision for modern businesses.
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Terms</a>
            <a href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
