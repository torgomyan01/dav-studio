'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'ohanyan-studio-install-dismissed-session';

export function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Install prompt still works on supported browsers when registration succeeds later.
      });
    }

    const isDismissed = window.sessionStorage.getItem(DISMISSED_KEY) === '1';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (isDismissed || isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      window.sessionStorage.setItem(DISMISSED_KEY, '1');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if (isIos && isSafari) {
      const timer = window.setTimeout(() => {
        setShowIosHelp(true);
        setVisible(true);
      }, 1200);

      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) {
      setShowIosHelp(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
      window.sessionStorage.setItem(DISMISSED_KEY, '1');
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    window.sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-green/20 bg-white p-4 shadow-2xl sm:bottom-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green">
          <span className="fa-solid fa-mobile-screen-button" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">Տեղադրե՞լ հավելվածը էկրանին</p>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            {showIosHelp
              ? 'iPhone-ում սեղմեք Share կոճակը, հետո ընտրեք Add to Home Screen։'
              : 'Կայքը կարող եք բացել որպես առանձին հավելված՝ համակարգչի կամ հեռախոսի էկրանից։'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={installApp}
              className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-green/90"
            >
              Տեղադրել
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              Հետո
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
