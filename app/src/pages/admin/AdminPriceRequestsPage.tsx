import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { servicesAPI } from '@/services/api';
import {
  Plane,
  Hotel,
  Clock,
  CheckCircle,
  XCircle,
  Quote,
  Loader2,
  Search,
  Filter,
  Eye,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminPriceRequestsPage() {
  const [priceRequests, setPriceRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [quoteFormData, setQuoteFormData] = useState({
    adminPrice: '',
    adminNotes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPriceRequests();
  }, []);

  const fetchPriceRequests = async () => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.getPriceRequests();
      if (response.success) {
        setPriceRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching price requests:', error);
      toast.error('Failed to load price requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setQuoteFormData({
      adminPrice: request.adminPrice?.toString() || '',
      adminNotes: request.adminNotes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmitQuote = async () => {
    if (!quoteFormData.adminPrice || parseFloat(quoteFormData.adminPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      await servicesAPI.respondToPriceRequest(selectedRequest.id, {
        admin_price: parseFloat(quoteFormData.adminPrice),
        admin_notes: quoteFormData.adminNotes,
      });
      
      toast.success('Price quote sent to client successfully');
      setIsDialogOpen(false);
      fetchPriceRequests();
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = priceRequests.filter((request) => {
    const matchesSearch = 
      request.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesService = serviceFilter === 'all' || request.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'quoted':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'flight':
        return Plane;
      case 'hotel':
        return Hotel;
      default:
        return Quote;
    }
  };

  const getServiceName = (serviceType: string) => {
    switch (serviceType) {
      case 'flight':
        return 'Flight Booking';
      case 'hotel':
        return 'Hotel Reservation';
      default:
        return serviceType;
    }
  };

  const renderRequestDetails = (request: any) => {
    const details = typeof request.details === 'string' 
      ? JSON.parse(request.details) 
      : request.details;

    if (request.serviceType === 'flight') {
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Departure</p>
            <p className="font-medium">{details?.departureCountry || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Destination</p>
            <p className="font-medium">{details?.destinationCountry || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Departure Date</p>
            <p className="font-medium">{details?.departureDate || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Return Date</p>
            <p className="font-medium">{details?.returnDate || 'Not specified'}</p>
          </div>
        </div>
      );
    }

    if (request.serviceType === 'hotel') {
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">City</p>
            <p className="font-medium">{details?.city || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Check-in</p>
            <p className="font-medium">{details?.checkIn || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-slate-500">Check-out</p>
            <p className="font-medium">{details?.checkOut || 'Not specified'}</p>
          </div>
        </div>
      );
    }

    return (
      <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
        {JSON.stringify(details, null, 2)}
      </pre>
    );
  };

  const pendingCount = priceRequests.filter(r => r.status === 'pending').length;
  const quotedCount = priceRequests.filter(r => r.status === 'quoted').length;
  const acceptedCount = priceRequests.filter(r => r.status === 'accepted').length;

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
            Price Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage flight and hotel price quote requests
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-3 gap-4"
      >
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
                <p className="text-sm text-slate-500">Quoted</p>
                <p className="text-2xl font-bold text-blue-600">{quotedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Quote className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
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
            placeholder="Search by client name or email..."
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
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="flight">Flight</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Price Requests List */}
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
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <Quote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No price requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Details</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Quote</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRequests.map((request) => {
                      const ServiceIcon = getServiceIcon(request.serviceType);
                      return (
                        <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {request.clientName || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500">{request.clientEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#0a9396]/10 flex items-center justify-center">
                                <ServiceIcon className="w-4 h-4 text-[#0a9396]" />
                              </div>
                              <span className="text-sm font-medium">{getServiceName(request.serviceType)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="text-xs text-slate-500 max-w-[150px] truncate">
                              {request.serviceType === 'flight' && `${request.details?.departureCountry || ''} → ${request.details?.destinationCountry || ''}`}
                              {request.serviceType === 'hotel' && `${request.details?.city || ''}`}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(request.status)}>
                              {(request.status || '').charAt(0).toUpperCase() + (request.status || '').slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {request.adminPrice ? (
                              <span className="font-bold text-green-600">₦{request.adminPrice.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-xs text-slate-500">
                              {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                              className="text-[#0a9396]"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Quote Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && (
                <>
                  {(() => {
                    const Icon = getServiceIcon(selectedRequest.serviceType);
                    return <Icon className="w-5 h-5 text-[#0a9396]" />;
                  })()}
                  Price Request - {getServiceName(selectedRequest?.serviceType)}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Client Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Client Information</h4>
                <p className="text-sm"><span className="text-slate-500">Name:</span> {selectedRequest.clientName}</p>
                <p className="text-sm"><span className="text-slate-500">Email:</span> {selectedRequest.clientEmail}</p>
              </div>

              {/* Request Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Request Details</h4>
                {renderRequestDetails(selectedRequest)}
              </div>

              {/* Admin Quote Form */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Quote (₦) *</Label>
                    <Input
                      type="number"
                      value={quoteFormData.adminPrice}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, adminPrice: e.target.value })}
                      placeholder="Enter price quote"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={quoteFormData.adminNotes}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, adminNotes: e.target.value })}
                      placeholder="Any additional information for the client..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* View Existing Quote */}
              {selectedRequest.status === 'quoted' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Quote Sent</h4>
                  <p className="text-2xl font-bold text-blue-600">₦{selectedRequest.adminPrice?.toLocaleString()}</p>
                  {selectedRequest.adminNotes && (
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">{selectedRequest.adminNotes}</p>
                  )}
                </div>
              )}

              {/* Accepted/Rejected Status */}
              {selectedRequest.status === 'accepted' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Quote Accepted</span>
                  </div>
                  <p className="text-xl font-bold text-green-600 mt-2">₦{selectedRequest.adminPrice?.toLocaleString()}</p>
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Quote Rejected</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitQuote} disabled={isSubmitting} className="gradient-primary text-white">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Quote
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

