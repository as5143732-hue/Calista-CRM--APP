import React, { useState, useEffect } from 'react';
import { Client, ClientStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectName: '',
    budget: '',
    followUpDate: '',
    meetingDate: '',
    status: 'My Fresh Lead' as ClientStatus,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone || '',
        email: initialData.email || '',
        projectName: initialData.projectName || '',
        budget: initialData.budget ? initialData.budget.toString() : '',
        followUpDate: initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '',
        meetingDate: initialData.meetingDate ? initialData.meetingDate.split('T')[0] : '',
        status: initialData.status,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: Number(formData.budget) || 0,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      meetingDate: formData.meetingDate ? new Date(formData.meetingDate).toISOString() : null,
      salesAgent: initialData?.salesAgent || 'Current User',
    });
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
            Notes ({initialData.notes.length})
          </button>
        </div>
      )}

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
              <input type="number" min="0" step="1000" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
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
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
              {initialData ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex-1 flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {initialData?.notes.length === 0 ? (
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

