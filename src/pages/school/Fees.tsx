//  Update the Fees component to fix grade-specific account permissions
import { useState, useEffect } from 'react';
import { Clipboard, Calendar, Plus, Edit, Trash, Search, Filter, Download, Upload, FileText, MessageCircle, Printer, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../db';
import { Fee, Student } from '../../types';
import { useConnection } from '../../contexts/ConnectionContext';
import { generateReceipt } from '../../utils/pdfGenerator';

const Fees = () => {
  const { user } = useAuth();
  const { isOnline } = useConnection();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [currentSchool, setCurrentSchool] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<Fee>>({
    name: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
    installments: 1,
    description: '',
    schoolId: user?.schoolId,
    studentId: undefined
  });
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'student'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // New state to track which grades a supervisor manages
  const [supervisedGrades, setSupervisedGrades] = useState<string[]>([]);

  useEffect(() => {
    if (user?.schoolId) {
      fetchFees();
      fetchStudents();
      fetchSchool();
      
      // Parse the grades assigned to this supervisor
      if (user.role === 'grade-supervisor' && user.grade) {
        const grades = user.grade.includes(',') 
          ? user.grade.split(',').map(g => g.trim()) 
          : [user.grade];
        setSupervisedGrades(grades);
      }
    }
  }, [user]);

  const fetchSchool = async () => {
    try {
      if (!user?.schoolId) return;
      const school = await db.schools.get(user.schoolId);
      setCurrentSchool(school || null);
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

  const fetchFees = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.fees.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show fees from their grade(s)
      if (user.role === 'grade-supervisor' && user.grade) {
        // Support for multiple grades (comma-separated)
        if (user.grade.includes(',')) {
          const grades = user.grade.split(',').map(g => g.trim());
          query = query.and(fee => {
            // Allow specific student fees for this supervisor's grades
            if (fee.studentId) {
              // Need to check if the student is in one of our grades
              return db.students.get(fee.studentId).then(student => {
                return student && grades.includes(student.grade);
              });
            }
            // Or regular grade fees for supervised grades
            return grades.includes(fee.grade);
          });
        } else {
          // Single grade supervisor
          query = query.and(fee => {
            // Allow specific student fees for this grade
            if (fee.studentId) {
              // Need to check if the student is in our grade
              return db.students.get(fee.studentId).then(student => {
                return student && student.grade === user.grade;
              });
            }
            // Or regular grade fees for this grade
            return fee.grade === user.grade;
          });
        }
      }
      
      const allFees = await query.toArray();
      setFees(allFees);
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.students.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show students from their grade(s)
      if (user.role === 'grade-supervisor' && user.grade) {
        // Support for multiple grades
        if (user.grade.includes(',')) {
          const grades = user.grade.split(',').map(g => g.trim());
          query = query.and(student => grades.includes(student.grade));
        } else {
          query = query.and(student => student.grade === user.grade);
        }
      }
      
      const allStudents = await query.toArray();
      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount' || name === 'installments') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === 'studentId') {
      const studentId = value ? parseInt(value) : undefined;
      
      if (studentId) {
        const student = students.find(s => s.id === studentId);
        setFormData({ 
          ...formData, 
          studentId, 
          grade: student ? student.grade : formData.grade 
        });
      } else {
        setFormData({ ...formData, studentId: undefined });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let feeId: number;
      
      if (isEditing && formData.id) {
        await db.fees.update(formData.id, formData);
        feeId = formData.id;
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'update',
            entity: 'fee',
            entityId: formData.id,
            data: formData,
            timestamp: Date.now()
          });
        }
      } else {
        feeId = await db.fees.add(formData as Fee);
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'create',
            entity: 'fee',
            entityId: feeId,
            data: formData,
            timestamp: Date.now()
          });
        }
      }
      
      // Create installments if specified
      if (formData.installments && formData.installments > 1 && formData.amount) {
        const installmentAmount = formData.amount / formData.installments;
        const baseDate = new Date(formData.dueDate || new Date());
        
        // Delete existing installments first if editing
        if (isEditing && formData.id) {
          await db.table('installments').where('feeId').equals(formData.id).delete();
        }
        
        // Create new installments
        for (let i = 1; i <= formData.installments; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(baseDate.getMonth() + (i - 1));
          
          await db.table('installments').add({
            feeId,
            studentId: formData.studentId,
            schoolId: user?.schoolId,
            number: i,
            amount: installmentAmount,
            dueDate: dueDate.toISOString(),
            status: 'unpaid'
          });
        }
      }
      
      setShowForm(false);
      setFormData({
        name: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
        installments: 1,
        description: '',
        schoolId: user?.schoolId,
        studentId: undefined
      });
      setIsEditing(false);
      fetchFees();
    } catch (error) {
      console.error('Error saving fee:', error);
    }
  };

  const handleEdit = (fee: Fee) => {
    setFormData({
      ...fee,
      dueDate: new Date(fee.dueDate).toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (confirm('هل أنت متأكد من حذف هذه الرسوم؟')) {
      try {
        await db.fees.delete(id);
        
        // Delete associated installments
        await db.table('installments').where('feeId').equals(id).delete();
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'delete',
            entity: 'fee',
            entityId: id,
            data: { id },
            timestamp: Date.now()
          });
        }
        
        fetchFees();
      } catch (error) {
        console.error('Error deleting fee:', error);
      }
    }
  };

  const handleGenerateReceipt = async (fee: Fee) => {
    try {
      if (!fee.id || !currentSchool) return;
      
      // If fee is for a specific student
      if (fee.studentId) {
        const student = await db.students.get(fee.studentId);
        if (student) {
          await generateReceipt({
            receiptNumber: `F-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            schoolName: currentSchool.name,
            schoolLogo: currentSchool.logo,
            studentName: student.name,
            grade: student.grade,
            feeName: fee.name,
            amount: fee.amount,
            paymentMethod: "غير محدد",
            notes: fee.description || ""
          });
        }
      } else {
        // For general fees without specific student
        await generateReceipt({
          receiptNumber: `F-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          schoolName: currentSchool.name,
          schoolLogo: currentSchool.logo,
          studentName: "رسوم عامة",
          grade: fee.grade,
          feeName: fee.name,
          amount: fee.amount,
          paymentMethod: "غير محدد",
          notes: fee.description || ""
        });
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const handleSendWhatsApp = async (fee: Fee) => {
    try {
      if (!fee.studentId) {
        alert('هذه الرسوم ليست مرتبطة بطالب محدد.');
        return;
      }
      
      const student = await db.students.get(fee.studentId);
      if (!student) return;
      
      // Format phone number for WhatsApp
      let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
      
      // Make sure the phone number starts with the country code
      if (!phoneNumber.startsWith('968')) {
        phoneNumber = '968' + phoneNumber;
      }
      
      // Create message content
      const message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nنود تذكيركم بدفع الرسوم المستحقة للطالب ${student.name} في الصف ${student.grade}.\nاسم الرسوم: ${fee.name}\nالمبلغ: ${fee.amount} ريال\nتاريخ الاستحقاق: ${new Date(fee.dueDate).toLocaleDateString('ar-SA')}\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
      
      // Create WhatsApp link with pre-filled message
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      // Open in a new tab
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const handleExportFees = () => {
    // Create CSV header
    const csvHeader = 'اسم الرسوم,المبلغ,تاريخ الاستحقاق,الصف,عدد الأقساط,الوصف,اسم الطالب\n';
    
    // Create CSV content
    let csvContent = csvHeader;
    fees.forEach(fee => {
      const student = fee.studentId ? students.find(s => s.id === fee.studentId)?.name || '' : '';
      
      csvContent += `${fee.name},${fee.amount},${new Date(fee.dueDate).toLocaleDateString('ar-SA')},${fee.grade},${fee.installments},${fee.description || ''},${student}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fees.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTemplate = () => {
    // Create CSV template
    const csvHeader = 'اسم الرسوم,المبلغ,تاريخ الاستحقاق,الصف,عدد الأقساط,الوصف,اسم الطالب\n';
    const csvExample = 'الرسوم الدراسية,5000,2023-09-01,الصف 1,2,رسوم العام الدراسي,محمد أحمد\n';
    
    // Create blob and download
    const blob = new Blob([csvHeader, csvExample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fees_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFees = () => {
    setShowImportModal(true);
  };

  const processImportFile = async () => {
    if (!importFile) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) return;
        
        const csvData = event.target.result as string;
        const lines = csvData.split('\n');
        
        // Skip header row
        const newFees: Fee[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          if (values.length >= 6) {
            const studentName = values[6]?.trim();
            let studentId: number | undefined = undefined;
            
            if (studentName) {
              const student = students.find(s => s.name === studentName);
              if (student) {
                // Check if this grade supervisor can add fees for this student
                if (user?.role === 'grade-supervisor' && user?.grade) {
                  const supervisorGrades = user.grade.includes(',') 
                    ? user.grade.split(',').map(g => g.trim()) 
                    : [user.grade];
                  
                  if (!supervisorGrades.includes(student.grade)) {
                    console.warn(`Skipping fee for student ${studentName} - not in supervisor's grades`);
                    continue;
                  }
                }
                
                studentId = student.id;
              }
            }
            
            // For grade supervisors, check the grade is within their supervised grades
            const feeGrade = values[3]?.trim();
            if (user?.role === 'grade-supervisor' && user?.grade && !studentId) {
              const supervisorGrades = user.grade.includes(',') 
                ? user.grade.split(',').map(g => g.trim()) 
                : [user.grade];
              
              if (!supervisorGrades.includes(feeGrade)) {
                console.warn(`Skipping fee for grade ${feeGrade} - not in supervisor's grades`);
                continue;
              }
            }
            
            newFees.push({
              name: values[0].trim(),
              amount: parseFloat(values[1]?.trim() || '0'),
              dueDate: values[2]?.trim() || new Date().toISOString(),
              grade: feeGrade,
              installments: parseInt(values[4]?.trim() || '1'),
              description: values[5]?.trim() || '',
              schoolId: user?.schoolId!,
              studentId
            });
          }
        }
        
        if (newFees.length > 0) {
          // Add all fees to the database
          for (const fee of newFees) {
            const feeId = await db.fees.add(fee);
            
            // Create installments if specified
            if (fee.installments && fee.installments > 1 && fee.amount) {
              const installmentAmount = fee.amount / fee.installments;
              const baseDate = new Date(fee.dueDate);
              
              for (let i = 1; i <= fee.installments; i++) {
                const dueDate = new Date(baseDate);
                dueDate.setMonth(baseDate.getMonth() + (i - 1));
                
                await db.table('installments').add({
                  feeId,
                  studentId: fee.studentId,
                  schoolId: user?.schoolId,
                  number: i,
                  amount: installmentAmount,
                  dueDate: dueDate.toISOString(),
                  status: 'unpaid'
                });
              }
            }
            
            // Add to sync queue if online
            if (isOnline) {
              await db.syncQueue.add({
                operation: 'create',
                entity: 'fee',
                data: { ...fee, id: feeId },
                timestamp: Date.now()
              });
            }
          }
          
          setShowImportModal(false);
          setImportFile(null);
          fetchFees();
          alert(`تم استيراد ${newFees.length} رسوم بنجاح`);
        }
      };
      
      reader.readAsText(importFile);
    } catch (error) {
      console.error('Error importing fees:', error);
      alert('حدث خطأ أثناء استيراد الرسوم');
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewMode('student');
  };

  // Apply filters
  let filteredFees = fees;
  
  if (searchTerm) {
    filteredFees = filteredFees.filter(
      fee =>
        fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedGrade) {
    filteredFees = filteredFees.filter(fee => fee.grade === selectedGrade);
  }
  
  if (selectedStudentId) {
    filteredFees = filteredFees.filter(fee => fee.studentId === selectedStudentId);
  }

  // For student view
  const studentFees = selectedStudent ? 
    fees.filter(fee => fee.studentId === selectedStudent.id || fee.grade === selectedStudent.grade) : 
    [];

  // Get available grades based on role
  const grades = user?.role === 'grade-supervisor' && supervisedGrades.length > 0 
    ? supervisedGrades
    : [
        'روضة 1',
        'التمهيدي',
        'الصف 1',
        'الصف 2',
        'الصف 3',
        'الصف 4',
        'الصف 5',
        'الصف 6',
        'الصف 7',
        'الصف 8',
        'الصف 9',
        'الصف 10',
        'الصف 11',
        'الصف 12'
      ];

  return (
    <div>
      <div className="page-header">
        <div className="pattern-bg absolute inset-0 opacity-5"></div>
        <div className="page-header-content">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">إدارة الرسوم</h2>
            <p className="text-white/90">
              تسجيل وإدارة وتتبع الرسوم الدراسية والأقساط
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {viewMode === 'all' ? 'إدارة الرسوم' : `رسوم الطالب: ${selectedStudent?.name}`}
        </h2>
        <div className="flex flex-wrap gap-2">
          {viewMode === 'student' && (
            <button
              onClick={() => setViewMode('all')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              العودة للرسوم
            </button>
          )}
          {viewMode === 'all' && (
            <>
              <button
                onClick={handleExportTemplate}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="h-5 w-5 ml-2" />
                قالب الاستيراد
              </button>
              <button
                onClick={handleImportFees}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Upload className="h-5 w-5 ml-2" />
                استيراد الرسوم
              </button>
              <button
                onClick={handleExportFees}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                <Download className="h-5 w-5 ml-2" />
                تصدير الرسوم
              </button>
              <button
                onClick={() => {
                  setFormData({
                    name: '',
                    amount: 0,
                    dueDate: new Date().toISOString().split('T')[0],
                    grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
                    installments: 1,
                    description: '',
                    schoolId: user?.schoolId,
                    studentId: undefined
                  });
                  setIsEditing(false);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <Plus className="h-5 w-5 ml-2" />
                إضافة رسوم
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'all' && !showForm && (
        <div className="section-card mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">طلاب المدرسة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {students.map(student => (
              <div 
                key={student.id} 
                onClick={() => handleSelectStudent(student)} 
                className="bg-white border rounded-lg shadow-sm hover:shadow-md p-4 cursor-pointer transition-all"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mr-3">
                    <h4 className="text-base font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.grade}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-600">عرض الرسوم</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                    <FileText className="h-3 w-3 ml-1" />
                    رسوم الطالب
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'all' && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            تصفية الرسوم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-800 mb-1">
                بحث
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="form-input block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="البحث عن رسوم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-800 mb-1">
                الصف
              </label>
              <select
                id="grade-filter"
                className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="">كل الصفوف</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-800 mb-1">
                الطالب
              </label>
              <select
                id="student-filter"
                className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">كل الطلاب</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'تعديل بيانات الرسوم' : 'إضافة رسوم جديدة'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-800">
                  اسم الرسوم
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-800 flex items-center">
                  <span>الطالب (اختياري)</span>
                  <FileText className="mr-2 h-4 w-4 text-primary-600" />
                </label>
                <div className="mt-1">
                  <select
                    id="studentId"
                    name="studentId"
                    value={formData.studentId || ''}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">رسوم عامة (لجميع الطلاب)</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="grade" className="block text-sm font-medium text-gray-800">
                  الصف
                </label>
                <div className="mt-1">
                  <select
                    id="grade"
                    name="grade"
                    required
                    value={formData.grade}
                    onChange={handleInputChange}
                    disabled={formData.studentId !== undefined}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-800">
                  المبلغ
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="installments" className="block text-sm font-medium text-gray-800">
                  عدد الأقساط
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="installments"
                    id="installments"
                    required
                    min="1"
                    value={formData.installments}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-800">
                  تاريخ الاستحقاق
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    required
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-800">
                  الوصف
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                {isEditing ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student Fees View */}
      {viewMode === 'student' && selectedStudent && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-xl font-medium text-gray-900">{selectedStudent.name}</h3>
              <p className="text-gray-600">{selectedStudent.grade}</p>
              <p className="text-sm text-gray-500">ولي الأمر: {selectedStudent.parentName}</p>
            </div>
          </div>

          <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">الرسوم والمستحقات</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student-specific fees */}
            <div className="border rounded-lg p-5">
              <h5 className="text-base font-medium text-gray-900 mb-4">الرسوم الخاصة بالطالب</h5>
              {studentFees.filter(f => f.studentId === selectedStudent.id).length > 0 ? (
                <div className="space-y-4">
                  {studentFees
                    .filter(f => f.studentId === selectedStudent.id)
                    .map(fee => (
                      <div key={fee.id} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-medium text-gray-900">{fee.name}</h6>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSendWhatsApp(fee)}
                              className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              title="إرسال واتساب"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateReceipt(fee)}
                              className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                              title="طباعة إيصال"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-800">{fee.amount.toLocaleString()} ريال</span>
                          <span className="text-gray-600">تاريخ الاستحقاق: {new Date(fee.dueDate).toLocaleDateString('ar-SA')}</span>
                        </div>
                        {fee.installments > 1 && (
                          <div className="mt-2 text-xs text-primary-600">
                            مقسمة على {fee.installments} أقساط
                          </div>
                        )}
                        {fee.description && (
                          <p className="mt-2 text-sm text-gray-600">{fee.description}</p>
                        )}
                      </div>
                    ))
                }
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  لا توجد رسوم خاصة بالطالب
                </div>
              )}
            </div>

            {/* Grade fees */}
            <div className="border rounded-lg p-5">
              <h5 className="text-base font-medium text-gray-900 mb-4">الرسوم العامة للصف ({selectedStudent.grade})</h5>
              {studentFees.filter(f => f.studentId === undefined && f.grade === selectedStudent.grade).length > 0 ? (
                <div className="space-y-4">
                  {studentFees
                    .filter(f => f.studentId === undefined && f.grade === selectedStudent.grade)
                    .map(fee => (
                      <div key={fee.id} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-medium text-gray-900">{fee.name}</h6>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setFormData({
                                  ...fee,
                                  studentId: selectedStudent.id,
                                  id: undefined // Create new fee specific to this student
                                });
                                setIsEditing(false);
                                setShowForm(true);
                              }}
                              className="p-1 rounded bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                              title="تخصيص للطالب"
                            >
                              <User className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-800">{fee.amount.toLocaleString()} ريال</span>
                          <span className="text-gray-600">تاريخ الاستحقاق: {new Date(fee.dueDate).toLocaleDateString('ar-SA')}</span>
                        </div>
                        {fee.installments > 1 && (
                          <div className="mt-2 text-xs text-primary-600">
                            مقسمة على {fee.installments} أقساط
                          </div>
                        )}
                        {fee.description && (
                          <p className="mt-2 text-sm text-gray-600">{fee.description}</p>
                        )}
                      </div>
                    ))
                }
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  لا توجد رسوم عامة للصف
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  amount: 0,
                  dueDate: new Date().toISOString().split('T')[0],
                  grade: selectedStudent.grade,
                  installments: 1,
                  description: '',
                  schoolId: user?.schoolId,
                  studentId: selectedStudent.id
                });
                setIsEditing(false);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <Plus className="h-5 w-5 ml-2" />
              إضافة رسوم للطالب
            </button>
          </div>
        </div>
      )}

      {/* Fees List - Only show in 'all' view */}
      {viewMode === 'all' && !showForm && (
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              إجمالي الرسوم: <span className="font-medium">{filteredFees.length}</span>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredFees.length > 0 ? (
              filteredFees.map((fee) => (
                <li key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Clipboard className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="mr-4">
                          <h4 className="text-base font-medium text-gray-900">{fee.name}</h4>
                          <div className="mt-1 flex items-center flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                              {fee.grade}
                            </span>
                            {fee.studentId && (
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                {students.find(s => s.id === fee.studentId)?.name || 'طالب'}
                              </span>
                            )}
                            {fee.installments > 1 && (
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-100 text-yellow-800">
                                {fee.installments} أقساط
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendWhatsApp(fee)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          title="إرسال واتساب"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateReceipt(fee)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          title="طباعة إيصال"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(fee)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          title="حذف"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex gap-6">
                        <p className="flex items-center text-sm text-gray-700">
                          <span className="font-medium">المبلغ:</span> {fee.amount.toLocaleString()} ريال
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                          <span className="font-medium">عدد الأقساط:</span> {fee.installments}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                          <Calendar className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-500" />
                          <span className="font-medium">تاريخ الاستحقاق:</span>{' '}
                          <time dateTime={fee.dueDate}>
                            {new Date(fee.dueDate).toLocaleDateString('ar-SA')}
                          </time>
                        </p>
                      </div>
                    </div>
                    {fee.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{fee.description}</p>
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                {searchTerm || selectedGrade || selectedStudentId ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد رسوم مسجلة بعد'}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      استيراد الرسوم
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        قم بتحميل ملف CSV يحتوي على بيانات الرسوم. يجب أن يكون الملف بنفس تنسيق القالب الذي يمكنك تحميله من زر "قالب الاستيراد".
                      </p>
                      <div className="mt-4">
                        <label htmlFor="importFile" className="block text-sm font-medium text-gray-800">
                          ملف CSV
                        </label>
                        <input
                          type="file"
                          id="importFile"
                          accept=".csv"
                          onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={processImportFile}
                  disabled={!importFile}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  استيراد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
 