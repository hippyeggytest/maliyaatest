import  { useState, useEffect, useRef } from 'react';
import { User, Plus, Search, Edit, Trash, Phone, Calendar, Download, Upload, Filter, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../db';
import { Student, Fee } from '../../types';
import { useConnection } from '../../contexts/ConnectionContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { importStudentsFromFile, saveImportedStudents, exportStudentTemplate, exportStudentsToExcel } from '../../utils/importExport';

const Students = () => {
  const { user } = useAuth();
  const { isOnline } = useConnection();
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTransportation, setSelectedTransportation] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    students: Student[],
    studentFees: {studentName: string, fee: Partial<Fee>}[]
  } | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
    parentName: '',
    parentPhone: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    schoolId: user?.schoolId,
    useTransportation: false,
    transportationType: 'none',
    transportationFee: 0,
    busRoute: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user?.schoolId) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.students.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show students from their grade
      if (user.role === 'grade-supervisor' && user.grade) {
        // Support for grade supervisors with multiple grades (comma-separated)
        if (user.grade.includes(',')) {
          const grades = user.grade.split(',');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ 
        ...formData, 
        [name]: checked,
        transportationType: checked ? formData.transportationType || 'one-way' : 'none',
        transportationFee: checked ? formData.transportationFee || 0 : 0 
      });
    } else if (name === 'transportationFee') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let studentId: number;
      
      if (isEditing && formData.id) {
        await db.students.update(formData.id, formData);
        studentId = formData.id;
        
        // Add to sync queue if online
        if (isOnline) {
          // Add to sync
        }
      } else {
        studentId = await db.students.add(formData as Student);
        
        // Add to sync queue if online
        if (isOnline) {
          // Add to sync
        }
      }
      
      setShowForm(false);
      setFormData({
        name: '',
        grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
        parentName: '',
        parentPhone: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        schoolId: user?.schoolId,
        useTransportation: false,
        transportationType: 'none',
        transportationFee: 0,
        busRoute: ''
      });
      setIsEditing(false);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setFormData({
      ...student,
      enrollmentDate: new Date(student.enrollmentDate).toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await db.students.delete(id);
        
        // Add to sync queue if online
        if (isOnline) {
          // Add to sync
        }
        
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleSendWhatsApp = (student: Student) => {
    if (!student.parentPhone) return;
    
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    // Create message content
    const message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nهذه رسالة تجريبية من نظام إدارة مالية المدارس.\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
    
    // Create WhatsApp link with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleExportStudents = () => {
    exportStudentsToExcel(students);
  };

  const handleExportTemplate = () => {
    exportStudentTemplate();
  };

  const handleImportStudents = () => {
    setImportPreview(null);
    setImportStatus('');
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    setImportStatus('جاري تحليل الملف...');
    setImportPreview(null);
    
    try {
      const result = await importStudentsFromFile(file, user?.schoolId || 0);
      setImportPreview(result);
      setImportStatus(`تم العثور على ${result.students.length} طالب و ${result.studentFees.length} رسوم`);
    } catch (error) {
      console.error('Error parsing import file:', error);
      setImportStatus(`خطأ: ${error instanceof Error ? error.message : 'حدث خطأ أثناء تحليل الملف'}`);
    }
  };

  const handleProcessImport = async () => {
    if (!importPreview || !user?.schoolId) return;
    
    setIsImporting(true);
    setImportStatus('جاري استيراد البيانات...');
    
    try {
      const result = await saveImportedStudents(
        importPreview.students, 
        importPreview.studentFees
      );
      
      setImportStatus(`تم استيراد ${result.savedStudents} طالب و ${result.savedFees} رسوم بنجاح`);
      
      // Refresh the student list
      fetchStudents();
      
      // Close the modal after a delay
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        setImportStatus('');
        setIsImporting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving imported data:', error);
      setImportStatus(`خطأ: ${error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ البيانات'}`);
      setIsImporting(false);
    }
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters
  let filteredStudents = students;
  
  if (searchTerm) {
    filteredStudents = filteredStudents.filter(
      student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentPhone.includes(searchTerm) ||
        (student.busRoute && student.busRoute.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  if (selectedGrade) {
    filteredStudents = filteredStudents.filter(student => student.grade === selectedGrade);
  }
  
  if (selectedTransportation !== 'all') {
    filteredStudents = filteredStudents.filter(student => {
      if (selectedTransportation === 'yes') {
        return student.useTransportation === true;
      } else if (selectedTransportation === 'no') {
        return student.useTransportation !== true;
      } else if (selectedTransportation === 'one-way') {
        return student.useTransportation === true && student.transportationType === 'one-way';
      } else if (selectedTransportation === 'two-way') {
        return student.useTransportation === true && student.transportationType === 'two-way';
      }
      return true;
    });
  }
  
  // Apply sorting
  filteredStudents = [...filteredStudents].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortField) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'grade':
        valueA = a.grade;
        valueB = b.grade;
        break;
      case 'parentName':
        valueA = a.parentName;
        valueB = b.parentName;
        break;
      case 'enrollmentDate':
        valueA = new Date(a.enrollmentDate).getTime();
        valueB = new Date(b.enrollmentDate).getTime();
        break;
      case 'transportationFee':
        valueA = a.transportationFee || 0;
        valueB = b.transportationFee || 0;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  const grades = [
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
      <div className="page-header relative">
        <img 
          src="https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="Modern School"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-700 opacity-90"></div>
        <div className="page-header-content">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">إدارة بيانات الطلاب</h2>
            <p className="text-white/90">
              إضافة وتعديل وإدارة الطلاب وبياناتهم الأساسية
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">إدارة الطلاب</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportTemplate}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-5 w-5 ml-2" />
            قالب الاستيراد
          </button>
          <button
            onClick={handleExportStudents}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <Download className="h-5 w-5 ml-2" />
            تصدير الطلاب
          </button>
          <button
            onClick={handleImportStudents}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Upload className="h-5 w-5 ml-2" />
            استيراد الطلاب
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
                parentName: '',
                parentPhone: '',
                enrollmentDate: new Date().toISOString().split('T')[0],
                schoolId: user?.schoolId,
                useTransportation: false,
                transportationType: 'none',
                transportationFee: 0,
                busRoute: ''
              });
              setIsEditing(false);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-5 w-5 ml-2" />
            إضافة طالب
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 ml-2" />
          تصفية الطلاب
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              بحث
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="form-input block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                placeholder="البحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="transportation-filter" className="block text-sm font-medium text-gray-700 mb-1">
              النقل المدرسي
            </label>
            <select
              id="transportation-filter"
              className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={selectedTransportation}
              onChange={(e) => setSelectedTransportation(e.target.value)}
            >
              <option value="all">الكل</option>
              <option value="yes">مشترك في النقل</option>
              <option value="one-way">نقل اتجاه واحد</option>
              <option value="two-way">نقل اتجاهين</option>
              <option value="no">غير مشترك في النقل</option>
            </select>
          </div>
        </div>
        
        {/* Sort options */}
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="text-sm font-medium text-gray-700">ترتيب حسب:</span>
          <button
            onClick={() => handleSortChange('name')}
            className={`text-sm px-2 py-1 rounded ${
              sortField === 'name' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الاسم {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('grade')}
            className={`text-sm px-2 py-1 rounded ${
              sortField === 'grade' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الصف {sortField === 'grade' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('enrollmentDate')}
            className={`text-sm px-2 py-1 rounded ${
              sortField === 'enrollmentDate' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تاريخ التسجيل {sortField === 'enrollmentDate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('transportationFee')}
            className={`text-sm px-2 py-1 rounded ${
              sortField === 'transportationFee' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            رسوم النقل {sortField === 'transportationFee' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  اسم الطالب
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
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                  الصف
                </label>
                <div className="mt-1">
                  <select
                    id="grade"
                    name="grade"
                    required
                    value={formData.grade}
                    onChange={handleInputChange}
                    disabled={user?.role === 'grade-supervisor' && !user.grade?.includes(',')}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">اختر الصف</option>
                    {user?.role === 'grade-supervisor' && user.grade?.includes(',')
                      ? user.grade.split(',').map(grade => (
                          <option key={grade} value={grade.trim()}>
                            {grade.trim()}
                          </option>
                        ))
                      : grades.map(grade => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))
                    }
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
                  اسم ولي الأمر
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="parentName"
                    id="parentName"
                    required
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">
                  رقم هاتف ولي الأمر
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="parentPhone"
                    id="parentPhone"
                    required
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="968-12345678"
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700">
                  تاريخ التسجيل
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="enrollmentDate"
                    id="enrollmentDate"
                    required
                    value={formData.enrollmentDate}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="useTransportation"
                    name="useTransportation"
                    type="checkbox"
                    checked={formData.useTransportation}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useTransportation" className="mr-2 block text-sm font-medium text-gray-700">
                    مشترك في النقل المدرسي
                  </label>
                </div>
              </div>

              {formData.useTransportation && (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="transportationType" className="block text-sm font-medium text-gray-700">
                      نوع النقل
                    </label>
                    <div className="mt-1">
                      <select
                        id="transportationType"
                        name="transportationType"
                        value={formData.transportationType}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="one-way">اتجاه واحد</option>
                        <option value="two-way">اتجاهان</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="transportationFee" className="block text-sm font-medium text-gray-700">
                      رسوم النقل
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="transportationFee"
                        id="transportationFee"
                        value={formData.transportationFee}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="busRoute" className="block text-sm font-medium text-gray-700">
                      مسار الحافلة
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="busRoute"
                        id="busRoute"
                        value={formData.busRoute}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isEditing ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} hover className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mr-3">{student.name}</h3>
              </div>
              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                {student.grade}
              </span>
            </CardHeader>
            <CardBody>
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">ولي الأمر:</span>
                  <span className="font-medium">{student.parentName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{student.parentPhone}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">تاريخ التسجيل:</span>
                  <span className="font-medium">{new Date(student.enrollmentDate).toLocaleDateString('en-US')}</span>
                </div>
                
                {student.useTransportation && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">النقل المدرسي:</span>
                      <span className="font-medium">{student.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهان'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">رسوم النقل:</span>
                      <span className="font-medium">{student.transportationFee} ريال</span>
                    </div>
                    {student.busRoute && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">مسار الحافلة:</span>
                        <span className="font-medium">{student.busRoute}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => handleSendWhatsApp(student)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
                  title="إرسال واتساب"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(student)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors"
                  title="تعديل"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
                  title="حذف"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white p-8 text-center rounded-lg shadow-sm">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">لا يوجد طلاب</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm || selectedGrade || selectedTransportation !== 'all' ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد طلاب مسجلين بعد'}
          </p>
          {!(searchTerm || selectedGrade || selectedTransportation !== 'all') && (
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  grade: user?.role === 'grade-supervisor' ? user?.grade || '' : '',
                  parentName: '',
                  parentPhone: '',
                  enrollmentDate: new Date().toISOString().split('T')[0],
                  schoolId: user?.schoolId,
                  useTransportation: false,
                  transportationType: 'none',
                  transportationFee: 0,
                  busRoute: ''
                });
                setIsEditing(false);
                setShowForm(true);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
            >
              <Plus className="h-5 w-5 ml-2" />
              إضافة طالب
            </button>
          )}
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
                      استيراد الطلاب
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        قم بتحميل ملف Excel أو CSV يحتوي على بيانات الطلاب.
                        الملف يجب أن يحتوي على الأعمدة التالية:
                        الاسم, الصف, اسم ولي الأمر, رقم الهاتف
                      </p>
                      
                      <div className="mt-4">
                        <label htmlFor="importFile" className="block text-sm font-medium text-gray-700 mb-2">
                          اختر ملف Excel أو CSV
                        </label>
                        <input
                          type="file"
                          id="importFile"
                          accept=".xlsx,.xls,.csv"
                          ref={fileInputRef}
                          onChange={handleFileSelected}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      {importStatus && (
                        <div className={`mt-4 p-3 rounded-md ${
                          importStatus.includes('خطأ') 
                            ? 'bg-red-50 text-red-800' 
                            : importStatus.includes('جاري') 
                              ? 'bg-blue-50 text-blue-800' 
                              : 'bg-green-50 text-green-800'
                        }`}>
                          {importStatus.includes('خطأ') && (
                            <AlertCircle className="inline-block mb-1 h-4 w-4 ml-1" />
                          )}
                          {importStatus.includes('جاري') && (
                            <div className="inline-block h-4 w-4 mr-1 border-2 border-r-0 border-blue-600 rounded-full animate-spin"></div>
                          )}
                          {!importStatus.includes('خطأ') && !importStatus.includes('جاري') && (
                            <CheckCircle className="inline-block mb-1 h-4 w-4 ml-1" />
                          )}
                          {importStatus}
                        </div>
                      )}
                      
                      {importPreview && (
                        <div className="mt-4">
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium flex justify-between">
                              <span>معاينة البيانات</span>
                              <span>{importPreview.students.length} طالب</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      الاسم
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      الصف
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      ولي الأمر
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      النقل
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {importPreview.students.slice(0, 5).map((student, index) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 text-xs text-gray-900">{student.name}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900">{student.grade}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900">{student.parentName}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900">
                                        {student.useTransportation 
                                          ? student.transportationType === 'one-way' 
                                            ? 'اتجاه واحد' 
                                            : 'اتجاهان'
                                          : 'لا'
                                        }
                                      </td>
                                    </tr>
                                  ))}
                                  {importPreview.students.length > 5 && (
                                    <tr>
                                      <td colSpan={4} className="px-3 py-2 text-xs text-gray-500 text-center">
                                        ... و {importPreview.students.length - 5} طالب آخر
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {importPreview.studentFees.length > 0 && (
                            <div className="mt-3 border rounded-md overflow-hidden">
                              <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium flex justify-between">
                                <span>الرسوم المدرسية</span>
                                <span>{importPreview.studentFees.length} رسوم</span>
                              </div>
                              <div className="max-h-32 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                        الطالب
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                        الرسوم
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                        المبلغ
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                        الأقساط
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {importPreview.studentFees.slice(0, 3).map((item, index) => (
                                      <tr key={index}>
                                        <td className="px-3 py-2 text-xs text-gray-900">{item.studentName}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900">{item.fee.name}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900">{item.fee.amount?.toLocaleString()} ريال</td>
                                        <td className="px-3 py-2 text-xs text-gray-900">{item.fee.installments}</td>
                                      </tr>
                                    ))}
                                    {importPreview.studentFees.length > 3 && (
                                      <tr>
                                        <td colSpan={4} className="px-3 py-2 text-xs text-gray-500 text-center">
                                          ... و {importPreview.studentFees.length - 3} رسوم أخرى
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleProcessImport}
                  disabled={!importPreview || isImporting}
                >
                  {isImporting && <div className="mr-2 h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin"></div>}
                  استيراد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview(null);
                    setImportStatus('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={isImporting}
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

export default Students;
 