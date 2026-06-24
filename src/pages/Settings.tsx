import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Save, Users, Check, X, Lock, Trash2, Plus, LogOut } from 'lucide-react';
import { useAuth, AppUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, writeBatch, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, createAuthUserWithoutSignout } from '../firebase';
import { Modal } from '../components/ui/Modal';

interface AppUserWithId extends AppUser {
  id: string;
  role?: string;
  lastLogin?: any;
  lastLogout?: any;
  lastActive?: any;
}

export const Settings: React.FC = () => {
  const { user, appUser, firebaseUser, linkEmailPasswordToGoogle, logout } = useAuth();
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
  
  // Link Password State
  const [linkPassword, setLinkPassword] = useState('');
  const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });
  const [isLinking, setIsLinking] = useState(false);

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
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('sales');
  const [newUserTeamId, setNewUserTeamId] = useState('');
  const [newUserActive, setNewUserActive] = useState(true);
  const [addUserError, setAddUserError] = useState('');
  const [managers, setManagers] = useState<{id: string, name: string}[]>([]);

  const { clients } = useData();
  const [loggedUsersToday, setLoggedUsersToday] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (activeTab === 'notifications' && user?.role === 'super_admin') {
      fetchAppUsers(); // Ensure we have the user list
      fetchTodayLogins();
    }
  }, [activeTab, user]);

  const fetchTodayLogins = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'notifications'),
        where('type', '==', 'login'),
        where('timestamp', '>=', today)
      );
      const snapshot = await getDocs(q);
      const logins: Record<string, boolean> = {};
      snapshot.forEach(doc => {
        const notif = doc.data();
        if (notif.userId) {
          logins[notif.userId] = true;
        }
      });
      setLoggedUsersToday(logins);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && (user?.role === 'super_admin' || user?.role === 'manager')) {
      fetchAppUsers();
      fetchManagers();
    }
  }, [activeTab, user]);

  const fetchManagers = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'manager')));
      const managersData = snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
      setManagers(managersData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppUsers = async () => {
    setLoadingUsers(true);
    try {
      let reqQuery = query(collection(db, 'appUsers'));
      let usersQuery = query(collection(db, 'users'));
      
      if (user?.role === 'manager') {
        if (firebaseUser) {
          reqQuery = query(collection(db, 'appUsers'), where('teamId', '==', firebaseUser.uid));
          usersQuery = query(collection(db, 'users'), where('teamId', '==', firebaseUser.uid));
        }
      }
      const snapshot = await getDocs(reqQuery);
      
      const usersSnapshot = await getDocs(usersQuery);
      const extraDataMap: Record<string, any> = {};
      usersSnapshot.forEach(d => {
        const data = d.data();
        extraDataMap[d.id] = {
          role: data.role,
          lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate().toISOString() : null,
          lastLogout: data.lastLogout?.toDate ? data.lastLogout.toDate().toISOString() : null,
          lastActive: data.lastActive?.toDate ? data.lastActive.toDate().toISOString() : null,
        };
      });

      const fetched: AppUserWithId[] = [];
      snapshot.forEach((d) => {
        const extra = extraDataMap[d.id] || {};
        fetched.push({ 
          id: d.id, 
          ...d.data(), 
          role: extra.role,
          lastLogin: extra.lastLogin,
          lastLogout: extra.lastLogout,
          lastActive: extra.lastActive
        } as AppUserWithId);
      });
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

  const runMigration = async () => {
    if (!window.confirm("هل أنت متأكد من تشغيل تحديث قاعدة البيانات للعملاء؟")) return;
    try {
      const clientsRef = collection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      const batch = writeBatch(db);
      let count = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.createdAt) {
          batch.update(docSnap.ref, { createdAt: new Date().toISOString() });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`تم التحديث بنجاح! تم إضافة createdAt لـ ${count} عميل.`);
      } else {
        alert("جميع العملاء يحتوون على createdAt مسبقًا. لا يوجد تحديثات.");
      }
    } catch (error) {
      console.error("Migration error:", error);
      alert("حدث خطأ أثناء التحديث.");
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
      const exists = appUsers.some(d => d.id === safeEmail || d.email === safeEmail);
      if (exists) {
         setAddUserError('البريد الإلكتروني موجود مسبقاً');
         return;
      }

      // Create authentication credentials in Firebase Auth
      const newUser = await createAuthUserWithoutSignout(safeEmail, newUserPassword);
      
      const newUid = newUser.uid;
      
      // Store in users collection using UID
      const usersRef = doc(db, 'users', newUid);
      
      const userData: any = {
        email: safeEmail,
        name: newUserName || safeEmail.split('@')[0],
        role: newUserRole,
        createdAt: new Date().toISOString()
      };
      
      if (newUserRole === 'sales' && newUserTeamId) {
        userData.teamId = newUserTeamId;
      }

      if (user?.role === 'manager') {
        userData.managerId = firebaseUser?.uid;
      }
      
      await setDoc(usersRef, userData);

      // Still create appUsers (for backward compatibility / active logic if needed)
      // but using UID might be better? Original used email... I'll use UID to be safe, but keep original if needed.
      // Actually, wait, original used safeEmail as id...
      const appUserRef = doc(db, 'appUsers', newUid);
      const newAppUserData: any = {
        email: safeEmail,
        password: newUserPassword,
        isActive: newUserActive,
        role: newUserRole
      };
      
      if (newUserRole === 'sales' && newUserTeamId) {
        newAppUserData.teamId = newUserTeamId;
      }

      if (user?.role === 'manager') {
        newAppUserData.managerId = firebaseUser?.uid;
      }
      
      await setDoc(appUserRef, newAppUserData);
      setAppUsers([...appUsers, { id: newUid, ...newAppUserData }]);
      setIsAddUserModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('sales');
      setNewUserActive(true);
    } catch (error: any) {
      if (error && (error.code === 'auth/email-already-in-use' || String(error).includes('email-already-in-use'))) {
        setAddUserError('البريد الإلكتروني مسجل بالفعل في نظام المصادقة (Firebase Auth)');
      } else if (error && (error.code === 'auth/weak-password' || String(error).includes('weak-password'))) {
        setAddUserError('كلمة المرور ضعيفة جداً. يجب أن تكون من 6 أحرف على الأقل.');
      } else if (error && (error.code === 'auth/operation-not-allowed' || String(error).includes('operation-not-allowed'))) {
        setAddUserError('خطأ: ميزة الدخول بالبريد الإلكتروني غير مفعلة في مشروع Firebase الخاص بك. يرجى تفعيل "Email/Password" بمستودع المصادقة (Authentication > Sign-in method) في Firebase Console.');
      } else {
        setAddUserError('حدث خطأ أثناء إضافة المستخدم: ' + (error.message || error));
      }
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

  const handleLinkPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkMessage({ type: '', text: '' });
    if (!linkPassword || linkPassword.length < 6) {
      setLinkMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور من 6 أحرف على الأقل.' });
      return;
    }
    try {
      setIsLinking(true);
      await linkEmailPasswordToGoogle(linkPassword);
      setLinkMessage({ type: 'success', text: 'تم تعيين كلمة المرور وربط الحساب بنجاح! يمكنك الآن تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور أيضاً.' });
      setLinkPassword('');
    } catch (error: any) {
      console.error(error);
      setLinkMessage({ type: 'error', text: 'حدث خطأ أثناء ربط الحساب: ' + (error.message || error) });
    } finally {
      setIsLinking(false);
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

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
    } catch(e) {
      return '-';
    }
  };

  const renderLoginStatus = (appUser: AppUserWithId) => {
    const loginTime = appUser.lastLogin ? new Date(appUser.lastLogin).getTime() : 0;
    const logoutTime = appUser.lastLogout ? new Date(appUser.lastLogout).getTime() : 0;
    
    // Consider online strictly if they logged in after their last logout
    const isOnline = loginTime > logoutTime;

    return (
      <div className="flex items-center gap-2 justify-end" dir="rtl">
        <span className={isOnline ? "text-emerald-500 text-sm font-bold" : "text-slate-400 text-sm font-bold"}>
          {isOnline ? "مفتوح" : "مغلق"}
        </span>
        <span className="text-xs font-mono text-slate-500" dir="ltr">
          {isOnline 
            ? formatDateTime(appUser.lastLogin) 
            : (logoutTime > 0 ? formatDateTime(appUser.lastLogout) : 'لم يسجل')}
        </span>
      </div>
    );
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
          
          {(user?.role === 'super_admin' || user?.role === 'manager') && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4 shrink-0" /> إدارة المستخدمين
            </button>
          )}

          {user?.role === 'super_admin' && (
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Bell className="w-4 h-4 shrink-0" /> الإشعارات
            </button>
          )}
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Shield className="w-4 h-4 shrink-0" /> الأمان
          </button>
          
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 shrink-0" /> تسجيل الخروج
            </button>
          </div>
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

          {activeTab === 'users' && (user?.role === 'super_admin' || user?.role === 'manager') && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  إدارة الوصول للمستخدمين
                </h2>
                <div className="flex items-center gap-2">
                  {user?.role === 'super_admin' && (
                    <>
                      <button
                        onClick={runMigration}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg flex items-center gap-2 font-medium text-sm hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        تحديث العملاء (Migration)
                      </button>
                      <button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مستخدم
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-md font-semibold text-slate-800 mb-4 border-b pb-2">المديرين والمسؤولين (Managers & Admins)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                            <th className="px-4 py-3 font-medium">نوع الحساب</th>
                            <th className="px-4 py-3 font-medium">آخر ظهور</th>
                            <th className="px-4 py-3 font-medium">حالة الدخول</th>
                            <th className="px-4 py-3 font-medium">حالة التفعيل</th>
                            <th className="px-4 py-3 font-medium">إعداد كلمة المرور</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {appUsers.filter(u => u.role !== 'sales').map((appUser) => (
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
                              <td className="px-4 py-4 text-xs font-mono text-slate-500" dir="ltr">{formatDateTime(appUser.lastActive)}</td>
                              <td className="px-4 py-4">
                                {renderLoginStatus(appUser)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => handleToggleActive(appUser.id, appUser.isActive)}
                                  disabled={user?.role !== 'super_admin'}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appUser.isActive ? 'bg-emerald-500' : 'bg-slate-300'} ${user?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        disabled={user?.role !== 'super_admin'}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-xs font-medium ${user?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        <Lock className="w-3.5 h-3.5" /> تعيين
                                      </button>
                                    </div>
                                  )}
                                  {user?.role === 'super_admin' && (
                                    <button
                                      onClick={() => handleDeleteUser(appUser.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="حذف المستخدم"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {appUsers.filter(u => u.role !== 'sales').length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                لا يوجد مديرين بعد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-slate-800 mb-4 border-b pb-2">فريق المبيعات (Sales)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                            <th className="px-4 py-3 font-medium">نوع الحساب</th>
                            <th className="px-4 py-3 font-medium">آخر ظهور</th>
                            <th className="px-4 py-3 font-medium">حالة الدخول</th>
                            <th className="px-4 py-3 font-medium">حالة التفعيل</th>
                            <th className="px-4 py-3 font-medium">إعداد كلمة المرور</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {appUsers.filter(u => u.role === 'sales').map((appUser) => (
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
                              <td className="px-4 py-4 text-xs font-mono text-slate-500" dir="ltr">{formatDateTime(appUser.lastActive)}</td>
                              <td className="px-4 py-4">
                                {renderLoginStatus(appUser)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => handleToggleActive(appUser.id, appUser.isActive)}
                                  disabled={user?.role !== 'super_admin'}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appUser.isActive ? 'bg-emerald-500' : 'bg-slate-300'} ${user?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        disabled={user?.role !== 'super_admin'}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-xs font-medium ${user?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        <Lock className="w-3.5 h-3.5" /> تعيين
                                      </button>
                                    </div>
                                  )}
                                  {user?.role === 'super_admin' && (
                                    <button
                                      onClick={() => handleDeleteUser(appUser.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="حذف المستخدم"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {appUsers.filter(u => u.role === 'sales').length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                لا يوجد موظفي مبيعات بعد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Dashboard */}
          {activeTab === 'notifications' && user?.role === 'super_admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                لوحة معلومات الإشعارات
              </h2>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">اسم المستخدم</th>
                      <th className="px-4 py-3 font-medium text-slate-700">المتابعات المتأخرة</th>
                      <th className="px-4 py-3 font-medium text-slate-700">تسجيل الدخول اليوم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appUsers.map(appUser => {
                      // Calculate overdue
                      const currentTime = new Date();
                      const todayStr = currentTime.toISOString().split('T')[0];
                      const currentHourMin = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                      const userClients = clients.filter(c => c.ownerId === appUser.id);
                      let overdueCount = 0;
                      userClients.forEach(c => {
                        if (c.followUpDate) {
                          const cDate = c.followUpDate.split('T')[0];
                          const isClosed = ['Not Interested', 'Reserved', 'Done Deal', 'Canceled', 'Unreachable'].includes(c.status);
                          if (!isClosed) {
                             if (cDate < todayStr) {
                               overdueCount++;
                             } else if (cDate === todayStr) {
                               if (c.followUpTime) {
                                 if (c.followUpTime <= currentHourMin) {
                                   overdueCount++;
                                 }
                               } else {
                                 overdueCount++;
                               }
                             }
                          }
                        }
                      });

                      const loggedIn = loggedUsersToday[appUser.id];

                      return (
                        <tr key={appUser.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-900 font-medium">
                            <div className="flex flex-col">
                              <span>{appUser.name ? appUser.name : (appUser.email ? appUser.email.split('@')[0] : 'غير معروف')}</span>
                              <span className="text-xs text-slate-500 font-normal mt-0.5">
                                {appUser.role === 'super_admin' ? 'إدارة عليا' : appUser.role === 'manager' ? 'مدير' : appUser.role === 'sales' ? 'مبيعات' : appUser.role}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {overdueCount > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                                {overdueCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {renderLoginStatus(appUser)}
                          </td>
                        </tr>
                      );
                    })}
                    {appUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          لا يوجد مستخدمين.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                تغيير كلمة المرور الأمان
              </h2>
              
              {!appUser?.password ? (
                <form className="space-y-5" onSubmit={handleLinkPasswordSubmit}>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl text-sm leading-relaxed">
                    <span className="font-semibold block mb-1">💡 تعيين كلمة المرور وتفعيل تسجيل الدخول بالبريد</span>
                    أنت مسجل الدخول باستخدام حساب Google ولم تقم بتعيين كلمة مرور مسبقاً. قم بتعيين كلمة مرور الآن للربط وتفعيل تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور أيضاً.
                  </div>

                  {linkMessage.text && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${linkMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {linkMessage.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تعيين كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      placeholder="كلمة مرور من 6 أحرف على الأقل"
                      value={linkPassword}
                      disabled={isLinking}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isLinking}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isLinking ? 'جاري تعيين وربط الحساب...' : 'تعيين كلمة المرور وربط الحساب'}
                    </button>
                  </div>
                </form>
              ) : appUser?.isActive ? (
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الدور (Role)</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <option value="super_admin">مدير النظام (Super Admin)</option>
              <option value="manager">مدير (Manager)</option>
              <option value="sales">مبيعات (Sales)</option>
            </select>
          </div>

          {newUserRole === 'sales' && (
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">تعيين إلى مدير (اختياري)</label>
               <select
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={newUserTeamId}
                 onChange={(e) => setNewUserTeamId(e.target.value)}
               >
                 <option value="">بدون مدير (إدارة مباشرة)</option>
                 {managers.map(m => (
                   <option key={m.id} value={m.id}>{m.name || m.id}</option>
                 ))}
               </select>
             </div>
          )}

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
