import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Upload,
  FileText,
  X,
  CreditCard,
  Loader2,
  Plane,
  Briefcase,
  GraduationCap,
  Globe,
  Building,
  UserCheck,
  FileCheck,
  Scale,
  Code,
  CreditCard as CardIcon,
  Fingerprint,
} from 'lucide-react';
import { toast } from 'sonner';
import { applicationsAPI, uploadsAPI, servicesAPI } from '@/services/api';
import { PaystackPayment } from '@/components/PaystackPayment';

// Extended services list with new services
const services = [
  { id: 'cv', name: 'CV / Resume Maker', price: { NGN: 10000, USD: 15 }, icon: FileText, requiresCountry: false },
  { id: 'study', name: 'Study Abroad Application', price: { NGN: 500000, USD: 600 }, icon: GraduationCap, requiresCountry: true },
  { id: 'work', name: 'Work Visa Application', price: { NGN: 500000, USD: 600 }, icon: Briefcase, requiresCountry: true, isDynamic: true },
  { id: 'flight', name: 'Flight Booking', price: { NGN: 0, USD: 0 }, icon: Plane, isRequestBased: true },
  { id: 'hotel', name: 'Hotel Reservation', price: { NGN: 0, USD: 0 }, icon: Building, isRequestBased: true },
  { id: 'caregiver', name: 'Caregiver Certification', price: { NGN: 250000, USD: 300 }, icon: UserCheck, requiresCountry: true },
  { id: 'job_assessment', name: 'Job Assessment Fee', price: { NGN: 100000, USD: 120 }, icon: FileCheck },
  { id: 'lawyer', name: 'Lawyer Agreement Fee', price: { NGN: 50000, USD: 60 }, icon: Scale },
  { id: 'web_development', name: 'Web Development', price: { NGN: 100000, USD: 120 }, icon: Code, isDynamic: true, requiresWebsiteType: true },
  { id: 'visa_processing', name: 'Visa Processing Fee', price: { NGN: 500000, USD: 600 }, icon: Globe, requiresCountry: true },
  { id: 'biometric', name: 'Biometric Appointment Fee', price: { NGN: 350000, USD: 420 }, icon: Fingerprint },
];

const countries = [
  'Canada', 'United Kingdom', 'United States', 'Australia', 'Germany',
  'France', 'Netherlands', 'Ireland', 'Sweden', 'Finland', 'Denmark',
  'Poland', 'Hungary', 'Italy', 'Spain', 'China', 'Japan',
  'South Korea', 'UAE', 'Turkey', 'Saudi Arabia', 'Qatar',
];

const workTypes = [
  'Skilled Worker',
  'Professional',
  'Manager',
  'Technical',
  'Healthcare',
  'Education',
  'Hospitality',
  'Retail',
  'Other',
];

// Default website types (will be fetched from API if available)
const defaultWebsiteTypes = [
  { id: '1', name: 'Portfolio Website', basePrice: 150000 },
  { id: '2', name: 'E-commerce Store', basePrice: 350000 },
  { id: '3', name: 'Business Website', basePrice: 250000 },
  { id: '4', name: 'Blog Website', basePrice: 200000 },
  { id: '5', name: 'Landing Page', basePrice: 100000 },
  { id: '6', name: 'Educational Platform', basePrice: 500000 },
  { id: '7', name: 'Job Portal', basePrice: 450000 },
  { id: '8', name: 'Custom Web Application', basePrice: 1000000 },
];

