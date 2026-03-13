export interface Application {
  id: string;
  clientId: string;
  agentId?: string;
  type: 'cv' | 'study' | 'work' | 'flight' | 'hotel' | 'document';
  typeLabel: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface Payment {
  id: string;
  amount: number;
  currency: 'NGN' | 'USD';
}