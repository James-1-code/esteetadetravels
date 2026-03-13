import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authAPI, uploadsAPI } from '@/services/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Copy,
  CheckCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: '',
  });
  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      // Upload the file
      const fileInput = new DataTransfer();
      fileInput.items.add(file);
      const uploadResponse = await uploadsAPI.upload(fileInput.files);
      
      if (uploadResponse.success && uploadResponse.data?.files?.[0]) {
        const uploadedFile = uploadResponse.data.files[0];
        
        // Update user profile with the avatar URL
        const response = await authAPI.updateProfile({
          avatar: uploadedFile.url || uploadedFile.id,
        });
        
        if (response.data) {
          const { setUser } = useStore.getState();
          setUser(response.data);
          setAvatarUrl(uploadedFile.url || uploadedFile.id);
          toast.success('Profile picture updated successfully!');
        }
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  const handleCopyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      });
      
      if (response.data) {
        const { setUser } = useStore.getState();
        setUser(response.data);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </motion.div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto h-9">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs sm:text-sm">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl || user?.avatar} />
                      <AvatarFallback className="text-xl gradient-primary text-white">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0a9396] text-white flex items-center justify-center shadow-lg hover:bg-[#005f73] transition-colors disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                      <Badge className="bg-[#0a9396]/10 text-[#0a9396] capitalize text-xs">
                        {user?.role}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant={isEditing ? 'outline' : 'default'}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className={isEditing ? '' : 'gradient-primary text-white text-sm h-9'}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      'Save Changes'
                    ) : (
                      'Edit Profile'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-[#0a9396]" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="pl-10 h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="pl-10 h-9"
                        placeholder="+234 800 123 4567"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Referral Code (for agents) */}
          {user?.role === 'agent' && user?.referralCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#d4af37]">
                    <Shield className="w-5 h-5" />
                    Agent Referral Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Share this code with clients to earn commissions on their applications.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-lg font-mono text-lg text-center">
                      {user.referralCode}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferral}
                      className="h-14 w-14"
                    >
                      {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button className="gradient-primary text-white">Update Password</Button>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Enable 2FA</p>
                  <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Email notifications', 'SMS notifications', 'Push notifications', 'Marketing emails'].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-[#0a9396]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
