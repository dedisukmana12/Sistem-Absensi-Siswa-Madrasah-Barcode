import React, { useState } from 'react';
import { Copy, Check, FileCode, Smartphone, Database, CheckCircle2, ShieldCheck, BookOpen, BellRing, History } from 'lucide-react';
import { GAS_CODE_GS, ANDROID_GRADLE, ANDROID_MANIFEST, ANDROID_ROOM_ENTITIES, ANDROID_WORKER_CODE } from '../data/handoffDocs';

export const HandoffDocsScreen: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<number>(4); // Default to Code.gs for convenience
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              Paket Dokumen Handoff Lengkap MA Bojongjati
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Status: <strong className="text-emerald-800 font-semibold">Kanonik & Siap Bangun</strong></span>
              <span aria-hidden="true">·</span>
              <span>Target: Android Studio & Google Apps Script</span>
              <span aria-hidden="true">·</span>
              <span>Single-Tenant ~300 Siswa &amp; WorkManager 07:15</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation for 5 Documents */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-lg mt-4 text-xs">
          <button
            onClick={() => setActiveDoc(1)}
            className={`px-3 py-2 rounded-md font-semibold whitespace-nowrap transition-colors ${activeDoc === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dokumen 1: Master Context
          </button>
          <button
            onClick={() => setActiveDoc(2)}
            className={`px-3 py-2 rounded-md font-semibold whitespace-nowrap transition-colors ${activeDoc === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dokumen 2: Aturan Bisnis (BRS)
          </button>
          <button
            onClick={() => setActiveDoc(3)}
            className={`px-3 py-2 rounded-md font-semibold whitespace-nowrap transition-colors ${activeDoc === 3 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dokumen 3: Arsitektur & Room DB
          </button>
          <button
            onClick={() => setActiveDoc(4)}
            className={`px-3 py-2 rounded-md font-semibold whitespace-nowrap transition-colors ${activeDoc === 4 ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dokumen 4: Code.gs (Apps Script)
          </button>
          <button
            onClick={() => setActiveDoc(5)}
            className={`px-3 py-2 rounded-md font-semibold whitespace-nowrap transition-colors ${activeDoc === 5 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dokumen 5: Direktif Android Studio
          </button>
        </div>
      </div>

      {/* Document 1: Master Context */}
      {activeDoc === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            DOKUMEN 1: MASTER CONTEXT (MC-MAB-AND-001)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-900 text-sm">Visi & Karakteristik Sistem</div>
              <div>• <strong>Nama Proyek:</strong> Sistem Absensi Digital MA Bojongjati</div>
              <div>• <strong>Target Lingkungan:</strong> Native Android (Android Studio / Kotlin / Jetpack Compose)</div>
              <div>• <strong>Backend & Storage:</strong> Google Sheets via Google Apps Script (GAS) Web App</div>
              <div>• <strong>Status Penyewa:</strong> Single-Tenant (Khusus MA Bojongjati, kapasitas ~300 siswa)</div>
              <div>• <strong>Model Notifikasi:</strong> 1-Tap Native Android Share to WhatsApp (3 Tingkat) &amp; Automated 07:15 Guardian Reminder</div>
              <div>• <strong>Prinsip Utama:</strong> Offline-First, Zero-Server Cost, Anti-Banned WA</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-900 text-sm">Catatan Keputusan Kanonik (Decision Log)</div>
              <div>• <strong>DEC-020 (Dynamic Parameters):</strong> Jam operasional (07:00), toleransi keterlambatan (5 menit), ambang notifikasi otomatis (07:15), dan jam cutoff pagi (08:00) disimpan dalam konfigurasi yang dapat diedit.</div>
              <div>• <strong>DEC-021 (Anti-Tamper & Locked Day):</strong> Data yang disinkronkan ke Google Sheets dikunci oleh script; perubahan manual melalui otorisasi.</div>
              <div>• <strong>DEC-022 (Single Tenant Pivot):</strong> Dihapusnya arsitektur multi-tenant kompleks; fokus 1 madrasah (MA Bojongjati).</div>
              <div>• <strong>DEC-023 (Official WhatsApp Intent):</strong> Pengiriman laporan menggunakan <code className="font-mono bg-white px-1">Intent.ACTION_SEND</code> resmi OS, tanpa bot Accessibility Service.</div>
            </div>
          </div>
        </div>
      )}

      {/* Document 2: BRS */}
      {activeDoc === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900">
            DOKUMEN 2: BUSINESS REQUIREMENTS SPECIFICATION (BRS-MAB-AND-001)
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-900 text-sm">1. Aturan Waktu Absensi &amp; Notifikasi Otomatis</div>
              <div>• <strong>BR-TIME-001 (Jam Masuk):</strong> Jam masuk sekolah ditetapkan pukul <strong>07:00 WIB</strong>.</div>
              <div>• <strong>BR-TIME-002 (Toleransi Keterlambatan):</strong> Diberikan toleransi hingga pukul <strong>07:05:59 WIB</strong> (dikategorikan <code className="bg-emerald-50 text-emerald-800 font-mono px-1">TEPAT_WAKTU</code>).</div>
              <div>• <strong>BR-TIME-003 (Status Terlambat):</strong> Siswa yang melakukan scan mulai pukul <strong>07:06:00 WIB</strong> otomatis berstatus <code className="bg-amber-50 text-amber-800 font-mono px-1">TERLAMBAT</code>.</div>
              <div>• <strong>BR-TIME-004 (Peringatan Otomatis 07:15 WIB):</strong> Pada pukul 07:15 WIB, sistem mengevaluasi siswa yang belum scan kedatangan dan mengirimkan push notification serta tautan pesan pengingat ke kontak wali murid.</div>
              <div>• <strong>BR-TIME-005 (Cutoff Snapshot Pagi):</strong> Pukul <strong>08:00 WIB</strong>, sistem membuat snapshot ringkasan harian untuk dilaporkan ke grup WhatsApp wali murid tingkat X, XI, XII.</div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-900 text-sm">2. Aturan Pemindaian & Idempotensi (Pencegahan Duplikasi)</div>
              <div>• <strong>BR-SCAN-001:</strong> Identitas unik berupa NIS (Nomor Induk Siswa) dalam format QR Code / Barcode (Code128).</div>
              <div>• <strong>BR-SCAN-002 (Anti Double-Scan):</strong> Dalam 1 hari, siswa hanya boleh tercatat 1 kali untuk tiap tipe kegiatan (<code className="font-mono">KEDATANGAN</code>, <code className="font-mono">KEPULANGAN</code>, <code className="font-mono">ZUHUR</code>).</div>
              <div>• <strong>BR-SCAN-003 (Idempotency Key):</strong> Format unik: <code className="bg-slate-100 font-mono px-1.5 py-0.5 rounded">YYYY-MM-DD_NIS_TIPE_KEGIATAN</code>. Jika kunci sudah ada, transaksi kedua ditolak secara deterministik.</div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-900 text-sm">3. Aturan Pencatatan Manual Darurat &amp; Riwayat Presensi</div>
              <div>• <strong>BR-MAN-001:</strong> Jika kartu siswa rusak/tertinggal, petugas memilih nama siswa dari daftar lokal.</div>
              <div>• <strong>BR-MAN-002 (Alasan Wajib):</strong> Wajib menyertakan teks alasan (misal: &ldquo;Kartu patah&rdquo;). Jika kosong, tombol simpan tidak aktif.</div>
              <div>• <strong>BR-MAN-003:</strong> Ditandai dengan flag <code className="font-mono bg-slate-100 px-1">source = &quot;MANUAL&quot;</code> untuk keperluan audit.</div>
              <div>• <strong>BR-HIST-001:</strong> Riwayat presensi siswa dapat dicari secara individual dan difilter berdasarkan rentang tanggal serta jenis kegiatan.</div>
            </div>
          </div>
        </div>
      )}

      {/* Document 3: SADS */}
      {activeDoc === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              DOKUMEN 3: SYSTEM ARCHITECTURE & DATA SPECIFICATION (SADS-MAB-AND-001)
            </h3>
            <button
              onClick={() => copyToClipboard(ANDROID_ROOM_ENTITIES, 'entities')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              {copiedKey === 'entities' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Salin Room Entities &amp; DAO
            </button>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed">
            <pre>{ANDROID_ROOM_ENTITIES}</pre>
          </div>
        </div>
      )}

      {/* Document 4: Code.gs (Apps Script) */}
      {activeDoc === 4 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                DOKUMEN 4: BACKEND GOOGLE APPS SCRIPT (Code.gs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin seluruh kode di bawah ke Google Sheets madrasah (<strong>Extensions &gt; Apps Script</strong>).
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(GAS_CODE_GS, 'codegs')}
              className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              {copiedKey === 'codegs' ? (
                <>
                  <Check className="w-4 h-4" />
                  Code.gs Berhasil Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  1-Click Salin Seluruh Code.gs
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
            <pre className="text-slate-200">{GAS_CODE_GS}</pre>
          </div>
        </div>
      )}

      {/* Document 5: Android Studio Implementation Directive */}
      {activeDoc === 5 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900">
            DOKUMEN 5: ANDROID STUDIO IMPLEMENTATION DIRECTIVE
          </h3>

          {/* build.gradle.kts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono">
                1. app/build.gradle.kts (Room, WorkManager 07:15, CameraX)
              </span>
              <button
                onClick={() => copyToClipboard(ANDROID_GRADLE, 'gradle')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'gradle' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                Salin Gradle
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-xs">
              <pre>{ANDROID_GRADLE}</pre>
            </div>
          </div>

          {/* AndroidManifest.xml */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono">
                2. AndroidManifest.xml (Kamera, Push Notif, &amp; WhatsApp Intent)
              </span>
              <button
                onClick={() => copyToClipboard(ANDROID_MANIFEST, 'manifest')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'manifest' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                Salin Manifest
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-xs">
              <pre>{ANDROID_MANIFEST}</pre>
            </div>
          </div>

          {/* WorkManager Worker Implementation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                3. AttendanceReminderWorker.kt (WorkManager 07:15 Background Job)
              </span>
              <button
                onClick={() => copyToClipboard(ANDROID_WORKER_CODE, 'worker')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'worker' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                Salin Worker
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-xs">
              <pre>{ANDROID_WORKER_CODE}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
