import React, { useState } from 'react';
import { X, Settings, Clock, Save, BellRing } from 'lucide-react';
import { AppConfig } from '../types/attendance';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [jamMasuk, setJamMasuk] = useState(config.jamMasuk);
  const [toleransiMenit, setToleransiMenit] = useState(config.toleransiMenit);
  const [jamPeringatanAbsen, setJamPeringatanAbsen] = useState(config.jamPeringatanAbsen || '07:15');
  const [jamCutoffPagi, setJamCutoffPagi] = useState(config.jamCutoffPagi);
  const [petugasDefault, setPetugasDefault] = useState(config.petugasDefault);
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [autoNotificationEnabled, setAutoNotificationEnabled] = useState(config.autoNotificationEnabled ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      jamMasuk,
      toleransiMenit: Number(toleransiMenit) || 5,
      jamPeringatanAbsen,
      jamCutoffPagi,
      petugasDefault: petugasDefault.trim() || 'Petugas Piket MA Bojongjati',
      webAppUrl: webAppUrl.trim(),
      autoNotificationEnabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Konfigurasi Sistem Absensi MAB
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            Sesuai <strong>DEC-020 (Dynamic Parameters)</strong>: Jam operasional madrasah, toleransi keterlambatan, ambang notifikasi otomatis, dan cutoff dapat diatur fleksibel.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Jam Masuk Madrasah
              </label>
              <input
                type="time"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-500">Baku: 07:00 WIB</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Toleransi (Menit)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={toleransiMenit}
                onChange={(e) => setToleransiMenit(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-500">s/d 07:05:59 Tepat Waktu</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                Peringatan Absen Wali
              </label>
              <input
                type="time"
                value={jamPeringatanAbsen}
                onChange={(e) => setJamPeringatanAbsen(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-500">Baku: 07:15 WIB</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Cutoff Snapshot Pagi
              </label>
              <input
                type="time"
                value={jamCutoffPagi}
                onChange={(e) => setJamCutoffPagi(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-500">Baku: 08:00 WIB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Petugas Piket Default
            </label>
            <input
              type="text"
              value={petugasDefault}
              onChange={(e) => setPetugasDefault(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-900">
              URL Google Apps Script Web App
            </label>
            <input
              type="text"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-400">
              Dapat dikosongkan jika menjalankan mode offline mandiri.
            </span>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoNotificationEnabled}
                onChange={(e) => setAutoNotificationEnabled(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Aktifkan Tugas Terjadwal Latar Belakang (WorkManager 07:15 WIB)</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
