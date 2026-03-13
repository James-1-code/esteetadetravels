import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentsAPI } from '@/services/api';
import PaystackPayment from '@/components/PaystackPayment';



export function PriceRequestsPage() {
  const navigate = useNavigate();
  const [priceRequests, setPriceRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);


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

  const handleAcceptQuote = async (request: any) => {
    if (!request.adminPrice) {
      toast.error('No price quote available');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Accept the quote (creates invoice)
      const acceptResponse = await servicesAPI.respondToQuote(request.id, true);
      
      if (acceptResponse.success && acceptResponse.data.invoiceId) {
        // Step 2: Initialize Paystack payment  
        const paymentResponse = await paymentsAPI.initialize(acceptResponse.data.invoiceId);
        
        if (paymentResponse.success) {
          setPaymentData({
            invoiceId: acceptResponse.data.invoiceId,
            ...paymentResponse.data,
            amount: request.adminPrice,
            email: request.clientEmail || ''
          });
          setSelectedRequest(request);
          setShowPaymentModal(true);
          return;
        }
      }
      
      toast.success('Quote accepted! Ready for payment.');
      fetchPriceRequests();
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      toast.error('Failed to accept quote', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment completed! Redirecting to invoices...');
    setShowPaymentModal(false);
    setPaymentData(null);
    fetchPriceRequests();
    navigate('/dashboard/invoices');
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    toast.info('Payment cancelled');
    fetchPriceRequests();
  };


  // Helper function
  const getToken = () => {
    try {
      const stored = localStorage.getItem('esteetade-storage');
      if (!stored) return localStorage.getItem('token');
      const parsed = JSON.parse(stored);
      return parsed?.token || parsed?.state?.token || localStorage.getItem('token');
    } catch {
      return localStorage.getItem('token');
    }
  };

  const handleRejectQuote = async (requestId: string) => {
    setIsProcessing(true);
    try {
      await servicesAPI.respondToQuote(requestId, false);
      toast.info('Price quote rejected');
      fetchPriceRequests();
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  const pendingCount = priceRequests.filter(r => r.status === 'pending').length;
  const quotedCount = priceRequests.filter(r => r.status === 'quoted').length;

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
            My Price Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and manage your flight and hotel price quotes
          </p>
        </div>
      </motion.div>

      {/* Info Card */}
      <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">How it works</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Submit a request for flight or hotel bookings. Our team will check the prices 
                and send you a quote. Once you accept, you can proceed to payment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Awaiting Quote</p>
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
                <p className="text-sm text-slate-500">Quote Ready</p>
                <p className="text-2xl font-bold text-blue-600">{quotedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Quote className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
              </div>
            ) : priceRequests.length === 0 ? (
              <div className="text-center py-16">
                <Quote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">No price requests yet</p>
                <Button 
                  onClick={() => navigate('/dashboard/applications/new')} 
                  className="gradient-primary text-white"
                >
                  Create New Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {priceRequests.map((request) => {
                  const ServiceIcon = getServiceIcon(request.serviceType);
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#0a9396]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                            <ServiceIcon className="w-6 h-6 text-[#0a9396]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {getServiceName(request.serviceType)}
                              </h3>
                              <Badge className={getStatusColor(request.status)}>
                                {(request.status || '').charAt(0).toUpperCase() + (request.status || '').slice(1)}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">
                              Requested on {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {request.status === 'quoted' && request.adminPrice && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                ₦{request.adminPrice.toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          {request.status === 'pending' && (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Awaiting quote...</span>
                            </div>
                          )}
                          
                          {request.status === 'quoted' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectQuote(request.id)}
                                disabled={isProcessing}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptQuote(request)}
                                className="gradient-primary text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                            </div>
                          )}
                          
                          {request.status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => navigate('/dashboard/invoices')}
                              className="gradient-primary text-white"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Proceed to Payment
                            </Button>
                          )}
                          
                          {request.status === 'rejected' && (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">You rejected this quote</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quote Details */}
                      {request.status === 'quoted' && request.adminPrice && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Quote className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-900 dark:text-blue-100">Quote Details</span>
                            </div>
                            {request.adminNotes && (
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {request.adminNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

  {/* Accept Quote Confirmation Dialog */}
  <Dialog open={!!selectedRequest && !showPaymentModal} onOpenChange={() => setSelectedRequest(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Accept Price Quote</DialogTitle>
      </DialogHeader>
      
      {selectedRequest && (
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Accept Quote of ₦{selectedRequest.adminPrice?.toLocaleString()}?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Proceed to secure Paystack payment.
            </p>
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setSelectedRequest(null)}>
          Cancel
        </Button>
        <Button onClick={handleAcceptQuote} disabled={isProcessing} className="gradient-primary text-white">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Accept & Pay Now
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Paystack Payment Modal */}
  <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
        <p className="text-sm text-slate-500">
          Pay ₦{paymentData?.amount?.toLocaleString()} for {selectedRequest?.serviceType}
        </p>
      </DialogHeader>
      
      {paymentData && selectedRequest && (
        <div className="flex-1 flex flex-col">
          <PaystackPayment
            invoiceId={paymentData.invoiceId}
            email={paymentData.email}
            amount={paymentData.amount}
            currency="NGN"
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentClose}
          />

        </div>
      )}
    </DialogContent>
  </Dialog>

    </div>
  );
}

