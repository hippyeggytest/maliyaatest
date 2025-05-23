import  { useState, useEffect } from 'react';
import { 
  School as SchoolIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash, 
  Upload, 
  Check, 
  X,
  Pause,
  Play 
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';

type School = {
  id: number;
  name: string;
  logo: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

const Schools = () => {
  const supabase = useSupabase();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    name: '',
    logo: null,
    status: 'active'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await supabase.fetch('schools', { 
        orderBy: { column: 'name', ascending: true }
      });
      if (data && Array.isArray(data)) {
        setSchools(data as unknown as School[]);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // If changing logo URL, update preview
    if (name === 'logo' && value) {
      setLogoPreview(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      const requiredFields = ['name', 'status'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        setError(`الرجاء إدخال: ${missingFields.join('، ')}`);
        return;
      }

      // Log the data being sent
      console.log('Submitting school data:', formData);
      
      if (isEditing && formData.id) {
        const { id, ...dataToUpdate } = formData;
        const updated = await supabase.update('schools', id, {
          name: dataToUpdate.name || '',
          logo: dataToUpdate.logo,
          status: dataToUpdate.status || 'active'
        });
        if (updated) {
          await loadSchools();
          setShowForm(false);
          resetForm();
        }
      } else {
        const created = await supabase.create('schools', {
          name: formData.name || '',
          logo: formData.logo,
          status: formData.status || 'active'
        });
        if (created) {
          await loadSchools();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving school:', error);
      setError('فشل في حفظ بيانات المدرسة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      logo: null,
      status: 'active'
    });
    setLogoPreview(null);
    setIsEditing(false);
  };

  const handleEdit = (school: School) => {
    setFormData(school);
    setLogoPreview(school.logo);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDelete(id);
  };
  
  const confirmDeleteSchool = async () => {
    if (confirmDelete) {
      try {
        setLoading(true);
        const deleted = await supabase.remove('schools', confirmDelete);
        if (deleted) {
          await loadSchools();
        }
      } catch (error) {
        console.error('Error deleting school:', error);
        setError('Failed to delete school');
      } finally {
        setLoading(false);
        setConfirmDelete(null);
      }
    }
  };
  
  const toggleSchoolStatus = async (school: School) => {
    try {
      setLoading(true);
      const newStatus = school.status === 'active' ? 'inactive' : 'active';
      const updated = await supabase.update('schools', school.id, { status: newStatus });
      if (updated) {
        await loadSchools();
      }
    } catch (error) {
      console.error('Error toggling school status:', error);
      setError('Failed to update school status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && schools.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden mb-8 h-40">
        <img 
          src="https://images.unsplash.com/photo-1472377723522-4768db9c41ce?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBidWlsZGluZyUyMGNsYXNzcm9vbSUyMGVkdWNhdGlvbnxlbnwwfHx8fDE3NDYzNjgxNjV8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="مدارس"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-600/50 flex items-center px-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">إدارة المدارس</h2>
            <p className="text-white/80">
              إضافة وتعديل وحذف المدارس المشتركة في النظام من قاعدة البيانات
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">إدارة المدارس</h2>
        <Button 
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          <Plus className="h-5 w-5 ml-2" />
          إضافة مدرسة
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-800 p-4 rounded-md border border-red-200">
          حدث خطأ: {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  اسم المدرسة
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
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  الحالة
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  شعار المدرسة
                </label>
                <div className="mt-1 flex flex-col items-center space-y-4">
                  {(logoPreview || formData.logo) && (
                    <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-gray-300">
                      <img 
                        src={logoPreview || formData.logo || ''} 
                        alt="شعار المدرسة" 
                        className="w-full h-full object-cover"
                        onError={() => setLogoPreview(null)}
                      />
                    </div>
                  )}
                  
                  {/* URL input */}
                  <div className="w-full">
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                      رابط الشعار
                    </label>
                    <input
                      type="text"
                      name="logo"
                      id="logoUrl"
                      value={formData.logo || ''}
                      onChange={handleInputChange}
                      placeholder="https://example.com/logo.png"
                      className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 gap-3">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white text-gray-700 border border-gray-300"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isEditing ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {schools.length > 0 ? (
            schools.map((school) => (
              <li key={school.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                        {school.logo ? (
                          <img 
                            src={school.logo} 
                            alt={school.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501349800519-48093d60bde0?ixlib=rb-4.0.3&fit=fillmax&h=600&w=800';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-primary-100 flex items-center justify-center">
                            <SchoolIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        <h4 className="text-lg font-medium text-gray-900">{school.name}</h4>
                        <div className="mt-1 flex items-center">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                              school.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {school.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 gap-2">
                      <Button
                        onClick={() => toggleSchoolStatus(school)}
                        className={`p-2 rounded-full ${
                          school.status === 'active'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                        title={school.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      >
                        {school.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleEdit(school)}
                        className="p-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(school.id)}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
                        title="حذف"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <SchoolIcon className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-400" />
                        {school.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 ml-6">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            school.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {school.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-gray-500">لا توجد مدارس مسجلة بعد</li>
          )}
        </ul>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذه المدرسة؟ لا يمكن التراجع عن هذه العملية."
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
              onClick={confirmDeleteSchool}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="h-4 w-4 ml-1" />
              نعم، حذف
            </Button>
          </>
        }
      />
    </div>
  );
};

export default Schools;
 