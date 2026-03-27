// src/services/socket.ts
import { io } from 'socket.io-client';
import { toast } from 'sonner';
// import type { ApiResponse } from '@/types/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Application {
  id: string;
  typeLabel: string;
  status: string;
  progress?: number;
}

interface Payment {
  amount: number;
  currency: string;
}

// Event callback type
type EventCallback = (data: unknown) => void;

class SocketService {
  socket: any = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private applicationUpdateCallbacks: Set<(app: Application) => void> = new Set();
  private isConnecting: boolean = false;

  connect(token: string) {
    // Prevent multiple connections
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Socket connection in progress, waiting...');
      return this.socket;
    }

    this.isConnecting = true;

    // Disconnect any existing socket first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (import.meta.env.DEV) {
      this.socket = io(SOCKET_URL.replace('/api', ''), {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
      });
    } else {
      console.warn('Socket.IO disabled in production (Vercel serverless)');
    }

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
      this.isConnecting = false;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
      this.isConnecting = false;
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error.message);
    });

    // Notifications
    this.socket.on('notification:new', (notification: { type: 'info' | 'success' | 'warning' | 'error'; title: string; message: string }) => {
      const notifyFn = (toast as any)[notification.type] || toast.info;
      notifyFn(notification.title, { description: notification.message });
    });

    // Application updates - notify all registered callbacks
    this.socket.on('application:update', (application: Application) => {
      console.log('📱 Application update received:', application);
      
      // Show toast notification
      toast.info('Application Update', {
        description: `Your ${application.typeLabel} is now ${application.status}`,
      });
      
      // Notify all registered callbacks
      this.applicationUpdateCallbacks.forEach(callback => {
        try {
          callback(application);
        } catch (error) {
          console.error('Error in application update callback:', error);
        }
      });
    });

    // New application notification for admins
    this.socket.on('application:new', (application: Application) => {
      toast.info('New Application', {
        description: `New ${application.typeLabel} application received`,
      });
    });

    // Payment received
    this.socket.on('payment:received', (payment: Payment) => {
      toast.success('Payment Received', {
        description: `Payment of ${payment.currency} ${payment.amount.toLocaleString()} confirmed`,
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.applicationUpdateCallbacks.clear();
      console.log('🔌 Socket disconnected');
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  emit(event: string, data: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Register callback for application updates (for real-time UI updates)
  onApplicationUpdate(callback: any) {
    this.applicationUpdateCallbacks.add(callback);
    console.log('📱 Application update callback registered, total:', this.applicationUpdateCallbacks.size);
  }

  // Remove application update callback
  offApplicationUpdate(callback: (application: Application) => void) {
    this.applicationUpdateCallbacks.delete(callback);
  }

  on(event: string, callback: EventCallback) {
    // Store the callback for reconnection
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    // Also attach to socket if connected
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: EventCallback) {
    // Remove from stored listeners
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
    
    // Remove from socket
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const socketService = new SocketService();
export default socketService;
