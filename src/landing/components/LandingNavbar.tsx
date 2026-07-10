import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Why', href: '#why-choose-us' },
];

const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Scroll detection with RAF throttling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Keyboard: Escape closes menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className={`lp-navbar ${
          isScrolled ? 'lp-navbar--glass' : 'lp-navbar--transparent'
        }`}
        role="banner"
      >
        <div className="lp-navbar-inner">
          {/* Logo */}
          <a href="/" className="flex items-center" aria-label="Counter Pro — Home">
            <img 
              src={BRANDING.logos.primary} 
              alt={`${BRANDING.meta.companyName} Logo`}
              className="h-8 md:h-10 w-auto object-contain"
              loading="eager"
            />
          </a>

          {/* Desktop Nav Links */}
          <nav aria-label="Main navigation">
            <ul className="lp-navbar-links">
              {NAV_LINKS.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="lp-navbar-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Section */}
          <div className="lp-navbar-right flex items-center space-x-1 md:space-x-3">
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden md:inline-flex lp-btn lp-btn-ghost font-semibold text-slate-700 hover:text-slate-900"
            >
              Contact
            </a>
            
            {/* Desktop Sign In */}
            <Link
              to="/login"
              className="lp-btn lp-btn-primary lp-navbar-signin-desktop"
              style={{ backgroundColor: 'var(--lp-primary)', color: 'white' }}
            >
              Sign In
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              ref={toggleRef}
              className="lp-navbar-toggle"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X size={22} strokeWidth={2} />
              ) : (
                <Menu size={22} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`lp-mobile-menu ${isMobileMenuOpen ? 'lp-mobile-menu--open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
        role="dialog"
        aria-label="Mobile navigation"
      >
        {/* Backdrop */}
        <div
          className="lp-mobile-menu-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="lp-mobile-menu-panel">
          <nav aria-label="Mobile navigation">
            <ul className="lp-mobile-menu-links">
              {NAV_LINKS.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="lp-mobile-menu-link"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lp-mobile-menu-divider" />

          <a
            href="#contact"
            className="lp-mobile-menu-link"
            onClick={(e) => {
              e.preventDefault();
              closeMobileMenu();
              setTimeout(() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{ fontWeight: 600 }}
          >
            Contact
          </a>

          <Link
            to="/login"
            className="lp-mobile-menu-link"
            onClick={closeMobileMenu}
            style={{ color: 'var(--lp-primary)', fontWeight: 600 }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
};

export default LandingNavbar;
