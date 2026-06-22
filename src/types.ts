export type ClientStatus = 
  | 'New'
  | 'In Progress'
  | 'Interested'
  | 'Reserved'
  | 'Not Interested'
  | 'My Fresh Lead'
  | 'Follow Up'
  | 'Meeting'
  | 'Pending'
  | 'Done Deal'
  | 'No Answer'
  | 'No Answer At All'
  | 'Follow Up After Meeting'
  | 'Canceled'
  | 'Low Budget'
  | 'Unreachable'
  | 'Call Attempt';

export type ActivityType = 
  | 'status_change' 
  | 'note_added' 
  | 'client_created' 
  | 'client_updated' 
  | 'meeting_scheduled' 
  | 'call_logged'
  | 'call_attempt'
  | 'whatsapp_sent'
  | 'follow_up'
  | 'task_added'
  | 'budget_change';

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  content?: string;
  previousStatus?: ClientStatus;
  newStatus?: ClientStatus;
  agentName: string;
  ownerId?: string;
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

export type LeadScore = 'Cold' | 'Warm' | 'Hot';
export type PropertyType = 'Residential' | 'Commercial' | 'Administrative' | string;

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectName: string;
  budget: number;
  budgetMin?: number;
  budgetMax?: number;
  leadSource?: string;
  leadScore?: LeadScore;
  propertyType?: PropertyType;
  preferredLocation?: string;
  notes: Note[];
  activities?: Activity[];
  followUpDate: string | null;
  followUpTime?: string | null;
  meetingDate: string | null;
  salesAgent: string;
  status: ClientStatus;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  name: string;
  role: string;
  email: string;
  avatar?: string;
}
