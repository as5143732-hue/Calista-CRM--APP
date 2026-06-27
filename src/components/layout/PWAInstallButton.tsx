import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader2, Share, X, AlertCircle, ExternalLink, Copy } from 'lucide-react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const PWAInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isIframe = typeof window !== 'undefined' && window !== window.parent;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      console.log('PWA: Install prompt available and captured.');
    };

    const handlePromptAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstructions(false);
      console.log('PWA: App installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

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
      // Prompt not available. Show instructions.
      setShowInstructions(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isDownloading}
        className={`rounded-full px-4 py-2 text-[12px] md:text-[13px] font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all shrink-0 cursor-pointer ${
          isInstalled 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : isDownloading
            ? 'bg-blue-800 text-white cursor-wait opacity-90'
            : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse active:scale-95'
        }`}
        dir="rtl"
      >
        {isInstalled ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>تم التثبيت بنجاح</span>
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التثبيت...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق</span>
          </>
        )}
      </button>

      {/* Instructions Modal when native prompt is blocked */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h3 className="font-bold text-white text-lg">تثبيت التطبيق</h3>
              <button 
                onClick={() => setShowInstructions(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isIframe ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 p-3 rounded-xl border border-amber-400/20">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm leading-relaxed">
                      أنت تتصفح من داخل نافذة معاينة لا تدعم التنزيل المباشر. لتنزيل التطبيق فعلياً، يرجى فتح الرابط في متصفح خارجي.
                    </p>
                  </div>
                  
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600"
                  >
                    <Copy className="w-5 h-5" />
                    {copied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التطبيق'}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-blue-400 bg-blue-400/10 p-3 rounded-xl border border-blue-400/20">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-semibold">
                      لتنزيل التطبيق فعلياً على هاتفك، يرجى اتباع الآتي:
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold shrink-0 border border-slate-700">1</div>
                      <p className="text-slate-300 text-sm mt-1">
                        اضغط على أيقونة <strong className="text-white">النقاط الثلاث (⋮)</strong> في أعلى يسار المتصفح أو أيقونة <strong className="text-white">المشاركة <Share className="inline w-3 h-3 mx-1"/></strong> في الأسفل.
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold shrink-0 border border-slate-700">2</div>
                      <p className="text-slate-300 text-sm mt-1">
                        اختر <strong className="text-white">تثبيت التطبيق (Install App)</strong> أو <strong className="text-white">إضافة للشاشة الرئيسية (Add to Home Screen)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-800/50 border-t border-slate-800">
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl transition-all"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
