const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth token
const getToken = () => {
  try {
    const stored = localStorage.getItem('esteetade-storage');
    if (!stored) return null;
    const state = JSON.parse(stored);
    return state?.state?.token || state?.token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Generic fetch wrapper
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error: any) {
    // Provide more helpful error messages for network failures
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
      throw new Error('Network error occurred. Please check your internet connection.');
    }
    throw error;
  }
}

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    referralCode?: string;
  }) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  // Forgot password - send OTP
  forgotPassword: (email: string) =>
    fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  // Verify OTP
  verifyOTP: (email: string, otp: string) =>
    fetchAPI('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
  
  // Reset password with token
  resetPassword: (password: string, confirmPassword: string, token: string) => {
    // Custom fetch for Authorization header
    return fetchAPI('/auth/reset-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password, confirmPassword }),
    });
  },
  
  getMe: () => fetchAPI('/auth/me'),
  
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    bio?: string;
    avatar?: string;
  }) =>
    fetchAPI('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Applications APIs
export const applicationsAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/applications${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id: string) => fetchAPI(`/applications/${id}`),
  
  create: (data: {
    applicationType: string;
    typeLabel: string;
    amount: number;
    currency: string;
    formData?: Record<string, any>;
    documents?: string[];
  }) =>
    fetchAPI('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { status?: string; progress?: number; notes?: string }) =>
    fetchAPI(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/applications/${id}`, {
      method: 'DELETE',
    }),
  
  getStats: () => fetchAPI('/applications/stats/overview'),
  
  // Export applications to CSV
  export: (params?: { status?: string; search?: string }) => {
    const token = getToken();
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/applications/export?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = token ? `${url}&token=${token}` : url;
    link.download = `applications-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Users APIs
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/users${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id: string) => fetchAPI(`/users/${id}`),
  
  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    adminApproved?: boolean;
  }) =>
    fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  approveAgent: (id: string) =>
    fetchAPI(`/users/${id}/approve`, {
      method: 'POST',
    }),
  
  rejectAgent: (id: string, reason?: string) =>
    fetchAPI(`/users/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  getStats: () => fetchAPI('/users/stats/overview'),
  
  getMyClients: () => fetchAPI('/users/agent/clients'),
  
  // Export users to CSV
  export: (params?: { role?: string; status?: string; search?: string }) => {
    const token = getToken();
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/users/export?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = token ? `${url}&token=${token}` : url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Invoices APIs
export const invoicesAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/invoices${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id: string) => fetchAPI(`/invoices/${id}`),
  
  pay: (id: string, data?: { paymentMethod?: string; paymentReference?: string }) =>
    fetchAPI(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getStats: () => fetchAPI('/invoices/stats/overview'),
  
  refund: (id: string, reason?: string) =>
    fetchAPI(`/invoices/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  // Download invoice as HTML receipt
  download: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Export invoices to CSV
  export: (params?: { status?: string }) => {
    const token = getToken();
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `${API_BASE_URL}/exports/invoices/all?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = token ? `${url}&token=${token}` : url;
    link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Payments APIs
export const paymentsAPI = {
  initialize: (invoiceId: string) =>
    fetchAPI('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    }),
  
  verify: (reference: string) =>
    fetchAPI(`/payments/verify/${reference}`),
  
  // Demo payment for testing
  demo: (invoiceId: string) =>
    fetchAPI('/payments/demo', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    }),
};

// Notifications APIs
export const notificationsAPI = {
  getAll: (params?: { limit?: number; unreadOnly?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    
    const queryString = queryParams.toString();
    return fetchAPI(`/notifications${queryString ? '?' + queryString : ''}`);
  },
  
  markAsRead: (id: string) =>
    fetchAPI(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  
  markAllAsRead: () =>
    fetchAPI('/notifications/read-all', {
      method: 'PUT',
    }),
  
  delete: (id: string) =>
    fetchAPI(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

// Upload APIs
export const uploadsAPI = {
  upload: async (files: FileList, applicationId?: string) => {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    if (applicationId) {
      formData.append('applicationId', applicationId);
    }
    
    const token = getToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // If response is not JSON, throw a generic error
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Upload failed: ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },
  
  getMyFiles: () => fetchAPI('/uploads/my-files'),
  
  delete: (id: string) =>
    fetchAPI(`/uploads/${id}`, {
      method: 'DELETE',
    }),
  
  // Link documents to an application
  linkDocuments: (documentIds: string[], applicationId: string) =>
    fetchAPI('/uploads/link-documents', {
      method: 'PUT',
      body: JSON.stringify({ documentIds, applicationId }),
    }),
  
  // Download uploaded file from Wasabi (uses file ID)
  download: async (fileId: string) => {
    const response = await fetch(`${API_BASE_URL}/uploads/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const data = await response.json();
    if (data.success && data.data.url) {
      // Prepend backend URL if the URL is relative
      let downloadUrl = data.data.url;
      if (downloadUrl.startsWith('/uploads/')) {
        // Get the backend base URL without the /api suffix
        const backendUrl = API_BASE_URL.replace('/api', '');
        downloadUrl = `${backendUrl}${downloadUrl}`;
      }
      window.open(downloadUrl, '_blank');
    }
  },
};

export default {
  auth: authAPI,
  applications: applicationsAPI,
  users: usersAPI,
  invoices: invoicesAPI,
  notifications: notificationsAPI,
  uploads: uploadsAPI,
};

// Services APIs - for dynamic pricing and price requests
export const servicesAPI = {
  // Get all service prices
  getPrices: (params?: { service_type?: string; country?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.service_type) queryParams.append('service_type', params.service_type);
    if (params?.country) queryParams.append('country', params.country);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/services/prices${queryString ? '?' + queryString : ''}`);
  },
  
  // Get price for a specific service
  getPrice: (serviceType: string, params?: { country?: string; work_type?: string; website_type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.country) queryParams.append('country', params.country);
    if (params?.work_type) queryParams.append('work_type', params.work_type);
    if (params?.website_type) queryParams.append('website_type', params.website_type);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/services/prices/${serviceType}${queryString ? '?' + queryString : ''}`);
  },
  
  // Update service price (admin only)
  updatePrice: (serviceType: string, data: {
    country?: string;
    work_type?: string;
    website_type?: string;
    price_amount: number;
    currency?: string;
    is_active?: boolean;
  }) =>
    fetchAPI(`/services/prices/${serviceType}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Get all website types
  getWebsiteTypes: () => fetchAPI('/services/website-types'),
  
  // Create price request (for flight/hotel)
  createPriceRequest: (data: {
    application_id?: string;
    service_type: string;
    details: Record<string, any>;
  }) =>
    fetchAPI('/services/price-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get price requests
  getPriceRequests: (params?: { status?: string; service_type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.service_type) queryParams.append('service_type', params.service_type);
    
    const queryString = queryParams.toString();
    return fetchAPI(`/services/price-requests${queryString ? '?' + queryString : ''}`);
  },
  
  // Admin: Respond to price request
  respondToPriceRequest: (id: string, data: { admin_price: number; admin_notes?: string }) =>
    fetchAPI(`/services/price-requests/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Client: Accept or reject price quote
  respondToQuote: (id: string, accept: boolean) =>
    fetchAPI(`/services/price-requests/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ accept }),
    }),
};
