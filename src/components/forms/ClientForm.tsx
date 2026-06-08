import React, { useState, useEffect } from 'react';
import { Client, ClientStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const statusOptions: ClientStatus[] = [
  'My Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 'Reserved',
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting',
  'Canceled', 'Interested', 'Low Budget', 'Not Interested', 'Unreachable'
];

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { addNote } = useData();
  const { user, firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');
  const [usersList, setUsersList] = useState<{id: string, name: string, email: string}[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'manager') {
      const fetchUsers = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          const users = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.data().email?.split('@')[0] || 'Unknown',
            email: doc.data().email || ''
          }));
          setUsersList(users);
        } catch (err) {
          console.error("Error fetching users list for admin assignment", err);
        }
      };
      fetchUsers();
    }
  }, [user]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectName: '',
    budgetMin: '',
    budgetMax: '',
    followUpDate: '',
    meetingDate: '',
    status: 'My Fresh Lead' as ClientStatus,
    leadSource: '',
    leadScore: 'Cold' as any,
    propertyType: 'Residential',
    preferredLocation: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone || '',
        email: initialData.email || '',
        projectName: initialData.projectName || '',
        budgetMin: initialData.budgetMin ? initialData.budgetMin.toString() : '',
        budgetMax: initialData.budgetMax ? initialData.budgetMax.toString() : '',
        followUpDate: initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '',
        meetingDate: initialData.meetingDate ? initialData.meetingDate.split('T')[0] : '',
        status: initialData.status,
        leadSource: initialData.leadSource || '',
        leadScore: initialData.leadScore || 'Cold',
        propertyType: initialData.propertyType || 'Residential',
        preferredLocation: initialData.preferredLocation || '',
      });
      if (initialData.ownerId) {
        setAssignedUserId(initialData.ownerId);
      }
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.phone && !initialData) {
      try {
        setIsSubmitting(true);
        // Check for duplicate phone number
        let duplicateQuery;
        if (user?.role === 'super_admin' || user?.role === 'manager') {
           duplicateQuery = query(collection(db, 'clients'), where('phone', '==', formData.phone));
        } else {
           duplicateQuery = query(collection(db, 'clients'), where('phone', '==', formData.phone), where('ownerId', '==', user?.uid || firebaseUser?.uid));
        }
        const snapshot = await getDocs(duplicateQuery);
        
        if (!snapshot.empty) {
          setFormError('هذا الرقم موجود بالفعل، لا يمكن تكرار بيانات العميل');
          setIsSubmitting(false);
          return; // Stop submission
        }
      } catch (err) {
        console.error("Error checking for duplicate phone", err);
        // If we get a permissions error because we can't query the whole collection,
        // we might still continue, or we can just fail. We'll proceed in case of error
        // since the prompt says "if the phone number is found".
      }
    }

    const result: any = {
      name: formData.name,
      status: formData.status,
      salesAgent: initialData?.salesAgent || 'Current User',
      leadScore: formData.leadScore,
      propertyType: formData.propertyType,
    };
    if ((user?.role === 'super_admin' || user?.role === 'manager') && assignedUserId) {
       result.ownerId = assignedUserId;
       const assignedUser = usersList.find(u => u.id === assignedUserId);
       if (assignedUser) {
         result.salesAgent = assignedUser.name;
       }
    }
    if (formData.phone) result.phone = formData.phone;
    if (formData.email) result.email = formData.email;
    if (formData.projectName) result.projectName = formData.projectName;
    if (formData.budgetMin) result.budgetMin = Number(formData.budgetMin);
    if (formData.budgetMax) result.budgetMax = Number(formData.budgetMax);
    if (formData.leadSource) result.leadSource = formData.leadSource;
    if (formData.preferredLocation) result.preferredLocation = formData.preferredLocation;
    if (formData.followUpDate) result.followUpDate = new Date(formData.followUpDate).toISOString();
    if (formData.meetingDate) result.meetingDate = new Date(formData.meetingDate).toISOString();

    const avgBudget = ((Number(formData.budgetMin || 0) + Number(formData.budgetMax || 0)) / 2) || 0;
    result.budget = avgBudget;

    onSubmit(result);
    setIsSubmitting(false);
  };

  const handleAddNote = () => {
    if (newNote.trim() && initialData) {
      addNote(initialData.id, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {initialData && (
        <div className="flex border-b border-slate-200 mb-4">
          <button
            type="button"
            className={`py-2 px-4 text-sm font-bold uppercase tracking-tight border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-sm font-bold uppercase tracking-tight border-b-2 transition-colors ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({initialData?.notes?.length || 0})
          </button>
        </div>
      )}

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Client Name *</label>
              <input required type="text" className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {(user?.role === 'super_admin' || user?.role === 'manager') && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned To (User)</label>
                <select className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={assignedUserId} onChange={e => setAssignedUserId(e.target.value)}>
                  <option value="">Assign to me</option>
                  {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              {user?.role === 'sales' ? (
                 <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed overflow-hidden">
                    {formData.phone || '—'}
                 </div>
              ) : (
                 <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.leadSource} onChange={e => setFormData({...formData, leadSource: e.target.value})} placeholder="e.g. Facebook Ads" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Score</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.leadScore} onChange={e => setFormData({...formData, leadScore: e.target.value})}>
                <option value="Cold">Cold</option>
                <option value="Warm">Warm</option>
                <option value="Hot">Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Administrative">Administrative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Location</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.preferredLocation} onChange={e => setFormData({...formData, preferredLocation: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget Min ($)</label>
              {user?.role === 'sales' ? (
                 <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed">
                   {formData.budgetMin || '—'}
                 </div>
              ) : (
                 <input type="number" min="0" step="1000" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.budgetMin} onChange={e => setFormData({...formData, budgetMin: e.target.value})} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget Max ($)</label>
              {user?.role === 'sales' ? (
                 <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed">
                   {formData.budgetMax || '—'}
                 </div>
              ) : (
                 <input type="number" min="0" step="1000" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.budgetMax} onChange={e => setFormData({...formData, budgetMax: e.target.value})} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow Up Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.meetingDate} onChange={e => setFormData({...formData, meetingDate: e.target.value})} />
            </div>
          </div>
          
          <div className="pt-4 mt-auto flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex-1 flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {!initialData?.notes?.length ? (
              <p className="text-sm text-slate-500 text-center py-6 border border-dashed rounded-lg">No notes added yet.</p>
            ) : (
              initialData?.notes.map(note => (
                <div key={note.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700">{note.text}</p>
                  <p className="text-xs text-slate-400 mt-2">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto border-t border-slate-100 pt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Add a new note..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') handleAddNote() }}
            />
            <button 
              type="button" 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

