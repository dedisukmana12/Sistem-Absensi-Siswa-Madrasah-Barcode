import React, { useState } from 'react';
import { Search, UserCheck, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { StudentEntity, TipeKegiatan } from '../types/attendance';
import { recordAttendance, AddRecordResult } from '../utils/storage';
import { getCurrentDateString, getCurrentTimeString } from '../utils/time';
import { soundEffects } from '../utils/audio';

interface ManualScreenProps {
  students: StudentEntity[];
  onAttendanceUpdated: () => void;
  defaultPetugas: string;
}

const COMMON_REASONS = [
  'Kartu siswa tertinggal di rumah',
  'Kartu siswa patah / barcode tergores',
  'Kamera HP berembun / tidak fokus',
  'Kartu siswa hilang (proses cetak ulang)',
  'Barcode tidak terbaca oleh scanner'
];

export const ManualScreen: React.FC<ManualScreenProps> = ({
  students,
  onAttendanceUpdated,
  defaultPetugas
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentEntity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<TipeKegiatan>('KEDATANGAN');
  const [alasan, setAlasan] = useState('');
  const [petugas, setPetugas] = useState(defaultPetugas);
  const [resultMessage, setResultMessage] = useState<AddRecordResult | null>(null);

  // Filter students based on query
  const filteredStudents = students
    .filter(s => {
      if (!searchQuery.trim()) return false;
      const q = searchQuery.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nis.includes(q) ||
        s.kelas.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !alasan.trim()) return;

    const result = recordAttendance({
      nis: selectedStudent.nis,
      tipeKegiatan: selectedActivity,
      source: 'MANUAL',
      petugas: petugas.trim() || 'Petugas Piket MAB',
      catatanManual: alasan.trim()
    });

    setResultMessage(result);

    if (result.success) {
      soundEffects.playSuccess();
      setSelectedStudent(null);
      setAlasan('');
      setSearchQuery('');
      onAttendanceUpdated();
    } else {
      soundEffects.playDuplicate();
    }
  };

  const isSaveDisabled = !selectedStudent || !alasan.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Pencatatan Kehadiran Manual Darurat
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
          <span>Aturan BR-MAN-001 s/d BR-MAN-003</span>
          <span aria-hidden="true">·</span>
          <span>Flag: <strong className="font-mono text-slate-700">source = &quot;MANUAL&quot;</strong></span>
          <span aria-hidden="true">·</span>
          <span className="text-rose-700 font-semibold">Teks Alasan Wajib Diisi</span>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            resultMessage.code === 'OK'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {resultMessage.code === 'OK' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className="font-bold uppercase tracking-wider">
              {resultMessage.code === 'OK' ? 'Pencatatan Manual Berhasil' : 'Pencatatan Ditolak (Duplikasi)'}
            </div>
            <p className="text-sm font-semibold">{resultMessage.message}</p>
            {resultMessage.existingRecord && (
              <p className="text-rose-800">
                Data sudah ada sejak pukul {resultMessage.existingRecord.waktu} WIB melalui {resultMessage.existingRecord.source}.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {/* Step 1: Search & Pick Student */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            1. Cari Siswa Terdaftar (Nama / NIS / Kelas)
          </label>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik minimal 2 huruf nama siswa atau NIS..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Search Dropdown / Suggestion List */}
          {searchQuery.trim() && !selectedStudent && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50">
              {filteredStudents.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">
                  Tidak ditemukan siswa dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredStudents.map((st) => (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(st);
                      setSearchQuery(`${st.nama} (${st.kelas})`);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 flex items-center justify-between transition-colors text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{st.nama}</span>
                      <span className="text-slate-500 ml-2">Kelas {st.kelas}</span>
                    </div>
                    <span className="font-mono text-slate-500">NIS: {st.nis}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Student Card */}
          {selectedStudent && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-sm">
                    {selectedStudent.nama}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <span>Kelas: {selectedStudent.kelas}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">NIS: {selectedStudent.nis}</span>
                  <span aria-hidden="true">·</span>
                  <span>Tingkat: {selectedStudent.tingkat}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setSearchQuery('');
                }}
                className="text-xs text-slate-600 hover:text-rose-700 font-medium px-2.5 py-1 bg-white border border-slate-200 rounded-md"
              >
                Ganti Siswa
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Activity Mode & Attendant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              2. Tipe Kegiatan
            </label>
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
              {(['KEDATANGAN', 'KEPULANGAN', 'ZUHUR'] as TipeKegiatan[]).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setSelectedActivity(act)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedActivity === act
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {act === 'KEDATANGAN' ? 'Kedatangan' : act === 'KEPULANGAN' ? 'Kepulangan' : 'Zuhur'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              Nama Petugas Piket
            </label>
            <input
              type="text"
              value={petugas}
              onChange={(e) => setPetugas(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Step 3: Mandatory Reason (BR-MAN-002) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              3. Alasan Pencatatan Manual <span className="text-rose-600">* (Wajib)</span>
            </label>
            <span className="text-xs text-slate-500">
              {alasan.trim().length === 0 ? 'Wajib diisi' : `${alasan.trim().length} karakter`}
            </span>
          </div>

          <textarea
            rows={2}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Contoh: Kartu siswa rusak / tertinggal di rumah / kamera HP berembun..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />

          {/* Quick Reason Snippets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-slate-500 self-center mr-1">Rekomendasi:</span>
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAlasan(r)}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button (Disabled if reason is empty as per BR-MAN-002) */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Waktu Catat: <strong className="font-mono text-slate-700">{getCurrentTimeString()} WIB</strong></span>
          </div>

          <button
            type="submit"
            disabled={isSaveDisabled}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isSaveDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Simpan Catatan Manual
          </button>
        </div>

        {isSaveDisabled && (
          <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {!selectedStudent
                ? 'Silakan pilih siswa terlebih dahulu dari daftar di atas.'
                : 'Tombol simpan dinonaktifkan hingga kolom &ldquo;Alasan Pencatatan Manual&rdquo; diisi.'}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
