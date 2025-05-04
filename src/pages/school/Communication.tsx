import  { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, User, Download, Edit, Trash, Plus, Search, Phone, ArrowLeft, Users, List, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../db';
import { Student, MessageTemplate } from '../../types';
import { Card, CardBody, CardHeader, CardFooter } from '../../components/ui/Card';

const Communication = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateFormData, setTemplateFormData] = useState<Partial<MessageTemplate>>({ 
    name: '', 
    content: '',
    schoolId: user?.schoolId 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState<'students' | 'templates' | 'message'>('students');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [messageStatus, setMessageStatus] = useState<{type: string, text: string} | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [grades, setGrades] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [whatsappLinks, setWhatsappLinks] = useState<string[]>([]);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);

  useEffect(() => {
    if (user?.schoolId) {
      fetchStudents();
      fetchTemplates();
      extractGrades();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTemplate && selectedStudent) {
      // Replace template variables with student data
      let messageText = selectedTemplate.content;
      messageText = messageText.replace(/\{studentName\}/g, selectedStudent.name);
      messageText = messageText.replace(/\{parentName\}/g, selectedStudent.parentName);
      messageText = messageText.replace(/\{grade\}/g, selectedStudent.grade);
      messageText = messageText.replace(/\{date\}/g, new Date().toLocaleDateString('ar-SA'));
      
      setMessage(messageText);
    }
  }, [selectedTemplate, selectedStudent]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [message]);

  const extractGrades = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.students.where('schoolId').equals(user.schoolId);
      
      const allStudents = await query.toArray();
      const uniqueGrades = [...new Set(allStudents.map(s => s.grade))].sort();
      setGrades(uniqueGrades);
    } catch (error) {
      console.error('Error extracting grades:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.students.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show students from their grade
      if (user.role === 'grade-supervisor' && user.grade) {
        const gradesList = user.grade.includes(',') ? user.grade.split(',').map(g => g.trim()) : [user.grade];
        query = query.and(student => gradesList.includes(student.grade));
      }
      
      const allStudents = await query.toArray();
      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      if (!user?.schoolId) return;
      
      // First try to fetch from DB
      const dbTemplates = await db.messageTemplates.where('schoolId').equals(user.schoolId).toArray();
      
      if (dbTemplates.length > 0) {
        setTemplates(dbTemplates);
      } else {
        // If no templates in DB, create default ones
        const defaultTemplates: MessageTemplate[] = [
          {
            name: 'تذكير بالرسوم',
            content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنود تذكيركم بموعد سداد الرسوم الدراسية المستحقة للطالب {studentName} في الصف {grade}. نرجو التكرم بسداد المبلغ في أقرب وقت ممكن.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
            schoolId: user.schoolId
          },
          {
            name: 'تأكيد الدفع',
            content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنشكركم على سداد الرسوم الدراسية للطالب {studentName} في الصف {grade} بتاريخ {date}.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
            schoolId: user.schoolId
          },
          {
            name: 'إشعار غياب',
            content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنود إشعاركم بغياب الطالب {studentName} من الصف {grade} اليوم {date}. يرجى التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
            schoolId: user.schoolId
          },
          {
            name: 'دعوة اجتماع',
            content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nيسرنا دعوتكم لحضور اجتماع أولياء الأمور لمناقشة المستوى الدراسي للطالب {studentName} في الصف {grade}، وذلك يوم الأربعاء القادم الساعة الخامسة مساءً.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
            schoolId: user.schoolId
          },
          {
            name: 'تذكير بقسط متأخر',
            content: 'السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / {parentName}\nنود تذكيركم بأن القسط رقم X من رسوم الطالب {studentName} في الصف {grade} متأخر عن موعد استحقاقه. نرجو التكرم بسداد المبلغ في أقرب وقت ممكن.\nمع خالص الشكر والتقدير,\nإدارة المدرسة',
            schoolId: user.schoolId
          }
        ];
        
        // Add templates to DB
        for (const template of defaultTemplates) {
          const id = await db.messageTemplates.add(template);
          
          // Update with ID
          template.id = id;
        }
        
        setTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!selectedStudent && bulkSelected.length === 0) || !message.trim()) return;
    
    try {
      setMessageStatus({type: 'loading', text: 'جاري إرسال الرسالة...'});
      
      if (isBulkMode && bulkSelected.length > 0) {
        // Send message to multiple students
        const selectedStudents = students.filter(s => bulkSelected.includes(s.id!));
        
        // Generate WhatsApp links for all selected students
        const links = selectedStudents.map(student => createWhatsAppLink(student, message));
        setWhatsappLinks(links);
        setCurrentLinkIndex(0);
        
        // Open the first link
        if (links.length > 0) {
          window.open(links[0], '_blank');
        }
        
        setMessageStatus({type: 'success', text: `تم إنشاء ${selectedStudents.length} رسالة واتساب. يرجى النقر على "إرسال التالي" للمتابعة.`});
      } else if (selectedStudent) {
        // Send message to single student
        const link = createWhatsAppLink(selectedStudent, message);
        window.open(link, '_blank');
        setMessageStatus({type: 'success', text: 'تم إرسال الرسالة بنجاح'});
        setTimeout(() => setMessageStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageStatus({type: 'error', text: 'حدث خطأ أثناء إرسال الرسالة'});
      setTimeout(() => setMessageStatus(null), 3000);
    }
  };

  const createWhatsAppLink = (student: Student, messageText: string): string => {
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    // Prepare message content for this specific student
    let personalizedMessage = messageText;
    if (selectedTemplate) {
      personalizedMessage = selectedTemplate.content;
      personalizedMessage = personalizedMessage.replace(/\{studentName\}/g, student.name);
      personalizedMessage = personalizedMessage.replace(/\{parentName\}/g, student.parentName);
      personalizedMessage = personalizedMessage.replace(/\{grade\}/g, student.grade);
      personalizedMessage = personalizedMessage.replace(/\{date\}/g, new Date().toLocaleDateString('ar-SA'));
    }
    
    // Create WhatsApp link with pre-filled message
    const encodedMessage = encodeURIComponent(personalizedMessage);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

  const handleSendNext = () => {
    if (currentLinkIndex < whatsappLinks.length - 1) {
      const nextIndex = currentLinkIndex + 1;
      setCurrentLinkIndex(nextIndex);
      window.open(whatsappLinks[nextIndex], '_blank');
    } else {
      setMessageStatus({type: 'success', text: 'تم إرسال جميع الرسائل بنجاح'});
      setTimeout(() => {
        setMessageStatus(null);
        setWhatsappLinks([]);
        setCurrentLinkIndex(0);
      }, 3000);
    }
  };

  const handleStudentSelect = (studentId: number) => {
    if (isBulkMode) {
      // Toggle student selection in bulk mode
      if (bulkSelected.includes(studentId)) {
        setBulkSelected(bulkSelected.filter(id => id !== studentId));
      } else {
        setBulkSelected([...bulkSelected, studentId]);
      }
    } else {
      // Single student selection
      const student = students.find(s => s.id === studentId);
      setSelectedStudent(student || null);
      setActiveView('templates');
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setActiveView('message');
  };

  const handleAddEditTemplate = () => {
    // Reset form data
    if (!isEditing) {
      setTemplateFormData({ 
        name: '', 
        content: '',
        schoolId: user?.schoolId 
      });
    }
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTemplateFormData({ ...template });
      setIsEditing(true);
      setShowTemplateForm(true);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      try {
        await db.messageTemplates.delete(templateId);
        
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
        
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setMessage('');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleSubmitTemplate = async () => {
    if (!templateFormData.name?.trim() || !templateFormData.content?.trim() || !user?.schoolId) return;
    
    try {
      if (isEditing && templateFormData.id) {
        // Update existing template
        await db.messageTemplates.update(templateFormData.id, {
          ...templateFormData,
          schoolId: user.schoolId
        });
        
        // Update in state
        const updatedTemplates = templates.map(t => 
          t.id === templateFormData.id 
            ? { ...t, name: templateFormData.name!, content: templateFormData.content! } 
            : t
        );
        setTemplates(updatedTemplates);
        
        if (selectedTemplate?.id === templateFormData.id) {
          setSelectedTemplate({ 
            ...selectedTemplate, 
            name: templateFormData.name!, 
            content: templateFormData.content! 
          });
        }
      } else {
        // Add new template
        const newTemplate: MessageTemplate = {
          name: templateFormData.name,
          content: templateFormData.content,
          schoolId: user.schoolId
        };
        
        const id = await db.messageTemplates.add(newTemplate);
        newTemplate.id = id;
        
        setTemplates([...templates, newTemplate]);
      }
      
      setShowTemplateForm(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setBulkSelected([]);
    setSelectedStudent(null);
  };

  const selectAllStudentsInGrade = () => {
    const studentsToSelect = filteredStudents.map(s => s.id!);
    setBulkSelected(studentsToSelect);
  };

  const clearAllSelections = () => {
    setBulkSelected([]);
  };
  
  // Filter students based on selected grade and search term
  const filteredStudents = students.filter(student => {
    const matchesGrade = selectedGrade === 'all' ? true : student.grade === selectedGrade;
    const matchesSearch = searchTerm 
      ? student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentPhone.includes(searchTerm)
      : true;
    
    return matchesGrade && matchesSearch;
  });
  
  // Sort students by name
  const sortedStudents = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="font-tajawal">
      <div className="page-header">
                 <img 
            src="https://images.unsplash.com/photo-1462536943532-57a629f6cc60?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
            alt="Education classroom"
            className="absolute inset-0 w-full h-full object-cover"
          />
 
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-700 opacity-90"></div>
        <div className="page-header-content">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">نظام التواصل</h2>
            <p className="text-white/90">
              إرسال رسائل واتساب للطلاب وأولياء الأمور بسهولة وكفاءة
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden mb-6 bg-white rounded-lg shadow-md slide-up">
        <div className="grid grid-cols-3 gap-1 p-1">
          <button 
            className={`py-3 px-4 rounded-md flex flex-col items-center justify-center text-xs font-medium transition-colors ${activeView === 'students' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveView('students')}
          >
            <Users className="h-5 w-5 mb-1" />
            الطلاب
          </button>
          <button 
            className={`py-3 px-4 rounded-md flex flex-col items-center justify-center text-xs font-medium transition-colors ${activeView === 'templates' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveView('templates')}
          >
            <List className="h-5 w-5 mb-1" />
            القوالب
          </button>
          <button 
            className={`py-3 px-4 rounded-md flex flex-col items-center justify-center text-xs font-medium transition-colors ${activeView === 'message' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveView('message')}
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            الرسالة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students Column */}
        <div className={`${activeView !== 'students' && 'lg:block hidden'}`}>
          <Card className="overflow-hidden h-full max-h-[800px] flex flex-col">
            <CardHeader className="flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">الطلاب</h3>
              <button
                onClick={toggleBulkMode}
                className={`flex items-center p-1.5 rounded-md text-xs font-medium transition-colors ${
                  isBulkMode ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                {isBulkMode ? 'إلغاء الاختيار المتعدد' : 'اختيار متعدد'}
              </button>
            </CardHeader>
            
            <div className="p-4 border-b border-gray-100">
              <div className="mb-4">
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
              
              <div className="mb-4">
                <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-800 mb-1">تصفية حسب الصف</label>
                <select
                  id="grade-filter"
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="all">جميع الصفوف</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              
              {isBulkMode && (
                <div className="flex space-x-1 gap-2 mb-4">
                  <button
                    onClick={selectAllStudentsInGrade}
                    className="flex-1 text-xs bg-blue-50 text-blue-700 py-1 px-2 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    اختيار الكل ({filteredStudents.length})
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="flex-1 text-xs bg-gray-50 text-gray-700 py-1 px-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    إلغاء الاختيار ({bulkSelected.length})
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {sortedStudents.length > 0 ? (
                  sortedStudents.map((student) => (
                    <li 
                      key={student.id} 
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        (isBulkMode && bulkSelected.includes(student.id!)) || 
                        (!isBulkMode && selectedStudent?.id === student.id) 
                          ? 'bg-primary-50 border-r-4 border-primary-600' 
                          : ''
                      }`}
                      onClick={() => handleStudentSelect(student.id!)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isBulkMode && (
                            <div className="ml-3">
                              <input 
                                type="checkbox" 
                                checked={bulkSelected.includes(student.id!)}
                                onChange={() => {}}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </div>
                          )}
                          
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                          
                          <div className="mr-3">
                            <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                            <p className="text-xs text-gray-500">{student.grade}</p>
                          </div>
                        </div>
                        
                        <a 
                          href={`tel:${student.parentPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-5 text-center text-gray-500">
                    لا يوجد طلاب مطابقون للبحث
                  </li>
                )}
              </ul>
            </div>
          </Card>
        </div>

        {/* Templates Column */}
        <div className={`${activeView !== 'templates' && 'lg:block hidden'}`}>
          <Card className="overflow-hidden h-full max-h-[800px] flex flex-col">
            <CardHeader className="flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">قوالب الرسائل</h3>
              <button
                onClick={handleAddEditTemplate}
                className="flex items-center p-1.5 rounded-md text-xs font-medium bg-primary-700 text-white hover:bg-primary-800 transition-colors"
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة قالب
              </button>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto">
              {showTemplateForm ? (
                <div className="p-4">
                  <div className="mb-4">
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-800 mb-1">اسم القالب</label>
                    <input
                      type="text"
                      id="templateName"
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={templateFormData.name}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="templateContent" className="block text-sm font-medium text-gray-800 mb-1">محتوى الرسالة</label>
                    <textarea
                      id="templateContent"
                      rows={10}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                      value={templateFormData.content}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      المتغيرات المتاحة: {'{studentName}'}, {'{parentName}'}, {'{grade}'}, {'{date}'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitTemplate}
                      className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      {isEditing ? 'تحديث' : 'إضافة'}
                    </button>
                    <button
                      onClick={() => {
                        setShowTemplateForm(false);
                        setIsEditing(false);
                      }}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {templates.map((template) => (
                    <li 
                      key={template.id} 
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedTemplate?.id === template.id 
                          ? 'bg-primary-50 border-r-4 border-primary-600' 
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleTemplateSelect(template.id!)}
                        >
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{template.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-line">{template.content}</p>
                        </div>
                        
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleEditTemplate(template.id!)}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id!)}
                            className="p-1 rounded-full hover:bg-gray-100 text-red-600 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Message Column */}
        <div className={`${activeView !== 'message' && 'lg:block hidden'}`}>
          <Card className="overflow-hidden h-full max-h-[800px] flex flex-col">
            <CardHeader className="flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">إرسال الرسالة</h3>
            </CardHeader>
            
            <div className="p-4 border-b border-gray-100">
              {selectedTemplate ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">القالب المختار:</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-600">{selectedTemplate.name}</span>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-500">لم يتم اختيار قالب بعد</p>
                  <button
                    onClick={() => setActiveView('templates')}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    اختيار قالب
                  </button>
                </div>
              )}
              
              {(selectedStudent || isBulkMode) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">المستلم:</h4>
                  {isBulkMode ? (
                    <div className="bg-primary-50 p-2 rounded-md">
                      <p className="text-sm text-primary-800">
                        {bulkSelected.length} طالب تم اختيارهم
                      </p>
                    </div>
                  ) : selectedStudent ? (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="mr-2">
                        <h5 className="text-sm font-medium">{selectedStudent.name}</h5>
                        <p className="text-xs text-gray-500">{selectedStudent.grade}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">لم يتم اختيار مستلم بعد</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <label htmlFor="messageContent" className="block text-sm font-medium text-gray-800 mb-2">محتوى الرسالة:</label>
              <textarea
                id="messageContent"
                rows={10}
                className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
              <div ref={messageEndRef} />
            </div>
            
            <CardFooter className="border-t border-gray-100">
              {messageStatus && (
                <div className={`w-full mb-2 p-2 rounded-md text-sm ${
                  messageStatus.type === 'loading' ? 'bg-blue-50 text-blue-800' :
                  messageStatus.type === 'success' ? 'bg-green-50 text-green-800' :
                  'bg-red-50 text-red-800'
                }`}>
                  {messageStatus.text}
                </div>
              )}
              
              <div className="flex justify-between w-full">
                {whatsappLinks.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {currentLinkIndex + 1} من {whatsappLinks.length}
                  </div>
                )}
                <div className="flex gap-2">
                  {whatsappLinks.length > 0 && currentLinkIndex < whatsappLinks.length - 1 ? (
                    <button
                      onClick={handleSendNext}
                      className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      إرسال التالي
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={(!selectedStudent && bulkSelected.length === 0) || !message.trim()}
                      className="inline-flex items-center py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="ml-2 h-5 w-5" />
                      إرسال واتساب
                    </button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Communication;
 