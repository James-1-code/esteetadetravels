import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { servicesAPI } from '@/services/api';
import {
  DollarSign,
  Plus,
  Edit,
  Loader2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

// Service types that can have prices
const serviceTypes = [
  { id: 'cv', name: 'CV / Resume Maker' },
  { id: 'study', name: 'Study Abroad Application' },
  { id: 'work', name: 'Work Visa Application' },
  { id: 'caregiver', name: 'Caregiver Certification' },
  { id: 'job_assessment', name: 'Job Assessment Fee' },
  { id: 'lawyer', name: 'Lawyer Agreement Fee' },
  { id: 'web_development', name: 'Web Development' },
  { id: 'visa_processing', name: 'Visa Processing Fee' },
  { id: 'biometric', name: 'Biometric Appointment Fee' },
];

const countries = [
  'Canada', 'United Kingdom', 'United States', 'Australia', 'Germany',
  'France', 'Netherlands', 'Ireland', 'Sweden', 'Finland', 'Denmark',
  'Poland', 'Hungary', 'Italy', 'Spain', 'China', 'Japan',
  'South Korea', 'UAE', 'Turkey', 'Saudi Arabia', 'Qatar', 'Other',
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

export function AdminServicePricingPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [websiteTypes, setWebsiteTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    serviceType: '',
    country: '',
    workType: '',
    websiteType: '',
    priceAmount: '',
    currency: 'NGN',
  });

  useEffect(() => {
    fetchPrices();
    fetchWebsiteTypes();
  }, []);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.getPrices();
      if (response.success) {
        setPrices(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Failed to load service prices');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebsiteTypes = async () => {
    try {
      const response = await servicesAPI.getWebsiteTypes();
      if (response.success) {
        setWebsiteTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching website types:', error);
    }
  };

  const handleOpenDialog = (price?: any) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        serviceType: price.serviceType || '',
        country: price.country || '',
        workType: price.workType || '',
        websiteType: price.websiteType || '',
        priceAmount: price.priceAmount?.toString() || '',
        currency: price.currency || 'NGN',
      });
    } else {
      setEditingPrice(null);
      setFormData({
        serviceType: '',
        country: '',
        workType: '',
        websiteType: '',
        priceAmount: '',
        currency: 'NGN',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (!formData.serviceType || !formData.priceAmount) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        country: formData.country || undefined,
        work_type: formData.workType || undefined,
        website_type: formData.websiteType || undefined,
        price_amount: parseFloat(formData.priceAmount),
        currency: formData.currency,
      };

      await servicesAPI.updatePrice(formData.serviceType, data);
      
      toast.success(editingPrice ? 'Price updated successfully' : 'Price created successfully');
      setIsDialogOpen(false);
      fetchPrices();
    } catch (error: any) {
      console.error('Error saving price:', error);
      toast.error('Failed to save price', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceName = (serviceType: string) => {
    return serviceTypes.find(s => s.id === serviceType)?.name || serviceType;
  };

  // Group prices by service type
  const groupedPrices = prices.reduce((acc: any, price: any) => {
    const serviceType = price.serviceType || 'unknown';
    if (!acc[serviceType]) {
      acc[serviceType] = [];
    }
    acc[serviceType].push(price);
    return acc;
  }, {});

  // Show work-related services (work visa with country/type)
  const showCountryField = formData.serviceType === 'work' || formData.serviceType === 'study' || formData.serviceType === 'caregiver' || formData.serviceType === 'visa_processing';
  const showWorkTypeField = formData.serviceType === 'work';
  const showWebsiteTypeField = formData.serviceType === 'web_development';

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
            Service Pricing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage service prices by country and work type
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add New Price
        </Button>
      </motion.div>

      {/* Info Card */}
      <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Dynamic Pricing</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Work Visa prices can vary by country and work type. Add specific prices for each combination.
                The system will automatically select the most specific price available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prices List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Prices</span>
              <Button variant="ghost" size="sm" onClick={fetchPrices}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
              </div>
            ) : prices.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No prices configured yet</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4 gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Price
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPrices).map(([serviceType, servicePrices]: [string, any]) => (
                  <div key={serviceType}>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Badge variant="outline">{getServiceName(serviceType)}</Badge>
                    </h3>
                    <div className="grid gap-3">
                      {servicePrices.map((price: any) => (
                        <div
                          key={price.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#0a9396]/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#0a9396]/10 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-[#0a9396]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {price.country && (
                                  <Badge variant="secondary">{price.country}</Badge>
                                )}
                                {price.workType && (
                                  <Badge variant="secondary">{price.workType}</Badge>
                                )}
                                {price.websiteType && (
                                  <Badge variant="secondary">{price.websiteType}</Badge>
                                )}
                                {!price.country && !price.workType && !price.websiteType && (
                                  <Badge variant="secondary">Base Price</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#0a9396]">
                                ₦{price.priceAmount?.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500">{price.currency}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(price)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPrice ? 'Edit Price' : 'Add New Price'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                disabled={!!editingPrice}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showCountryField && (
              <div className="space-y-2">
                <Label>Country (Optional)</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Leave empty for base price</p>
              </div>
            )}

            {showWorkTypeField && (
              <div className="space-y-2">
                <Label>Work Type (Optional)</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => setFormData({ ...formData, workType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Leave empty for base price</p>
              </div>
            )}

            {showWebsiteTypeField && (
              <div className="space-y-2">
                <Label>Website Type (Optional)</Label>
                <Select
                  value={formData.websiteType}
                  onValueChange={(value) => setFormData({ ...formData, websiteType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select website type" />
                  </SelectTrigger>
                  <SelectContent>
                    {websiteTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name} - ₦{type.basePrice?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Leave empty for base price</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Amount *</Label>
                <Input
                  type="number"
                  value={formData.priceAmount}
                  onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice} disabled={isSaving} className="gradient-primary text-white">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : editingPrice ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editingPrice ? 'Update Price' : 'Add Price'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

