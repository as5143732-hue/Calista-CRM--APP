import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Share, X, Compass } from 'lucide-react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const PWAInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Modals
  const [showiOSGuide, setShowiOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  
  const isIframe = typeof window !== 'undefined' && window !== window.parent;

  useEffect(() => {
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
    };

    const handlePromptAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowiOSGuide(false);
      setShowAndroidGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    handlePromptAvailable();

    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isIOSDevice = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const handleMainButtonClick = async () => {
    if (isInstalled) return;
    
    if (isIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    const promptEvent = window.deferredPrompt || deferredPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        window.deferredPrompt = null;
      } catch (err) {
        console.error('PWA: Error invoking native prompt:', err);
      }
    } else {
      if (isIOSDevice()) {
        setShowiOSGuide(true);
      } else {
        setShowAndroidGuide(true);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleMainButtonClick}
        className={`rounded-full px-4 py-2 text-[12px] md:text-[13px] font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all shrink-0 cursor-pointer ${
          isInstalled 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500' 
            : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse active:scale-95'
        }`}
        dir="rtl"
      >
        {isInstalled ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>تم التثبيت</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق</span>
          </>
        )}
      </button>

      {showiOSGuide && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 bg-transparent flex justify-center" dir="rtl">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs -z-10" onClick={() => setShowiOSGuide(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white text-sm">خطوة واحدة للتثبيت على آيفون</h4>
              </div>
              <button 
                onClick={() => setShowiOSGuide(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                متصفح Safari على أجهزة الآيفون يتطلب تأكيد التثبيت يدوياً. يرجى الضغط كالتالي:
              </p>
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20 shrink-0">1</div>
                  <div className="text-slate-200">
                    اضغط على أيقونة <strong className="text-white bg-slate-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">مشاركة <Share className="w-3 h-3 inline" /></strong> في شريط Safari بالأسفل.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20 shrink-0">2</div>
                  <div className="text-slate-200">
                    اسحب القائمة لأسفل واختر <strong className="text-white bg-slate-700 px-1.5 py-0.5 rounded">إضافة للشاشة الرئيسية (Add to Home Screen)</strong>.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowiOSGuide(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                حسناً، سأفعل ذلك الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Android Fallback Guide (If Chrome blocks native prompt or beforeinstallprompt wasn't triggered yet) */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2 text-blue-400">
                <Compass className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">طريقة التثبيت</h3>
              </div>
              <button 
                onClick={() => setShowAndroidGuide(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                لم يتمكن المتصفح من إظهار نافذة التثبيت التلقائية. لتثبيت التطبيق:
              </p>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/25">1</span>
                  <p className="text-slate-300 leading-relaxed">
                    اضغط على زر <strong className="text-white">الخيارات (⋮)</strong> في أعلى يسار أو يمين المتصفح.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/25">2</span>
                  <p className="text-slate-300 leading-relaxed">
                    اختر <strong className="text-white">تثبيت التطبيق (Install App)</strong> أو <strong className="text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/30 border-t border-slate-800/80">
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                موافق، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
