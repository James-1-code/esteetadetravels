import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Menu,
  Sun,
  Moon,
  Plane,
  User,
  LogOut,
  Home,
  Briefcase,
  Info,
  Mail,
} from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout, darkMode, toggleDarkMode } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  
  const navLinks = [
    { name: 'Home', href: '/', icon: Home, type: 'route' as const },
    { name: 'Services', href: 'services', icon: Briefcase, type: 'section' as const },
    { name: 'About', href: 'about', icon: Info, type: 'section' as const },
    { name: 'Contact', href: 'contact', icon: Mail, type: 'section' as const },
  ];

  // Handle navigation - scroll to section or navigate to route
  const handleNavClick = (link: typeof navLinks[0], e: React.MouseEvent) => {
    if (link.type === 'section') {
      e.preventDefault();
      // If we're not on the home page, navigate to home first then scroll
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.getElementById(link.href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        // Already on home page, just scroll
        const element = document.getElementById(link.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    // For route type, default Link behavior will handle it
  };
  
  const isActive = (path: string, type: string) => {
    if (type === 'section') {
      if (location.pathname !== '/') return false;
      return location.hash === `#${path}`;
    }
    return location.pathname === path;
  };
  
  const NavLink = ({ link, mobile = false, onClick }: { link: typeof navLinks[0], mobile?: boolean, onClick?: () => void }) => {
    const Icon = link.icon;
    
    // For section links, use custom click handler; for route links, use the provided onClick
    const handleClick = (e: React.MouseEvent) => {
      if (link.type === 'section') {
        handleNavClick(link, e);
      } else if (onClick) {
        onClick();
      }
    };
    
    return (
      <Link
        to={link.type === 'route' ? link.href : '#'}
        onClick={handleClick}
        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
          mobile
            ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 w-full'
            : 'hover:text-[#0a9396] hover:bg-slate-100 dark:hover:bg-slate-800'
        } ${
          isActive(link.href, link.type)
            ? 'text-[#0a9396] bg-[#0a9396]/10'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{link.name}</span>
      </Link>
    );
  };
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-lg'
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#0a9396] to-[#005f73] bg-clip-text text-transparent">
              Esteetade
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.name} link={link} />
            ))}
          </div>
          
          {/* Right Side Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            
            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-[#0a9396] hover:text-[#005f73]"
                  >
                    <User className="w-4 h-4" />
                    <span className="capitalize">{user?.firstName}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-[#0a9396]"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="gradient-primary text-white hover:opacity-90"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button & Actions */}
          <div className="flex lg:hidden items-center gap-1">
            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            
            {/* Mobile Sheet/Drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-white dark:bg-slate-900">
                <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                        <Plane className="w-4 h-4 text-white" />
                      </div>
                      <SheetTitle className="text-lg m-0 font-bold bg-gradient-to-r from-[#0a9396] to-[#005f73] bg-clip-text text-transparent">
                        Esteetade
                      </SheetTitle>
                    </div>
                  </div>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {/* Navigation Links */}
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <NavLink key={link.name} link={link} mobile onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
                
                {/* Auth Section - Mobile */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 flex-shrink-0">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg text-[#0a9396] hover:bg-[#0a9396]/10 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="block">
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setMobileOpen(false)} className="block">
                        <Button className="w-full gradient-primary text-white">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

