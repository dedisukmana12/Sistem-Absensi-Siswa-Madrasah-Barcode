import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertTriangle, XCircle, Search, Clock, ArrowRight, ShieldCheck, Sparkles, Volume2, UserCheck } from 'lucide-react';
import { AttendanceRecordEntity, StudentEntity, TipeKegiatan } from '../types/attendance';
import { recordAttendance, loadStudents, AddRecordResult } from '../utils/storage';
import { getCurrentDateString, getCurrentTimeString } from '../utils/time';
import { soundEffects } from '../utils/audio';

interface ScannerScreenProps {
  onAttendanceUpdated: () => void;
  recentRecords: AttendanceRecordEntity[];
  students: StudentEntity[];
  jamMasuk: string;
  toleransiMenit: number;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  onAttendanceUpdated,
  recentRecords,
  students,
  jamMasuk,
  toleransiMenit
}) => {
  const [selectedActivity, setSelectedActivity] = useState<TipeKegiatan>('KEDATANGAN');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<AddRecordResult | null>(null);
  const [testNisInput, setTestNisInput] = useState<string>('');
  const [quickStudentFilter, setQuickStudentFilter] = useState<string>('');
  const [simulateTime, setSimulateTime] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>('06:50:00');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanInProgressRef = useRef<boolean>(false);

  // Initialize and clean up camera scanner
  const startCamera = async () => {
    try {
      setCameraError(null);
      const scannerId = 'mab-reader-view';
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13
          ],
          verbose: false
        });
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanCode(decodedText);
        },
        () => {
          // Frame parse error, ignore to prevent console spam
        }
      );
      setScannerActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(`Kamera tidak dapat diakses (${msg}). Anda dapat menggunakan Simulator Scan Barcode di bawah.`);
      setScannerActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore
      }
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanCode = (code: string) => {
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;

    // Extract NIS from QR code or barcode
    // Some formats could be just NIS "2401001", or URL with NIS
    let cleanNis = code.trim();
    if (cleanNis.includes('=')) {
      cleanNis = cleanNis.split('=').pop() || cleanNis;
    }

    const effectiveTime = simulateTime ? customTime : getCurrentTimeString();
    const result = recordAttendance({
      nis: cleanNis,
      tipeKegiatan: selectedActivity,
      source: 'SCAN',
      petugas: 'Petugas Gerbang MAB',
      customTime: simulateTime ? customTime : undefined
    });

    setLastScanResult(result);

    if (result.success) {
      if (result.record?.statusKehadiran === 'TERLAMBAT') {
        soundEffects.playLate();
      } else {
        soundEffects.playSuccess();
      }
      onAttendanceUpdated();
    } else {
      soundEffects.playDuplicate();
    }

    // Debounce next scan
    setTimeout(() => {
      scanInProgressRef.current = false;
    }, 1600);
  };

  const handleSimulatedScan = (nis: string) => {
    handleScanCode(nis);
  };

  // Filtered sample students for quick test buttons
  const filteredQuickStudents = students
    .filter(s => {
      if (!quickStudentFilter) return true;
      const q = quickStudentFilter.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.nis.includes(q) || s.kelas.toLowerCase().includes(q);
    })
    .slice(0, 8);

  const todayStr = getCurrentDateString();
  const todayScans = recentRecords.filter(r => r.tanggal === todayStr && r.tipeKegiatan === selectedActivity);

  return (
    <div className="space-y-6">
      {/* Activity Selector & Operational Policy Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Pemindai Barcode / QR Siswa
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Jam Masuk: <strong className="text-slate-700 font-mono">{jamMasuk} WIB</strong></span>
              <span aria-hidden="true">·</span>
              <span>Toleransi: <strong className="text-slate-700 font-mono">+{toleransiMenit} mnt (07:05:59)</strong></span>
              <span aria-hidden="true">·</span>
              <span>Terlambat: <strong className="text-amber-700 font-mono">&ge; 07:06:00</strong></span>
            </div>
          </div>

          {/* Interactive Activity Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto">
            {(['KEDATANGAN', 'KEPULANGAN', 'ZUHUR'] as TipeKegiatan[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedActivity(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  selectedActivity === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'KEDATANGAN' ? 'Kedatangan' : mode === 'KEPULANGAN' ? 'Kepulangan' : 'Shalat Zuhur'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Camera / Scanner Viewport & Status Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport & Quick Input */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Kamera Scanner (CameraX / ML Kit Engine)
                </h3>
              </div>

              {scannerActive ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  Matikan Kamera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Aktifkan Kamera
                </button>
              )}
            </div>

            {/* Camera View Area */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden min-h-[260px] flex flex-col items-center justify-center text-white">
              <div id="mab-reader-view" className="w-full max-w-[360px]" />
              
              {!scannerActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Kamera sedang tidak aktif
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Klik tombol &ldquo;Aktifkan Kamera&rdquo; untuk memindai kartu fisik siswa, atau gunakan pengujian barcode di bawah.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                  >
                    Mulai Scan Kamera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Time Simulation Toggle for Testing BR-TIME-001 & BR-TIME-002 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={simulateTime}
                    onChange={(e) => setSimulateTime(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Simulasikan Jam Pindai (Uji Aturan Keterlambatan)</span>
                </label>

                {simulateTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Jam:</span>
                    <input
                      type="time"
                      step="1"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-slate-50 focus:bg-white"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCustomTime('06:52:00')}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono"
                        title="Tepat Waktu"
                      >
                        06:52
                      </button>
                      <button
                        onClick={() => setCustomTime('07:05:30')}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono"
                        title="Toleransi Terakhir"
                      >
                        07:05
                      </button>
                      <button
                        onClick={() => setCustomTime('07:12:00')}
                        className="px-1.5 py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded text-[10px] font-mono"
                        title="Terlambat"
                      >
                        07:12 (Telat)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rapid Barcode & QR Simulator Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Simulator Scan Cepat (300 Siswa Terdaftar)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Idempotensi Aktif: <strong className="font-mono text-slate-700">1 Scan / Hari</strong>
              </span>
            </div>

            {/* Direct Input Barcode / NIS */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (testNisInput.trim()) {
                  handleScanCode(testNisInput.trim());
                  setTestNisInput('');
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testNisInput}
                  onChange={(e) => setTestNisInput(e.target.value)}
                  placeholder="Ketik/Pindai NIS (contoh: 2401001)..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={!testNisInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                Scan NIS
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Click Simulation for testing */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Klik kartu di bawah untuk uji scan instan:</span>
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={quickStudentFilter}
                  onChange={(e) => setQuickStudentFilter(e.target.value)}
                  className="px-2 py-0.5 text-xs border border-slate-200 rounded bg-slate-50 w-36"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {filteredQuickStudents.map((st) => (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => handleSimulatedScan(st.nis)}
                    className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-900 truncate group-hover:text-emerald-700">
                      {st.nama}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{st.nis}</span>
                      <span className="font-sans font-medium text-slate-600">{st.kelas}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Feedback & Today's Scan Activity */}
        <div className="lg:col-span-5 space-y-4">
          {/* Latest Scan Result Card */}
          {lastScanResult ? (
            <div
              className={`p-4 rounded-xl border transition-all ${
                lastScanResult.code === 'OK'
                  ? lastScanResult.record?.statusKehadiran === 'TEPAT_WAKTU'
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                  : 'bg-rose-50/70 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastScanResult.code === 'OK' ? (
                  lastScanResult.record?.statusKehadiran === 'TEPAT_WAKTU' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  )
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {lastScanResult.code === 'OK'
                        ? lastScanResult.record?.statusKehadiran === 'TEPAT_WAKTU'
                          ? 'BERHASIL: TEPAT WAKTU'
                          : 'BERHASIL: TERLAMBAT'
                        : 'DUPLIKASI / DITOLAK'}
                    </span>
                    <span className="text-xs font-mono">
                      {lastScanResult.record?.waktu || getCurrentTimeString()} WIB
                    </span>
                  </div>

                  <p className="text-sm font-semibold">
                    {lastScanResult.message}
                  </p>

                  {lastScanResult.record && (
                    <div className="text-xs space-y-0.5 pt-1 text-slate-700">
                      <div>Siswa: <strong>{lastScanResult.record.nama}</strong> ({lastScanResult.record.kelas})</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        NIS: {lastScanResult.record.nis} · Key: {lastScanResult.record.idempotencyKey}
                      </div>
                    </div>
                  )}

                  {lastScanResult.existingRecord && (
                    <div className="mt-2 p-2 bg-rose-100/60 rounded text-xs text-rose-900">
                      <div>Waktu tercatat sebelumnya: <strong>{lastScanResult.existingRecord.waktu} WIB</strong></div>
                      <div>Metode: <strong>{lastScanResult.existingRecord.source}</strong> ({lastScanResult.existingRecord.petugas})</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-slate-400" />
              <p className="font-medium text-slate-700">Menunggu Pemindaian Kartu</p>
              <p>Arahkan kamera ke barcode/QR Code kartu siswa atau gunakan simulator.</p>
            </div>
          )}

          {/* Live Recent Scans Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Aktivitas Scan Hari Ini ({todayScans.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {selectedActivity}
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {todayScans.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada siswa yang memindai {selectedActivity.toLowerCase()} hari ini.
                </div>
              ) : (
                todayScans.slice(0, 15).map((rec) => (
                  <div key={rec.eventId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">
                        {rec.nama}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span>{rec.kelas}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{rec.nis}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.source === 'MANUAL' ? 'Manual' : 'Scan'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-slate-700 font-medium">
                        {rec.waktu.slice(0, 8)}
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          rec.statusKehadiran === 'TEPAT_WAKTU'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {rec.statusKehadiran === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
