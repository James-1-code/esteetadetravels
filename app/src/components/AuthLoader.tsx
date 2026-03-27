import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { authAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export function AuthLoader({ children }: { children: React.ReactNode }) {
  // DEV: Bypass auth validation for development
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }
const { setUser, setToken, token } = useStore();
  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!token) {
          setValidToken(false);
          setLoading(false);
          return;
        }

        const user = await authAPI.getMe();
        setUser(user.data.user);
        setValidToken(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('esteetade-storage');
        setValidToken(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('AuthLoader timeout fallback');
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#0a9396]" />
          <p className="text-slate-500 dark:text-slate-400">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
