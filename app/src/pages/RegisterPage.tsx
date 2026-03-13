import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Plane,
  ArrowRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/services/api';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const { login } = useStore();
  const navigate = useNavigate();
  
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };
  
  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please enter your password');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.role) {
      toast.error('Please select an account type');
      return false;
    }
    return true;
  };
  
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsLoading(true);
    
    try {
      // Make actual API call
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone,
        referralCode: formData.referralCode || undefined,
      });
      
      if (response.success) {
        const { user, token } = response.data;
        
        login(
          {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            referralCode: user.referralCode,
          },
          token
        );
        
        toast.success('Account created successfully!', {
          description: 'Welcome to Esteetade Travels!',
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed', {
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
      
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block text-white"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold">Esteetade Travels</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold mb-6">
            Start Your <span className="text-[#d4af37]">Journey</span> Today
          </h1>
          
          <p className="text-lg text-white/80 mb-8">
            Create an account and join thousands of travelers who have achieved their dreams with our premium services.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#d4af37]" />
              <span className="text-white/90">Free account creation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#d4af37]" />
              <span className="text-white/90">Track applications in real-time</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#d4af37]" />
              <span className="text-white/90">Secure document management</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#d4af37]" />
              <span className="text-white/90">24/7 customer support</span>
            </div>
          </div>
        </motion.div>
        
        {/* Right Side - Registration Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="lg:hidden flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">Esteetade</span>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                Create your account
              </CardTitle>
              <CardDescription>
                {step === 1 ? 'Enter your personal information' : 'Set up your account security'}
              </CardDescription>
              
              {/* Progress Steps */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-[#0a9396]' : 'bg-slate-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-[#0a9396]' : 'bg-slate-200'}`} />
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {step === 1 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                            className="pl-10 h-12"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+234 800 123 4567"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="w-full h-12 gradient-primary text-white font-semibold btn-shine"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="role">Account Type</Label>
                      <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client - I need travel services</SelectItem>
                          <SelectItem value="agent">Agent - I want to offer services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.role === 'client' && (
                      <div className="space-y-2">
                        <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                        <Input
                          id="referralCode"
                          placeholder="Enter agent referral code"
                          value={formData.referralCode}
                          onChange={(e) => handleChange('referralCode', e.target.value)}
                          className="h-12"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          className="pl-10 pr-10 h-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 h-12"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 gradient-primary text-white font-semibold btn-shine"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#0a9396] hover:text-[#005f73] font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
              
              <p className="mt-4 text-xs text-center text-slate-500">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-[#0a9396] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-[#0a9396] hover:underline">Privacy Policy</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
