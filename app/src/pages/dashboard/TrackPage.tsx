import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { invoicesAPI, uploadsAPI, applicationsAPI } from '@/services/api';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { socketService } from '@/services/socket';

const timelineSteps = [
  { id: 'submitted', label: 'Application Submitted', description: 'Your application has been received' },
  { id: 'review', label: 'Under Review', description: 'Our team is reviewing your documents' },
  { id: 'processing', label: 'Processing', description: 'Your application is being processed' },
  { id: 'approved', label: 'Approved', description: 'Your application has been approved' },
  { id: 'completed', label: 'Completed', description: 'All services have been delivered' },
];

export function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const { applications, invoices, updateApplication } = useStore();
  const [documents, setDocuments] = useState<{ id: string; filename: string }[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Find application from store first, but fetch fresh from API
  const storedApplication = applications.find((a) => a.id === id);
  const [application, setApplication] = useState<any>(storedApplication || null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const invoice = invoices.find((i) => i.applicationId === id);

  // Fetch latest application data from API
  const fetchApplicationData = useCallback(async () => {
    if (!id) return;
    
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const response = await applicationsAPI.getById(id);
      if (response.data) {
        setApplication(response.data);
        // Update store with fresh data
        updateApplication(id, response.data);
      }
    } catch (error: any) {
      console.error('Error fetching application:', error);
      // Don't clear the application if fetch fails - keep showing stored data
      setFetchError(error.message || 'Failed to fetch latest data');
    } finally {
      setIsRefreshing(false);
    }
  }, [id, updateApplication]);

  // Fetch documents when component mounts
  useEffect(() => {
    if (id) {
      setIsLoadingDocs(true);
      applicationsAPI.getById(id)
        .then((response) => {
          if (response.data?.documents && response.data.documents.length > 0) {
            setDocuments(response.data.documents.map((doc: any) => ({
              id: doc.id,
              filename: doc.filename || doc.originalName
            })));
          } else {
            setDocuments([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching documents:', error);
          setDocuments([]);
        })
        .finally(() => {
          setIsLoadingDocs(false);
        });
    }
  }, [id]);

  // Initial fetch and set up polling for real-time updates
  useEffect(() => {
    fetchApplicationData();
    
    // Poll every 10 seconds for status updates
    const interval = setInterval(() => {
      fetchApplicationData();
    }, 10000);
    
    // Listen for socket updates
    const handleApplicationUpdate = (data: any) => {
      if (data.id === id && id) {
        // Only update if we have valid data
        if (data && Object.keys(data).length > 0) {
          setApplication((prev: any) => prev ? ({ ...prev, ...data }) : data);
          updateApplication(id, data);
          toast.info('Application Updated', {
            description: `Your application status is now ${data.status}`,
          });
        }
      }
    };
    
    socketService.on('application:update', handleApplicationUpdate);
    
    return () => {
      clearInterval(interval);
      socketService.off('application:update', handleApplicationUpdate);
    };
  }, [id, fetchApplicationData, updateApplication]);

  // Handle invoice download
  const handleInvoiceDownload = async () => {
    if (!invoice) return;
    
    const invoiceId = invoice.invoiceNumber || invoice.id;
    
    try {
      await invoicesAPI.download(invoiceId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  // Handle document download
  const handleDocumentDownload = async (docId: string) => {
    setDownloadingDoc(docId);
    try {
      await uploadsAPI.download(docId);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setDownloadingDoc(null);
    }
  };
  
  if (!application) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Application Not Found
        </h2>
        <p className="text-slate-500 mb-4">The application you're looking for doesn't exist.</p>
        <Link to="/dashboard/applications">
          <Button>Back to Applications</Button>
        </Link>
      </div>
    );
  }
  
  const currentStepIndex = timelineSteps.findIndex((step) => {
    const status = application.status || '';
    if (status === 'completed') return step.id === 'completed';
    if (status === 'approved') return step.id === 'approved';
    if (status === 'pending') return step.id === 'review';
    return step.id === 'submitted';
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
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link to="/dashboard/applications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Track Application</h1>
            <p className="text-slate-500">Monitor your application progress</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplicationData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </motion.div>
      
      {/* Application Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#0a9396]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#0a9396]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {application.typeLabel}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">ID: {application.id}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                  {application.agent && (
                    <p className="text-xs sm:text-sm text-[#d4af37] mt-1">
                      Agent: {application.agent.firstName} {application.agent.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(application.status || '')}>
                  {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-[#0a9396]">{application.progress}%</span>
              </div>
              <Progress value={application.progress} className="h-2 sm:h-3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-5 h-5 text-[#0a9396]" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.id} className="relative flex gap-3 sm:gap-4 pb-6 sm:pb-8 last:pb-0">
                      {/* Timeline Line */}
                      {index < timelineSteps.length - 1 && (
                        <div
                          className={`absolute left-4 sm:left-5 top-8 sm:top-10 w-0.5 h-full ${
                            isCompleted ? 'bg-[#0a9396]' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      )}
                      
                      {/* Timeline Dot */}
                      <div
                        className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-[#0a9396]'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        ) : (
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-400" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className={`flex-1 pt-1 ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                        <h4 className={`font-semibold text-sm sm:text-base ${isCurrent ? 'text-[#0a9396]' : 'text-slate-900 dark:text-white'}`}>
                          {step.label}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">{step.description}</p>
                        {isCurrent && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#0a9396]/10 rounded-lg">
                            <p className="text-xs sm:text-sm text-[#0a9396]">
                              <strong>Current Status:</strong> {application.notes || 'In progress'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Sidebar Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Payment Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium">
                    {application.currency === 'NGN' ? '₦' : '$'}{application.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge className={invoice?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {invoice?.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice ID</span>
                  <span className="font-medium">{invoice?.invoiceNumber || invoice?.id}</span>
                </div>
                {invoice?.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid On</span>
                    <span className="font-medium">{new Date(invoice.paidAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={handleInvoiceDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>

            </CardContent>
          </Card>
          
          {/* Documents */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0a9396]" />
                  <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  No documents uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#0a9396]" />
                        <span className="text-sm truncate max-w-[150px]">{doc.filename}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDocumentDownload(doc.id)}
                        disabled={downloadingDoc === doc.id}
                      >
                        {downloadingDoc === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Support */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#0a9396] to-[#005f73]">
            <CardContent className="p-6 text-white">
              <MessageSquare className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-white/80 text-sm mb-4">
                Our support team is available 24/7 to assist you with any questions.
              </p>
              <Button variant="secondary" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

