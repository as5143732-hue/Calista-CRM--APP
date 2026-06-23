import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

interface CustomTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // 'HH:mm' (24 hour format)
  onChange: (time: string) => void;
}

export const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({ isOpen, onClose, value, onChange }) => {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      let hNum = parseInt(h, 10);
      const isPM = hNum >= 12;
      if (hNum === 0) hNum = 12;
      else if (hNum > 12) hNum -= 12;
      
      setHour(hNum.toString().padStart(2, '0'));
      setMinute(m);
      setPeriod(isPM ? 'PM' : 'AM');
    }
  }, [value, isOpen]);

  const handleConfirm = () => {
    let hNum = parseInt(hour, 10);
    if (period === 'PM' && hNum < 12) hNum += 12;
    else if (period === 'AM' && hNum === 12) hNum = 0;
    
    onChange(`${hNum.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`);
    onClose();
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => setHour(e.target.value);
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => setMinute(e.target.value);
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value as 'AM' | 'PM');

  // Calculate clock hand degrees
  const hNumForDeg = parseInt(hour, 10) % 12;
  const mNumForDeg = parseInt(minute, 10);
  const hourDeg = (hNumForDeg * 30) + (mNumForDeg * 0.5);
  const minuteDeg = mNumForDeg * 6;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-4 mb-8">
          <Menu className="w-6 h-6 text-slate-800" />
          <h2 className="text-xl font-bold text-slate-900 mx-auto -ml-3">Set Time</h2>
        </div>

        {/* Analog Clock Face */}
        <div className="relative w-48 h-48 mx-auto mb-8 bg-slate-50 rounded-full border-[12px] border-slate-800 shadow-inner flex items-center justify-center">
          {/* Clock center dot */}
          <div className="w-3 h-3 bg-red-500 rounded-full z-10"></div>
          
          {/* Hour Hand */}
          <div 
            className="absolute w-1.5 h-12 bg-slate-800 rounded-full bottom-1/2 origin-bottom transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${hourDeg}deg)` }}
          ></div>
          
          {/* Minute Hand */}
          <div 
            className="absolute w-1 h-16 bg-slate-600 rounded-full bottom-1/2 origin-bottom transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${minuteDeg}deg)` }}
          ></div>
          
          {/* Second Hand (Decorative static) */}
          <div className="absolute w-0.5 h-20 bg-red-500 rounded-full bottom-1/2 origin-bottom transform rotate-[210deg]"></div>

          {/* Clock Ticks */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-full h-full p-1"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div className="w-1 h-3 bg-slate-300 mx-auto rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Selectors */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <select 
            value={hour} 
            onChange={handleHourChange}
            className="appearance-none bg-slate-100 hover:bg-slate-200 transition-colors text-slate-800 font-bold py-3 px-4 rounded-xl outline-none text-center cursor-pointer min-w-[70px]"
          >
            {[...Array(12)].map((_, i) => {
               const val = (i === 0 ? 12 : i).toString().padStart(2, '0');
               return <option key={val} value={val}>{val}</option>;
            })}
          </select>
          <span className="text-slate-400 font-bold">:</span>
          <select 
            value={minute} 
            onChange={handleMinuteChange}
            className="appearance-none bg-slate-100 hover:bg-slate-200 transition-colors text-slate-800 font-bold py-3 px-4 rounded-xl outline-none text-center cursor-pointer min-w-[70px]"
          >
            {[...Array(60)].map((_, i) => {
               const val = i.toString().padStart(2, '0');
               return <option key={val} value={val}>{val}</option>;
            })}
          </select>
          <select 
            value={period} 
            onChange={handlePeriodChange}
            className="appearance-none bg-slate-100 hover:bg-slate-200 transition-colors text-slate-800 font-bold py-3 px-4 rounded-xl outline-none text-center cursor-pointer ml-2 min-w-[70px]"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleConfirm}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Set Time
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
