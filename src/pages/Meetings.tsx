import React from 'react';
import { useData } from '../context/DataContext';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';
import { Calendar, Clock, Video, Info } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';

export const Meetings: React.FC = () => {
  const { clients } = useData();

  // Filter out clients without a meeting date, sort by closest meeting first
  const upcomingMeetings = clients
    .filter(c => c.meetingDate && !isPast(parseISO(c.meetingDate)))
    .sort((a, b) => new Date(a.meetingDate!).getTime() - new Date(b.meetingDate!).getTime());

  const pastMeetings = clients
    .filter(c => c.meetingDate && isPast(parseISO(c.meetingDate)))
    .sort((a, b) => new Date(b.meetingDate!).getTime() - new Date(a.meetingDate!).getTime());

  const MeetingCard = ({ client, isUpcoming }: { client: any, isUpcoming: boolean }) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${isUpcoming ? 'bg-white border-slate-200 hover:border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75'} transition-colors shadow-sm`}>
      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${isUpcoming ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
        <span className="text-[10px] leading-none uppercase">{format(new Date(client.meetingDate), 'MMM')}</span>
        <span className="text-xl leading-none mt-1">{format(new Date(client.meetingDate), 'd')}</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-tight truncate ${isUpcoming ? 'text-slate-800' : 'text-slate-700'}`}>{client.projectName || 'Discovery Call'}</h3>
            <p className="text-xs text-slate-400 truncate">{client.name}</p>
          </div>
          <StatusBadge status={client.status} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            <span>Google Meet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isUpcoming ? 'Upcoming' : 'Completed'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
        <p className="text-slate-500 text-sm mt-1">Track your upcoming appointments and past meetings.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Upcoming Meetings
          <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase ml-2">
            {upcomingMeetings.length}
          </span>
        </h2>
        
        {upcomingMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMeetings.map(client => (
              <MeetingCard key={client.id} client={client} isUpcoming={true} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center flex flex-col items-center">
             <Calendar className="w-10 h-10 text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">No upcoming meetings</p>
             <p className="text-slate-400 text-sm mt-1">Schedule a meeting from the clients page.</p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 opacity-80">Past Meetings</h2>
        {pastMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastMeetings.map(client => (
              <MeetingCard key={client.id} client={client} isUpcoming={false} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No past meetings recorded.</p>
        )}
      </div>
    </div>
  );
};
