import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { authAPI } from '@/services/api';

interface Props {
  children: React.ReactNode;
}

export function AuthLoader({ children }: Props) {
  const { token, setUser, setToken } = useStore();
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

        const userResponse = await authAPI.getMe();
        setUser(userResponse.data.user);
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
  }, [token, setUser, setToken]);

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

