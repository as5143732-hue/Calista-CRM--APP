import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Building2, Banknote, Calendar, ChevronRight, Edit2, Plus, Clock, FileText, CheckCircle2, MessageCircle, CalendarPlus, Search, PhoneCall, Bell } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ClientForm } from '../components/forms/ClientForm';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { ClientStatus, Activity } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const ALL_STATUSES: ClientStatus[] = [
  'My Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 'Reserved', 
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting', 
  'Canceled', 'Interested', 'Low Budget', 'Not Interested', 'Unreachable', 'Call Attempt'
];

const PIPELINE_STAGES: { id: ClientStatus, title: string }[] = [
  { id: 'My Fresh Lead', title: 'New' },
  { id: 'Call Attempt', title: 'Contacted' },
  { id: 'Interested', title: 'Interested' },
  { id: 'Follow Up', title: 'Negotiation' },
  { id: 'Done Deal', title: 'Closed' },
];

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, updateClientStatus, addNote, addFollowUp, logCall, updateClient } = useData();
  const { firebaseUser, user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchActivity, setSearchActivity] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Follow Up Form State
  const [fuType, setFuType] = useState('Call Attempt');
  const [fuFeedback, setFuFeedback] = useState('');
  const [fuStatus, setFuStatus] = useState<ClientStatus>('My Fresh Lead');
  const [fuNextAction, setFuNextAction] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');

  // Reminder State
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'tasks' | 'requirements'>('overview');

  const client = clients.find(c => c.id === id);

  useEffect(() => {
    if (!id || !firebaseUser) return;
    
    const activitiesRef = collection(db, `clients/${id}/activities`);
    let q;
    if (user?.role === 'admin') {
      q = query(activitiesRef);
    } else {
      q = query(activitiesRef, where('ownerId', '==', firebaseUser.uid));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Activity[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Activity);
      });
      setActivities(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `clients/${id}/activities`);
    });

    return () => unsubscribe();
  }, [id, firebaseUser]);

  useEffect(() => {
    if(window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Client Not Found</h2>
        <p className="text-slate-500 mb-6">The client you are looking for does not exist or has been deleted.</p>
        <button onClick={() => navigate('/clients')} className="text-blue-600 hover:underline">
          Return to Clients
        </button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: ClientStatus) => {
    updateClientStatus(client.id, newStatus);
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    addFollowUp(client.id, {
      followUpType: fuType,
      feedbackText: fuFeedback,
      status: fuStatus,
      nextAction: fuNextAction,
      nextFollowUpDate: fuNextDate
    });
    setIsFollowUpModalOpen(false);
    setFuFeedback('');
    setFuNextAction('');
    setFuNextDate('');
  };

  const handleSetReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.Notification && Notification.permission === "granted") {
      const scheduledTime = new Date(`${reminderDate}T${reminderTime}`).getTime();
      const now = new Date().getTime();
      const delay = scheduledTime - now;
      
      if (delay > 0) {
        addNote(client.id, `Reminder set for ${format(scheduledTime, 'MMM d, h:mm a')}: ${reminderNote}`);
        
        // Schedule notification (will only work while tab is kept open or service worker is active)
        setTimeout(() => {
          new Notification(`Reminder: ${client.name}`, {
            body: reminderNote || 'Follow up with your client now!',
            icon: '/vite.svg'
          });
        }, delay);

        alert('Reminder set successfully!');
      } else {
        alert('Please set a time in the future.');
        return;
      }
    } else {
      alert('Please enable browser notifications to use this feature.');
      Notification.requestPermission();
    }
    
    setIsReminderModalOpen(false);
    setReminderDate('');
    setReminderTime('');
    setReminderNote('');
  };

  const openFollowUpModal = () => {
    setFuStatus(client.status);
    setIsFollowUpModalOpen(true);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNote(client.id, newNote.trim());
      setNewNote('');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'note_added': return <FileText className="w-4 h-4 text-white" />;
      case 'client_created': return <User className="w-4 h-4 text-white" />;
      case 'client_updated': return <Edit2 className="w-4 h-4 text-white" />;
      case 'meeting_scheduled': return <Calendar className="w-4 h-4 text-white" />;
      case 'call_logged': 
      case 'call_attempt': return <Phone className="w-4 h-4 text-white" />;
      case 'budget_change': return <Banknote className="w-4 h-4 text-white" />;
      case 'follow_up': return <CalendarPlus className="w-4 h-4 text-white" />;
      default: return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'bg-purple-500';
      case 'note_added': return 'bg-blue-500';
      case 'client_created': return 'bg-emerald-500';
      case 'client_updated': return 'bg-amber-500';
      case 'meeting_scheduled': return 'bg-indigo-500';
      case 'call_logged': return 'bg-cyan-500';
      case 'call_attempt': return 'bg-orange-500';
      case 'budget_change': return 'bg-green-600';
      case 'follow_up': return 'bg-pink-500';
      default: return 'bg-slate-400';
    }
  };

  const formatActivityName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredActivities = (activities || []).filter(a => {
    if (!searchActivity) return true;
    const term = searchActivity.toLowerCase();
    const matchContent = a.content?.toLowerCase().includes(term);
    const matchType = a.type ? a.type.replace('_', ' ').toLowerCase().includes(term) : false;
    return matchContent || matchType;
  }).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === client.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 truncate">{client.name}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsReminderModalOpen(true)} 
            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors tooltip" title="Set Reminder">
            <Bell className="w-4 h-4" />
          </button>
          <button 
            onClick={() => logCall(client.id, 'call_attempt')} 
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors tooltip" title="Log Call Attempt">
            <PhoneCall className="w-4 h-4" />
          </button>
          <a href={`tel:${client.phone}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Call Client">
            <Phone className="w-4 h-4" />
          </a>
          <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Send WhatsApp">
             <MessageCircle className="w-4 h-4" />
          </a>
          <button onClick={openFollowUpModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm ml-2">
             <CalendarPlus className="w-4 h-4" />
             Add Follow Up
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium text-sm ml-2">
             <Edit2 className="w-4 h-4" />
             Edit Profile
          </button>
        </div>
      </div>

      {/* Progress Tracker Pipeline */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex >= idx;
            const isCurrent = currentStageIndex === idx || (currentStageIndex === -1 && idx === 0);
            
            return (
              <div 
                key={stage.id} 
                onClick={() => handleStatusChange(stage.id)}
                className={`flex flex-col items-center gap-2 cursor-pointer group flex-1 ${isCompleted ? '' : 'opacity-50'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-4 ${
                  isCurrent ? 'bg-blue-600 text-white border-blue-100 scale-110 shadow-md ring-4 ring-blue-500/20' : 
                  isCompleted ? 'bg-blue-600 text-white border-white' : 'bg-slate-200 text-slate-500 border-white hover:bg-slate-300'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  {stage.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-6">
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Overview</button>
        <button onClick={() => setActiveTab('log')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === 'log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Interaction Log</button>
        <button onClick={() => setActiveTab('tasks')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Tasks</button>
        <button onClick={() => setActiveTab('requirements')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Requirements</button>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-800 mb-6">Client Identity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><User className="w-5 h-5" /></div>
                  <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</p><p className="font-medium text-slate-900">{client.name}</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Phone className="w-5 h-5" /></div>
                  <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Number</p><p className="font-medium text-slate-900">{client.phone}</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Mail className="w-5 h-5" /></div>
                  <div className="min-w-0"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p><p className="font-medium text-slate-900 truncate">{client.email || 'N/A'}</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><User className="w-5 h-5" /></div>
                  <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Agent</p><p className="font-medium text-slate-900">{client.salesAgent}</p></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="font-bold text-slate-800 mb-6">Lead Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Search className="w-5 h-5" /></div>
                    <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Source</p><p className="font-medium text-slate-900">{client.leadSource || 'N/A'}</p></div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Score</p>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${client.leadScore === 'Hot' ? 'bg-red-100 text-red-700' : client.leadScore === 'Warm' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {client.leadScore || 'Cold'} {client.leadScore === 'Hot' ? '🔥' : client.leadScore === 'Warm' ? '🌤️' : '❄️'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Banknote className="w-5 h-5" /></div>
                    <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Range</p><p className="font-mono font-bold text-slate-900">{client.budgetMin || 0} - {client.budgetMax || 0} $</p></div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Quick Status Change</label>
                <select 
                  value={client.status}
                  onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow font-medium text-slate-800"
                >
                  {ALL_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[700px]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="font-bold text-slate-800">Activity Timeline</h2>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search activities..." 
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-shadow"
                  />
                </div>
              </div>
              
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity, idx, arr) => (
                    <div key={activity.id} className="relative pl-8 pb-4">
                      {idx !== arr.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100"></div>}
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10 border-2 border-white ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {formatActivityName(activity.type)}
                              {activity.followUpType && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded uppercase font-bold">{activity.followUpType}</span>}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 shrink-0 ml-4 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, h:mm a') : 'Just now'}
                          </span>
                        </div>
                        
                        {activity.type === 'status_change' && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">{activity.previousStatus}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs font-bold">{activity.newStatus}</span>
                          </div>
                        )}

                        {(activity.type === 'note_added' || activity.content) && (
                          <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100/50 mt-2">
                            <p className="text-slate-700 text-sm font-medium leading-relaxed">{activity.content}</p>
                          </div>
                        )}
                        
                        {activity.nextAction && (
                          <div className="mt-3 bg-indigo-50 text-indigo-800 p-3 rounded-lg text-sm font-medium border border-indigo-100 flex items-start gap-2">
                            <CalendarPlus className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold">Next Action:</span> {activity.nextAction} 
                              {activity.nextFollowUpDate && <div className="text-indigo-600 text-xs mt-1">Due: {format(new Date(activity.nextFollowUpDate), 'MMMM d, yyyy')}</div>}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {activity.agentName?.charAt(0) || 'U'}
                           </div>
                           <span className="text-xs font-medium text-slate-500">{activity.agentName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">No activity logged yet.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h2 className="font-bold text-slate-800 mb-4">Add Note</h2>
              <form onSubmit={handleAddNote} className="flex flex-col flex-1">
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type a new note..."
                  className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow resize-none text-sm bg-slate-50 focus:bg-white"
                  required
                />
                <button 
                  type="submit"
                  className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800">Tasks & Reminders</h2>
              <button onClick={openFollowUpModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm">
                 <CalendarPlus className="w-4 h-4" /> Add Task
              </button>
            </div>
            <div className="space-y-4">
               {activities.filter(a => a.nextAction).map(a => (
                 <div key={a.id} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                     <h3 className="font-bold text-indigo-900">{a.nextAction}</h3>
                     <p className="text-sm text-indigo-700 mt-1">Due: {a.nextFollowUpDate ? format(new Date(a.nextFollowUpDate), 'MMM d, yyyy') : 'No Date'}</p>
                   </div>
                   <div className="text-xs text-indigo-500 bg-indigo-100 px-3 py-1 rounded-full font-bold">
                     Created by {a.agentName}
                   </div>
                 </div>
               ))}
               {activities.filter(a => a.nextAction).length === 0 && (
                 <div className="text-center py-10 text-slate-500">No scheduled tasks.</div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
            <h2 className="font-bold text-slate-800 mb-6">Client Requirements</h2>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Property Type</p>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {client.propertyType || 'Not specified'}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Preferred Location</p>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {client.preferredLocation || 'Not specified'}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Project</p>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {client.projectName || 'Not specified'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Min Budget</p>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-lg">
                    {formatCurrency(client.budgetMin || 0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Max Budget</p>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-lg">
                    {formatCurrency(client.budgetMax || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Add Follow Up">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={fuType}
                onChange={(e) => setFuType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              >
                <option>Call Attempt</option>
                <option>Phone Call</option>
                <option>WhatsApp Message</option>
                <option>Email Sent</option>
                <option>Meeting</option>
                <option>Site Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
              <select
                value={fuStatus}
                onChange={(e) => setFuStatus(e.target.value as ClientStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              >
                {ALL_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feedback / Notes</label>
            <textarea
              required
              value={fuFeedback}
              onChange={(e) => setFuFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm resize-none"
              rows={3}
              placeholder="What happened during this follow up?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Action (Optional)</label>
              <input
                type="text"
                value={fuNextAction}
                onChange={(e) => setFuNextAction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                placeholder="e.g. Send proposal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow Up Date</label>
              <input
                type="date"
                value={fuNextDate}
                onChange={(e) => setFuNextDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Save Follow Up
            </button>
          </div>
        </form>
      </Modal>

      {/* Reminder Modal */}
      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Set Smart Reminder">
        <form onSubmit={handleSetReminder} className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Set a browser notification to remind you to follow up with this client.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reminder Note</label>
            <textarea
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="e.g. Call to discuss the new project"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm resize-none"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Set Reminder
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
        <ClientForm 
          initialData={client}
          onSubmit={(data) => {
            updateClient(client.id, data);
            setIsEditModalOpen(false);
          }}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
