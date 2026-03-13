// src/store/mockData.ts
import type { Application, Invoice, Notification } from './index';

export const generateMockApplications = (userId: string): Application[] => [
  {
    id: 'app-001',
    clientId: userId,
    type: 'study',
    typeLabel: 'Study Abroad',
    amount: 250000,
    currency: 'NGN',
    status: 'pending',
    documents: ['passport.pdf', 'transcript.pdf'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 25,
    notes: 'Application under initial review',
  },
  {
    id: 'app-002',
    clientId: userId,
    type: 'cv',
    typeLabel: 'CV/Resume',
    amount: 10000,
    currency: 'NGN',
    status: 'completed',
    documents: ['cv_template.docx'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 100,
    notes: 'CV delivered successfully',
  },
];

export const generateMockInvoices = (userId: string): Invoice[] => [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    invoiceNumber: 'INV-2024-0001',
    applicationId: 'app-001',
    clientId: userId,
    amount: 250000,
    currency: 'NGN',
    status: 'paid',
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    invoiceNumber: 'INV-2024-0002',
    applicationId: 'app-002',
    clientId: userId,
    amount: 10000,
    currency: 'NGN',
    status: 'paid',
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  },
];

export const generateMockNotifications = (userId: string): Notification[] => [
  {
    id: 'notif-001',
    userId,
    title: 'Application Update',
    message: 'Your Study Abroad application is now under review.',
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-002',
    userId,
    title: 'Payment Successful',
    message: 'Your payment of ₦250,000 has been received.',
    type: 'success',
    read: true,
    createdAt: new Date().toISOString(),
  },
];