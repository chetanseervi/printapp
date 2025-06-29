export interface PrintJob {
  id: string;
  fileName: string;
  fileUrl: string;
  copies: number;
  isColor: boolean;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  name: string;
} 