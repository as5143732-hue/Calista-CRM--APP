import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Save, Users, Check, X, Lock, Trash2, Plus } from 'lucide-react';
import { useAuth, AppUser } from '../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Modal } from '../components/ui/Modal';

interface AppUserWithId extends AppUser {
  id: string;
}

export const Settings: React.FC = () => {
  const { user, appUser, firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Admin User Management State
  const [appUsers, setAppUsers] = useState<AppUserWithId[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');

  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState({ type: '', text: '' });

  // Profile Tab State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user?.name]);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserActive, setNewUserActive] = useState(true);
  const [addUserError, setAddUserError] = useState('');

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchAppUsers();
    }
  }, [activeTab, user]);

  const fetchAppUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'appUsers'));
      const snapshot = await getDocs(q);
      const fetched: AppUserWithId[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as AppUserWithId));
      setAppUsers(fetched);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'appUsers');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm("هل أنت متأكد من تغيير حالة هذا المستخدم؟")) return;
    try {
      await updateDoc(doc(db, `appUsers/${userId}`), { isActive: !currentStatus });
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appUsers/${userId}`);
    }
  };

  const handleSavePassword = async (userId: string) => {
    if (!window.confirm("هل أنت متأكد من تغيير كلمة المرور للمستخدم؟")) return;
    try {
      await updateDoc(doc(db, `appUsers/${userId}`), { password: editPassword });
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, password: editPassword } : u));
      setEditingUserId(null);
      setEditPassword('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appUsers/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await deleteDoc(doc(db, `appUsers/${userId}`));
      setAppUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appUsers/${userId}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    if (!newUserEmail || !newUserPassword) {
      setAddUserError('يجب إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    const safeEmail = newUserEmail.trim();
    try {
      const userRef = doc(db, 'appUsers', safeEmail);
      const exists = appUsers.some(d => d.id === safeEmail || d.email === safeEmail);
      if (exists) {
         setAddUserError('البريد الإلكتروني موجود مسبقاً');
         return;
      }
      
      const newAppUserData = {
        email: safeEmail,
        password: newUserPassword,
        isActive: newUserActive
      };
      
      await setDoc(userRef, newAppUserData);
      setAppUsers([...appUsers, { id: safeEmail, ...newAppUserData }]);
      setIsAddUserModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserActive(true);
    } catch (error) {
      setAddUserError('حدث خطأ أثناء إضافة المستخدم');
      console.error(error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage({ type: '', text: '' });
    
    if (appUser?.password !== currentPassword) {
      setPasswordChangeMessage({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }
    
    if (!newPassword) {
      setPasswordChangeMessage({ type: 'error', text: 'الرجاء إدخال كلمة المرور الجديدة' });
      return;
    }

    if (!firebaseUser) return;

    try {
      await updateDoc(doc(db, `appUsers/${firebaseUser.uid}`), { password: newPassword });
      setPasswordChangeMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appUsers/${firebaseUser.uid}`);
      setPasswordChangeMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث كلمة المرور' });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, `users/${firebaseUser.uid}`), { name: profileName });
      alert('تم تحديث الملف الشخصي بنجاح!');
      // Assuming AuthContext automatically real-time updates user state on subsequent reads or reload
      window.location.reload(); // Refresh to reflect new name in context and top bar
    } catch (error) {
       console.error("Error updating profile", error);
       alert("حدث خطأ أثناء تحديث الملف الشخصي");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
        <p className="text-slate-500 text-sm mt-1">إدارة إعدادات حسابك والتفضيلات.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        <div className="md:w-64 bg-slate-50 border-l border-slate-200 p-6 space-y-1 shrink-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <User className="w-4 h-4 shrink-0" /> الملف الشخصي
          </button>
          
          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4 shrink-0" /> إدارة المستخدمين
            </button>
          )}

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Bell className="w-4 h-4 shrink-0" /> الإشعارات
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Shield className="w-4 h-4 shrink-0" /> الأمان
          </button>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-x-auto">
          {activeTab === 'profile' && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">المعلومات الشخصية</h2>
              
              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" 
                  />
                  <p className="text-xs text-slate-500 mt-1" dir="ltr">Contact your administrator to change your email address.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الدور / الوظيفة</label>
                  <input 
                    type="text" 
                    defaultValue={user?.role}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                  <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'users' && user?.role === 'admin' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  إدارة الوصول للمستخدمين
                </h2>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مستخدم
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                        <th className="px-4 py-3 font-medium">نوع الحساب</th>
                        <th className="px-4 py-3 font-medium">حالة التفعيل</th>
                        <th className="px-4 py-3 font-medium">إعداد كلمة المرور</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appUsers.map((appUser) => (
                        <tr key={appUser.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-slate-800" dir="ltr">
                            {appUser.email}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {appUser.id.includes('@') ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                                مضاف يدويًا
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                مسجل دخول
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleToggleActive(appUser.id, appUser.isActive)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appUser.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appUser.isActive ? 'translate-x-1' : 'translate-x-6'}`} />
                            </button>
                            <span className={`mr-2 text-xs font-bold ${appUser.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {appUser.isActive ? 'مفعل' : 'معطل'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-4">
                              {editingUserId === appUser.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="كلمة المرور الجديدة"
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40 outline-none focus:border-indigo-500"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    autoFocus
                                    dir="ltr"
                                  />
                                  <button 
                                    onClick={() => handleSavePassword(appUser.id)}
                                    className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                                    title="حفظ"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingUserId(null)}
                                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                    title="إلغاء"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-slate-400">
                                    {appUser.password ? '••••••••' : 'لم يتم التعيين'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingUserId(appUser.id);
                                      setEditPassword(appUser.password || '');
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-xs font-medium"
                                  >
                                    <Lock className="w-3.5 h-3.5" /> تعيين
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteUser(appUser.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {appUsers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                            لا يوجد مستخدمين بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Placeholders for other tabs */}
          {activeTab === 'notifications' && <div className="text-slate-500">محتوى الإشعارات (قريباً)</div>}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                تغيير كلمة المرور
              </h2>
              
              {appUser?.isActive ? (
                <form className="space-y-5" onSubmit={handleChangePassword}>
                  {passwordChangeMessage.text && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${passwordChangeMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {passwordChangeMessage.text}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                      <Save className="w-4 h-4" />
                      حفظ التغييرات
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-700 rounded-lg text-sm">
                  لا يمكنك تغيير كلمة المرور لأن حسابك غير مفعل بعد.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="إضافة مستخدم جديد">
        <form onSubmit={handleAddUser} className="space-y-4" dir="rtl">
          {addUserError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {addUserError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الابتدائية</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setNewUserActive(!newUserActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newUserActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newUserActive ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
            <span className="text-sm font-medium text-slate-700">تفعيل الحساب فوراً</span>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              إضافة المستخدم
            </button>
            <button 
              type="button" 
              onClick={() => setIsAddUserModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
