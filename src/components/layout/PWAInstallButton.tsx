import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, X, Smartphone, Monitor, Copy, ExternalLink, AlertTriangle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isIframe, setIsIframe] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if running inside an iframe (like AI Studio preview)
    if (typeof window !== 'undefined') {
      setIsIframe(window.self !== window.top);
    }

    // Detect device type for custom instructions
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Set initial prompt from global if already captured early in index.html
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      console.log('PWA: Found early captured deferredPrompt on mount.');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent standard browser bar from showing
      e.preventDefault();
      // Stash the event
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      console.log('PWA: beforeinstallprompt event fired and captured successfully in component.');
    };

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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('PWA: App is already running in standalone mode.');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      console.log('PWA: Triggering native install prompt...');
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log(`PWA: User response to install prompt: ${outcome}`);
      } catch (err) {
        console.error('PWA: Error during prompt invocation:', err);
        setShowInstructions(true);
      }
    } else {
      console.log('PWA: Native prompt unavailable. Showing manual installation and direct open options...');
      setShowInstructions(true);
    }
  };

  const getCleanUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + '/';
    }
    return '';
  };

  const handleCopyLink = () => {
    const url = getCleanUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenInChrome = () => {
    const cleanUrl = getCleanUrl().replace(/^https?:\/\//, '');
    // Android Chrome intent to force opening in native Chrome browser
    const chromeIntent = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    
    if (deviceType === 'android') {
      window.location.href = chromeIntent;
    } else {
      window.open(getCleanUrl(), '_blank');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`rounded-full px-3.5 py-1.5 text-[11px] md:text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all shrink-0 cursor-pointer ${
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

      {/* Modern custom instruction modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                {/* Premium Exact CSS Replica of the custom C logo from the uploaded picture */}
                <div className="w-12 h-12 rounded-2xl bg-black relative flex items-center justify-center border border-slate-800 shadow-xl overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35)_0%,transparent_75%)]" />
                  <span className="font-sans font-bold text-white text-2xl z-10 relative select-none">C</span>
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-white z-10 shadow" />
                  <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-white z-10 shadow" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">تثبيت Calista CRM</h3>
                  <p className="text-[11px] text-slate-400">تطبيق ويب تقدمي (PWA) متزامن بالكامل</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main CTA: Direct Escape / Open in External Chrome Browser */}
            <div className="p-4 bg-blue-600/10 border-b border-blue-500/20 space-y-3">
              <div className="flex gap-2.5 items-start text-blue-300">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-blue-400 animate-bounce" />
                <p className="text-[11px] md:text-xs leading-relaxed text-blue-200">
                  إذا كنت تتصفح من داخل تطبيق آخر أو إطار معطل للتحميل المباشر، اضغط أدناه لفتح الرابط في متصفح خارجي حقيقي وتثبيته فوراً:
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleOpenInChrome}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {deviceType === 'android' ? 'فتح في متصفح Chrome الأصلي' : 'فتح في متصفح خارجي'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'تم النسخ!' : 'نسخ الرابط'}
                </button>
              </div>
            </div>

            {/* Device tabs */}
            <div className="flex border-b border-slate-800/80 bg-slate-900/20 text-xs">
              <button
                onClick={() => setDeviceType('android')}
                className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 ${deviceType === 'android' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                أندرويد
              </button>
              <button
                onClick={() => setDeviceType('ios')}
                className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 ${deviceType === 'ios' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                آيفون (iOS)
              </button>
              <button
                onClick={() => setDeviceType('desktop')}
                className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 ${deviceType === 'desktop' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
                كمبيوتر
              </button>
            </div>

            {/* Instructions list */}
            <div className="p-5 space-y-4">
              {deviceType === 'ios' && (
                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      افتح الموقع باستخدام متصفح <strong className="text-white">Safari</strong> على جهازك.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      اضغط على زر <strong className="text-white">مشاركة (Share)</strong> في شريط الأدوات بالأسفل.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      مرر للأسفل واختر <strong className="text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                    </p>
                  </div>
                </div>
              )}

              {deviceType === 'android' && (
                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      تأكد من فتح الرابط في متصفح <strong className="text-white">Google Chrome</strong> الأصلي.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      اضغط على <strong className="text-white">أيقونة النقاط الثلاث (⋮)</strong> أعلى اليسار.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      اختر <strong className="text-white">تثبيت التطبيق (Install App)</strong> أو <strong className="text-white">إضافة إلى الشاشة الرئيسية</strong>.
                    </p>
                  </div>
                </div>
              )}

              {deviceType === 'desktop' && (
                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      من شريط العنوان أعلى المتصفح، ابحث عن <strong className="text-white">أيقونة الشاشة مع السهم</strong> أو النقاط الثلاث.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      اضغط على <strong className="text-white">تثبيت (Install)</strong> لتشغيل التطبيق كنافذة مستقلة على سطح المكتب.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900/30 border-t border-slate-900 text-center">
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
