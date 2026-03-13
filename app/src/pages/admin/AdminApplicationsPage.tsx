import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { applicationsAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Handle real-time application updates
  const handleApplicationUpdate = useCallback((updatedApp: any) => {
    setApplications(prev => 
      prev.map(app => app.id === updatedApp.id ? { ...app, ...updatedApp } : app)
    );
    toast.info('Application Updated', {
      description: `${updatedApp.typeLabel} status changed to ${updatedApp.status}`,
    });
  }, []);

  useEffect(() => {
    // Register for real-time application updates (for admins)
    socketService.on('application:update', handleApplicationUpdate);
    
    return () => {
      socketService.off('application:update', handleApplicationUpdate);
    };
  }, [handleApplicationUpdate]);

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await applicationsAPI.getAll({ limit: 100 });
        let apps = response.data?.applications || [];
        
        // Filter out demo applications (those with IDs like app-001, app-002)
        apps = apps.filter((app: any) => !app.id?.startsWith('app-00'));
        
        setApplications(apps);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter((app) => {
    const typeLabel = app.typeLabel || '';
    const appId = app.id || '';
    const matchesSearch = typeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const totalRevenue = applications.reduce((sum, app) => sum + (app.amount || 0), 0);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const completedCount = applications.filter((a) => a.status === 'completed').length;
  
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const progress = newStatus === 'completed' ? 100 : newStatus === 'approved' ? 75 : newStatus === 'pending' ? 50 : 25;
      await applicationsAPI.update(appId, { status: newStatus, progress });
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus, progress } : app
        )
      );
      toast.success(`Application status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application', {
        description: error.message || 'Please try again.',
      });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            All Applications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and review all applications
          </p>
        </div>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Applications</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{applications.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0a9396]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#0a9396]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-[#d4af37]">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cv">CV/Resume</SelectItem>
              <SelectItem value="study">Study Abroad</SelectItem>
              <SelectItem value="work">Work Visa</SelectItem>
              <SelectItem value="flight">Flight Booking</SelectItem>
              <SelectItem value="hotel">Hotel Reservation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>
      
      {/* Applications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Application</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#0a9396]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{app.typeLabel}</p>
                              <p className="text-xs text-slate-500 truncate">{app.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {app.currency === 'NGN' ? '₦' : '$'}{(app.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v)}>
                            <SelectTrigger className="w-28 h-7">
                              <Badge className={getStatusColor(app.status)}>
                                {(app.status || '').charAt(0).toUpperCase() + (app.status || '').slice(1)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={0} align="start">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="w-16">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">{app.progress || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0a9396] to-[#d4af37] rounded-full transition-all"
                                style={{ width: `${app.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Link to={`/dashboard/track/${app.id}`}>
                              <Button variant="ghost" size="sm" className="text-[#0a9396] h-8 px-2">
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </Link>
                          </div>
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

