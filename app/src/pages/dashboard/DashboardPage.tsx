
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { socketService } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { applicationsAPI, invoicesAPI, notificationsAPI } from '@/services/api';
import {
  FileText,
  PlusCircle,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Bell,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function DashboardPage() {
  const { user, setApplications, setInvoices, setNotifications, updateApplication, applications: storeApps } = useStore();
  
  const [applications, setLocalApplications] = useState<any[]>([]);
  const [invoices, setLocalInvoices] = useState<any[]>([]);
  const [notifications, setLocalNotifications] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ name: string; applications: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle real-time application updates
  const handleApplicationUpdate = useCallback((updatedApp: any) => {
    console.log('Dashboard received application update:', updatedApp);
    
    // Update local state
    setLocalApplications(prev => 
      prev.map(app => app.id === updatedApp.id ? { ...app, ...updatedApp } : app)
    );
    
    // Also update the global store
    updateApplication(updatedApp.id, {
      status: updatedApp.status,
      progress: updatedApp.progress
    });
  }, [updateApplication]);

  useEffect(() => {
    // Register for real-time application updates
    socketService.onApplicationUpdate(handleApplicationUpdate);
    
    // Cleanup on unmount
    return () => {
      socketService.offApplicationUpdate(handleApplicationUpdate);
    };
  }, [handleApplicationUpdate]);

  useEffect(() => {
    // Sync with store applications
    if (storeApps.length > 0) {
      setLocalApplications(storeApps);
    }
  }, [storeApps]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch applications
        const appsResponse = await applicationsAPI.getAll({ limit: 100 });
        const apps = appsResponse.data?.applications || [];
        setLocalApplications(apps);
        setApplications(apps);

        // Fetch invoices
        const invResponse = await invoicesAPI.getAll({ limit: 100 });
        const invs = invResponse.data?.invoices || [];
        setLocalInvoices(invs);
        setInvoices(invs);

        // Fetch notifications
        const notifResponse = await notificationsAPI.getAll({ limit: 20 });
        const notifs = notifResponse.data?.notifications || notifResponse.data || [];
        setLocalNotifications(notifs);
        setNotifications(notifs);

        // Generate chart data from real application dates
        const appsByMonth = apps.reduce((acc: any, app: any) => {
          const month = new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chart = months.map(month => ({
          name: month,
          applications: appsByMonth[month] || 0
        }));
        setChartData(chart);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setApplications, setInvoices, setNotifications]);
  
  const totalApplications = applications.length;
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;
  const approvedApplications = applications.filter((a) => a.status === 'approved' || a.status === 'completed').length;
  const totalSpent = invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0);
  
  const recentApplications = applications.slice(0, 5);
  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your applications
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/applications/new">
            <Button className="gradient-primary text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        <motion.div variants={fadeInUp}>
          <Card className="stat-card border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate">Total Applications</p>
                  <p className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalApplications}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-[#0a9396]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <Card className="stat-card border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate">Pending</p>
                  <p className="text-xl lg:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingApplications}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <Card className="stat-card border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate">Approved</p>
                  <p className="text-xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedApplications}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <Card className="stat-card border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate">Total Spent</p>
                  <p className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    ₦{totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 lg:w-6 lg:h-6 text-[#d4af37]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="chart-container border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Application Activity</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% this month
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a9396" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0a9396" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#0a9396"
                      fillOpacity={1}
                      fill="url(#colorApplications)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#0a9396]" />
                  Notifications
                </CardTitle>
                {unreadNotifications.length > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadNotifications.length} new</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-amber-500' :
                          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Recent Applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
              <Link to="/dashboard/applications">
                <Button variant="ghost" size="sm" className="text-[#0a9396]">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-slate-500 mb-4">Start your journey by creating your first application</p>
                <Link to="/dashboard/applications/new">
                  <Button className="gradient-primary text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Application
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Service</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Date</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr key={app.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 lg:px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#0a9396]" />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white text-sm truncate">{app.typeLabel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 lg:px-4 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 lg:px-4 font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {app.currency === 'NGN' ? '₦' : '$'}{app.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 lg:px-4">
                          <Badge className={`
                            ${app.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                            ${app.status === 'approved' ? 'bg-blue-100 text-blue-700' : ''}
                            ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                            ${app.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 lg:px-4">
                          <Link to={`/dashboard/track/${app.id}`}>
                            <Button variant="ghost" size="sm" className="text-[#0a9396] h-8 px-2">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
