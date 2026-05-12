import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Building2, Banknote, Calendar, ChevronRight, Edit2, Plus, Clock, FileText, CheckCircle2, MessageCircle, CalendarPlus, Search, PhoneCall } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { ClientStatus, Activity } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const ALL_STATUSES: ClientStatus[] = [
  'My Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 'Reserved', 
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting', 
  'Canceled', 'Interested', 'Low Budget', 'Not Interested', 'Unreachable'
];

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, updateClientStatus, addNote, addFollowUp, logCall } = useData();
  const { firebaseUser } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [searchActivity, setSearchActivity] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Follow Up Form State
  const [fuType, setFuType] = useState('Call Attempt');
  const [fuFeedback, setFuFeedback] = useState('');
  const [fuStatus, setFuStatus] = useState<ClientStatus>('My Fresh Lead');
  const [fuNextAction, setFuNextAction] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');

  const client = clients.find(c => c.id === id);

  useEffect(() => {
    if (!id || !firebaseUser) return;
    
    const activitiesRef = collection(db, `clients/${id}/activities`);
    const q = query(activitiesRef, where('ownerId', '==', firebaseUser.uid));
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateClientStatus(client.id, e.target.value as ClientStatus);
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800">Profile Details</h2>
              <div className="flex items-center gap-2">
                <StatusBadge status={client.status} />
              </div>
            </div>
            
            <div className="mb-4">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Quick Status Change</label>
               <select 
                  value={client.status}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow font-medium text-slate-800"
                >
                  {ALL_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
               </select>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Agent</p>
                  <p className="font-medium text-slate-900">{client.salesAgent}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                  <p className="font-medium text-slate-900">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-medium text-slate-900 truncate">{client.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</p>
                  <p className="font-medium text-slate-900">{client.projectName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget</p>
                  <p className="font-mono font-bold text-slate-900 text-lg">{formatCurrency(client.budget)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Follow Up Date</p>
                  <p className="font-medium text-slate-900">
                    {client.followUpDate ? format(new Date(client.followUpDate), 'MMMM d, yyyy') : 'No date set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[700px]">
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
                    {/* Vertical Line */}
                    {idx !== arr.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100"></div>
                    )}
                    
                    {/* Circle Icon */}
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {formatActivityName(activity.type)}
                            {activity.followUpType && <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded uppercase">{activity.followUpType}</span>}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 shrink-0 ml-4">
                          {activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, h:mm a') : 'Just now'}
                        </span>
                      </div>
                      
                      {activity.type === 'status_change' && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-medium">{activity.previousStatus}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{activity.newStatus}</span>
                        </div>
                      )}

                      {(activity.type === 'note_added' || activity.content) && (
                        <p className="text-slate-600 text-sm mt-2 font-medium">{activity.content}</p>
                      )}
                      
                      {activity.nextAction && (
                        <div className="mt-2 bg-blue-50 text-blue-800 p-2 rounded text-xs font-medium border border-blue-100">
                          <span className="font-bold mr-1">Next Action:</span> {activity.nextAction} 
                          {activity.nextFollowUpDate && <span className="ml-2 text-blue-500">({format(new Date(activity.nextFollowUpDate), 'MMM d, yyyy')})</span>}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                         <User className="w-3.5 h-3.5 text-slate-400" />
                         <span className="text-xs font-medium text-slate-500">by {activity.agentName}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">No activity logged yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4">Add Note</h2>
            <form onSubmit={handleAddNote}>
              <textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your note here..."
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button 
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
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

    </div>
  );
};
