import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader2 } from 'lucide-react';

// Extend the Window interface to include deferredPrompt
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const PWAInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      console.log('PWA: Install prompt available and captured.');
    };

    // A custom event listener in case index.html captured it before React mounted
    const handlePromptAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        console.log('PWA: React notified of early captured prompt via custom event.');
      }
    };

    // Detection for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      console.log('PWA: تم تثبيت التطبيق بنجاح');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also check if app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    const promptEvent = window.deferredPrompt || deferredPrompt;

    if (promptEvent) {
      setIsDownloading(true);
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('PWA: Error during prompt invocation:', err);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // If inside iframe or prompt unavailable, show simulated downloading to respect user expectation,
      // then display a native alert. No more instruction modals.
      setIsDownloading(true);
      setTimeout(() => {
        setIsDownloading(false);
        alert('عذراً، المتصفح الحالي يمنع التنزيل المباشر للتطبيقات (لأنك داخل نافذة معاينة). لتنزيل التطبيق فعلياً على هاتفك، يرجى نسخ رابط التطبيق وفتحه في متصفح جوجل كروم الأساسي.');
      }, 1500);
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      disabled={isDownloading}
      className={`rounded-full px-3.5 py-1.5 text-[11px] md:text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0 cursor-pointer ${
        isInstalled 
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
          : isDownloading
          ? 'bg-blue-800 text-white cursor-wait opacity-90'
          : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse active:scale-95'
      }`}
      dir="rtl"
      title="تثبيت تطبيق Calista CRM"
    >
      {isInstalled ? (
        <>
          <CheckCircle className="w-3.5 h-3.5" />
          <span>تم التثبيت بنجاح</span>
        </>
      ) : isDownloading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>جاري تحميل التطبيق...</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          <span>تثبيت التطبيق</span>
        </>
      )}
    </button>
  );
}
