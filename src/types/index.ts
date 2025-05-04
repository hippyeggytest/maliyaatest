//   Common types
export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'school_admin' | 'teacher' | 'student';
  email: string;
  schoolId: number | null;
  grade: string | null;
}

export interface School {
  id: number;
  name: string;
  logo: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  school_id: number;
  plan: string;
  status: 'active' | 'inactive' | 'cancelled';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Fee {
  id: number;
  school_id: number;
  name: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Student {
  id: number;
  school_id: number;
  name: string;
  grade: string | null;
  parent_name: string | null;
  contact_number: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  school_id: number;
  student_id: number;
  fee_id: number;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string;
  created_at: string;
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
 