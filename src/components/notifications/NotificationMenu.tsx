import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, User as UserIcon, LogIn, Check } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AppNotification {
  id: string;
  type: 'login' | 'new_client' | 'follow_up';
  userId?: string;
  userEmail?: string;
  clientId?: string;
  clientName?: string;
  addedBy?: string;
  targetUserId?: string;
  timestamp: string;
  read: boolean;
  message?: string;
  isLocal?: boolean; // For locally generated follow-ups
}

export const NotificationMenu: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { clients } = useData();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === 'manager' && firebaseUser) {
      const q = query(
        collection(db, 'users'),
        where('managerId', '==', firebaseUser.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => doc.id);
        setTeamMembers(members);
      });
      return () => unsubscribe();
    }
  }, [user, firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || !user) return;

    let q;
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') {
      // Admins and managers fetch recent, then filter locally
      q = query(
        collection(db, 'notifications'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      // Normal users see only notifications directed at them
      q = query(
        collection(db, 'notifications'),
        where('targetUserId', '==', firebaseUser.uid),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let dbNotifs: AppNotification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<AppNotification, 'id'>)
      })).filter(n => n.type !== 'login');

      // Apply RBAC filtering for manager
      if (user.role === 'manager') {
        dbNotifs = dbNotifs.filter(n => {
          // Manager sees follow_up and new_client for themselves and their team members
          if ((n.type === 'follow_up' || n.type === 'new_client') && 
              (n.targetUserId === firebaseUser.uid || teamMembers.includes(n.targetUserId || ''))) {
            return true;
          }
          // Manager sees their own login? Usually they don't see any login unless it's for them,
          // but the prompt says they don't see team login. 
          if (n.type === 'login' && n.userId === firebaseUser.uid) {
            return true;
          }
          return false;
        });
      }

      setNotifications(dbNotifs);
    });

    return () => unsubscribe();
  }, [firebaseUser, user, teamMembers]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  // Locally generated follow-up reminders
  const localNotifications: (AppNotification & { isOverdue?: boolean, fuDate?: string, fuTime?: string })[] = [];
  if (user && clients.length > 0) {
    const todayStr = currentTime.toISOString().split('T')[0];
    const currentHourMin = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    clients.forEach(c => {
      // super_admin sees all, manager sees own and team, sales sees own
      let isVisible = false;
      if (user.role === 'super_admin' || user.role === 'admin') {
        isVisible = true;
      } else if (user.role === 'manager') {
        isVisible = c.ownerId === firebaseUser?.uid || teamMembers.includes(c.ownerId || '');
      } else {
        isVisible = c.ownerId === firebaseUser?.uid;
      }

      if (c.followUpDate && isVisible) {
        const cDate = c.followUpDate.split('T')[0];
        const isClosed = ['Not Interested', 'Reserved', 'Done Deal', 'Canceled', 'Unreachable'].includes(c.status);
        
        let shouldNotify = false;
        if (!isClosed) {
           if (cDate < todayStr) {
             shouldNotify = true; // Overdue from previous day
           } else if (cDate === todayStr) {
             if (c.followUpTime) {
               shouldNotify = c.followUpTime <= currentHourMin;
             } else {
               shouldNotify = true; // If no time specified, notify immediately on the day
             }
           }
        }

        if (shouldNotify) {
          const isOverdue = cDate < todayStr || (cDate === todayStr && !!c.followUpTime && c.followUpTime < currentHourMin);
          localNotifications.push({
            id: `local-fu-${c.id}`,
            type: 'follow_up',
            clientId: c.id,
            clientName: c.name,
            timestamp: c.followUpDate,
            read: localStorage.getItem(`read_fu_${c.id}_${cDate}`) === 'true',
            isLocal: true,
            isOverdue
          } as AppNotification & { isOverdue?: boolean, fuDate?: string, fuTime?: string });
          
          localNotifications[localNotifications.length - 1].fuDate = cDate;
          localNotifications[localNotifications.length - 1].fuTime = c.followUpTime || '';
        }
      }
    });
  }

  const allNotifications = [...notifications, ...localNotifications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 10); // Take top 10

  // Effect to show Toasts
  useEffect(() => {
    // Toast new unread local follow ups
    for (const notif of localNotifications) {
      if (!notif.read && localStorage.getItem(`toast_${notif.id}`) !== 'true') {
        toast(`متابعة اليوم: ${notif.clientName}`, { icon: '📅' });
        localStorage.setItem(`toast_${notif.id}`, 'true');
      }
    }
    // Toast new DB notifications
    for (const notif of notifications) {
      if (!notif.read && localStorage.getItem(`toast_${notif.id}`) !== 'true') {
        if (notif.type === 'new_client') {
          toast(`عميل جديد: ${notif.clientName}`, { icon: '👤' });
        } else if (notif.type === 'login' && (user?.role === 'admin' || user?.role === 'super_admin')) {
          toast(`تسجيل دخول: ${notif.userEmail}`, { icon: '🔐' });
        }
        localStorage.setItem(`toast_${notif.id}`, 'true');
      }
    }
  }, [localNotifications, notifications, user]);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const getNotificationText = (notif: AppNotification & { isOverdue?: boolean }) => {
    switch (notif.type) {
      case 'login': return `قام ${notif.userEmail} بتسجيل الدخول`;
      case 'new_client': return `تم إضافة عميل جديد: ${notif.clientName} بواسطة ${notif.addedBy}`;
      case 'follow_up': 
          if (notif.isOverdue) return `متأخر: ${notif.clientName}`;
          return `متابعة اليوم: ${notif.clientName}`;
      default: return '';
    }
  };

  const handleNotificationClick = async (notif: AppNotification & { fuDate?: string }) => {
    // Mark as read
    if (notif.isLocal) {
        localStorage.setItem(`read_fu_${notif.clientId}_${notif.fuDate}`, 'true');
        // Trigger a re-render by doing a dummy state update
        setNotifications([...notifications]);
    } else if (!notif.read) {
        try {
            await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    }

    setIsOpen(false);

    // Route handling
    if (notif.type === 'follow_up' || notif.type === 'new_client') {
      navigate(`/clients/${notif.clientId}`);
    } else if (notif.type === 'login') {
      // maybe do nothing or navigate to a logs page if existed
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'new_client': return <UserIcon className="w-4 h-4 text-blue-500" />;
      case 'follow_up': return <Calendar className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="relative p-2.5 bg-slate-100 text-slate-400 rounded-full hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden" dir="rtl">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">الإشعارات</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {allNotifications.length > 0 ? (
              allNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                      {getNotificationText(notif)}
                    </p>
                    {notif.type !== 'follow_up' && (
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(notif.timestamp), 'PP p')}
                      </p>
                    )}
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 self-center shrink-0"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                لا توجد إشعارات
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
