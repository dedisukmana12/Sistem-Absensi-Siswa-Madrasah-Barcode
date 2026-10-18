import React, { useState } from 'react';
import { Send, Copy, Check, Users, Clock, AlertCircle, Share2, Calendar } from 'lucide-react';
import { AttendanceRecordEntity, StudentEntity, Tingkat } from '../types/attendance';
import { buildWhatsAppReport, shareToWhatsApp } from '../utils/whatsapp';
import { getCurrentDateString } from '../utils/time';

interface WhatsAppScreenProps {
  students: StudentEntity[];
  records: AttendanceRecordEntity[];
  cutoffPagi: string;
}

export const WhatsAppScreen: React.FC<WhatsAppScreenProps> = ({
  students,
  records,
  cutoffPagi
}) => {
  const [selectedTingkat, setSelectedTingkat] = useState<Tingkat>('X');
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDateString());
  const [copied, setCopied] = useState<boolean>(false);
  const [subFilter, setSubFilter] = useState<'ALL' | 'TERLAMBAT' | 'BELUM'>('ALL');

  const report = buildWhatsAppReport(
    selectedTingkat,
    students,
    records,
    selectedDate,
    `${cutoffPagi} WIB`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(report.messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWA = () => {
    shareToWhatsApp(report.messageText);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Laporan Kehadiran Grup WhatsApp Wali Murid
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Intent Resmi: <strong className="font-mono text-slate-700">ACTION_SEND</strong></span>
              <span aria-hidden="true">·</span>
              <span>Anti-Banned: Tanpa Aksesibilitas Bot</span>
              <span aria-hidden="true">·</span>
              <span>Cutoff Snapshot: <strong className="font-mono text-slate-700">{cutoffPagi} WIB</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3 Group Buttons (Tingkat X, XI, XII) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['X', 'XI', 'XII'] as Tingkat[]).map((tingkat) => {
          const currentReport = buildWhatsAppReport(
            tingkat,
            students,
            records,
            selectedDate,
            `${cutoffPagi} WIB`
          );
          const isSelected = selectedTingkat === tingkat;

          return (
            <button
              key={tingkat}
              type="button"
              onClick={() => setSelectedTingkat(tingkat)}
              className={`p-5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  Grup Wali Murid
                </span>
                <span className={`text-xs font-mono tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {currentReport.totalSiswa} Siswa
                </span>
              </div>

              <div className="text-xl font-bold mt-1">
                Tingkat {tingkat}
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/20 text-xs">
                <div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Tepat</div>
                  <div className={`font-mono font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {currentReport.hadirTepatWaktu}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Telat</div>
                  <div className={`font-mono font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-amber-700'}`}>
                    {currentReport.hadirTerlambat}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Belum</div>
                  <div className={`font-mono font-bold text-sm ${isSelected ? 'text-rose-400' : 'text-rose-700'}`}>
                    {currentReport.belumTercatat}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Preview & 1-Tap Share Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Formatted WhatsApp Message Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Pesan WhatsApp (Format Baku BRS)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Grup: <strong>Wali Murid Kelas {selectedTingkat}</strong>
            </span>
          </div>

          {/* Chat bubble styled box */}
          <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[460px] overflow-y-auto">
            {report.messageText}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleSendWA}
              className="w-full sm:w-auto flex-1 min-h-[44px] px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              1-Tap Kirim ke WhatsApp Grup Kelas {selectedTingkat}
            </button>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  Salin Teks Laporan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Breakdown List (Terlambat & Belum Hadir) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Rincian Siswa Kelas {selectedTingkat}
            </h3>
            {/* Sub-filter tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
              <button
                onClick={() => setSubFilter('ALL')}
                className={`px-2 py-1 rounded font-medium ${subFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setSubFilter('TERLAMBAT')}
                className={`px-2 py-1 rounded font-medium ${subFilter === 'TERLAMBAT' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'}`}
              >
                Telat ({report.hadirTerlambat})
              </button>
              <button
                onClick={() => setSubFilter('BELUM')}
                className={`px-2 py-1 rounded font-medium ${subFilter === 'BELUM' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600'}`}
              >
                Belum ({report.belumTercatat})
              </button>
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 text-xs">
            {subFilter === 'TERLAMBAT' && (
              report.daftarTerlambat.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Tidak ada siswa terlambat di Kelas {selectedTingkat}.
                </div>
              ) : (
                report.daftarTerlambat.map((st, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{st.nama}</div>
                      <div className="text-[11px] text-slate-500">Kelas {st.kelas}</div>
                    </div>
                    <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      {st.waktu} WIB
                    </span>
                  </div>
                ))
              )
            )}

            {subFilter === 'BELUM' && (
              report.daftarBelumHadir.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Semua siswa Kelas {selectedTingkat} telah hadir.
                </div>
              ) : (
                report.daftarBelumHadir.map((st, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{st.nama}</div>
                      <div className="text-[11px] text-slate-500">Kelas {st.kelas}</div>
                    </div>
                    <span className="text-[11px] text-rose-600 font-medium">
                      Belum Scan
                    </span>
                  </div>
                ))
              )
            )}

            {subFilter === 'ALL' && (
              <div className="space-y-4">
                {/* Late Section */}
                <div>
                  <div className="font-bold text-amber-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Terlambat ({report.daftarTerlambat.length})
                  </div>
                  {report.daftarTerlambat.length === 0 ? (
                    <div className="text-slate-400 py-1 text-[11px]">Nihil</div>
                  ) : (
                    report.daftarTerlambat.map((st, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between border-b border-slate-50">
                        <span className="text-slate-800">{st.nama} ({st.kelas})</span>
                        <span className="font-mono text-amber-700 font-medium">{st.waktu} WIB</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Unrecorded Section */}
                <div className="pt-2">
                  <div className="font-bold text-rose-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Belum Ada Catatan ({report.daftarBelumHadir.length})
                  </div>
                  {report.daftarBelumHadir.length === 0 ? (
                    <div className="text-slate-400 py-1 text-[11px]">Semua telah hadir</div>
                  ) : (
                    report.daftarBelumHadir.slice(0, 15).map((st, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between border-b border-slate-50">
                        <span className="text-slate-800">{st.nama} ({st.kelas})</span>
                        <span className="text-slate-400 text-[11px]">Belum scan</span>
                      </div>
                    ))
                  )}
                  {report.daftarBelumHadir.length > 15 && (
                    <div className="text-[11px] text-slate-400 pt-1 text-center">
                      + {report.daftarBelumHadir.length - 15} siswa lainnya
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
