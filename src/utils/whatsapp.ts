import { AttendanceRecordEntity, StudentEntity, Tingkat, WhatsAppReportSummary } from '../types/attendance';

export function buildWhatsAppReport(
  tingkat: Tingkat,
  students: StudentEntity[],
  records: AttendanceRecordEntity[],
  tanggal: string,
  cutoffTime = '08.00 WIB'
): WhatsAppReportSummary {
  // Filter active students of this grade
  const targetStudents = students.filter(s => s.tingkat === tingkat && s.status === 'ACTIVE');
  const totalSiswa = targetStudents.length;

  // Filter attendance records of today for this grade for 'KEDATANGAN'
  const todayRecords = records.filter(
    r => r.tanggal === tanggal && r.tingkat === tingkat && r.tipeKegiatan === 'KEDATANGAN'
  );

  const recordedNisSet = new Map<string, AttendanceRecordEntity>();
  todayRecords.forEach(r => {
    recordedNisSet.set(r.nis, r);
  });

  const tepatWaktuList: AttendanceRecordEntity[] = [];
  const terlambatList: AttendanceRecordEntity[] = [];
  const belumHadirList: StudentEntity[] = [];

  targetStudents.forEach(st => {
    const rec = recordedNisSet.get(st.nis);
    if (!rec) {
      belumHadirList.push(st);
    } else if (rec.statusKehadiran === 'TERLAMBAT') {
      terlambatList.push(rec);
    } else {
      tepatWaktuList.push(rec);
    }
  });

  // Sort lists by class and name
  terlambatList.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  belumHadirList.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));

  // Build the standardized template
  const terlambatSection = terlambatList.length > 0
    ? terlambatList.map((item, idx) => `${idx + 1}. ${item.nama} (${item.kelas}) - ${item.waktu.slice(0, 5)} WIB`).join('\n')
    : '(Nihil)';

  const belumHadirSection = belumHadirList.length > 0
    ? belumHadirList.map((item, idx) => `${idx + 1}. ${item.nama} (${item.kelas})`).join('\n')
    : '(Semua telah hadir)';

  const messageText = 
`*LAPORAN KEHADIRAN SISWA KELAS ${tingkat}*
*MA BOJONGJATI*
Tanggal: ${tanggal}
Pukul: ${cutoffTime}
--------------------------------------
Total Siswa: ${totalSiswa}
Hadir Tepat Waktu: ${tepatWaktuList.length}
Hadir Terlambat: ${terlambatList.length}
Belum Tercatat: ${belumHadirList.length}
--------------------------------------

*Daftar Terlambat:*
${terlambatSection}

*Belum Ada Catatan Kedatangan:*
${belumHadirSection}

_Pesan otomatis Sistem Absensi Digital MA Bojongjati_`;

  return {
    tingkat,
    tanggal,
    pukul: cutoffTime,
    totalSiswa,
    hadirTepatWaktu: tepatWaktuList.length,
    hadirTerlambat: terlambatList.length,
    belumTercatat: belumHadirList.length,
    daftarTerlambat: terlambatList.map(item => ({
      nama: item.nama,
      kelas: item.kelas,
      waktu: item.waktu.slice(0, 5)
    })),
    daftarBelumHadir: belumHadirList.map(item => ({
      nama: item.nama,
      kelas: item.kelas
    })),
    messageText
  };
}

export function shareToWhatsApp(messageText: string) {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
