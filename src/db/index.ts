import  Dexie, { Table } from 'dexie';
import { School, Student, Fee, Payment, User, Receipt, SyncItem, Installment, SyncLog, MessageTemplate } from '../types';

class SchoolFinanceDatabase extends Dexie {
  schools!: Table<School>;
  students!: Table<Student>;
  fees!: Table<Fee>;
  payments!: Table<Payment>;
  users!: Table<User>;
  receipts!: Table<Receipt>;
  syncQueue!: Table<SyncItem>;
  syncLog!: Table<SyncLog>;
  messageTemplates!: Table<MessageTemplate>;
  installments!: Table<Installment>;

  constructor() {
    super('SchoolFinanceDB');
    this.version(3).stores({
      schools: '++id, name, status, subscriptionEnd',
      students: '++id, name, grade, schoolId, [schoolId+grade], transportationType',
      fees: '++id, name, amount, dueDate, grade, schoolId, [schoolId+grade], studentId',
      payments: '++id, amount, date, studentId, feeId, schoolId, [schoolId+studentId], [schoolId+feeId]',
      users: '++id, username, role, schoolId, grade',
      receipts: '++id, paymentId, studentId, schoolId, date, receiptNumber',
      syncQueue: '++id, operation, entity, entityId, timestamp, synced',
      syncLog: '++id, entity, timestamp, count',
      messageTemplates: '++id, name, schoolId',
      installments: '++id, feeId, studentId, schoolId, number, amount, dueDate, status, [schoolId+studentId], [feeId+studentId+number]'
    });
  }
}

export const db = new SchoolFinanceDatabase();

export async function initDb() {
  if (await db.schools.count() === 0) {
    console.log('Database is empty, initializing with sample data');
    await seedSampleData();
  }
}

