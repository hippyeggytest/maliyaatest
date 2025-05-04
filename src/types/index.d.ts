//  Type declarations for global Installment type
declare interface Installment {
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
 