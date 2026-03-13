import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socketService } from '@/services/socket';

export type UserRole = 'client' | 'agent' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  referralCode?: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

export interface Application {
  id: string;
  clientId: string;
  agentId?: string;
  type: 'cv' | 'study' | 'work' | 'flight' | 'hotel' | 'document';
  typeLabel: string;
  amount: number;
  currency: 'NGN' | 'USD';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  documents: string[];
  createdAt: string;
  updatedAt: string;
  progress: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  applicationId: string;
  clientId: string;
  amount: number;
  currency: 'NGN' | 'USD';
  status: 'paid' | 'unpaid' | 'refunded';
  createdAt: string;
  paidAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  applications: Application[];
  invoices: Invoice[];
  notifications: Notification[];

  sidebarOpen: boolean;
  darkMode: boolean;
  notificationsOpen: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;

  setApplications: (applications: Application[]) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;

  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      applications: [],
      invoices: [],
      notifications: [],
      sidebarOpen: true,
      darkMode: false,
      notificationsOpen: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Connect to socket after login
        socketService.connect(token);
        const welcomeNotification: Notification = {
          id: `notif-${Date.now()}`,
          userId: user.id,
          title: 'Welcome back!',
          message: `Hello ${user.firstName}, welcome to Esteetade Travels!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        };
        get().addNotification(welcomeNotification);
      },

      logout: () => {
        socketService.disconnect();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          applications: [],
          invoices: [],
          notifications: [],
        });
      },

      setApplications: (applications) => set({ applications }),
      addApplication: (application) =>
        set((state) => ({
          applications: [application, ...state.applications],
        })),
      updateApplication: (id, updates) =>
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, ...updates } : app
          ),
        })),

      setInvoices: (invoices) => set({ invoices }),
      addInvoice: (invoice) =>
        set((state) => ({ invoices: [invoice, ...state.invoices] })),

      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
        })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.darkMode;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newDarkMode);
          }
          return { darkMode: newDarkMode };
        }),
      setDarkMode: (dark) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', dark);
        }
        set({ darkMode: dark });
      },

      toggleNotifications: () =>
        set((state) => ({ notificationsOpen: !state.notificationsOpen })),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
    }),
    {
      name: 'esteetade-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        darkMode: state.darkMode,
      }),
    }
  )
);

