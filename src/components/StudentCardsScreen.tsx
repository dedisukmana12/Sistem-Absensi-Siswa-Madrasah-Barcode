import React, { useState } from 'react';
import { Printer, Search, QrCode, Scan, ShieldCheck, GraduationCap } from 'lucide-react';
import { StudentEntity, Tingkat } from '../types/attendance';

interface StudentCardsScreenProps {
  students: StudentEntity[];
  onScanStudent: (nis: string) => void;
}

export const StudentCardsScreen: React.FC<StudentCardsScreenProps> = ({
  students,
  onScanStudent
}) => {
  const [selectedTingkat, setSelectedTingkat] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const allClasses = Array.from(new Set(students.map(s => s.kelas))).sort();

  const filtered = students.filter(s => {
    if (selectedTingkat !== 'ALL' && s.tingkat !== selectedTingkat) return false;
    if (selectedKelas !== 'ALL' && s.kelas !== selectedKelas) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.nis.includes(q) || s.kelas.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Kartu Pelajar & QR Code MA Bojongjati
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Total 300 Siswa Terdaftar</span>
              <span aria-hidden="true">·</span>
              <span>Format: <strong className="font-mono text-slate-700">QR Code & Barcode Code128</strong></span>
              <span aria-hidden="true">·</span>
              <span>Siap Cetak Fisik</span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            Cetak Lembar Kartu (Print)
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 print:hidden">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari siswa atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
          />
        </div>

        {/* Tingkat */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {['ALL', 'X', 'XI', 'XII'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTingkat(t)}
              className={`px-3 py-1.5 rounded-md font-medium ${selectedTingkat === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              {t === 'ALL' ? 'Semua Tingkat' : `Kelas ${t}`}
            </button>
          ))}
        </div>

        {/* Kelas */}
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
        >
          <option value="ALL">Semua Rombel</option>
          {allClasses.map(k => (
            <option key={k} value={k}>Kelas {k}</option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4">
        {filtered.slice(0, 30).map((st) => {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${st.nis}`;

          return (
            <div
              key={st.studentId}
              className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              {/* Card Header with Madrasah Branding */}
              <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center font-bold text-xs text-emerald-100">
                    MAB
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-tight uppercase leading-tight">
                      KARTU IDENTITAS SISWA
                    </div>
                    <div className="text-[10px] text-emerald-200 leading-tight">
                      MA BOJONGJATI
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                  {st.kelas}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex gap-4 items-center">
                {/* QR Code Container */}
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={qrUrl}
                    alt={`QR Code ${st.nis}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Student Info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate" title={st.nama}>
                    {st.nama}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    NIS: <strong className="text-slate-900">{st.nis}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    Tingkat: <span className="font-semibold text-slate-700">{st.tingkat}</span> ({st.kelas})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Status: <span className="text-emerald-700 font-medium">Aktif</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Barcode & Action */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
                {/* Pseudo-barcode bars */}
                <div className="space-y-0.5">
                  <div className="h-5 flex items-center gap-0.5 opacity-80" aria-hidden="true">
                    {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 tracking-widest text-center">
                    *{st.nis}*
                  </div>
                </div>

                {/* Direct Scan Trigger Button for Testing */}
                <button
                  type="button"
                  onClick={() => onScanStudent(st.nis)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center gap-1 print:hidden min-h-[36px]"
                  title="Uji scan kartu ini di sistem absensi"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Uji Scan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 30 && (
        <div className="text-xs text-slate-500 text-center py-2 print:hidden">
          Menampilkan 30 dari {filtered.length} kartu. Gunakan pencarian atau filter rombel untuk kartu lainnya.
        </div>
      )}
    </div>
  );
};
