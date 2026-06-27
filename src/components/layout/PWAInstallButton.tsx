import React, { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  });
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running inside an iframe
      setIsIframe(window.self !== window.top);

      // Detect device type
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceType('ios');
      } else if (/android/.test(ua)) {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }
    }

    // Load deferred prompt if already captured early in index.html
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      console.log('PWA: beforeinstallprompt event captured in React component.');
    };

    const handlePromptAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      console.log('PWA: Installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const getCleanUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + '/';
    }
    return '';
  };

  const handleInstallClick = async () => {
    if (isInstalled) {
      return;
    }

    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      console.log('PWA: Triggering native install prompt...');
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('PWA: Error during prompt invocation:', err);
      }
    } else {
      console.log('PWA: Native prompt unavailable.');
      // If we are inside an iframe (AI Studio), let user open in a new tab
      if (isIframe) {
        alert("جاري التثبيت... يرجى فتح الرابط في نافذة مستقلة إذا كنت تتصفح من المعاينة.");
        window.open(getCleanUrl(), '_blank');
      } else if (deviceType === 'ios') {
        alert("لتثبيت التطبيق على الآيفون: اضغط على زر 'مشاركة' بالأسفل ثم اختر 'إضافة إلى الشاشة الرئيسية'.");
      } else {
        alert("يرجى الانتظار قليلاً حتى يتم تجهيز التطبيق. إذا لم تظهر نافذة التثبيت، يمكنك التثبيت يدوياً من قائمة المتصفح (⋮) باختيار 'تثبيت التطبيق'.");
      }
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all shrink-0 cursor-pointer ${
          isInstalled 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
        }`}
        dir="rtl"
        title="تثبيت تطبيق Calista CRM"
      >
        {isInstalled ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>تم التثبيت</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت التطبيق</span>
          </>
        )}
      </button>
    </>
  );
};
