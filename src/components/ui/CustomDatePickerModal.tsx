import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Modal } from './Modal';

interface CustomDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // 'yyyy-MM-dd'
  onChange: (date: string) => void;
}

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({ isOpen, onClose, value, onChange }) => {
  const initialDate = value ? parseISO(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleConfirm = () => {
    onChange(format(selectedDate, 'yyyy-MM-dd'));
    onClose();
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <Menu className="w-6 h-6 text-slate-800" />
        <h2 className="text-xl font-bold text-slate-900">Select Date</h2>
        <CalendarIcon className="w-6 h-6 text-orange-500" />
      </div>
    );
  };

  const renderDaysSelector = () => {
    return (
      <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-md transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <span className="font-semibold text-slate-900">
          {format(currentMonth, 'MMMM, yyyy')}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-md transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday as start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const daysHeader = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-center font-medium text-xs text-slate-500 py-1">
            {wd}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={`
              flex justify-center items-center w-8 h-8 mx-auto rounded-full cursor-pointer text-sm font-medium transition-all
              ${!isCurrentMonth ? 'text-slate-300' : isSelected ? 'bg-teal-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-200'}
              ${isToday && !isSelected && isCurrentMonth ? 'border-2 border-teal-500 text-teal-700' : ''}
            `}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-y-2 mb-2">
          {days}
        </div>
      );
      days = [];
    }
    
    return (
      <div className="mb-6">
        {daysHeader}
        {rows}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {renderHeader()}
        {renderDaysSelector()}
        {renderCells()}
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleConfirm}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Set Date
          </button>
          <button 
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-700 font-medium py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
