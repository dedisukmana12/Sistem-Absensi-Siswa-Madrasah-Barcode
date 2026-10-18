export type Tingkat = 'X' | 'XI' | 'XII';

export type TipeKegiatan = 'KEDATANGAN' | 'KEPULANGAN' | 'ZUHUR';

export type StatusKehadiran = 'TEPAT_WAKTU' | 'TERLAMBAT';

export type SourceType = 'SCAN' | 'MANUAL';

export interface StudentEntity {
  studentId: string; // e.g. "STD-001"
  nis: string;       // e.g. "2401001"
  nama: string;
  tingkat: Tingkat;  // "X", "XI", "XII"
  kelas: string;    // "X-A", "X-B", "XI-IPA", etc.
  status: 'ACTIVE' | 'INACTIVE';
  // Guardian linkage
  namaWali: string;
  kontakWali: string; // e.g. "081234567890" / "628..."
  hubunganWali: 'Ayah' | 'Ibu' | 'Wali';
}

export interface AttendanceRecordEntity {
  eventId: string;
  tanggal: string;       // "YYYY-MM-DD"
  waktu: string;         // "HH:mm:ss"
  nis: string;
  nama: string;
  tingkat: Tingkat;
  kelas: string;
  tipeKegiatan: TipeKegiatan;
  statusKehadiran: StatusKehadiran;
  petugas: string;
  source: SourceType;
  catatanManual?: string | null;
  idempotencyKey: string; // "YYYY-MM-DD_NIS_TIPE"
  isSynced: boolean;
  createdAt?: number;
}

export interface GuardianNotificationEntity {
  notificationId: string;
  tanggal: string;
  waktu: string;
  studentNis: string;
  studentNama: string;
  kelas: string;
  namaWali: string;
  kontakWali: string;
  pesan: string;
  status: 'SENT' | 'PENDING' | 'FAILED';
  dispatchMethod: 'PUSH_NOTIFICATION' | 'WHATSAPP_LINK' | 'AUTO_WORKER';
  createdAt: number;
}

export interface AppConfig {
  jamMasuk: string;              // "07:00"
  toleransiMenit: number;        // 5
  jamPeringatanAbsen: string;    // "07:15" (Automated Notification threshold)
  jamCutoffPagi: string;         // "08:00"
  webAppUrl: string;             // Google Apps Script Web App URL
  petugasDefault: string;        // "Petugas Piket"
  autoNotificationEnabled: boolean; // Background job flag
}

export interface WhatsAppReportSummary {
  tingkat: Tingkat;
  tanggal: string;
  pukul: string;
  totalSiswa: number;
  hadirTepatWaktu: number;
  hadirTerlambat: number;
  belumTercatat: number;
  daftarTerlambat: Array<{ nama: string; kelas: string; waktu: string }>;
  daftarBelumHadir: Array<{ nama: string; kelas: string }>;
  messageText: string;
}

export interface SyncApiResponse {
  success: boolean;
  message?: string;
  count?: number;
  inserted?: number;
  duplicates?: number;
  error?: string;
  results?: Array<{ id: string; status: 'SUCCESS' | 'DUPLICATE' | 'ERROR' }>;
  data?: StudentEntity[];
}
