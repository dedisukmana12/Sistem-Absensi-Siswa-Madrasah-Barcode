import React, { useState } from 'react';
import { RefreshCw, Download, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Trash2, Search, Filter, ShieldCheck, Database, HardDriveDownload } from 'lucide-react';
import { AppConfig, AttendanceRecordEntity, StudentEntity, SyncApiResponse } from '../types/attendance';
import { syncPendingRecordsToGAS, fetchStudentsFromGAS, pingGAS, seedSampleAttendanceData, saveRecords } from '../utils/storage';
import { getCurrentDateString } from '../utils/time';

interface SyncScreenProps {
  records: AttendanceRecordEntity[];
  students: StudentEntity[];
  config: AppConfig;
  onConfigChange: (cfg: AppConfig) => void;
  onDataRefreshed: () => void;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({
  records,
  students,
  config,
  onConfigChange,
  onDataRefreshed
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSync, setFilterSync] = useState<string>('ALL');

  const pendingRecords = records.filter(r => !r.isSynced);
  const syncedRecords = records.filter(r => r.isSynced);

  const handleSaveUrl = () => {
    onConfigChange({ ...config, webAppUrl: webAppUrl.trim() });
    setSyncFeedback({ type: 'success', message: 'URL Google Apps Script berhasil disimpan.' });
  };

  const handlePing = async () => {
    setIsPinging(true);
    setSyncFeedback(null);
    const res = await pingGAS(webAppUrl.trim());
    setIsPinging(false);
    if (res.success) {
      setSyncFeedback({ type: 'success', message: `Server Online! Respon: "${res.message || 'OK'}"` });
    } else {
      setSyncFeedback({ type: 'error', message: res.error || 'Koneksi ke Google Sheets gagal.' });
    }
  };

  const handleSyncPending = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncPendingRecordsToGAS(webAppUrl.trim());
    setIsSyncing(false);
    if (res.success) {
      setSyncFeedback({
        type: 'success',
        message: `Sinkronisasi berhasil! ${res.inserted || 0} data masuk ke Google Sheets (${res.duplicates || 0} duplikat diabaikan).`
      });
      onDataRefreshed();
    } else {
      setSyncFeedback({ type: 'error', message: res.error || 'Gagal menyinkronkan data.' });
    }
  };

  const handlePullStudents = async () => {
    setIsFetchingStudents(true);
    setSyncFeedback(null);
    const res = await fetchStudentsFromGAS(webAppUrl.trim());
    setIsFetchingStudents(false);
    if (res.success && res.data) {
      setSyncFeedback({
        type: 'success',
        message: `Berhasil mengunduh ${res.count || res.data.length} master siswa dari Google Sheets!`
      });
      onDataRefreshed();
    } else {
      setSyncFeedback({ type: 'error', message: res.error || 'Gagal mengunduh siswa dari Google Sheets.' });
    }
  };

