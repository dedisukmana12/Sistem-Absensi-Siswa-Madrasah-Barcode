import { AppConfig, AttendanceRecordEntity, GuardianNotificationEntity, StudentEntity, SyncApiResponse, TipeKegiatan } from '../types/attendance';
import { generateInitialStudents } from '../data/studentsSeed';
import { evaluateAttendanceStatus, formatIndonesianDate, getCurrentDateString, getCurrentTimeString, generateIdempotencyKey } from './time';

const KEY_STUDENTS = 'mab_students_v2';
const KEY_RECORDS = 'mab_attendance_records_v1';
const KEY_CONFIG = 'mab_config_v2';
const KEY_NOTIFICATIONS = 'mab_guardian_notifications_v1';

export const DEFAULT_CONFIG: AppConfig = {
  jamMasuk: '07:00',
  toleransiMenit: 5,
  jamPeringatanAbsen: '07:15',
  jamCutoffPagi: '08:00',
  webAppUrl: '',
  petugasDefault: 'Petugas Piket MA Bojongjati',
  autoNotificationEnabled: true
};

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY_CONFIG);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(cfg: AppConfig): void {
  localStorage.setItem(KEY_CONFIG, JSON.stringify(cfg));
}

export function loadStudents(): StudentEntity[] {
  try {
    const raw = localStorage.getItem(KEY_STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].namaWali) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const initial = generateInitialStudents();
  saveStudents(initial);
  return initial;
}

export function saveStudents(students: StudentEntity[]): void {
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
}

