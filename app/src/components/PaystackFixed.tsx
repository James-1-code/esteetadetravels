// src/components/PaystackFixed.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePaystack } from '@/hooks/usePaystack';
import { useStore } from '@/store';
import { paymentsAPI } from '@/services/api';
import type { ApiResponse, PaymentInitData } from '@/types/api';

// Extend the Window interface to include PaystackPop
declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface PaystackPaymentProps {
  invoiceId: string;
  email: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaystackFixed({
  invoiceId,
  email,
  amount,
  currency,
  onSuccess,
  onCancel,
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const isScriptLoaded = usePaystack();
  const token = useStore((state) => state.token);

  const handlePayment = async (): Promise<void> => {
    if (!isScriptLoaded || typeof window === 'undefined' || !window.PaystackPop) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    if (!token) {
      toast.error('Please log in to make payments');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/payments/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ invoiceId }),
        }
      );

      const data: ApiResponse<PaymentInitData> = await response.json();

      if (!data.success || !data.data?.reference) {
        throw new Error(data.message ?? 'Payment initialization failed');
      }

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? '',
        email,
        amount: amount * 100,
        currency,
        ref: data.data.reference,
        callback: async (res: { reference: string }) => {
          try {
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/payments/verify/${res.reference}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const verifyData: ApiResponse = await verifyResponse.json();

            if (verifyData.success) {
              toast.success('Payment successful!', {
                description: `Your payment of ${currency} ${amount.toLocaleString()} has been received.`,
              });
              onSuccess?.();
            } else {
              toast.error('Payment verification failed');
            }
          } catch {
            toast.error('Failed to verify payment');
          }

          setIsLoading(false);
        },
        onClose: () => {
          setIsLoading(false);
          onCancel?.();
          toast.info('Payment cancelled');
        },
      });

      handler.openIframe();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment initialization failed';
      toast.error(message);
      setIsLoading(false);
    }
  };

  // Demo payment handler for testing
  const handleDemoPayment = async (): Promise<void> => {
    if (!token) {
      toast.error('Please log in to make payments');
      return;
    }

    setIsDemoLoading(true);

    try {
      const response = await paymentsAPI.demo(invoiceId);
      
      if (response.success) {
        toast.success('Demo payment successful!', {
          description: `Your payment of ${currency} ${amount.toLocaleString()} has been received.`,
        });
        onSuccess?.();
      } else {
        toast.error(response.message || 'Demo payment failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Demo payment failed';
      toast.error(message);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-4"
    >
      <div className="p-4 bg-gradient-to-br from-[#0a9396]/10 to-[#005f73]/10 rounded-xl border border-[#0a9396]/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-600 dark:text-slate-400">Amount to Pay</span>
          <span className="text-2xl font-bold text-[#0a9396]">
            {currency === 'NGN' ? '₦' : '$'}
            {amount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Secure payment powered by Paystack</span>
        </div>

        {/* Real Payment Button */}
        <Button 
          onClick={handlePayment} 
          disabled={isLoading || !isScriptLoaded || isDemoLoading} 
          className="w-full h-12 gradient-primary text-white font-semibold mb-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </>
          )}
        </Button>

        {/* Demo Payment Button */}
        <Button 
          onClick={handleDemoPayment} 
          disabled={isLoading || isDemoLoading || !isScriptLoaded}
          variant="outline"
          className="w-full h-10 border-[#0a9396] text-[#0a9396] hover:bg-[#0a9396] hover:text-white"
        >
          {isDemoLoading ? (
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
        <p className="text-xs text-center text-slate-500 mt-2">
          Use Demo Payment to simulate a successful payment without real money
        </p>
      </div>
    </motion.div>
  );
}
