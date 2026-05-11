import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, ClientStatus, Activity } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'activities'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addNote: (clientId: string, noteText: string) => void;
  updateClientStatus: (id: string, newStatus: ClientStatus) => void;
  addFollowUp: (clientId: string, data: { followUpType: string, feedbackText: string, status: ClientStatus, nextAction: string, nextFollowUpDate: string }) => void;
  logCall: (clientId: string, type: 'call_logged' | 'call_attempt') => void;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialClients: Client[] = [
  {
    id: '1',
    name: 'Acme Corp / John Doe',
    phone: '+1 555-1234',
    email: 'john@acme.com',
    projectName: 'Enterprise Upgrade',
    budget: 50000,
    notes: [{ id: 'n1', text: 'Initial contact via website', createdAt: new Date(Date.now() - 86400000).toISOString() }],
    activities: [],
    followUpDate: new Date(Date.now() + 86400000).toISOString(),
    meetingDate: null,
    salesAgent: 'Sarah Smith',
    status: 'Interested',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'Global Tech',
    phone: '+1 555-5678',
    email: 'contact@globaltech.com',
    projectName: 'Cloud Migration',
    budget: 120000,
    notes: [],
    activities: [],
    followUpDate: null,
    meetingDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    salesAgent: 'Sarah Smith',
    status: 'Meeting',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: '3',
    name: 'Emily Davis',
    phone: '+44 20 7123 4567',
    email: 'emily.d@example.com',
    projectName: 'Web App MVP',
    budget: 15000,
    notes: [],
    activities: [],
    followUpDate: null,
    meetingDate: null,
    salesAgent: 'Mike Johnson',
    status: 'Done Deal',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const { user } = useAuth();
  const currentAgent = user?.name || 'System';

  useEffect(() => {
    const stored = localStorage.getItem('calista_clients');
    if (stored) {
      // Ensure existing clients have activities array
      const parsed = JSON.parse(stored);
      setClients(parsed.map((c: Client) => ({ ...c, activities: c.activities || [] })));
    } else {
      setClients(initialClients);
      localStorage.setItem('calista_clients', JSON.stringify(initialClients));
    }
  }, []);

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('calista_clients', JSON.stringify(newClients));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'activities'>) => {
    const newId = crypto.randomUUID();
    const newClient: Client = {
      ...clientData,
      id: newId,
      notes: [],
      activities: [{
        id: crypto.randomUUID(),
        clientId: newId,
        type: 'client_created',
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveClients([...clients, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const updated = clients.map(c => {
      if (c.id === id) {
        const hasStatusChange = updates.status && updates.status !== c.status;
        const newActivities = [...(c.activities || [])];
        
        if (hasStatusChange) {
          newActivities.push({
            id: crypto.randomUUID(),
            clientId: id,
            type: 'status_change',
            previousStatus: c.status,
            newStatus: updates.status,
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          });
        }
        
        if (updates.budget !== undefined && Number(updates.budget) !== Number(c.budget)) {
          newActivities.push({
            id: crypto.randomUUID(),
            clientId: id,
            type: 'budget_change',
            content: `Budget changed from $${c.budget || 0} to $${updates.budget}`,
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          });
        }

        if (updates.meetingDate !== undefined && updates.meetingDate !== c.meetingDate && updates.meetingDate !== null) {
          newActivities.push({
            id: crypto.randomUUID(),
            clientId: id,
            type: 'meeting_scheduled',
            content: `Meeting scheduled for ${updates.meetingDate}`,
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          });
        }
        
        // General update
        newActivities.push({
          id: crypto.randomUUID(),
          clientId: id,
          type: 'client_updated',
          agentName: currentAgent,
          createdAt: new Date().toISOString()
        });

        return { 
          ...c, 
          ...updates, 
          activities: newActivities,
          updatedAt: new Date().toISOString() 
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const updateClientStatus = (id: string, newStatus: ClientStatus) => {
    const updated = clients.map(c => {
      if (c.id === id && c.status !== newStatus) {
        return {
          ...c,
          status: newStatus,
          activities: [...(c.activities || []), {
            id: crypto.randomUUID(),
            clientId: id,
            type: 'status_change',
            previousStatus: c.status,
            newStatus: newStatus,
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          }],
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const deleteClient = (id: string) => {
    const filtered = clients.filter(c => c.id !== id);
    saveClients(filtered);
  };

  const addNote = (clientId: string, noteText: string) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          notes: [...c.notes, { id: crypto.randomUUID(), text: noteText, createdAt: new Date().toISOString() }],
          activities: [...(c.activities || []), {
            id: crypto.randomUUID(),
            clientId: id,
            type: 'note_added',
            content: noteText,
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          }],
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const addFollowUp = (clientId: string, data: { followUpType: string, feedbackText: string, status: ClientStatus, nextAction: string, nextFollowUpDate: string }) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const newActivities = [...(c.activities || [])];
        
        newActivities.push({
          id: crypto.randomUUID(),
          clientId,
          type: 'follow_up',
          content: data.feedbackText,
          followUpType: data.followUpType,
          nextAction: data.nextAction,
          nextFollowUpDate: data.nextFollowUpDate,
          previousStatus: c.status,
          newStatus: data.status,
          agentName: currentAgent,
          createdAt: new Date().toISOString()
        });

        // If status changed to something else, we might log that or just let follow_up handle it. 
        // Follow up shows it visually, we will use newStatus and previousStatus on follow_up activity.

        return {
          ...c,
          status: data.status,
          followUpDate: data.nextFollowUpDate || c.followUpDate,
          activities: newActivities,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const logCall = (clientId: string, type: 'call_logged' | 'call_attempt') => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          activities: [...(c.activities || []), {
            id: crypto.randomUUID(),
            clientId,
            type,
            content: type === 'call_logged' ? 'Call logged' : 'Call attempted',
            agentName: currentAgent,
            createdAt: new Date().toISOString()
          }],
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const refreshData = () => {
    // just dummy for trigger updates if needed
  };

  return (
    <DataContext.Provider value={{ clients, addClient, updateClient, deleteClient, addNote, updateClientStatus, addFollowUp, logCall, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

