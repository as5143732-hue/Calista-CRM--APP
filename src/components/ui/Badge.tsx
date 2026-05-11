import React from 'react';
import { ClientStatus } from '../../types';
import { cn } from '../../lib/utils';

export const StatusBadge: React.FC<{ status: ClientStatus }> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'My Fresh Lead':
        return 'bg-blue-100 text-blue-600';
      case 'Follow Up':
      case 'Follow Up After Meeting':
        return 'bg-amber-100 text-amber-600';
      case 'Meeting':
        return 'bg-purple-100 text-purple-600';
      case 'Pending':
        return 'bg-slate-200 text-slate-700';
      case 'Reserved':
        return 'bg-indigo-100 text-indigo-600';
      case 'Done Deal':
        return 'bg-emerald-100 text-emerald-600';
      case 'Canceled':
      case 'Not Interested':
        return 'bg-rose-100 text-rose-600';
      case 'Interested':
        return 'bg-teal-100 text-teal-600';
      case 'No Answer':
      case 'No Answer At All':
      case 'Unreachable':
        return 'bg-red-100 text-red-600';
      case 'Low Budget':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={cn('w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase', getStyles())}>
      {status}
    </div>
  );
};
