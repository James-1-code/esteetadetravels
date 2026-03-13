// src/hooks/usePaystack.ts
import { useEffect, useState } from 'react';

/**
 * Custom hook to load the Paystack inline script.
 * Returns true when the script is loaded and ready to use.
 */
export const usePaystack = (): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if the script is already loaded
    if (typeof window !== 'undefined' && (window as any).PaystackPop) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return isLoaded;
};