import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useStore } from '@/store';
import { AuthLoader } from '@/components/AuthLoader';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ApplicationsPage } from '@/pages/dashboard/ApplicationsPage';
import { NewApplicationPage } from '@/pages/dashboard/NewApplicationPage';
import { TrackPage } from '@/pages/dashboard/TrackPage';
import { InvoicesPage } from '@/pages/dashboard/InvoicesPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { PriceRequestsPage } from '@/pages/dashboard/PriceRequestsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminApplicationsPage } from '@/pages/admin/AdminApplicationsPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminServicePricingPage } from '@/pages/admin/AdminServicePricingPage';
import { AdminPriceRequestsPage } from '@/pages/admin/AdminPriceRequestsPage';
import { AgentClientsPage } from '@/pages/agent/AgentClientsPage';

const AuthLoader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, setUser, setToken } = useStore();

  React.useEffect(() => {
  const checkAuth = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    
    let retries = 3;
    
    while (retries > 0) {
      try {
        console.log('🔄 Auth check attempt', 4 - retries);
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const userResponse = await response.json();
        
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
          console.log('✅ Auth check success');
          setLoading(false);
          return;
        } else {
          console.warn('⚠️ /me no success data:', userResponse);
          break;
        }
      } catch (err: any) {
        console.warn('❌ Auth check failed:', err.message || err, '- retries left:', retries - 1);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.warn('⚠️ All retries failed, using cached state');
    setError('Could not verify session. Some features may be limited. Go to Login.');
    setLoading(false);
  };

    checkAuth();

    const timeout = setTimeout(() => {
      console.log('⏰ Auth timeout, using cached state');
      setLoading(false);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [token, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#0a9396]" />
          <span className="text-xl font-medium text-slate-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <a href="/login" className="bg-[#0a9396] text-white px-6 py-2 rounded-lg hover:bg-[#005f73] font-medium">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return null;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { darkMode } = useStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <Toaster position="top-right" richColors />
      
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Dashboard Routes */}
        <Route element={
          <ProtectedRoute>
            <AuthLoader>
              <DashboardLayout />
            </AuthLoader>
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/applications" element={<ApplicationsPage />} />
          <Route path="/dashboard/applications/new" element={<NewApplicationPage />} />
          <Route path="/dashboard/track/:id" element={<TrackPage />} />
          <Route path="/dashboard/invoices" element={<InvoicesPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/price-requests" element={<PriceRequestsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuthLoader>
              <DashboardLayout />
            </AuthLoader>
          </ProtectedRoute>
        }>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/applications" element={<AdminApplicationsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/service-pricing" element={<AdminServicePricingPage />} />
          <Route path="/admin/price-requests" element={<AdminPriceRequestsPage />} />
        </Route>

        {/* Agent Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <AuthLoader>
              <DashboardLayout />
            </AuthLoader>
          </ProtectedRoute>
        }>
          <Route path="/agent/clients" element={<AgentClientsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;

