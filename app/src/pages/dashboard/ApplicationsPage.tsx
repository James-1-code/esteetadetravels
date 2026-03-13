import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { applicationsAPI } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { socketService } from '@/services/socket';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ApplicationsPage() {
  const { applications: storeApplications, setApplications } = useStore();
  const [applications, setLocalApplications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll({ limit: 100 });
      const apps = response.data?.applications || [];
      // Only update if we got valid data - don't clear existing data on error
      if (apps && apps.length >= 0) {
        setLocalApplications(apps);
        setApplications(apps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Don't clear applications on error - keep showing existing data
    }
  };

  useEffect(() => {
    const loadApplications = async () => {
      setIsLoading(true);
      await fetchApplications();
      setIsLoading(false);
    };

    loadApplications();

    // Poll every 15 seconds for updates
    const interval = setInterval(() => {
      fetchApplications();
    }, 15000);

    // Listen for socket updates - validate data to prevent clearing on empty updates
    const handleApplicationUpdate = (data: any) => {
      // Validate that we have valid data with meaningful content
      if (!data || !data.id) return;
      
      // Check if there's at least one meaningful property (non-empty string or number)
      const hasMeaningfulData = Object.entries(data).some(([key, value]) => {
        if (key === 'id') return false; // Skip id check
        return value !== null && value !== undefined && value !== '';
      });
      
      if (!hasMeaningfulData) {
        console.log('Ignoring empty application update:', data);
        return;
      }
      
      setLocalApplications((prev) =>
        prev.map((app) => (app.id === data.id ? { ...app, ...data } : app))
      );
      toast.info('Application Updated', {
        description: `Application ${data.typeLabel || 'status'} is now ${data.status}`,
      });
    };

    socketService.on('application:update', handleApplicationUpdate);

    return () => {
      clearInterval(interval);
      socketService.off('application:update', handleApplicationUpdate);
    };
  }, [setApplications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
    toast.success('Applications refreshed');
  };

  const handleDeleteClick = (app: any) => {
    setApplicationToDelete(app);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return;
    
    setIsDeleting(true);
    try {
      await applicationsAPI.delete(applicationToDelete.id);
      setLocalApplications((prev) => prev.filter((app) => app.id !== applicationToDelete.id));
      // Update store - get current applications and filter
      const currentApps = storeApplications.filter((app: any) => app.id !== applicationToDelete.id);
      setApplications(currentApps);
      toast.success('Application deleted successfully');
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter applications locally (search is done server-side via API params)
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.typeLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
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
            My Applications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all your applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/dashboard/applications/new">
            <Button className="gradient-primary text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>
      </motion.div>
      
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
        transition={{ delay: 0.2 }}
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
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No applications found
                </h3>
                <p className="text-slate-500 mb-4">
                  {applications.length === 0 
                    ? "Start your journey by creating your first application" 
                    : "No applications match your filters"}
                </p>
                {applications.length === 0 && (
                  <Link to="/dashboard/applications/new">
                    <Button className="gradient-primary text-white">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Application
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Application</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
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
                        <td className="py-3 px-4">
                          {app.agent ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-medium text-[#d4af37]">
                                  {app.agent.firstName?.charAt(0)}{app.agent.lastName?.charAt(0)}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {app.agent.firstName} {app.agent.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No agent</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {app.currency === 'NGN' ? '₦' : '$'}{app.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(app.status)}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-16">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">{app.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0a9396] to-[#d4af37] rounded-full transition-all"
                                style={{ width: `${app.progress}%` }}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 h-8 px-2 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(app)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
              {applicationToDelete && (
                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium">{applicationToDelete.typeLabel}</p>
                  <p className="text-sm text-slate-500">ID: {applicationToDelete.id}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
