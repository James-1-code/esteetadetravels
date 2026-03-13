// src/types/api.ts

/**
 * Generic API response type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Payment initialization data from backend
 */
export interface PaymentInitData {
  reference: string;
  access_code?: string; // Optional, depends on your backend
  authorization_url?: string; // Optional, depends on your backend
}