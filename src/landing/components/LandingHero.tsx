import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  WifiOff, 
  Layers, 
  BarChart3, 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Bell, 
  Users, 
  Activity 
} from 'lucide-react';

const LandingHero: React.FC = () => {
  return (
    <section className="lp-hero" aria-label="Overview">
      <div className="lp-container-wide">
        <div className="lp-hero-grid">
          
          {/* Left Column: Content */}
          <div className="lp-hero-left">
            <div className="lp-hero-badge-container">
              <span className="lp-badge">
                <span className="lp-badge-dot" aria-hidden="true" />
                Enterprise POS Platform
              </span>
            </div>

            <h1 className="lp-heading-xl lp-hero-title">
              Run Your Entire Business
              <span className="lp-text-gradient">From One Powerful POS.</span>
            </h1>

            <p className="lp-body-lg lp-hero-desc">
              Counter Pro is the ultimate cloud-based Point of Sale and business management platform. Seamlessly handle fast billing, advanced inventory tracking, customer relations, and multi-workspace sales analytics from a unified, enterprise-grade interface.
            </p>

            <div className="lp-hero-cta-container">
              <Link 
                to="/login" 
                className="lp-btn lp-btn-primary lp-btn-lg lp-hero-cta-btn"
                aria-label="Sign in to Counter Pro"
              >
                Sign In
              </Link>
            </div>

            <div className="lp-hero-trust">
              <span className="lp-hero-trust-title">Platform Standards</span>
              <div className="lp-hero-trust-grid">
                <div className="lp-hero-trust-item">
                  <Shield size={14} aria-hidden="true" />
                  <span>Secure Cloud Platform</span>
                </div>
                <div className="lp-hero-trust-item">
                  <WifiOff size={14} aria-hidden="true" />
                  <span>Offline Support</span>
                </div>
                <div className="lp-hero-trust-item">
                  <Layers size={14} aria-hidden="true" />
                  <span>Multi-Workspace</span>
                </div>
                <div className="lp-hero-trust-item">
                  <BarChart3 size={14} aria-hidden="true" />
                  <span>Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard Composition */}
          <div className="lp-hero-right" aria-hidden="true">
            <div className="lp-hero-composition-glow" />
            
            <div className="lp-hero-composition">
              <div className="lp-hero-composition-inner">

                {/* 1. Workspace Switcher */}
                <div className="lp-float-wrapper lp-float-wrapper--switcher lp-float-1">
                  <div className="lp-dashboard-card lp-glass lp-db-switcher">
                    <div className="lp-db-switcher-left">
                      <div className="lp-db-switcher-icon">NY</div>
                      <span>New York Outlet</span>
                    </div>
                    <ChevronDown size={12} className="lp-db-switcher-arrow" />
                  </div>
                </div>

                {/* 2. Today's Revenue */}
                <div className="lp-float-wrapper lp-float-wrapper--revenue lp-float-2">
                  <div className="lp-dashboard-card lp-glass-strong lp-card">
                    <div className="lp-db-header">
                      <span className="lp-db-title">Today's Revenue</span>
                      <div className="lp-db-icon-wrap">
                        <DollarSign />
                      </div>
                    </div>
                    <div className="lp-db-value">$14,248.50</div>
                    <div className="lp-db-meta">
                      <span className="lp-db-trend-up">+12.4%</span>
                      <span>vs yesterday</span>
                    </div>
                  </div>
                </div>

                {/* 3. Sales Chart */}
                <div className="lp-float-wrapper lp-float-wrapper--chart lp-float-3">
                  <div className="lp-dashboard-card lp-glass-strong lp-card">
                    <div className="lp-db-header">
                      <span className="lp-db-title">Sales Activity</span>
                      <div className="lp-db-icon-wrap">
                        <Activity />
                      </div>
                    </div>
                    
                    <div className="lp-db-graph-container">
                      <svg className="lp-db-graph-svg" viewBox="0 0 300 90" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="graph-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--lp-primary)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--lp-primary)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="300" y2="20" className="lp-db-graph-grid-line" />
                        <line x1="0" y1="50" x2="300" y2="50" className="lp-db-graph-grid-line" />
                        <line x1="0" y1="80" x2="300" y2="80" className="lp-db-graph-grid-line" />
                        
                        {/* Area Fill */}
                        <path 
                          d="M 10 85 Q 50 65 90 75 T 170 30 T 250 45 T 290 15 L 290 90 L 10 90 Z" 
                          className="lp-db-graph-fill" 
                        />
                        
                        {/* Stroke line */}
                        <path 
                          d="M 10 85 Q 50 65 90 75 T 170 30 T 250 45 T 290 15" 
                          className="lp-db-graph-line" 
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 4. Inventory Status */}
                <div className="lp-float-wrapper lp-float-wrapper--inventory lp-float-4">
                  <div className="lp-dashboard-card lp-glass lp-card lp-pulse-glow">
                    <div className="lp-db-inventory-card-body">
                      <div className="lp-db-progress-ring">
                        <svg width="42" height="42">
                          <circle cx="21" cy="21" r="16" className="lp-db-ring-bg" />
                          <circle cx="21" cy="21" r="16" className="lp-db-ring-fill" />
                        </svg>
                        <span className="lp-db-ring-center">75%</span>
                      </div>
                      <div className="lp-db-inv-details">
                        <span className="lp-db-inv-stat">3 Alerts</span>
                        <span className="lp-db-inv-label">Low Stock Items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Recent Transactions */}
                <div className="lp-float-wrapper lp-float-wrapper--transactions lp-float-5">
                  <div className="lp-dashboard-card lp-glass-strong lp-card">
                    <div className="lp-db-header">
                      <span className="lp-db-title">Recent Transactions</span>
                    </div>
                    <div className="lp-db-transaction-list">
                      <div className="lp-db-transaction-item">
                        <div className="lp-db-tx-left">
                          <div className="lp-db-tx-avatar">JD</div>
                          <div className="lp-db-tx-info">
                            <span className="lp-db-tx-name">John Doe</span>
                            <span className="lp-db-tx-time">Just now</span>
                          </div>
                        </div>
                        <span className="lp-db-tx-badge">+$149.00</span>
                      </div>
                      <div className="lp-db-transaction-item">
                        <div className="lp-db-tx-left">
                          <div className="lp-db-tx-avatar">AS</div>
                          <div className="lp-db-tx-info">
                            <span className="lp-db-tx-name">Alice Smith</span>
                            <span className="lp-db-tx-time">5m ago</span>
                          </div>
                        </div>
                        <span className="lp-db-tx-badge">+$85.50</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Top Products */}
                <div className="lp-float-wrapper lp-float-wrapper--top-products lp-float-6">
                  <div className="lp-dashboard-card lp-glass lp-card">
                    <div className="lp-db-header">
                      <span className="lp-db-title">Top Products</span>
                    </div>
                    <div className="lp-db-product-list">
                      <div className="lp-db-product-item">
                        <div className="lp-db-product-meta">
                          <span>Organic Coffee</span>
                          <span className="lp-db-product-percent">72%</span>
                        </div>
                        <div className="lp-db-product-bar-bg">
                          <div className="lp-db-product-bar-fill" style={{ width: '72%' }} />
                        </div>
                      </div>
                      <div className="lp-db-product-item">
                        <div className="lp-db-product-meta">
                          <span>Vanilla Latte</span>
                          <span className="lp-db-product-percent">48%</span>
                        </div>
                        <div className="lp-db-product-bar-bg">
                          <div className="lp-db-product-bar-fill" style={{ width: '48%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Notification Card */}
                <div className="lp-float-wrapper lp-float-wrapper--notification lp-float-7">
                  <div className="lp-dashboard-card lp-glass lp-db-toast">
                    <div className="lp-db-toast-dot" />
                    <div className="lp-db-toast-content">
                      <span className="lp-db-toast-msg">New Order Register (#1024)</span>
                      <span className="lp-db-toast-time">2 mins ago</span>
                    </div>
                  </div>
                </div>

                {/* 8. Customer Count */}
                <div className="lp-float-wrapper lp-float-wrapper--customers lp-float-8">
                  <div className="lp-dashboard-card lp-glass lp-card">
                    <div className="lp-db-header">
                      <span className="lp-db-title">Customers</span>
                      <div className="lp-db-icon-wrap">
                        <Users />
                      </div>
                    </div>
                    <div className="lp-db-value">1,842</div>
                    <div className="lp-db-meta">
                      <span className="lp-db-trend-up">+8.2%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingHero;
