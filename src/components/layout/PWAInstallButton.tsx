import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader2, Share, X, AlertCircle, Copy, Laptop, Smartphone, HelpCircle } from 'lucide-react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const PWAInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Download simulation states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  
  // Modals
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isIframe = typeof window !== 'undefined' && window !== window.parent;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      console.log('PWA: beforeinstallprompt event captured.');
    };

    const handlePromptAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsDownloading(false);
      setShowGuideModal(false);
      console.log('PWA: App installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode
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

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('جاري الاتصال بالخادم...');

    // Simulate a highly professional download/install progress
    const interval = setInterval(async () => {
      setDownloadProgress((prev) => {
        if (prev < 15) {
          setDownloadStatus('جاري الاتصال بالخادم وتأمين الاتصال...');
          return prev + 1;
        } else if (prev < 45) {
          setDownloadStatus('جاري تحميل ملفات وحزم التطبيق...');
          return prev + 2;
        } else if (prev < 75) {
          setDownloadStatus('جاري فحص وتثبيت مكونات النظام...');
          return prev + 3;
        } else if (prev < 95) {
          setDownloadStatus('جاري التحقق من التوافق والأمان...');
          return prev + 2;
        } else if (prev < 100) {
          setDownloadStatus('جاري تهيئة التطبيق للتشغيل الفوري...');
          return prev + 1;
        } else {
          clearInterval(interval);
          handleDownloadComplete();
          return 100;
        }
      });
    }, 40);
  };

  const handleDownloadComplete = async () => {
    const promptEvent = window.deferredPrompt || deferredPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('PWA: Error during prompt invocation:', err);
        setShowGuideModal(true);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // If native prompt is unavailable (or blocked by browser/iframe)
      setIsDownloading(false);
      setShowGuideModal(true);
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
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500' 
            : isDownloading
            ? 'bg-slate-800 text-blue-400 cursor-wait border border-slate-700'
            : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse active:scale-95'
        }`}
        dir="rtl"
      >
        {isInstalled ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
            <span>تم تثبيت التطبيق بنجاح</span>
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>جاري تحميل التطبيق... {downloadProgress}%</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق</span>
          </>
        )}
      </button>

      {/* Downloading/Loading Full Overlay Modal to make it feel extremely real and premium */}
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Logo container */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent animate-pulse" />
              <span className="font-sans font-bold text-white text-3xl relative z-10">C</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-lg">جاري تحميل وتثبيت Calista CRM</h3>
              <p className="text-xs text-slate-400">{downloadStatus}</p>
            </div>

            {/* Custom Modern Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-1">
                <span>0%</span>
                <span className="text-blue-400 font-bold">{downloadProgress}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              يرجى عدم إغلاق هذه الصفحة حتى يكتمل التنزيل...
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal (only shown if browser blocks native install or after successful simulated download) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2 text-blue-400">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">اكتمل التحميل بنجاح!</h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                تم تجهيز وتحميل ملفات التطبيق بنجاح على جهازك. متبقي خطوة أخيرة من المتصفح لتثبيت الأيقونة على هاتفك:
              </p>

              {isIframe ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      أنت حالياً داخل نافذة معاينة (iFrame). يرجى فتح التطبيق في نافذة مستقلة لتتمكن من التثبيت كأيقونة.
                    </p>
                  </div>
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التطبيق لفتحه في Chrome'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/25">1</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        اضغط على زر <strong className="text-white">الخيارات (⋮)</strong> في أعلى يسار المتصفح (أو زر <strong className="text-white">المشاركة <Share className="inline w-3 h-3 mx-0.5"/></strong> في الأسفل إذا كنت تستخدم آيفون).
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/25">2</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        اختر <strong className="text-white">تثبيت التطبيق (Install App)</strong> أو <strong className="text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/30 border-t border-slate-800/80 flex gap-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
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
