import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/services/api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  // Handle sending OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      
      // Check if we're in dev mode (email service unavailable)
      if (response.devMode && response.message) {
        // Extract OTP from message for development
        const otpMatch = response.message.match(/Use OTP: (\d{6})/);
        if (otpMatch) {
          toast.info('Development Mode: OTP displayed below', {
            description: 'Email service unavailable. Use the OTP shown.',
            duration: 10000,
          });
          // Show alert with OTP
          window.alert(`DEV MODE: Your OTP is: ${otpMatch[1]}\n\n(This is shown because email service is not configured)`);
        }
      } else {
        toast.success('OTP sent!', {
          description: 'Check your email for the verification code.',
        });
      }
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle OTP verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      if (response.success && response.data?.token) {
        setResetToken(response.data.token);
        toast.success('OTP verified!', {
          description: 'Now set your new password.',
        });
        setStep('reset');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      await authAPI.resetPassword(password, confirmPassword, resetToken);
      toast.success('Password reset successful!', {
        description: 'You can now log in with your new password.',
      });
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl"
        />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-between">
                <Link to="/login">
                  <Button variant="ghost" size="icon" className="text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-6 h-6 text-[#0a9396]" />
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Esteetade</span>
                </div>
                <div className="w-9" /> {/* Spacer for centering */}
              </div>
              
              {step === 'email' && (
                <>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                    Forgot Password?
                  </CardTitle>
                  <CardDescription className="text-center">
                    Enter your email address and we'll send you an OTP to reset your password.
                  </CardDescription>
                </>
              )}
              
              {step === 'otp' && (
                <>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                    Enter OTP
                  </CardTitle>
                  <CardDescription className="text-center">
                    We sent a 6-digit code to your email. Enter it below.
                  </CardDescription>
                </>
              )}
              
              {step === 'reset' && (
                <>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                    Set New Password
                  </CardTitle>
                  <CardDescription className="text-center">
                    Enter your new password below.
                  </CardDescription>
                </>
              )}
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className={`h-2 w-16 rounded-full ${step === 'email' ? 'bg-[#0a9396]' : 'bg-green-500'}`} />
                <div className={`h-2 w-16 rounded-full ${step === 'otp' ? 'bg-[#0a9396]' : step === 'reset' ? 'bg-green-500' : 'bg-slate-200'}`} />
                <div className={`h-2 w-16 rounded-full ${step === 'reset' ? 'bg-[#0a9396]' : 'bg-slate-200'}`} />
              </div>
            </CardHeader>
            
            <CardContent>
              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 gradient-primary text-white font-semibold btn-shine"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                      </>
                    )}
                  </Button>
                </form>
              )}
              
              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">6-Digit OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 text-center text-lg tracking-[0.5em] font-mono"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-slate-500 text-center">
                      OTP sent to <span className="font-medium">{email}</span>
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 gradient-primary text-white font-semibold btn-shine"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                </form>
              )}
              
              {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      OTP verified successfully
                    </span>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 gradient-primary text-white font-semibold btn-shine"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login" className="text-[#0a9396] hover:text-[#005f73] font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

