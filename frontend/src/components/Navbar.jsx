import React, { useState, useEffect } from 'react';
import LifePulseLogo from '../assets/logo/LifePulseLogo';
import { NAV_LINKS } from '../data/landingData';
import { Button } from './Button';
import Container from './Container';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ArrowRight, LogIn, UserCheck, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [activeLink, setActiveLink] = useState('/#hero');
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Active section scroll detection
      const sections = NAV_LINKS.map(link => {
        const hash = link.href.includes('#') ? link.href.substring(link.href.indexOf('#')) : '';
        if (hash === '#hero' || !hash) return { href: link.href, element: document.querySelector('#hero') || document.body };
        return { href: link.href, element: document.querySelector(hash) };
      }).filter(s => s.element);

      const scrollPosition = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const { href, element } = sections[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveLink(href);
          break;
        }
      }
    };

    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      setActiveLink(hash ? `/${hash}` : (path === '/' ? '/#hero' : path));
    };

    handleLocationChange();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const getPortalPath = () => {
    if (!user) return '/login';
    return user.role === 'DONOR'
      ? '/donor/dashboard'
      : user.role === 'HOSPITAL'
      ? '/hospital/dashboard'
      : '/admin/dashboard';
  };

  const handleNavClick = (e, href) => {
    const isHomePage = window.location.pathname === '/';
    const targetHash = href.includes('#') ? href.substring(href.indexOf('#')) : '';

    if (isHomePage && targetHash) {
      e.preventDefault();
      setActiveLink(href);
      if (targetHash === '#hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
      } else {
        const element = document.querySelector(targetHash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', targetHash);
        } else {
          window.location.href = href;
        }
      }
    } else {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2.5' : 'bg-white py-3 border-b border-slate-100'}`}>
      <Container size="lg">
        <nav className="flex items-center justify-between" aria-label="Main Navigation">
          {/* Logo */}
          <a href="/" className="focus:outline-none focus:ring-2 focus:ring-brand-red rounded-lg p-1">
            <LifePulseLogo size="md" />
          </a>

          {/* Desktop Nav Links with Bhavesh's Sliding Pill Active Indicator */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md">
            {NAV_LINKS.map((link) => {
              const isActive = activeLink === link.href;
              const isHovered = hoveredLink === link.href;

              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative px-4 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer rounded-full select-none"
                >
                  {/* Sliding Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-white rounded-full shadow-xs border border-slate-200/80"
                    />
                  )}

                  {/* Hover Pill Background */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      className="absolute inset-0 bg-white/60 rounded-full"
                    />
                  )}

                  <span className={`relative z-10 transition-colors ${isActive ? 'text-brand-red font-black' : 'text-brand-navy hover:text-brand-red'}`}>
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Right Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={UserCheck}
                  onClick={() => { window.location.href = getPortalPath(); }}
                >
                  Dashboard ({user?.role})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  onClick={logout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={LogIn}
                  onClick={() => { window.location.href = '/login'; }}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => { window.location.href = '/register'; }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-brand-navy hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-red"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </Container>

      {/* Mobile Animated Nav Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-white border-b border-slate-200 overflow-hidden shadow-xl"
          >
            <Container className="py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {NAV_LINKS.map((link) => {
                  const isActive = activeLink === link.href;
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleNavClick(e, link.href);
                      }}
                      className={`text-base font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-rose-50 text-brand-red font-bold' : 'text-brand-navy hover:bg-slate-50'}`}
                    >
                      {link.name}
                    </a>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      icon={UserCheck}
                      onClick={() => { setMobileMenuOpen(false); window.location.href = getPortalPath(); }}
                    >
                      Dashboard ({user?.role})
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-center"
                      icon={LogOut}
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      icon={LogIn}
                      onClick={() => { setMobileMenuOpen(false); window.location.href = '/login'; }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      icon={ArrowRight}
                      iconPosition="right"
                      onClick={() => { setMobileMenuOpen(false); window.location.href = '/register'; }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
