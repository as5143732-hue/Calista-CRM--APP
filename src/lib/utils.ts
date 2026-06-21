import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  // 1. التنظيف: إزالة جميع الأحرف غير الرقمية (المسافات، +، -، الأقواس)
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // 2. التوحيد الدولي: إذا كان الرقم يبدأ بـ 00، احذف الصفرين
  if (cleanNumber.startsWith('00')) {
    cleanNumber = cleanNumber.substring(2);
  }
  
  // 3. التوحيد المحلي: إذا كان الرقم يبدأ بـ 01 ويتكون من 11 رقماً بالضبط، أضف 2 في البداية
  if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
    cleanNumber = '2' + cleanNumber;
  }
  
  return cleanNumber;
}
