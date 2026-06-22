import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client, ClientStatus, Activity } from '../types';
import { useAuth, User } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

interface DataContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'activities'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addNote: (clientId: string, noteText: string) => void;
  updateClientStatus: (id: string, newStatus: ClientStatus) => void;
  addFollowUp: (clientId: string, data: { followUpType: string, feedbackText: string, status: ClientStatus, nextAction: string, nextFollowUpDate: string, nextFollowUpTime?: string }) => void;
  logQuickAction: (clientId: string, type: 'call_logged' | 'call_attempt' | 'whatsapp_sent', content?: string) => void;
  refreshData: () => void;
  usersMap: Record<string, string>;
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
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [usersTeamMap, setUsersTeamMap] = useState<Record<string, string | null>>({});
  const { user, firebaseUser } = useAuth();
  const currentAgent = user?.name || 'System';

  useEffect(() => {
    if (!firebaseUser) return;
    
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uMap: Record<string, string> = {};
      const tMap: Record<string, string | null> = {};
      snapshot.forEach(d => {
        const data = d.data();
        uMap[d.id] = data.name || data.email?.split('@')[0] || 'Unknown';
        tMap[d.id] = data.teamId || null;
      });
      setUsersMap(uMap);
      setUsersTeamMap(tMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    
    return () => unsubscribeUsers();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      setRawClients([]);
      return;
    }

    let q;
    if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') {
      q = query(collection(db, 'clients'));
    } else {
      q = query(collection(db, 'clients'), where('ownerId', '==', firebaseUser.uid));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let loaded: Client[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Client);
      });
      setRawClients(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });

    return () => unsubscribe();
  }, [firebaseUser, user]);

  useEffect(() => {
    if (!firebaseUser) {
      setClients([]);
      return;
    }
    
    let filtered = rawClients;
    if (user?.role === 'manager') {
      const isNewManager = user.createdAt && new Date(user.createdAt) > new Date('2026-06-01T00:00:00Z');
      if (isNewManager) {
        filtered = rawClients.filter(c => 
          c.teamId === firebaseUser.uid || 
          c.ownerId === firebaseUser.uid || 
          usersTeamMap[c.ownerId || ''] === firebaseUser.uid
        );
      }
    }
    setClients(filtered);
  }, [rawClients, usersTeamMap, user, firebaseUser]);

  const normalizeProjectName = (name?: string) => {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()).join(' ');
  };

  const addClient = async (clientData: Partial<Client>) => {
    if (!firebaseUser) return;
    try {
      const newClientRef = doc(collection(db, 'clients'));
      const finalOwnerId = clientData.ownerId || firebaseUser.uid;
      const finalSalesAgent = clientData.salesAgent && clientData.salesAgent !== 'Current User' ? clientData.salesAgent : currentAgent;
      
      let clientTeamId = user?.teamId || null;
      if (user?.role === 'manager') {
        clientTeamId = firebaseUser.uid;
      }
      
      const newClient = {
        ...clientData,
        projectName: normalizeProjectName(clientData.projectName),
        salesAgent: finalSalesAgent,
        ownerId: finalOwnerId,
        createdBy: currentAgent,
        teamId: clientTeamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // Optimistic update
      setClients(prev => [{ id: newClientRef.id, ...newClient } as Client, ...prev]);

      await setDoc(newClientRef, newClient);

      const activityRef = doc(collection(db, `clients/${newClientRef.id}/activities`));
      await setDoc(activityRef, {
        clientId: newClientRef.id,
        ownerId: finalOwnerId,
        type: 'client_created',
        agentName: currentAgent,
        content: `Client Created by ${currentAgent}`,
        createdAt: new Date().toISOString()
      });

      // Send new client notification
      if (user?.role !== 'super_admin' && user?.role !== 'admin') {
        try {
          await addDoc(collection(db, 'notifications'), {
            type: 'new_client',
            clientId: newClientRef.id,
            clientName: clientData.name || 'Unknown',
            addedBy: currentAgent,
            targetUserId: finalOwnerId,
            timestamp: new Date().toISOString(),
            read: false
          });
        } catch (e) {
          console.error("Failed to add new_client notification", e);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === id);
    if (!client) return;

    let finalUpdates = { ...updates };
    if (updates.ownerId && client.ownerId && updates.ownerId !== client.ownerId) {
      finalUpdates.status = 'My Fresh Lead';
      finalUpdates.updatedBy = currentAgent;
    }

    // Optimistic update
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...finalUpdates, updatedAt: new Date().toISOString() } : c));

    try {
      const clientRef = doc(db, 'clients', id);

      const updateData = { 
        ...finalUpdates, 
        ...(finalUpdates.projectName ? { projectName: normalizeProjectName(finalUpdates.projectName) } : {}),
        updatedAt: new Date().toISOString() 
      };
      await updateDoc(clientRef, updateData);

      let updateContent = undefined;
      if (updates.ownerId && client.ownerId && updates.ownerId !== client.ownerId) {
        const newOwnerName = usersMap[updates.ownerId] || 'another agent';
        updateContent = `Client Transferred to ${newOwnerName} by ${currentAgent}`;
      }

      const hasStatusChange = finalUpdates.status && finalUpdates.status !== client.status;
      if (hasStatusChange || updateContent) {
        const activityRef = doc(collection(db, `clients/${id}/activities`));
        await setDoc(activityRef, {
          clientId: id,
          ownerId: firebaseUser.uid,
          type: 'status_change',
          previousStatus: client.status,
          newStatus: finalUpdates.status || client.status,
          agentName: currentAgent,
          ...(updateContent ? { content: updateContent } : {}),
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const updateClientStatus = async (id: string, newStatus: ClientStatus) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === id);
    if (!client || client.status === newStatus) return;

    // Optimistic update
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c));

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
    // Optimistic update
    setClients(prev => prev.filter(c => c.id !== id));
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

  const addFollowUp = async (clientId: string, data: { followUpType: string, feedbackText: string, status: ClientStatus, nextAction: string, nextFollowUpDate: string, nextFollowUpTime?: string }) => {
    if (!firebaseUser) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const isClosedStatus = ['Not Interested', 'Reserved', 'Done Deal', 'Canceled', 'Unreachable'].includes(data.status);
    const newFollowUpDate = isClosedStatus ? null : (data.nextFollowUpDate || client.followUpDate);
    const newFollowUpTime = isClosedStatus ? null : (data.nextFollowUpTime || client.followUpTime || null);

    // Optimistic update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: data.status, followUpDate: newFollowUpDate, followUpTime: newFollowUpTime, updatedAt: new Date().toISOString() } : c));

    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, { 
        status: data.status, 
        followUpDate: newFollowUpDate,
        followUpTime: newFollowUpTime,
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
        nextFollowUpTime: data.nextFollowUpTime || null,
        previousStatus: client.status,
        newStatus: data.status,
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  const logQuickAction = async (clientId: string, type: 'call_logged' | 'call_attempt' | 'whatsapp_sent', content?: string) => {
    if (!firebaseUser) return;
    try {
      const activityRef = doc(collection(db, `clients/${clientId}/activities`));
      
      let defaultContent = '';
      if (type === 'call_logged') defaultContent = 'Call logged';
      if (type === 'call_attempt') defaultContent = 'Call attempted';
      if (type === 'whatsapp_sent') defaultContent = 'WhatsApp message sent';

      await setDoc(activityRef, {
        clientId,
        ownerId: firebaseUser.uid,
        type,
        content: content || defaultContent,
        agentName: currentAgent,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients/${clientId}/activities`);
    }
  };

  const logCall = (clientId: string, type: 'call_logged' | 'call_attempt') => {
      logQuickAction(clientId, type);
  };

  const refreshData = () => {
    // just dummy for trigger updates if needed
  };

  return (
    <DataContext.Provider value={{ clients, addClient, updateClient, deleteClient, addNote, updateClientStatus, addFollowUp, logCall, logQuickAction, refreshData, usersMap }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