async function seedSampleData() {
  // Admin user
  await db.users.add({
    id: 1,
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    name: 'مدير النظام',
    role: 'admin',
    email: 'admin@example.com'
  });

  // Sample school
  const schoolId = await db.schools.add({
    name: 'مدرسة النور الدولية',
    logo: 'https://images.unsplash.com/photo-1472377723522-4768db9c41ce?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBidWlsZGluZyUyMGNsYXNzcm9vbSUyMGVkdWNhdGlvbnxlbnwwfHx8fDE3NDYyMDM5NDJ8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '968-123456789',
    email: 'info@alnoor.edu',
    status: 'active',
    subscriptionStart: new Date().toISOString(),
    subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  });

  // School supervisor users
  await db.users.bulkAdd([
    {
      id: 2,
      username: 'supervisor',
      password: 'super123', // In a real app, this would be hashed
      name: 'أحمد محمد',
      role: 'main-supervisor',
      schoolId: schoolId,
      email: 'ahmed@alnoor.edu'
    },
    {
      id: 3,
      username: 'grade1',
      password: 'grade123', // In a real app, this would be hashed
      name: 'سارة عبدالله',
      role: 'grade-supervisor',
      schoolId: schoolId,
      grade: 'الصف 1',
      email: 'sara@alnoor.edu'
    }
  ]);

  // Sample students with transportation data
  const studentIds = await db.students.bulkAdd([
    {
      name: 'خالد عبدالرحمن',
      grade: 'الصف 1',
      schoolId: schoolId,
      parentName: 'عبدالرحمن محمد',
      parentPhone: '968-511234567',
      enrollmentDate: new Date().toISOString(),
      useTransportation: true,
      transportationType: 'two-way',
      transportationFee: 1200,
      busRoute: 'المسار الشمالي'
    },
    {
      name: 'فاطمة أحمد',
      grade: 'الصف 1',
      schoolId: schoolId,
      parentName: 'أحمد علي',
      parentPhone: '968-522345678',
      enrollmentDate: new Date().toISOString(),
      useTransportation: true,
      transportationType: 'one-way',
      transportationFee: 800,
      busRoute: 'المسار الغربي'
    },
    {
      name: 'محمد سعد',
      grade: 'الصف 2',
      schoolId: schoolId,
      parentName: 'سعد إبراهيم',
      parentPhone: '968-533456789',
      enrollmentDate: new Date().toISOString(),
      useTransportation: false,
      transportationType: 'none',
      transportationFee: 0,
      busRoute: ''
    },
    {
      name: 'عمر خالد',
      grade: 'الصف 1',
      schoolId: schoolId,
      parentName: 'خالد عمر',
      parentPhone: '968-544567890',
      enrollmentDate: new Date().toISOString(),
      useTransportation: false,
      transportationType: 'none',
      transportationFee: 0,
      busRoute: ''
    },
    {
      name: 'سارة محمد',
      grade: 'الصف 2',
      schoolId: schoolId,
      parentName: 'محمد إبراهيم',
      parentPhone: '968-555678901',
      enrollmentDate: new Date().toISOString(),
      useTransportation: true,
      transportationType: 'two-way',
      transportationFee: 1200,
      busRoute: 'المسار الشرقي'
    }
  ]);

  // Sample fees
  const feeIds = await db.fees.bulkAdd([
    {
      name: 'الرسوم الدراسية السنوية',
      amount: 10000,
      dueDate: new Date().toISOString(),
      grade: 'الصف 1',
      schoolId: schoolId,
      installments: 2,
      description: 'الرسوم الدراسية للعام الدراسي 2023-2024'
    },
    {
      name: 'رسوم الأنشطة',
      amount: 1000,
      dueDate: new Date().toISOString(),
      grade: 'الصف 1',
      schoolId: schoolId,
      installments: 1,
      description: 'رسوم الأنشطة والرحلات المدرسية'
    },
    {
      name: 'رسوم الكتب الدراسية',
      amount: 1500,
      dueDate: new Date().toISOString(),
      grade: 'الصف 2',
      schoolId: schoolId,
      installments: 1,
      description: 'رسوم الكتب الدراسية للعام الدراسي 2023-2024'
    }
  ]);

  // Create installments for the fees
  // For the first fee (2 installments)
  await db.installments.bulkAdd([
    {
      feeId: feeIds[0],
      studentId: studentIds[0],
      schoolId: schoolId,
      number: 1,
      amount: 5000,
      dueDate: new Date().toISOString(),
      status: 'paid',
      paidAmount: 5000,
      paidDate: new Date().toISOString()
    },
    {
      feeId: feeIds[0],
      studentId: studentIds[0],
      schoolId: schoolId,
      number: 2,
      amount: 5000,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'unpaid'
    },
    {
      feeId: feeIds[1],
      studentId: studentIds[0],
      schoolId: schoolId,
      number: 1,
      amount: 1000,
      dueDate: new Date().toISOString(),
      status: 'paid',
      paidAmount: 1000,
      paidDate: new Date().toISOString()
    },
    {
      feeId: feeIds[0],
      studentId: studentIds[1],
      schoolId: schoolId,
      number: 1,
      amount: 5000,
      dueDate: new Date().toISOString(),
      status: 'partial',
      paidAmount: 3000,
      paidDate: new Date().toISOString()
    },
    {
      feeId: feeIds[0],
      studentId: studentIds[1],
      schoolId: schoolId,
      number: 2,
      amount: 5000,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'unpaid'
    },
    {
      feeId: feeIds[2],
      studentId: studentIds[2],
      schoolId: schoolId,
      number: 1,
      amount: 1500,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
      status: 'unpaid'
    }
  ]);

  // Sample payments
  await db.payments.bulkAdd([
    {
      amount: 5000,
      date: new Date().toISOString(),
      studentId: studentIds[0],
      feeId: feeIds[0],
      schoolId: schoolId,
      paymentMethod: 'نقداً',
      notes: 'الدفعة الأولى',
      installmentNumber: 1
    },
    {
      amount: 1000,
      date: new Date().toISOString(),
      studentId: studentIds[0],
      feeId: feeIds[1],
      schoolId: schoolId,
      paymentMethod: 'تحويل بنكي',
      notes: 'رسوم الأنشطة كاملة',
      installmentNumber: 1
    },
    {
      amount: 3000,
      date: new Date().toISOString(),
      studentId: studentIds[1],
      feeId: feeIds[0],
      schoolId: schoolId,
      paymentMethod: 'نقداً',
      notes: 'دفعة جزئية من القسط الأول',
      installmentNumber: 1
    }
  ]);

  // Message templates
  await db.messageTemplates.bulkAdd([
    {
      name: 'تذكير بالرسوم',
      content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنود تذكيركم بموعد سداد الرسوم الدراسية المستحقة للطالب {studentName} في الصف {grade}. نرجو التكرم بسداد المبلغ في أقرب وقت ممكن.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
      schoolId: schoolId
    },
    {
      name: 'تأكيد الدفع',
      content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنشكركم على سداد الرسوم الدراسية للطالب {studentName} في الصف {grade} بتاريخ {date}.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
      schoolId: schoolId
    },
    {
      name: 'إشعار غياب',
      content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنود إشعاركم بغياب الطالب {studentName} من الصف {grade} اليوم {date}. يرجى التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
      schoolId: schoolId
    }
  ]);

  // Initialize syncQueue with string synced property
  await db.syncQueue.add({
    operation: 'create',
    entity: 'school',
    entityId: schoolId,
    data: { id: schoolId },
    timestamp: Date.now(),
    synced: 'yes'
  });
}

export default db;
 