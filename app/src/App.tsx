import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLoader } from '@/components/AuthLoader';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
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
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, token } = useStore();
  
  // DEV: Bypass auth for development
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }
  
  // Loading state while auth initializes
  if (token !== null && token !== undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-[#0a9396]" />
        <span>Checking authentication...</span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { darkMode } = useStore();
  
  useEffect(() => {
    // Initialize dark mode from system preference or stored value
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
        {/* Public Routes - NO AuthLoader */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        
        {/* Protected Routes - WITH AuthLoader */}
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
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;

