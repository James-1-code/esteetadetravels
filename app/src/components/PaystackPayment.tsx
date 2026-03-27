import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePaystack } from '@/hooks/usePaystack';
import { useStore } from '@/store';
import { toast } from 'sonner';
import { paymentsAPI } from '@/services/api';
import { Loader2, Sparkles } from 'lucide-react';

interface PaystackPaymentProps {
  invoiceId: string;
  email: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export function PaystackPayment({
  invoiceId,
  email,
  amount,
  currency,
  onSuccess,
  onCancel,
}: PaystackPaymentProps) {
  const isLoaded = usePaystack();
  const { token } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoProcessing, setIsDemoProcessing] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!isLoaded) {
      toast.error('Payment system not loaded. Please refresh the page.');
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize payment on backend
      const initializeResponse = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/payments/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            invoiceId,
          }),
        }
      );

      const initData: ApiResponse<{ authorization_url: string; reference: string }> =
        await initializeResponse.json();

      if (!initData.success || !initData.data?.authorization_url) {
        throw new Error(initData.message || 'Failed to initialize payment');
      }

      // Open Paystack popup - using regular function instead of arrow function
      const handler = (window as any).PaystackPop?.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? '',
        email: email,
        amount: currency === 'NGN' ? amount * 100 : amount * 100,
        currency: currency,
        ref: initData.data.reference,
        callback: function(response: { reference: string }) {
          // Verify payment
          fetch(
            `${import.meta.env.VITE_API_URL || '/api'}/payments/verify/${response.reference}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then(function(verifyResponse: Response) { return verifyResponse.json(); })
          .then(function(verifyData: ApiResponse<any>) {
            if (verifyData.success) {
              toast.success('Payment successful!');
              onSuccess();
            } else {
              toast.error('Payment verification failed', {
                description: verifyData.message || 'Payment verification failed',
              });
            }
          })
          .catch(function(error: Error) {
            toast.error('Payment verification failed', {
              description: error.message,
            });
          });
        },
        onClose: function() {
          onCancel();
        },
      });

      if (handler) {
        handler.openIframe();
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Payment failed', {
        description: err.message || 'An error occurred during payment',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isLoaded, token, invoiceId, email, amount, currency, onSuccess, onCancel]);

  // Demo payment handler
  const handleDemoPayment = useCallback(async () => {
    setIsDemoProcessing(true);
    
    try {
      const response = await paymentsAPI.demo(invoiceId);
      
      if (response.success) {
        toast.success('Demo payment successful!', {
          description: `Your payment of ${currency} ${amount.toLocaleString()} has been received.`,
        });
        onSuccess();
      } else {
        toast.error(response.message || 'Demo payment failed');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Demo payment failed', {
        description: err.message || 'An error occurred during demo payment',
      });
    } finally {
      setIsDemoProcessing(false);
    }
  }, [invoiceId, currency, amount, onSuccess]);

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        disabled={!isLoaded || isProcessing || isDemoProcessing}
        className="w-full gradient-primary text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}`
        )}
      </Button>
      
      {/* Demo Payment Button */}
      <Button
        onClick={handleDemoPayment}
        disabled={!isLoaded || isProcessing || isDemoProcessing}
        variant="outline"
        className="w-full border-[#0a9396] text-[#0a9396] hover:bg-[#0a9396] hover:text-white"
        size="sm"
      >
        {isDemoProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Demo...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Demo Payment (Test)
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-slate-500">
        Secured by Paystack. Click to proceed with payment.
      </p>
      <p className="text-xs text-center text-slate-400">
        Use Demo Payment to simulate a successful payment without real money.
      </p>
    </div>
  );
}

export default PaystackPayment;

