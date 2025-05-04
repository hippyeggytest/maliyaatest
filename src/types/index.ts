//   Common types
export interface User {
  id?: number;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'main-supervisor' | 'grade-supervisor';
  email: string;
  schoolId?: number;
  grade?: string;
  grades?: string[]; // For grade supervisors with multiple grades
}

export interface School {
  id?: number;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  subscriptionStart: string;
  subscriptionEnd: string;
}

export interface Student {
  id?: number;
  name: string;
  grade: string;
  schoolId: number;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string;
  useTransportation?: boolean;
  transportationType?: 'none' | 'one-way' | 'two-way';
  transportationFee?: number;
  busRoute?: string;
}

export interface Fee {
  id?: number;
  name: string;
  amount: number;
  dueDate: string;
  grade: string;
  schoolId: number;
  installments: number;
  description: string;
  studentId?: number; // Optional, for student-specific fees
}

export interface Payment {
  id?: number;
  amount: number;
  date: string;
  studentId: number;
  feeId: number;
  schoolId: number;
  paymentMethod: string;
  notes?: string;
  installmentNumber?: number;
}

export interface Receipt {
  id?: number;
  paymentId: number;
  studentId: number;
  schoolId: number;
  date: string;
  receiptNumber?: string;
  pdfUrl?: string;
}

export interface Installment {
  id?: number;
  feeId: number;
  studentId: number;
  schoolId: number;
  number: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial';
  paidAmount?: number;
  paidDate?: string;
}

export interface SyncItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entity: 'school' | 'student' | 'fee' | 'payment' | 'user' | 'receipt' | 'installment' | 'messageTemplate';
  entityId?: number;
  data: any;
  timestamp: number;
  synced?: string; // Changed to string type 'yes' or 'no'
  syncedAt?: string;
}

export interface SyncLog {
  id?: number;
  entity: string;
  timestamp: number;
  count: number;
}

export interface MessageTemplate {
  id?: number;
  name: string;
  content: string;
  schoolId: number;
}

// Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  error: string | null;
}

export interface AppContextType {
  currentSchool: School | null;
  setCurrentSchool: (school: School | null) => void;
}

export interface ConnectionContextType {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  pendingSyncs: number;
  syncNow: () => Promise<void>;
}
 