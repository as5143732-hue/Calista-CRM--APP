import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, ClientStatus, Activity } from '../types';
import { useAuth, User } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  const { user, firebaseUser } = useAuth();
  const currentAgent = user?.name || 'System';

  useEffect(() => {
    if (!firebaseUser) {
      setClients([]);
      return;
    }

    let q;
    if (user?.role === 'admin') {
      q = query(collection(db, 'clients'));
    } else {
      q = query(collection(db, 'clients'), where('ownerId', '==', firebaseUser.uid));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Client[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });

    return () => unsubscribe();
  }, [firebaseUser, user]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'activities'>) => {
    if (!firebaseUser) return;
    try {
      const newClientRef = doc(collection(db, 'clients'));
      const newClient = {
        ...clientData,
        ownerId: firebaseUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(newClientRef, newClient);

      const activityRef = doc(collection(db, `clients/${newClientRef.id}/activities`));
      await setDoc(activityRef, {
        clientId: newClientRef.id,
        ownerId: firebaseUser.uid,
        type: 'client_created',
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === id);
    if (!client) return;

    try {
      const clientRef = doc(db, 'clients', id);
      const updateData = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(clientRef, updateData);

      const hasStatusChange = updates.status && updates.status !== client.status;
      if (hasStatusChange) {
        const activityRef = doc(collection(db, `clients/${id}/activities`));
        await setDoc(activityRef, {
          clientId: id,
          ownerId: firebaseUser.uid,
          type: 'status_change',
          previousStatus: client.status,
          newStatus: updates.status,
          agentName: currentAgent,
          createdAt: new Date().toISOString()
        });
      }
      
      if (updates.budget !== undefined && Number(updates.budget) !== Number(client.budget)) {
        const activityRef = doc(collection(db, `clients/${id}/activities`));
        await setDoc(activityRef, {
          clientId: id,
          ownerId: firebaseUser.uid,
          type: 'budget_change',
          content: `Budget changed from $${client.budget || 0} to $${updates.budget}`,
          agentName: currentAgent,
          createdAt: new Date().toISOString()
        });
      }

      if (updates.meetingDate !== undefined && updates.meetingDate !== client.meetingDate && updates.meetingDate !== null) {
        const activityRef = doc(collection(db, `clients/${id}/activities`));
        await setDoc(activityRef, {
          clientId: id,
          ownerId: firebaseUser.uid,
          type: 'meeting_scheduled',
          content: `Meeting scheduled for ${updates.meetingDate}`,
          agentName: currentAgent,
          createdAt: new Date().toISOString()
        });
      }
      
      // General update
      const activityRef = doc(collection(db, `clients/${id}/activities`));
      await setDoc(activityRef, {
        clientId: id,
        ownerId: firebaseUser.uid,
        type: 'client_updated',
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const updateClientStatus = async (id: string, newStatus: ClientStatus) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === id);
    if (!client || client.status === newStatus) return;

    try {
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, { status: newStatus, updatedAt: new Date().toISOString() });

      const activityRef = doc(collection(db, `clients/${id}/activities`));
      await setDoc(activityRef, {
        clientId: id,
        ownerId: firebaseUser.uid,
        type: 'status_change',
        previousStatus: client.status,
        newStatus: newStatus,
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  const addNote = async (clientId: string, noteText: string) => {
    if (!firebaseUser) return;
    try {
      const activityRef = doc(collection(db, `clients/${clientId}/activities`));
      await setDoc(activityRef, {
        clientId,
        ownerId: firebaseUser.uid,
        type: 'note_added',
        content: noteText,
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients/${clientId}/activities`);
    }
  };

  const addFollowUp = async (clientId: string, data: { followUpType: string, feedbackText: string, status: ClientStatus, nextAction: string, nextFollowUpDate: string }) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, { 
        status: data.status, 
        followUpDate: data.nextFollowUpDate || client.followUpDate,
        updatedAt: new Date().toISOString() 
      });

      const activityRef = doc(collection(db, `clients/${clientId}/activities`));
      await setDoc(activityRef, {
        clientId,
        ownerId: firebaseUser.uid,
        type: 'follow_up',
        content: data.feedbackText,
        followUpType: data.followUpType,
        nextAction: data.nextAction,
        nextFollowUpDate: data.nextFollowUpDate,
        previousStatus: client.status,
        newStatus: data.status,
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  const logCall = async (clientId: string, type: 'call_logged' | 'call_attempt') => {
    if (!firebaseUser) return;
    try {
      const activityRef = doc(collection(db, `clients/${clientId}/activities`));
      await setDoc(activityRef, {
        clientId,
        ownerId: firebaseUser.uid,
        type,
        content: type === 'call_logged' ? 'Call logged' : 'Call attempted',
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients/${clientId}/activities`);
    }
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

