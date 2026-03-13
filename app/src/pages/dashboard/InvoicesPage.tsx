import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { invoicesAPI } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Search,
  Download,
  Filter,
  FileText,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function InvoicesPage() {
  const { setInvoices } = useStore();
  const [invoices, setLocalInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInvoices = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await invoicesAPI.getAll({ limit: 100 });
      const invs = response.data?.invoices || [];
      setLocalInvoices(invs);
      setInvoices(invs);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setInvoices]);

  // Fetch on mount and when page becomes visible
  useEffect(() => {
    fetchInvoices();
    
    // Refresh when page becomes visible (e.g., after returning from payment)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInvoices(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also set up an interval to refresh data periodically
    const intervalId = setInterval(() => {
      fetchInvoices(false);
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [fetchInvoices]);

  // Filter invoices locally
  const filteredInvoices = invoices.filter((invoice) => {
    const searchId = invoice.invoiceNumber?.toLowerCase() || invoice.id?.toString().toLowerCase() || '';
    const matchesSearch = searchId.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {

    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'unpaid':
        return 'bg-amber-100 text-amber-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalUnpaid = invoices
    .filter((i) => i.status === 'unpaid')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and download your invoices
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Total Paid */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Outstanding</p>
                <p className="text-2xl font-bold text-amber-600">
                  ₦{totalUnpaid.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {invoices.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0a9396]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#0a9396]" />
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
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 h-9">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
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
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No invoices found
                </h3>
                <p className="text-slate-500">
                  {invoices.length === 0
                    ? "You don't have any invoices yet"
                    : 'No invoices match your filters'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Invoice ID</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Date</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 lg:px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-4 h-4 text-[#0a9396]" />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                              {invoice.invoiceNumber || invoice.id}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 lg:px-4 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-3 lg:px-4 font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {invoice.currency === 'NGN' ? '₦' : '$'}
                          {invoice.amount.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 lg:px-4">
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </Badge>
                        </td>

                        <td className="py-3 px-3 lg:px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0a9396] h-8 px-2"
                            onClick={() => invoicesAPI.download(invoice.invoiceNumber || invoice.id)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
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