  const handleSeedData = () => {
    seedSampleAttendanceData();
    onDataRefreshed();
    setSyncFeedback({
      type: 'success',
      message: 'Data absensi simulasi berhasil dimuat! Anda dapat langsung meninjau Laporan WhatsApp dan Sinkronisasi.'
    });
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Yakin ingin mengosongkan seluruh antrean absensi lokal? (Data master siswa tidak dihapus).')) {
      saveRecords([]);
      onDataRefreshed();
      setSyncFeedback({ type: 'success', message: 'Data absensi lokal berhasil dikosongkan.' });
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Event ID', 'Tanggal', 'Waktu', 'NIS', 'Nama', 'Tingkat', 'Kelas', 'Kegiatan', 'Status', 'Petugas', 'Sumber', 'Alasan', 'Idempotency Key', 'Status Sync'];
    const rows = records.map(r => [
      `"${r.eventId}"`,
      `"${r.tanggal}"`,
      `"${r.waktu}"`,
      `"${r.nis}"`,
      `"${r.nama}"`,
      `"${r.tingkat}"`,
      `"${r.kelas}"`,
      `"${r.tipeKegiatan}"`,
      `"${r.statusKehadiran}"`,
      `"${r.petugas}"`,
      `"${r.source}"`,
      `"${r.catatanManual || ''}"`,
      `"${r.idempotencyKey}"`,
      r.isSynced ? '"TERKIRIM"' : '"PENDING"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Absensi_MA_Bojongjati_${getCurrentDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = r.nama.toLowerCase().includes(q) || r.nis.includes(q) || r.kelas.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterActivity !== 'ALL' && r.tipeKegiatan !== filterActivity) return false;
    if (filterStatus !== 'ALL' && r.statusKehadiran !== filterStatus) return false;
    if (filterSync === 'SYNCED' && !r.isSynced) return false;
    if (filterSync === 'PENDING' && r.isSynced) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Sinkronisasi Google Sheets & Basis Data Antrean
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
          <span>Arsitektur: <strong className="text-slate-700">Offline-First Room Engine</strong></span>
          <span aria-hidden="true">·</span>
          <span>Zero-Cost Server: <strong className="text-slate-700">Google Drive Madrasah</strong></span>
          <span aria-hidden="true">·</span>
          <span>Kapasitas: <strong className="text-slate-700">300 Siswa</strong></span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Master Siswa Aktif</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tingkat X, XI, XII</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Total Rekaman Absensi</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {records.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lokal SQLite / Room</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Antrean Belum Masuk Sheets</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {pendingRecords.length}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">Menunggu Sinkronisasi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Tersinkronisasi ke Sheets</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {syncedRecords.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Aman di Google Sheets</div>
        </div>
      </div>

      {/* GAS URL & Action Center */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Konfigurasi Google Apps Script (REST Web App)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {webAppUrl ? 'URL Terpasang' : 'Mode Offline Siap'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
          <button
            onClick={handleSaveUrl}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Simpan URL
          </button>
        </div>

        <p className="text-xs text-slate-500">
          * Catatan: Pasang script <strong className="text-slate-700 font-mono">Code.gs</strong> pada spreadsheet madrasah (buka tab &ldquo;Dokumen Handoff&rdquo; untuk salin kode). Jika belum ada URL, sistem tetap berjalan offline 100%.
        </p>

        {syncFeedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleSyncPending}
            disabled={isSyncing || pendingRecords.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {isSyncing ? 'Mengunggah...' : `Sinkronkan Antrean (${pendingRecords.length})`}
          </button>

          <button
            onClick={handlePing}
            disabled={isPinging || !webAppUrl}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            Uji Ping GAS
          </button>

          <button
            onClick={handlePullStudents}
            disabled={isFetchingStudents || !webAppUrl}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Tarik Siswa dari Sheets
          </button>

          <button
            onClick={handleSeedData}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
            title="Isi contoh riwayat absensi pagi hari"
          >
            <Database className="w-3.5 h-3.5" />
            Muat Data Uji Pagi
          </button>

          <button
            onClick={handleClearAllRecords}
            className="px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Log
          </button>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Log Transaksi Absensi ({filteredRecords.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama/NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 w-44"
              />
            </div>

            {/* Filter Activity */}
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Kegiatan</option>
              <option value="KEDATANGAN">Kedatangan</option>
              <option value="KEPULANGAN">Kepulangan</option>
              <option value="ZUHUR">Shalat Zuhur</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="TEPAT_WAKTU">Tepat Waktu</option>
              <option value="TERLAMBAT">Terlambat</option>
            </select>

            {/* Filter Sync */}
            <select
              value={filterSync}
              onChange={(e) => setFilterSync(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Sync</option>
              <option value="SYNCED">Tersinkron</option>
              <option value="PENDING">Pending (Lokal)</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu & Tanggal</th>
                <th className="py-2.5 px-3">Siswa & Kelas</th>
                <th className="py-2.5 px-3">NIS</th>
                <th className="py-2.5 px-3">Kegiatan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sumber</th>
                <th className="py-2.5 px-3">Idempotency Key</th>
                <th className="py-2.5 px-3">Google Sheets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada rekaman data absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 50).map((r) => (
                  <tr key={r.eventId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-900">{r.waktu}</span>
                      <span className="text-slate-400 text-[11px] block">{r.tanggal}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{r.nama}</div>
                      <div className="text-[11px] text-slate-500">Kelas {r.kelas} · {r.tingkat}</div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{r.nis}</td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-medium text-slate-700">
                        {r.tipeKegiatan}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[11px] font-semibold ${
                          r.statusKehadiran === 'TEPAT_WAKTU'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {r.statusKehadiran === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-slate-600 text-[11px]">
                        {r.source}
                      </span>
                      {r.catatanManual && (
                        <span className="block text-[10px] text-slate-400 truncate max-w-[120px]" title={r.catatanManual}>
                          {r.catatanManual}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={r.idempotencyKey}>
                      {r.idempotencyKey}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.isSynced ? (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Synced
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium text-[11px]">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredRecords.length > 50 && (
          <div className="text-xs text-slate-400 text-center">
            Menampilkan 50 data teratas dari total {filteredRecords.length} rekaman. Gunakan Ekspor CSV untuk mengunduh seluruh data.
          </div>
        )}
      </div>
    </div>
  );
};
