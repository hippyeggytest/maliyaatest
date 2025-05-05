import  { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Plus, 
  Edit, 
  Trash, 
  Mail, 
  School as SchoolIcon, 
  CheckCircle,
  Check,
  X,
  Lock 
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { formatGradeToArabic } from '../../utils/gradeFormatters';

type User = {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'school_admin' | 'teacher' | 'student';
  email: string;
  school_id: number | null;
  grade: string | null;
  created_at?: string;
  updated_at?: string;
  schools?: {
    name: string;
  };
};

type School = {
  id: number;
  name: string;
  status: string;
};

type UserFormData = {
  id?: number;
  username: string;
  name: string;
  role: 'admin' | 'school_admin' | 'teacher' | 'student';
  email: string;
  school_id: number | null;
  grade: string | null;
  password?: string;
};

const Users = () => {
  const supabase = useSupabase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmResetPassword, setConfirmResetPassword] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    name: '',
    role: 'school_admin',
    email: '',
    school_id: null,
    grade: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<{[key: string]: User[]}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Group users by school
    const grouped: {[key: string]: User[]} = {};
    
    // First add a group for admin users
    grouped['admin'] = users.filter(user => user.role === 'admin');
    
    // Then group by school
    schools.forEach(school => {
      grouped[String(school.id)] = users.filter(user => 
        user.school_id === school.id && user.role !== 'admin'
      );
    });
    
    setGroupedUsers(grouped);
  }, [users, schools]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await supabase.fetch('users', { 
        select: `*, schools:school_id (name)`,
        orderBy: { column: 'name', ascending: true }
      });
      
      if (userData && Array.isArray(userData)) {
        setUsers(userData as unknown as User[]);
      }
      
      const schoolsData = await supabase.fetch('schools', { 
        orderBy: { column: 'name', ascending: true }
      });
      
      if (schoolsData && Array.isArray(schoolsData)) {
        setSchools(schoolsData as unknown as School[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert school_id to number if it's provided
    if (name === 'school_id' && value) {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleGradeChange = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Handle multiple grades for grade supervisors
      const updatedData = { ...formData };
      if (formData.role === 'teacher' && selectedGrades.length > 0) {
        updatedData.grade = selectedGrades.join(',');
      }
      
      if (isEditing && formData.id) {
        const { id, password, ...dataToUpdate } = updatedData;
        // Ensure id is defined before calling update
        if (id) {
          const updated = await supabase.update('users', id, dataToUpdate);
          if (updated) {
            await loadData();
            setShowForm(false);
            resetForm();
          }
        }
      } else {
        const { id, password, ...dataToCreate } = updatedData;
        const created = await supabase.create('users', dataToCreate);
        if (created) {
          await loadData();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      role: 'school_admin',
      email: '',
      school_id: null,
      grade: null
    });
    setSelectedGrades([]);
    setIsEditing(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      school_id: user.school_id,
      grade: user.grade
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDelete(id);
  };
  
  const confirmDeleteUser = async () => {
    if (confirmDelete) {
      try {
        setLoading(true);
        const deleted = await supabase.remove('users', confirmDelete);
        if (deleted) {
          await loadData();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      } finally {
        setLoading(false);
        setConfirmDelete(null);
      }
    }
  };
  
  const handleResetPassword = (id: number) => {
    setConfirmResetPassword(id);
  };
  
  const confirmResetUserPassword = async () => {
    if (confirmResetPassword) {
      try {
        setLoading(true);
        // Use any type to bypass type checking for password field
        const dataToUpdate = {
          password: '123456' // Default password
        } as any;
        const updated = await supabase.update('users', confirmResetPassword, dataToUpdate);
        if (updated) {
          await loadData();
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        setError('Failed to reset password');
      } finally {
        setLoading(false);
        setConfirmResetPassword(null);
      }
    }
  };

  const getSchoolName = (schoolId: number | null | undefined) => {
    if (!schoolId) return 'غير محدد';
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'غير محدد';
  };

  const getSchoolStatus = (schoolId: number | null | undefined) => {
    if (!schoolId) return 'active';
    const school = schools.find(s => s.id === schoolId);
    return school ? school.status : 'active';
  };

  const grades = [
    'روضة 1',
    'التمهيدي',
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع',
    'الصف العاشر',
    'الصف الحادي عشر',
    'الصف الثاني عشر'
  ];

  if ((loading || loading) && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="font-tajawal">
      <div className="relative rounded-lg overflow-hidden mb-8 h-40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900 flex items-center px-6">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">إدارة المستخدمين</h2>
            <p className="text-white/80">
              إضافة وتعديل وإدارة مستخدمي النظام والصلاحيات
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">إدارة المستخدمين</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          <Plus className="h-5 w-5 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-800 p-4 rounded-md border border-red-200">
          حدث خطأ: {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  الاسم
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  اسم المستخدم
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  الدور
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="admin">مدير النظام</option>
                    <option value="school_admin">مدير مدرسة</option>
                    <option value="teacher">معلم</option>
                    <option value="student">طالب</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="school_id" className="block text-sm font-medium text-gray-700">
                  المدرسة
                </label>
                <div className="mt-1">
                  <select
                    id="school_id"
                    name="school_id"
                    value={formData.school_id || ''}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    disabled={formData.role === 'admin'}
                  >
                    <option value="">اختر المدرسة</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === 'teacher' && (
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصفوف
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {grades.map((grade) => (
                      <div key={grade} className="flex items-center">
                        <input
                          id={`grade-${grade}`}
                          type="checkbox"
                          checked={selectedGrades.includes(grade)}
                          onChange={() => handleGradeChange(grade)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`grade-${grade}`} className="mr-2 block text-sm text-gray-700">
                          {grade}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
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

      {/* Users List */}
      <div className="space-y-6">
        {/* Admin users */}
        {groupedUsers['admin'] && groupedUsers['admin'].length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">مدراء النظام</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {groupedUsers['admin'].map(user => (
                <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 ml-1" />
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-full hover:bg-gray-100 text-primary-600"
                        title="تعديل"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id!)}
                        className="p-2 rounded-full hover:bg-gray-100 text-yellow-600"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <Lock className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id!)}
                        className="p-2 rounded-full hover:bg-gray-100 text-red-600"
                        title="حذف"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* School users, grouped by school */}
        {schools.map(school => {
          const schoolUsers = groupedUsers[String(school.id)] || [];
          if (schoolUsers.length === 0) return null;
          
          const isSchoolActive = school.status === 'active';
          
          return (
            <div key={school.id} className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-base font-medium text-gray-900">
                  <div className="flex items-center">
                    <SchoolIcon className="h-5 w-5 ml-2 text-primary-600" />
                    {school.name}
                    <span className={`mr-2 text-sm px-2 py-0.5 rounded-full ${
                      isSchoolActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isSchoolActive ? 'نشطة' : 'غير نشطة'}
                    </span>
                  </div>
                </h3>
                <span className="text-xs text-gray-500">{schoolUsers.length} مستخدم</span>
              </div>
              <ul className="divide-y divide-gray-200">
                {schoolUsers.map(user => (
                  <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <div className="flex items-center flex-wrap">
                            <div className="flex items-center ml-3">
                              <Mail className="h-4 w-4 text-gray-400 ml-1" />
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 ml-1">الدور:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                user.role === 'school_admin' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : user.role === 'teacher' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role === 'school_admin' ? 'مدير مدرسة' : user.role === 'teacher' ? 'معلم' : 'طالب'}
                              </span>
                            </div>
                          </div>
                          {user.role === 'teacher' && user.grade && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {user.grade.split(',').map(grade => (
                                <span key={grade} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                  {grade.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 rounded-full hover:bg-gray-100 text-primary-600"
                          title="تعديل"
                          disabled={!isSchoolActive}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id!)}
                          className="p-2 rounded-full hover:bg-gray-100 text-yellow-600"
                          title="إعادة تعيين كلمة المرور"
                          disabled={!isSchoolActive}
                        >
                          <Lock className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id!)}
                          className="p-2 rounded-full hover:bg-gray-100 text-red-600"
                          title="حذف"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية."
        actions={
          <>
            <Button 
              onClick={() => setConfirmDelete(null)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <X className="h-4 w-4 ml-1" />
              إلغاء
            </Button>
            <Button 
              onClick={confirmDeleteUser}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="h-4 w-4 ml-1" />
              نعم، حذف
            </Button>
          </>
        }
      />

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        isOpen={confirmResetPassword !== null}
        onClose={() => setConfirmResetPassword(null)}
        title="إعادة تعيين كلمة المرور"
        description="هل أنت متأكد من إعادة تعيين كلمة المرور لهذا المستخدم؟ سيتم تعيين كلمة مرور افتراضية وسيتمكن المستخدم من تغييرها لاحقًا."
        actions={
          <>
            <Button 
              onClick={() => setConfirmResetPassword(null)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <X className="h-4 w-4 ml-1" />
              إلغاء
            </Button>
            <Button 
              onClick={confirmResetUserPassword}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              <Check className="h-4 w-4 ml-1" />
              نعم، إعادة تعيين
            </Button>
          </>
        }
      />
    </div>
  );
};

export default Users;
 