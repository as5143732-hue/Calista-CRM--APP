export type ClientStatus = 
  | 'My Fresh Lead'
  | 'Follow Up'
  | 'Meeting'
  | 'Pending'
  | 'Reserved'
  | 'Done Deal'
  | 'No Answer'
  | 'No Answer At All'
  | 'Follow Up After Meeting'
  | 'Canceled'
  | 'Interested'
  | 'Low Budget'
  | 'Not Interested'
  | 'Unreachable';

export type ActivityType = 
  | 'status_change' 
  | 'note_added' 
  | 'client_created' 
  | 'client_updated' 
  | 'meeting_scheduled' 
  | 'call_logged'
  | 'call_attempt'
  | 'follow_up'
  | 'budget_change';

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  content?: string;
  previousStatus?: ClientStatus;
  newStatus?: ClientStatus;
  agentName: string;
  createdAt: string;
  followUpType?: string;
  nextAction?: string;
  nextFollowUpDate?: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectName: string;
  budget: number;
  notes: Note[];
  activities?: Activity[];
  followUpDate: string | null;
  meetingDate: string | null;
  salesAgent: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  name: string;
  role: string;
  email: string;
  avatar?: string;
}
