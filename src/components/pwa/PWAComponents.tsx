import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{compact ? 'Install App' : 'Install Android App'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{compact ? 'Install' : 'Install on Mobile'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-5 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {isIOS ? 'Install on iPhone / iPad' : 'Install on Latest Android (14 / 15 / 16)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2 text-slate-700 list-decimal pl-4">
                <li>
                  Safari toolbar mein <strong>Share</strong> icon par tap karein.
                </li>
                <li>
                  Neeche scroll karke <strong>Add to Home Screen</strong> select karein.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 text-slate-700 list-decimal pl-4">
                <li>
                  Apne phone par <strong>Google Chrome</strong> mein is App URL ko open karein.
                </li>
                <li>
                  Top-right menu (<strong>⋮</strong>) par tap karein aur{' '}
                  <strong>Add to Home screen / Install App</strong> select karein.
                </li>
                <li>
                  Yeh direct latest Android par bina kisi Play Protect / SDK error ke standalone app
                  ki tarah install aur offline kaam karega.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg no-print">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached app &amp; local records active.</span>
    </div>
  );
};
