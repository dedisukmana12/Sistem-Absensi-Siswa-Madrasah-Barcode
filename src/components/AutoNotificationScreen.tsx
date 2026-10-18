import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Send, CheckCircle2, AlertTriangle, Users, Phone, Clock, MessageSquare, Play, ShieldCheck, Check, UserCheck, ExternalLink } from 'lucide-react';
import { AppConfig, GuardianNotificationEntity, StudentEntity, AttendanceRecordEntity } from '../types/attendance';
import { checkAndDispatchAutomatedNotifications, loadNotifications, saveNotifications, saveStudents } from '../utils/storage';
import { getCurrentDateString, getCurrentTimeString, formatIndonesianDate } from '../utils/time';

interface AutoNotificationScreenProps {
  students: StudentEntity[];
  records: AttendanceRecordEntity[];
  config: AppConfig;
  onStudentsUpdated: () => void;
}

export const AutoNotificationScreen: React.FC<AutoNotificationScreenProps> = ({
  students,
  records,
  config,
  onStudentsUpdated
}) => {
  const [notifications, setNotifications] = useState<GuardianNotificationEntity[]>(loadNotifications);
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDateString());
  const [testTime, setTestTime] = useState<string>('07:15:00');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastCheckResult, setLastCheckResult] = useState<{
    dispatchedCount: number;
    unrecordedStudents: StudentEntity[];
    skippedAlreadyNotified: number;
  } | null>(null);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Editing student guardian modal state
  const [editingStudent, setEditingStudent] = useState<StudentEntity | null>(null);
  const [editNamaWali, setEditNamaWali] = useState<string>('');
  const [editKontakWali, setEditKontakWali] = useState<string>('');
  const [editHubunganWali, setEditHubunganWali] = useState<'Ayah' | 'Ibu' | 'Wali'>('Ayah');
  const [guardianFilter, setGuardianFilter] = useState<string>('');

  // Unrecorded students calculation for selected date
  const arrivedNisSet = new Set(
    records
      .filter(r => r.tanggal === selectedDate && r.tipeKegiatan === 'KEDATANGAN')
      .map(r => r.nis)
  );

  const unrecordedStudents = students.filter(st => st.status === 'ACTIVE' && !arrivedNisSet.has(st.nis));

  // Request browser push notification permission
  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Notifikasi Otomatis MA Bojongjati Aktif', {
          body: 'Sistem siap mengirimkan peringatan otomatis untuk siswa yang belum hadir pada pukul 07:15 WIB.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleRunScheduledJob = () => {
    setIsEvaluating(true);
    const result = checkAndDispatchAutomatedNotifications(testTime, selectedDate);
    setNotifications(loadNotifications());
    setLastCheckResult({
      dispatchedCount: result.dispatchedCount,
      unrecordedStudents: result.unrecordedStudents,
      skippedAlreadyNotified: result.skippedAlreadyNotified
    });
    setIsEvaluating(false);
  };

  const handleSendSingleWhatsApp = (notif: GuardianNotificationEntity) => {
    const cleanPhone = notif.kontakWali.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(notif.pesan)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendWhatsAppToStudent = (student: StudentEntity) => {
    const cleanPhone = student.kontakWali.replace(/\D/g, '');
    const pesan = `Assalamu'alaikum Wr. Wb. ${student.namaWali}, menginformasikan bahwa ananda *${student.nama}* (Kelas ${student.kelas}, NIS ${student.nis}) hingga pukul ${config.jamPeringatanAbsen} WIB belum tercatat melakukan presensi kedatangan di MA Bojongjati hari ini (${formatIndonesianDate(selectedDate)}). Mohon konfirmasi kehadiran atau kabar ananda kepada petugas piket madrasah. Terima kasih.\n_Wassalamu'alaikum Wr. Wb._`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated = students.map(s => {
      if (s.studentId === editingStudent.studentId) {
        return {
          ...s,
          namaWali: editNamaWali.trim(),
          kontakWali: editKontakWali.trim(),
          hubunganWali: editHubunganWali
        };
      }
      return s;
    });

    saveStudents(updated);
    onStudentsUpdated();
    setEditingStudent(null);
  };

  const filteredStudentsForGuardianTab = students.filter(s => {
    if (!guardianFilter) return true;
    const q = guardianFilter.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.includes(q) || s.namaWali.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-600" />
              Layanan Peringatan Otomatis Wali Murid (Pukul {config.jamPeringatanAbsen} WIB)
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Jadwal Otomatis: <strong className="font-mono text-slate-700">{config.jamPeringatanAbsen} WIB</strong></span>
              <span aria-hidden="true">·</span>
              <span>Kriteria: Siswa belum scan <strong className="text-slate-700">KEDATANGAN</strong></span>
              <span aria-hidden="true">·</span>
              <span>Metode: <strong className="text-slate-700">Push Notification &amp; 1-Tap WA Wali</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission !== 'granted' ? (
              <button
                onClick={requestBrowserPermission}
                className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-4 h-4 text-amber-700" />
                Aktifkan Push Notif Browser
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Push Notif Aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Job Trigger & Controller Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pengatur Tugas Terjadwal (Scheduled Background Worker)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pada aplikasi Android Studio, tugas ini dijalankan oleh <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">WorkManager / AlarmManager</code> tepat pukul 07:15 WIB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50"
            />
            <button
              onClick={handleRunScheduledJob}
              disabled={isEvaluating}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              {isEvaluating ? 'Memeriksa...' : 'Jalankan Pemeriksaan 07:15 Sekarang'}
            </button>
          </div>
        </div>

        {/* Feedback after execution */}
        {lastCheckResult && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pemeriksaan Absensi 07:15 Selesai!
            </div>
            <div>
              Ditemukan <strong>{lastCheckResult.unrecordedStudents.length} siswa</strong> yang belum presensi kedatangan.
            </div>
            <div className="text-[11px] text-emerald-800">
              • Notifikasi baru dikirim: <strong>{lastCheckResult.dispatchedCount} siswa</strong>
              <br />
              • Dilewati (sudah dikirim sebelumnya hari ini): <strong>{lastCheckResult.skippedAlreadyNotified} siswa</strong>
            </div>
          </div>
        )}

        {/* Status Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Siswa Belum Hadir</span>
            <span className="text-xl font-bold font-mono text-rose-700">{unrecordedStudents.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Hingga 07:15 WIB</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Peringatan Terkirim Hari Ini</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {notifications.filter(n => n.tanggal === selectedDate).length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Antrean Notifikasi</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Siswa Telah Hadir</span>
            <span className="text-xl font-bold font-mono text-emerald-700">
              {students.length - unrecordedStudents.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Presensi Terpenuhi</span>
          </div>
        </div>
      </div>

      {/* Main Sections: Unrecorded Students with 1-Tap Guardian Alert & Registered Guardian Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Unrecorded Students List with 1-Tap WhatsApp Trigger */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Siswa Belum Hadir &amp; Hubungi Wali ({unrecordedStudents.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Cutoff 07:15 WIB
            </span>
          </div>

          {unrecordedStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-semibold text-slate-700">Seluruh siswa telah tercatat kedatangan!</p>
              <p>Tidak ada peringatan absen yang perlu dikirimkan saat ini.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-xs">
              {unrecordedStudents.map((st) => (
                <div key={st.studentId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{st.nama}</span>
                      <span className="font-mono text-[10px] text-slate-400">NIS {st.nis}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-2">
                      <span>Kelas {st.kelas}</span>
                      <span aria-hidden="true">·</span>
                      <span>Wali: <strong className="text-slate-700">{st.namaWali}</strong> ({st.hubunganWali})</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      +{st.kontakWali}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => handleSendWhatsAppToStudent(st)}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Kirim Pesan WhatsApp Pengingat Langsung ke Wali Murid"
                    >
                      <Send className="w-3 h-3" />
                      Kirim WA Wali
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudent(st);
                        setEditNamaWali(st.namaWali);
                        setEditKontakWali(st.kontakWali);
                        setEditHubunganWali(st.hubunganWali);
                      }}
                      className="px-2 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Ubah Kontak Wali"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Registered Guardians Directory & Linkage Manager */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Koneksi Data Wali Murid (Master Siswa)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              300 Siswa Terhubung
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Cari siswa / nama wali..."
              value={guardianFilter}
              onChange={(e) => setGuardianFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredStudentsForGuardianTab.slice(0, 25).map((st) => (
              <div key={st.studentId} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{st.nama}</div>
                  <div className="text-[11px] text-slate-500">
                    Kelas {st.kelas} · {st.namaWali} ({st.hubunganWali})
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    +{st.kontakWali}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingStudent(st);
                    setEditNamaWali(st.namaWali);
                    setEditKontakWali(st.kontakWali);
                    setEditHubunganWali(st.hubunganWali);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Edit Kontak
                </button>
              </div>
            ))}
          </div>

          {filteredStudentsForGuardianTab.length > 25 && (
            <div className="text-center text-[11px] text-slate-400 pt-1">
              Menampilkan 25 dari {filteredStudentsForGuardianTab.length} siswa.
            </div>
          )}
        </div>
      </div>

      {/* Edit Guardian Linkage Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Perbarui Kontak Wali: {editingStudent.nama}
            </h3>
            <p className="text-xs text-slate-500">
              Kelas {editingStudent.kelas} · NIS {editingStudent.nis}
            </p>

            <form onSubmit={handleSaveGuardian} className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Nama Lengkap Wali</label>
                <input
                  type="text"
                  value={editNamaWali}
                  onChange={(e) => setEditNamaWali(e.target.value)}
                  required
                  placeholder="Contoh: Bpk. Hidayat"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Hubungan / Status</label>
                <select
                  value={editHubunganWali}
                  onChange={(e) => setEditHubunganWali(e.target.value as 'Ayah' | 'Ibu' | 'Wali')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Ayah">Ayah Kandung</option>
                  <option value="Ibu">Ibu Kandung</option>
                  <option value="Wali">Wali Santri / Keluarga</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Nomor WhatsApp Wali (Gunakan 628...)</label>
                <input
                  type="text"
                  value={editKontakWali}
                  onChange={(e) => setEditKontakWali(e.target.value)}
                  required
                  placeholder="628123456789"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