export function loadRecords(): AttendanceRecordEntity[] {
  try {
    const raw = localStorage.getItem(KEY_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveRecords(records: AttendanceRecordEntity[]): void {
  localStorage.setItem(KEY_RECORDS, JSON.stringify(records));
}

export function loadNotifications(): GuardianNotificationEntity[] {
  try {
    const raw = localStorage.getItem(KEY_NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveNotifications(notifications: GuardianNotificationEntity[]): void {
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(notifications));
}

export interface AddRecordResult {
  success: boolean;
  code: 'OK' | 'DUPLICATE' | 'STUDENT_NOT_FOUND' | 'INVALID_DATA';
  message: string;
  record?: AttendanceRecordEntity;
  existingRecord?: AttendanceRecordEntity;
}

/**
 * BR-SCAN-002 & BR-SCAN-003: Deterministic Idempotency Check
 */
export function recordAttendance(params: {
  nis: string;
  tipeKegiatan: TipeKegiatan;
  source: 'SCAN' | 'MANUAL';
  petugas: string;
  catatanManual?: string | null;
  customTime?: string;
  customDate?: string;
}): AddRecordResult {
  const students = loadStudents();
  const student = students.find(s => s.nis.trim() === params.nis.trim() && s.status === 'ACTIVE');

  if (!student) {
    return {
      success: false,
      code: 'STUDENT_NOT_FOUND',
      message: `NIS "${params.nis}" tidak terdaftar atau non-aktif dalam data MA Bojongjati.`
    };
  }

  const tanggal = params.customDate || getCurrentDateString();
  const waktu = params.customTime || getCurrentTimeString();
  const cfg = loadConfig();

  const idempotencyKey = generateIdempotencyKey(tanggal, student.nis, params.tipeKegiatan);

  const existingRecords = loadRecords();
  const foundDuplicate = existingRecords.find(r => r.idempotencyKey === idempotencyKey);

  if (foundDuplicate) {
    return {
      success: false,
      code: 'DUPLICATE',
      message: `Siswa "${student.nama}" sudah tercatat ${params.tipeKegiatan} hari ini (${foundDuplicate.waktu.slice(0, 5)} WIB).`,
      existingRecord: foundDuplicate
    };
  }

  const statusKehadiran = evaluateAttendanceStatus(
    waktu,
    cfg.jamMasuk,
    cfg.toleransiMenit,
    params.tipeKegiatan
  );

  const newRecord: AttendanceRecordEntity = {
    eventId: Date.now().toString() + Math.random().toString().slice(2, 6),
    tanggal,
    waktu,
    nis: student.nis,
    nama: student.nama,
    tingkat: student.tingkat,
    kelas: student.kelas,
    tipeKegiatan: params.tipeKegiatan,
    statusKehadiran,
    petugas: params.petugas || cfg.petugasDefault,
    source: params.source,
    catatanManual: params.catatanManual || null,
    idempotencyKey,
    isSynced: false,
    createdAt: Date.now()
  };

  const updatedRecords = [newRecord, ...existingRecords];
  saveRecords(updatedRecords);

  return {
    success: true,
    code: 'OK',
    message: `Absensi ${student.nama} berhasil dicatat (${statusKehadiran === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}).`,
    record: newRecord
  };
}

/**
 * Automated Notification Engine:
 * Evaluates students who have NOT recorded 'KEDATANGAN' by 07:15 AM
 * Dispatches push notifications to browser & creates guardian notification records.
 */
export function checkAndDispatchAutomatedNotifications(
  customTime?: string,
  targetDate = getCurrentDateString()
): {
  dispatchedCount: number;
  unrecordedStudents: StudentEntity[];
  skippedAlreadyNotified: number;
  newNotifications: GuardianNotificationEntity[];
} {
  const students = loadStudents().filter(s => s.status === 'ACTIVE');
  const records = loadRecords();
  const cfg = loadConfig();
  const notifications = loadNotifications();

  // Find all attendance records for KEDATANGAN on targetDate
  const arrivedNisSet = new Set(
    records
      .filter(r => r.tanggal === targetDate && r.tipeKegiatan === 'KEDATANGAN')
      .map(r => r.nis)
  );

  // Unrecorded students
  const unrecordedStudents = students.filter(st => !arrivedNisSet.has(st.nis));

  // Check which students were already notified today
  const alreadyNotifiedNis = new Set(
    notifications
      .filter(n => n.tanggal === targetDate)
      .map(n => n.studentNis)
  );

  const newNotifications: GuardianNotificationEntity[] = [];
  const timeNow = customTime || getCurrentTimeString();

  unrecordedStudents.forEach(st => {
    if (!alreadyNotifiedNis.has(st.nis)) {
      const pesan = `Assalamu'alaikum Wr. Wb. ${st.namaWali}, ananda *${st.nama}* (Kelas ${st.kelas}, NIS ${st.nis}) hingga pukul ${cfg.jamPeringatanAbsen} WIB belum tercatat melakukan presensi kedatangan di MA Bojongjati hari ini (${formatIndonesianDate(targetDate)}). Mohon konfirmasi kehadiran atau kabar ananda kepada pihak madrasah. Terima kasih.`;

      const notifItem: GuardianNotificationEntity = {
        notificationId: `NOTIF-${Date.now()}-${st.nis}`,
        tanggal: targetDate,
        waktu: timeNow,
        studentNis: st.nis,
        studentNama: st.nama,
        kelas: st.kelas,
        namaWali: st.namaWali,
        kontakWali: st.kontakWali,
        pesan,
        status: 'SENT',
        dispatchMethod: 'AUTO_WORKER',
        createdAt: Date.now()
      };

      newNotifications.push(notifItem);
    }
  });

  if (newNotifications.length > 0) {
    const updatedNotifs = [...newNotifications, ...notifications];
    saveNotifications(updatedNotifs);

    // Browser Notification API if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`MA Bojongjati: Peringatan Absensi Pukul ${cfg.jamPeringatanAbsen} WIB`, {
          body: `${newNotifications.length} siswa belum tercatat kedatangan. Notifikasi otomatis telah disiapkan untuk wali murid.`,
          icon: '/favicon.ico'
        });
      } catch {
        // notification fallback
      }
    }
  }

  return {
    dispatchedCount: newNotifications.length,
    unrecordedStudents,
    skippedAlreadyNotified: unrecordedStudents.length - newNotifications.length,
    newNotifications
  };
}

/**
 * Seed realistic multi-day attendance records for Attendance History testing
 */
export function seedSampleAttendanceData(): AttendanceRecordEntity[] {
  const students = loadStudents();
  const cfg = loadConfig();
  const records: AttendanceRecordEntity[] = [];

  const today = new Date();
  
  // Seed past 5 days (excluding Sundays)
  const daysToSeed: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0) { // skip sunday
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      daysToSeed.push(`${year}-${month}-${day}`);
    }
  }

  daysToSeed.forEach((tanggal, dayIndex) => {
    students.forEach((st, idx) => {
      // Deterministic attendance per student
      const isPresent = (idx + dayIndex) % 4 !== 0;
      if (!isPresent) return;

      const isLate = (idx + dayIndex) % 9 === 0;
      const hour = isLate ? 7 : 6;
      const min = isLate ? (7 + (idx % 18)) : (25 + (idx % 35));
      const sec = 10 + (idx % 45);
      const waktuKedatangan = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      const statusKedatangan = isLate ? 'TERLAMBAT' : 'TEPAT_WAKTU';

      // Kedatangan
      records.push({
        eventId: `${Date.now() - (dayIndex * 86400000) - (idx * 30000)}`,
        tanggal,
        waktu: waktuKedatangan,
        nis: st.nis,
        nama: st.nama,
        tingkat: st.tingkat,
        kelas: st.kelas,
        tipeKegiatan: 'KEDATANGAN',
        statusKehadiran: statusKedatangan,
        petugas: 'Petugas Gerbang MAB',
        source: (idx % 23 === 0) ? 'MANUAL' : 'SCAN',
        catatanManual: (idx % 23 === 0) ? 'Kartu tertinggal di asrama' : null,
        idempotencyKey: generateIdempotencyKey(tanggal, st.nis, 'KEDATANGAN'),
        isSynced: dayIndex > 0 // older days are synced
      });

      // Zuhur (for ~80% of students)
      if ((idx + dayIndex) % 5 !== 0) {
        records.push({
          eventId: `${Date.now() - (dayIndex * 86400000) - (idx * 30000) + 18000000}`,
          tanggal,
          waktu: `12:${String(10 + (idx % 25)).padStart(2, '0')}:00`,
          nis: st.nis,
          nama: st.nama,
          tingkat: st.tingkat,
          kelas: st.kelas,
          tipeKegiatan: 'ZUHUR',
          statusKehadiran: 'TEPAT_WAKTU',
          petugas: 'Pembina Rohis',
          source: 'SCAN',
          idempotencyKey: generateIdempotencyKey(tanggal, st.nis, 'ZUHUR'),
          isSynced: dayIndex > 0
        });
      }

      // Kepulangan (for past days)
      if (dayIndex > 0) {
        records.push({
          eventId: `${Date.now() - (dayIndex * 86400000) - (idx * 30000) + 28800000}`,
          tanggal,
          waktu: `15:${String(30 + (idx % 25)).padStart(2, '0')}:00`,
          nis: st.nis,
          nama: st.nama,
          tingkat: st.tingkat,
          kelas: st.kelas,
          tipeKegiatan: 'KEPULANGAN',
          statusKehadiran: 'TEPAT_WAKTU',
          petugas: 'Petugas Gerbang MAB',
          source: 'SCAN',
          idempotencyKey: generateIdempotencyKey(tanggal, st.nis, 'KEPULANGAN'),
          isSynced: true
        });
      }
    });
  });

  saveRecords(records);
  return records;
}

