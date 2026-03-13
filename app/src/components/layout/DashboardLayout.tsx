import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Receipt,
  User,
  Users,
  CreditCard,
  Bell,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plane,
  DollarSign,
  Quote,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, darkMode, toggleDarkMode, notifications } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const clientNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Applications', href: '/dashboard/applications', icon: FileText },
    { name: 'New Application', href: '/dashboard/applications/new', icon: PlusCircle },
    { name: 'Price Requests', href: '/dashboard/price-requests', icon: Quote },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];
  
  const agentNavItems: NavItem[] = [
    { name: 'My Clients', href: '/agent/clients', icon: Users },
  ];
  
  const adminNavItems: NavItem[] = [
    { name: 'All Users', href: '/admin/users', icon: Users },
    { name: 'All Applications', href: '/admin/applications', icon: FileText },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Service Pricing', href: '/admin/service-pricing', icon: DollarSign },
    { name: 'Price Requests', href: '/admin/price-requests', icon: Quote },
  ];
  
  const getNavItems = () => {
    let items = [...clientNavItems];
    if (user?.role === 'agent' || user?.role === 'admin') {
      items = [...items, ...agentNavItems];
    }
    if (user?.role === 'admin') {
      items = [...items, ...adminNavItems];
    }
    return items;
  };
  
  const navItems = getNavItems();
  
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  
  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="text-xl font-bold text-white">Esteetade</span>}
        </Link>
        {!collapsed && (
          <button onClick={() => setSidebarCollapsed(true)} className="hidden lg:block p-1 rounded-lg hover:bg-white/10">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>
      
      {!collapsed && (
        <div className="px-6 pb-4">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{user?.role}</p>
            <p className="text-white font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-white/60 text-sm truncate">{user?.email}</p>
          </div>
        </div>
      )}
      
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.name} to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#d4af37]' : ''}`} />
              {!collapsed && <span className="flex-1">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 space-y-2">
        <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">{unreadCount}</span>}
          </div>
          {!collapsed && <span className="flex-1">Notifications</span>}
        </Link>
        
        <button onClick={toggleDarkMode} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        
        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
      
      {collapsed && (
        <button onClick={() => setSidebarCollapsed(false)} className="absolute -right-3 top-20 w-6 h-6 bg-[#0a9396] rounded-full flex items-center justify-center shadow-lg">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <motion.aside initial={false} animate={{ width: sidebarCollapsed ? 80 : 280 }} transition={{ duration: 0.3 }}
        className="hidden lg:block fixed left-0 top-0 h-screen z-40 sidebar overflow-hidden"
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </motion.aside>
      
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-[#005f73] to-[#0f172a">
          <SidebarContent />
        </SheetContent>
      </Sheet>
      
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu className="w-6 h-6" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-[#005f73] to-[#0f172a">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <span className="font-bold text-lg">Esteetade</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <div className="relative">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">{unreadCount}</span>}
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
