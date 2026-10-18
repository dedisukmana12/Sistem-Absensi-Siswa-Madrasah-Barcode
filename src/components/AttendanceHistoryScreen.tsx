import React, { useState, useMemo } from 'react';
import { History, Calendar, Filter, User, Search, Printer, Download, Clock, CheckCircle2, AlertTriangle, ArrowUpDown, ChevronRight, BookOpen, UserCheck } from 'lucide-react';
import { AttendanceRecordEntity, StudentEntity, TipeKegiatan, StatusKehadiran } from '../types/attendance';
import { formatIndonesianDate, getCurrentDateString } from '../utils/time';

interface AttendanceHistoryScreenProps {
  records: AttendanceRecordEntity[];
  students: StudentEntity[];
}

export const AttendanceHistoryScreen: React.FC<AttendanceHistoryScreenProps> = ({
  records,
  students
}) => {
  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState<string>('');
  
  // Date range filters
  const todayStr = getCurrentDateString();
  const past30Days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [startDate, setStartDate] = useState<string>(past30Days);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [activityFilter, setActivityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Currently selected student object
  const activeStudent = useMemo(() => {
    if (selectedStudentId === 'ALL') return null;
    return students.find(s => s.studentId === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Quick preset ranges
  const handlePresetRange = (preset: 'TODAY' | '7DAYS' | '30DAYS' | 'ALL') => {
    const now = new Date();
    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7DAYS') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setStartDate(`${y}-${m}-${day}`);
      setEndDate(todayStr);
    } else if (preset === '30DAYS') {
      setStartDate(past30Days);
      setEndDate(todayStr);
    } else if (preset === 'ALL') {
      setStartDate('2025-01-01');
      setEndDate(todayStr);
    }
  };

  // Filtered student list for picker
  const filteredStudentsForPicker = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.nis.includes(q) ||
      s.kelas.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [students, studentSearch]);

  // Chronologically sorted filtered records
  const chronologicalRecords = useMemo(() => {
    return records
      .filter(r => {
        // Filter by student
        if (activeStudent && r.nis !== activeStudent.nis) return false;
        // Filter by date range
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;
        // Filter by activity
        if (activityFilter !== 'ALL' && r.tipeKegiatan !== activityFilter) return false;
        // Filter by status
        if (statusFilter !== 'ALL' && r.statusKehadiran !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // Chronological descending (newest date and time first)
        if (a.tanggal !== b.tanggal) {
          return b.tanggal.localeCompare(a.tanggal);
        }
        return b.waktu.localeCompare(a.waktu);
      });
  }, [records, activeStudent, startDate, endDate, activityFilter, statusFilter]);

  // Summary Metrics for the student or filtered records
  const stats = useMemo(() => {
    const total = chronologicalRecords.length;
    const kedatanganList = chronologicalRecords.filter(r => r.tipeKegiatan === 'KEDATANGAN');
    const tepatWaktu = kedatanganList.filter(r => r.statusKehadiran === 'TEPAT_WAKTU').length;
    const terlambat = kedatanganList.filter(r => r.statusKehadiran === 'TERLAMBAT').length;
    const zuhur = chronologicalRecords.filter(r => r.tipeKegiatan === 'ZUHUR').length;
    const kepulangan = chronologicalRecords.filter(r => r.tipeKegiatan === 'KEPULANGAN').length;
    const onTimeRate = kedatanganList.length > 0 ? Math.round((tepatWaktu / kedatanganList.length) * 100) : 100;

    return {
      total,
      kedatanganCount: kedatanganList.length,
      tepatWaktu,
      terlambat,
      zuhur,
      kepulangan,
      onTimeRate
    };
  }, [chronologicalRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    if (chronologicalRecords.length === 0) return;
    const headers = ['Tanggal', 'Waktu', 'NIS', 'Nama Siswa', 'Kelas', 'Tingkat', 'Tipe Kegiatan', 'Status Kehadiran', 'Sumber', 'Catatan / Alasan', 'Petugas'];
    const rows = chronologicalRecords.map(r => [
      `"${r.tanggal}"`,
      `"${r.waktu}"`,
      `"${r.nis}"`,
      `"${r.nama}"`,
      `"${r.kelas}"`,
      `"${r.tingkat}"`,
      `"${r.tipeKegiatan}"`,
      `"${r.statusKehadiran}"`,
      `"${r.source}"`,
      `"${r.catatanManual || ''}"`,
      `"${r.petugas}"`
    ]);

    const filename = activeStudent
      ? `Riwayat_Absensi_${activeStudent.nis}_${activeStudent.nama.replace(/\s+/g, '_')}.csv`
      : `Riwayat_Absensi_MA_Bojongjati_${startDate}_sd_${endDate}.csv`;

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" />
              Riwayat Presensi Siswa (Attendance History)
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Urutan: <strong className="text-slate-700">Kronologis Lengkap</strong></span>
              <span aria-hidden="true">·</span>
              <span>Filter: <strong className="text-slate-700">Rentang Tanggal, Kegiatan &amp; Status</strong></span>
              <span aria-hidden="true">·</span>
              <span>Laporan Individual Siswa</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={chronologicalRecords.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Transkrip
            </button>
          </div>
        </div>
      </div>

      {/* Filter Ribbon: Student Picker & Date Range Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Student Picker (Col 1-5) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Pilih Siswa (Cari Nama / NIS / Rombel)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Semua siswa, atau ketik nama/NIS..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Quick dropdown / selection tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              <button
                onClick={() => {
                  setSelectedStudentId('ALL');
                  setStudentSearch('');
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded whitespace-nowrap transition-colors ${
                  selectedStudentId === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Siswa
              </button>
              {filteredStudentsForPicker.slice(0, 4).map(st => (
                <button
                  key={st.studentId}
                  onClick={() => {
                    setSelectedStudentId(st.studentId);
                    setStudentSearch(`${st.nama} (${st.kelas})`);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap transition-colors ${
                    selectedStudentId === st.studentId
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.nama.split(' ')[0]} ({st.kelas})
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Picker (Col 6-12) */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Rentang Tanggal (Date Range)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">s/d:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handlePresetRange('TODAY')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => handlePresetRange('7DAYS')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  7 Hari
                </button>
                <button
                  onClick={() => handlePresetRange('30DAYS')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  30 Hari
                </button>
                <button
                  onClick={() => handlePresetRange('ALL')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Sub-filters for Activity & Status */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>Kegiatan:</span>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium"
                >
                  <option value="ALL">Semua Kegiatan</option>
                  <option value="KEDATANGAN">Kedatangan</option>
                  <option value="ZUHUR">Shalat Zuhur</option>
                  <option value="KEPULANGAN">Kepulangan</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="TEPAT_WAKTU">Tepat Waktu</option>
                  <option value="TERLAMBAT">Terlambat</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Student Banner (if specific student is selected) */}
      {activeStudent && (
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {activeStudent.tingkat}
              </div>
              <div className="space-y-0.5">
                <div className="text-base font-bold text-slate-900 leading-tight">
                  {activeStudent.nama}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">NIS: {activeStudent.nis}</span>
                  <span aria-hidden="true">·</span>
                  <span>Kelas {activeStudent.kelas}</span>
                  <span aria-hidden="true">·</span>
                  <span>Wali: <strong className="text-slate-700">{activeStudent.namaWali}</strong> (+{activeStudent.kontakWali})</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStudentId('ALL');
                setStudentSearch('');
              }}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg self-start sm:self-auto"
            >
              Lihat Seluruh Siswa
            </button>
          </div>
        </div>
      )}

      {/* Statistical Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Total Transaksi</div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dalam rentang</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Hari Kedatangan</div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {stats.kedatanganCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Presensi pagi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Tepat Waktu</div>
          <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums mt-0.5">
            {stats.tepatWaktu}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">&le; 07:05:59 WIB</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Terlambat</div>
          <div className="text-xl font-bold font-mono text-amber-700 tabular-nums mt-0.5">
            {stats.terlambat}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">&ge; 07:06:00 WIB</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Tingkat Disiplin</div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {stats.onTimeRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rasio tepat waktu</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-500">Shalat Zuhur</div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {stats.zuhur}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Presensi masjid</div>
        </div>
      </div>

      {/* Chronological Attendance Records Table & Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Daftar Kronologis Transaksi Presensi</span>
            <span className="font-mono text-xs font-semibold text-slate-500">({chronologicalRecords.length} rekaman)</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {startDate} s/d {endDate}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Tanggal &amp; Hari</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Waktu</th>
                <th className="py-2.5 px-3">Nama Siswa &amp; Kelas</th>
                <th className="py-2.5 px-3">Kegiatan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sumber &amp; Catatan</th>
                <th className="py-2.5 px-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chronologicalRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada rekaman presensi dalam rentang tanggal dan kriteria filter yang dipilih.
                  </td>
                </tr>
              ) : (
                chronologicalRecords.map((r) => (
                  <tr key={r.eventId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{r.tanggal}</div>
                      <div className="text-[11px] text-slate-400">{formatIndonesianDate(r.tanggal).split(',')[0]}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-slate-800">
                      {r.waktu} WIB
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{r.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        Kelas {r.kelas} · NIS <span className="font-mono">{r.nis}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {r.tipeKegiatan === 'KEDATANGAN'
                          ? 'Kedatangan'
                          : r.tipeKegiatan === 'KEPULANGAN'
                          ? 'Kepulangan'
                          : 'Shalat Zuhur'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          r.statusKehadiran === 'TEPAT_WAKTU'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {r.statusKehadiran === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>{r.source}</span>
                        {r.catatanManual && (
                          <span className="text-[11px] text-slate-500 italic block">
                            &ldquo;{r.catatanManual}&rdquo;
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {r.petugas}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