/**
 * Sync un-synced records to Google Apps Script
 */
export async function syncPendingRecordsToGAS(webAppUrl: string): Promise<SyncApiResponse> {
  const allRecords = loadRecords();
  const pending = allRecords.filter(r => !r.isSynced);

  if (pending.length === 0) {
    return {
      success: true,
      inserted: 0,
      duplicates: 0,
      message: 'Semua data absensi sudah tersinkronisasi ke Google Sheets.'
    };
  }

  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    const updated = allRecords.map(r => ({ ...r, isSynced: true }));
    saveRecords(updated);
    return {
      success: true,
      inserted: pending.length,
      duplicates: 0,
      message: `[Simulasi Offline] ${pending.length} data absensi ditandai tersinkronisasi.`
    };
  }

  const payload = {
    events: pending.map(item => ({
      event_id: item.eventId,
      tanggal: item.tanggal,
      waktu: item.waktu,
      nis: item.nis,
      nama: item.nama,
      tingkat: item.tingkat,
      kelas: item.kelas,
      tipe_kegiatan: item.tipeKegiatan,
      status_kehadiran: item.statusKehadiran,
      petugas: item.petugas,
      source: item.source,
      idempotency_key: item.idempotencyKey
    }))
  };

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const data: SyncApiResponse = await res.json();
    if (data.success) {
      const successIds = new Set(
        (data.results || []).filter(r => r.status === 'SUCCESS' || r.status === 'DUPLICATE').map(r => r.id)
      );
      const updated = allRecords.map(r => {
        if (successIds.has(r.eventId) || pending.some(p => p.eventId === r.eventId)) {
          return { ...r, isSynced: true };
        }
        return r;
      });
      saveRecords(updated);
    }
    return data;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Gagal menghubungkan ke Google Apps Script: ${errMessage}`
    };
  }
}

/**
 * Fetch students from Google Apps Script
 */
export async function fetchStudentsFromGAS(webAppUrl: string): Promise<SyncApiResponse> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return {
      success: false,
      error: 'Masukkan URL Google Apps Script Web App yang valid di tab Konfigurasi.'
    };
  }

  try {
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'get_students');

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      saveStudents(json.data);
    }
    return json;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Gagal mengunduh siswa: ${errMessage}`
    };
  }
}

/**
 * Test connectivity to GAS Web App (ping)
 */
export async function pingGAS(webAppUrl: string): Promise<SyncApiResponse> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return {
      success: false,
      error: 'URL Web App belum diisi atau tidak valid.'
    };
  }

  try {
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'ping');

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    return await res.json();
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Koneksi gagal: ${errMessage}`
    };
  }
}
