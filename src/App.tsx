import React, { useEffect, useState, useMemo } from 'react';
import { QrCode, ClipboardEdit, MessageSquare, History, BellRing, RefreshCw, IdCard, FileCode } from 'lucide-react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScannerScreen } from './components/ScannerScreen';
import { ManualScreen } from './components/ManualScreen';
import { WhatsAppScreen } from './components/WhatsAppScreen';
import { AttendanceHistoryScreen } from './components/AttendanceHistoryScreen';
import { AutoNotificationScreen } from './components/AutoNotificationScreen';
import { SyncScreen } from './components/SyncScreen';
import { StudentCardsScreen } from './components/StudentCardsScreen';
import { HandoffDocsScreen } from './components/HandoffDocsScreen';
import { SettingsModal } from './components/SettingsModal';
import { AppConfig, AttendanceRecordEntity, StudentEntity } from './types/attendance';
import { loadConfig, loadRecords, loadStudents, saveConfig, seedSampleAttendanceData, checkAndDispatchAutomatedNotifications } from './utils/storage';
import { getCurrentDateString, getCurrentTimeString } from './utils/time';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [students, setStudents] = useState<StudentEntity[]>(loadStudents);
  const [records, setRecords] = useState<AttendanceRecordEntity[]>(loadRecords);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pre-seed sample attendance records if empty
  useEffect(() => {
    const existing = loadRecords();
    if (existing.length === 0) {
      const seeded = seedSampleAttendanceData();
      setRecords(seeded);
    }
  }, []);

  // Background automated scheduler: checks at interval if current time >= 07:15
  useEffect(() => {
    if (!config.autoNotificationEnabled) return;

    const interval = setInterval(() => {
      const currentTime = getCurrentTimeString();
      const [h, m] = currentTime.split(':').map(Number);
      const [targetH, targetM] = (config.jamPeringatanAbsen || '07:15').split(':').map(Number);

      // If past or equal to threshold in the morning
      if (h === targetH && m >= targetM && h < 8) {
        checkAndDispatchAutomatedNotifications();
      }
    }, 60000); // check once a minute

    return () => clearInterval(interval);
  }, [config.autoNotificationEnabled, config.jamPeringatanAbsen]);

  const refreshData = () => {
    setStudents(loadStudents());
    setRecords(loadRecords());
    setConfig(loadConfig());
  };

  const handleConfigSave = (newConfig: AppConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  };

  const pendingCount = records.filter(r => !r.isSynced).length;

  // Unrecorded students count for today
  const todayStr = getCurrentDateString();
  const unrecordedTodayCount = useMemo(() => {
    const arrivedNis = new Set(
      records
        .filter(r => r.tanggal === todayStr && r.tipeKegiatan === 'KEDATANGAN')
        .map(r => r.nis)
    );
    return students.filter(s => s.status === 'ACTIVE' && !arrivedNis.has(s.nis)).length;
  }, [records, students, todayStr]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingSyncCount={pendingCount}
        unrecordedCount={unrecordedTodayCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 xl:pb-8">
        {activeTab === 'scanner' && (
          <ScannerScreen
            onAttendanceUpdated={refreshData}
            recentRecords={records}
            students={students}
            jamMasuk={config.jamMasuk}
            toleransiMenit={config.toleransiMenit}
          />
        )}

        {activeTab === 'manual' && (
          <ManualScreen
            students={students}
            onAttendanceUpdated={refreshData}
            defaultPetugas={config.petugasDefault}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppScreen
            students={students}
            records={records}
            cutoffPagi={config.jamCutoffPagi}
          />
        )}

        {activeTab === 'history' && (
          <AttendanceHistoryScreen
            records={records}
            students={students}
          />
        )}

        {activeTab === 'autonotif' && (
          <AutoNotificationScreen
            students={students}
            records={records}
            config={config}
            onStudentsUpdated={refreshData}
          />
        )}

        {activeTab === 'sync' && (
          <SyncScreen
            records={records}
            students={students}
            config={config}
            onConfigChange={handleConfigSave}
            onDataRefreshed={refreshData}
          />
        )}

        {activeTab === 'cards' && (
          <StudentCardsScreen
            students={students}
            onScanStudent={() => {
              setActiveTab('scanner');
            }}
          />
        )}

        {activeTab === 'handoff' && (
          <HandoffDocsScreen />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 hidden xl:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Sistem Absensi Digital MA Bojongjati · Single-Tenant Madrasah</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Offline-First (Room DB / SQLite)</span>
            <span aria-hidden="true">·</span>
            <span>WorkManager Notif 07:15</span>
            <span aria-hidden="true">·</span>
            <span>Riwayat Absensi Kronologis</span>
            <span aria-hidden="true">·</span>
            <span>Google Apps Script</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar (Ergonomic Thumb-Zone Navigation Anchor) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg">
        <div className="grid grid-cols-6 items-center h-14">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'scanner' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'manual' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardEdit className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'whatsapp' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">WA Ortu</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'history' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">Riwayat</span>
          </button>

          <button
            onClick={() => setActiveTab('autonotif')}
            className={`flex flex-col items-center justify-center min-h-[44px] relative ${
              activeTab === 'autonotif' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">07:15</span>
            {unrecordedTodayCount > 0 && (
              <span className="absolute top-1 right-2 text-[9px] font-mono px-1 bg-rose-500 text-white rounded-full font-bold">
                {unrecordedTodayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center justify-center min-h-[44px] relative ${
              activeTab === 'sync' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">Sync</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-2 text-[9px] font-mono px-1 bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleConfigSave}
      />
    </div>
  );
}
