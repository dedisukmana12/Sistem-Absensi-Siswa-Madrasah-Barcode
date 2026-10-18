import { StatusKehadiran, TipeKegiatan } from '../types/attendance';

/**
 * Returns current date string in YYYY-MM-DD (WIB / Local)
 */
export function getCurrentDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time string in HH:mm:ss
 */
export function getCurrentTimeString(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Evaluates attendance status based on entry time and configured parameters
 * BR-TIME-001 (Jam Masuk): 07:00
 * BR-TIME-002 (Toleransi): 07:05:59 is TEPAT_WAKTU
 * BR-TIME-003 (Terlambat): >= 07:06:00 is TERLAMBAT
 * Only applies to 'KEDATANGAN'. For 'KEPULANGAN' and 'ZUHUR', it defaults to 'TEPAT_WAKTU'.
 */
export function evaluateAttendanceStatus(
  timeStr: string,
  jamMasuk = '07:00',
  toleransiMenit = 5,
  tipeKegiatan: TipeKegiatan = 'KEDATANGAN'
): StatusKehadiran {
  if (tipeKegiatan !== 'KEDATANGAN') {
    return 'TEPAT_WAKTU';
  }

  const [inHour, inMin] = jamMasuk.split(':').map(Number);
  const [curHour, curMin, curSec = 0] = timeStr.split(':').map(Number);

  const curTotalSeconds = curHour * 3600 + curMin * 60 + curSec;
  // Threshold is jamMasuk + toleransiMenit + 59 seconds (e.g. 07:05:59)
  const thresholdSeconds = (inHour * 3600) + (inMin * 60) + (toleransiMenit * 60) + 59;

  return curTotalSeconds <= thresholdSeconds ? 'TEPAT_WAKTU' : 'TERLAMBAT';
}

/**
 * Generates canonical Idempotency Key
 * BR-SCAN-003: YYYY-MM-DD_NIS_TIPE_KEGIATAN
 */
export function generateIdempotencyKey(
  tanggal: string,
  nis: string,
  tipeKegiatan: TipeKegiatan
): string {
  return `${tanggal}_${nis.trim()}_${tipeKegiatan}`;
}

/**
 * Format date to Indonesian human friendly string (e.g. "Kamis, 20 Maret 2025")
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
