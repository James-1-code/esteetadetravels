import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CreditCard,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';

export function AdminPaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await invoicesAPI.getAll({ limit: 100 });
        const fetchedInvoices = response.data?.invoices || [];
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceId = invoice.id || '';
    const invoiceNumber = invoice.invoiceNumber || '';
    const matchesSearch = 
      invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status === 'unpaid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  
  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await invoicesAPI.download(invoiceNumber || invoiceId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'unpaid': return 'bg-amber-100 text-amber-700';
      case 'refunded': return 'bg-red-100 text-red-700';
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
            Payments & Revenue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track and manage all payments
          </p>
        </div>
        <Button variant="outline" onClick={() => invoicesAPI.export()}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
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
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600">₦{totalPending.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Paid Invoices</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{paidCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0a9396]/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#0a9396]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-2xl font-bold text-[#d4af37]">{invoices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#d4af37]" />
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
            placeholder="Search payments..."
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
      
      {/* Payments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No payments found</p>
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
                      <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 lg:px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="w-4 h-4 text-[#0a9396]" />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                              {invoice.invoiceNumber || invoice.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 lg:px-4 text-xs text-slate-600 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-3 lg:px-4 font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {invoice.currency === 'NGN' ? '₦' : '$'}{(invoice.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 lg:px-4">
                          <Badge className={getStatusColor(invoice.status)}>
                            {(invoice.status || '').charAt(0).toUpperCase() + (invoice.status || '').slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 lg:px-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#0a9396] h-8 px-2"
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            <span className="hidden sm:inline">Receipt</span>
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