export function NewApplicationPage() {
  const navigate = useNavigate();
  const { user, addApplication, addInvoice } = useStore();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [websiteTypes, setWebsiteTypes] = useState(defaultWebsiteTypes);
  
  // Dynamic pricing states
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedWebsiteType, setSelectedWebsiteType] = useState('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
    address: '',
    education: '',
    workExperience: '',
    skills: '',
    preferredCountries: [] as string[],
    program: '',
    university: '',
    jobRole: '',
    departureCountry: '',
    destinationCountry: '',
    departureDate: '',
    returnDate: '',
    checkIn: '',
    checkOut: '',
    city: '',
    notes: '',
    websiteDescription: '',
  });
  
  const service = services.find((s) => s.id === selectedService);
  
  // Fetch website types on mount
  useEffect(() => {
    const fetchWebsiteTypes = async () => {
      try {
        const response = await servicesAPI.getWebsiteTypes();
        if (response.success && response.data?.length > 0) {
          setWebsiteTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching website types:', error);
      }
    };
    fetchWebsiteTypes();
  }, []);
  
  // Fetch dynamic price when country/type changes
  useEffect(() => {
    const fetchDynamicPrice = async () => {
      if (!selectedService || !service) return;
      
      // For Work Visa with country
      if (service.id === 'work' && selectedCountry) {
        setIsLoadingPrice(true);
        try {
          const response = await servicesAPI.getPrice('work', { country: selectedCountry });
          if (response.success && response.data) {
            setCurrentPrice(response.data.priceAmount);
          } else {
            setCurrentPrice(service.price.NGN);
          }
        } catch (error) {
          console.error('Error fetching work visa price:', error);
          setCurrentPrice(service.price.NGN);
        }
        setIsLoadingPrice(false);
      }
      
      // For Web Development with website type
      if (service.id === 'web_development' && selectedWebsiteType) {
        const selected = websiteTypes.find(w => w.id === selectedWebsiteType);
        if (selected) {
          setCurrentPrice(selected.basePrice);
        }
      }
    };
    
    fetchDynamicPrice();
  }, [selectedService, selectedCountry, selectedWebsiteType, service, websiteTypes]);
  
  const price = currentPrice || (service ? service.price[currency] : 0);
  
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const toggleCountry = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter((c) => c !== country)
        : [...prev.preferredCountries, country],
    }));
  };
  
  const canProceed = () => {
    switch (step) {
      case 1:
        if (!selectedService) return false;
        // For dynamic services, require selection
        if (service?.requiresCountry && !selectedCountry) return false;
        if (service?.requiresWebsiteType && !selectedWebsiteType) return false;
        return true;
      case 2:
        return formData.fullName && formData.email && formData.phone;
      case 3:
        // For request-based services (flight/hotel), skip file upload requirement
        if (service?.isRequestBased) return true;
        return uploadedFiles.length > 0;
      default:
        return true;
    }
  };

  // Handle going to next step - create application on step 3
  const handleNextStep = async () => {
    if (step === 3) {
      setIsSubmitting(true);
      toast.info('Creating application... Please complete payment next.');
      try {
        // Upload files first (without application ID)
        let documentIds: string[] = [];
        if (uploadedFiles.length > 0) {
          const fileInput = new DataTransfer();
          uploadedFiles.forEach(file => fileInput.items.add(file));
          const uploadResponse = await uploadsAPI.upload(fileInput.files);
          
          if (uploadResponse.success && uploadResponse.data?.files) {
            documentIds = uploadResponse.data.files.map((f: any) => f.id);
            setUploadedFileIds(documentIds);
          }
        }

        // For request-based services (flight/hotel), create price request
        if (service?.isRequestBased) {
          // Create application with amount 0 (pending price)
          const applicationData = {
            applicationType: selectedService,
            typeLabel: service.name,
            amount: 0,
            currency,
            formData: { ...formData },
            documents: documentIds,
          };
          
          const response = await applicationsAPI.create(applicationData);
          
          // Link documents
          if (documentIds.length > 0 && response.data?.application?.id) {
            await uploadsAPI.linkDocuments(documentIds, response.data.application.id);
          }
          
          // Create price request
          const details = selectedService === 'flight' 
            ? { departureCountry: formData.departureCountry, destinationCountry: formData.destinationCountry, departureDate: formData.departureDate, returnDate: formData.returnDate }
            : { city: formData.city, checkIn: formData.checkIn, checkOut: formData.checkOut };
          
          await servicesAPI.createPriceRequest({
            application_id: response.data.application.id,
            service_type: selectedService,
            details,
          });
          
          toast.success('Price request submitted! Check your dashboard for admin quote.');
          setIsPaymentComplete(true);
          setStep(4);
          return;
        }

        // For paid services: create app + invoice
        const applicationData = {
          applicationType: selectedService,
          typeLabel: service?.name || '',
          amount: price,
          currency,
          formData: { ...formData },
          documents: documentIds,
        };
        
        const response = await applicationsAPI.create(applicationData);
        
        // Link documents
        if (documentIds.length > 0 && response.data?.application?.id) {
          await uploadsAPI.linkDocuments(documentIds, response.data.application.id);
        }
        
        if (response.data?.invoice) {
          setPendingInvoiceId(response.data.invoice.id);
          toast.success('Application created! Now complete your payment below.');
        }
      } catch (error: any) {
        console.error('Error:', error);
        toast.error('Failed to create application', { description: error.message });
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    } else {
      setStep(step + 1);
    }
    setStep(step + 1);
  };
  
  // DEPRECATED: handleSubmit - Payment now happens in step 4
  const handleSubmit = async () => {
    toast.info('Please complete payment first, then check your applications.');
    navigate('/dashboard/applications');
  };
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Select Service</Label>
        <p className="text-sm text-slate-500 mb-4">Choose the service you need</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedService(s.id);
                // Reset dynamic selections
                setSelectedCountry('');
                setSelectedWorkType('');
                setSelectedWebsiteType('');
                setCurrentPrice(s.price.NGN);
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedService === s.id
                  ? 'border-[#0a9396] bg-[#0a9396]/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-[#0a9396]/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedService === s.id ? 'bg-[#0a9396]' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <s.icon className={`w-5 h-5 ${selectedService === s.id ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                  {s.isRequestBased ? (
                    <p className="text-sm text-amber-600 font-semibold">Request for Price</p>
                  ) : s.isDynamic ? (
                    <p className="text-sm text-blue-600 font-semibold">Price varies by selection</p>
                  ) : (
                    <p className="text-sm text-[#0a9396] font-semibold">
                      {currency === 'NGN' ? '₦' : '$'}{s.price[currency].toLocaleString()}
                    </p>
                  )}
                </div>
                {selectedService === s.id && (
                  <CheckCircle className="w-5 h-5 text-[#0a9396]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dynamic selections based on service */}
      {selectedService && service?.requiresCountry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label>Select Country</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}
      
      {selectedService === 'work' && selectedCountry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label>Work Type</Label>
          <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
            <SelectTrigger>
              <SelectValue placeholder="Select work category" />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}
      
      {selectedService && service?.requiresWebsiteType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label>Website Type</Label>
          <Select value={selectedWebsiteType} onValueChange={setSelectedWebsiteType}>
            <SelectTrigger>
              <SelectValue placeholder="Select website type" />
            </SelectTrigger>
            <SelectContent>
              {websiteTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} - ₦{type.basePrice.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}
      
      <div>
        <Label className="text-base font-medium">Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as 'NGN' | 'USD')}>
          <SelectTrigger className="w-40 mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NGN">NGN (₦)</SelectItem>
            <SelectItem value="USD">USD ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {selectedService && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#0a9396]/10 rounded-xl border border-[#0a9396]/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              {service?.isRequestBased 
                ? 'Price to be confirmed by admin' 
                : service?.isDynamic 
                  ? `Price for ${selectedCountry || 'selected options'}`
                  : 'Service Fee'}
            </span>
            {isLoadingPrice ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#0a9396]" />
            ) : service?.isRequestBased ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-700">Request Quote</Badge>
            ) : (
              <span className="text-2xl font-bold text-[#0a9396]">
                {currency === 'NGN' ? '₦' : '$'}{price.toLocaleString()}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label>Email Address *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+234 800 123 4567"
          />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          />
        </div>
      </div>
      
      {selectedService === 'study' && (
        <>
          <div className="space-y-2">
            <Label>Preferred Countries</Label>
            <div className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <Badge
                  key={country}
                  variant={formData.preferredCountries.includes(country) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    formData.preferredCountries.includes(country)
                      ? 'bg-[#0a9396] hover:bg-[#005f73]'
                      : 'hover:border-[#0a9396]'
                  }`}
                  onClick={() => toggleCountry(country)}
                >
                  {country}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Program of Interest</Label>
            <Input
              value={formData.program}
              onChange={(e) => handleInputChange('program', e.target.value)}
              placeholder="e.g., Computer Science, Business Administration"
            />
          </div>
          
          <div className="space-y-2">
            <Label>University Choice (Optional)</Label>
            <Input
              value={formData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
              placeholder="e.g., University of Toronto"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Academic History</Label>
            <Textarea
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="List your educational background"
              rows={3}
            />
          </div>
        </>
      )}
      
      {selectedService === 'work' && (
        <>
          <div className="space-y-2">
            <Label>Job Role</Label>
            <Input
              value={formData.jobRole}
              onChange={(e) => handleInputChange('jobRole', e.target.value)}
              placeholder="e.g., Software Engineer"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Work Experience</Label>
            <Textarea
              value={formData.workExperience}
              onChange={(e) => handleInputChange('workExperience', e.target.value)}
              placeholder="Describe your work experience"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Skills</Label>
            <Textarea
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              placeholder="List your key skills"
              rows={2}
            />
          </div>
        </>
      )}
      
      {selectedService === 'flight' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departure Country</Label>
              <Input
                value={formData.departureCountry}
                onChange={(e) => handleInputChange('departureCountry', e.target.value)}
                placeholder="From"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination Country</Label>
              <Input
                value={formData.destinationCountry}
                onChange={(e) => handleInputChange('destinationCountry', e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input
                type="date"
                value={formData.departureDate}
                onChange={(e) => handleInputChange('departureDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Return Date</Label>
              <Input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
      
      {selectedService === 'hotel' && (
        <>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city name"
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Input
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Input
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
      
      {selectedService === 'web_development' && (
        <>
          <div className="space-y-2">
            <Label>Website Description</Label>
            <Textarea
              value={formData.websiteDescription}
              onChange={(e) => handleInputChange('websiteDescription', e.target.value)}
              placeholder="Describe what you want for your website..."
              rows={4}
            />
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <Label>Additional Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional information..."
          rows={3}
        />
      </div>
    </div>
  );
  
  const renderStep3 = () => {
    // For request-based services (flight/hotel), show different content
    if (service?.isRequestBased) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Plane className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Request for Price Quote
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Since we don't use booking APIs yet, please submit your travel details. 
              Our admin team will check the prices and send you a quote. 
              Once you agree, you can proceed to payment.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Your Request Details:</h4>
            <div className="space-y-2 text-sm">
              {selectedService === 'flight' && (
                <>
                  <p><span className="text-slate-500">Route:</span> {formData.departureCountry || 'Not specified'} → {formData.destinationCountry || 'Not specified'}</p>
                  <p><span className="text-slate-500">Departure:</span> {formData.departureDate || 'Not specified'}</p>
                  <p><span className="text-slate-500">Return:</span> {formData.returnDate || 'Not specified'}</p>
                </>
              )}
              {selectedService === 'hotel' && (
                <>
                  <p><span className="text-slate-500">City:</span> {formData.city || 'Not specified'}</p>
                  <p><span className="text-slate-500">Check-in:</span> {formData.checkIn || 'Not specified'}</p>
                  <p><span className="text-slate-500">Check-out:</span> {formData.checkOut || 'Not specified'}</p>
                </>
              )}
            </div>
          </div>
          
          {/* Optional file upload */}
          <div>
            <Label className="text-base font-medium">Upload Documents (Optional)</Label>
            <p className="text-sm text-slate-500 mb-4">
              Upload any relevant documents (passport copy, ID, etc.) - All file types accepted
            </p>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
              className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-[#0a9396]" />
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-slate-500">
                Maximum file size: 10MB per file
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
          
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Label>Uploaded Files ({uploadedFiles.length})</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#0a9396]" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Original file upload for non-request-based services
    return (
      <div className="space-y-6">
        <div>
          <Label className="text-base font-medium">Upload Documents</Label>
          <p className="text-sm text-slate-500 mb-4">
            Drag and drop files or click to browse. All file types accepted.
          </p>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
            className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#0a9396]" />
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-slate-500">
              Maximum file size: 10MB per file
            </p>
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
        
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Label>Uploaded Files ({uploadedFiles.length})</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#0a9396]" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };
  
  const steps = [
    { number: 1, title: 'Service', description: 'Select service' },
    { number: 2, title: 'Details', description: 'Enter information' },
    { number: 3, title: service?.isRequestBased ? 'Request' : 'Documents', description: service?.isRequestBased ? 'Submit request' : 'Upload files' },
    { number: 4, title: 'Payment', description: 'Complete order' },
  ];
  
  const renderStep4 = () => {
    // For request-based services, show success message
    if (service?.isRequestBased) {
      return (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Request Submitted Successfully!
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Your price request has been submitted. Our admin team will review your request 
            and send you a quote. You'll receive a notification once the price is ready.
            Please check your dashboard for updates.
          </p>
          <Button
            onClick={() => navigate('/dashboard/applications')}
            className="mt-4 gradient-primary text-white"
          >
            View My Applications
          </Button>
        </div>
      );
    }
    
    if (isPaymentComplete) {
      return (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Payment Successful!
          </h3>
          <p className="text-slate-500">Your application has been submitted successfully.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0a9396]/10 flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-[#0a9396]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Payment Required
          </h3>
          <p className="text-slate-500">Complete payment to submit your application</p>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Service</span>
                <span className="font-medium text-slate-900 dark:text-white">{service?.name}</span>
              </div>
              {selectedCountry && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Country</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedCountry}</span>
                </div>
              )}
              {selectedWebsiteType && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Website Type</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {websiteTypes.find(w => w.id === selectedWebsiteType)?.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Currency</span>
                <span className="font-medium text-slate-900 dark:text-white">{currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Documents</span>
                <span className="font-medium text-slate-900 dark:text-white">{uploadedFiles.length} files</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-[#0a9396]">
                    {currency === 'NGN' ? '₦' : '$'}{price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Paystack Payment Component */}
        {pendingInvoiceId ? (
          <PaystackPayment
            invoiceId={pendingInvoiceId}
            email={user?.email || formData.email || ''}
            amount={price}
            currency={currency}
            onSuccess={() => {
              setIsPaymentComplete(true);
              toast.success('Payment successful! Application submitted.', {
                description: `Redirecting to your applications...`,
              });
              setTimeout(() => navigate('/dashboard/applications'), 1500);
            }}
            onCancel={() => {
              toast.info('Payment cancelled. Complete payment from your invoices.');
              navigate('/dashboard/invoices');
            }}
          />
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#0a9396]" />
            <p className="text-slate-500">Preparing payment...</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Application</h1>
          <p className="text-slate-500">Submit a new service application</p>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm ${
                  step > s.number
                    ? 'bg-green-500 text-white'
                    : step === s.number
                    ? 'bg-[#0a9396] text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {step > s.number ? <CheckCircle className="w-4 h-4" /> : s.number}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 ${step >= s.number ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 sm:w-16 lg:w-20 h-0.5 mx-1 sm:mx-2 ${step > s.number ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{steps[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={step === 1 ? 'invisible' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNextStep}
            disabled={!canProceed() || isSubmitting}
            className="gradient-primary text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : step === 3 ? (
              <>
                Proceed to Payment
                <CreditCard className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

