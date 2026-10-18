import React from 'react';
import { QrCode, ClipboardEdit, MessageSquare, History, BellRing, RefreshCw, IdCard, FileCode, Settings, Wifi, WifiOff } from 'lucide-react';

export type ActiveTab = 'scanner' | 'manual' | 'whatsapp' | 'history' | 'autonotif' | 'sync' | 'cards' | 'handoff';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingSyncCount: number;
  unrecordedCount: number;
  onOpenSettings: () => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingSyncCount,
  unrecordedCount,
  onOpenSettings,
  isOnline
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            MAB
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
              Absensi MA Bojongjati
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Single-Tenant</span>
              <span aria-hidden="true">·</span>
              <span>~300 Siswa</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Scanner
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'manual'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardEdit className="w-3.5 h-3.5" />
            Catat Manual
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Laporan WA
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Absensi
          </button>

          <button
            onClick={() => setActiveTab('autonotif')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
              activeTab === 'autonotif'
                ? 'bg-amber-50 text-amber-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            Notif 07:15
            {unrecordedCount > 0 && (
              <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold">
                {unrecordedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
              activeTab === 'sync'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync &amp; Data
            {pendingSyncCount > 0 && (
              <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                {pendingSyncCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'cards'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IdCard className="w-3.5 h-3.5" />
            Kartu Siswa
          </button>

          <button
            onClick={() => setActiveTab('handoff')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'handoff'
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            Handoff Docs
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            )}
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[44px]"
            title="Pengaturan Jam Masuk & Google Sheets"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Konfigurasi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
