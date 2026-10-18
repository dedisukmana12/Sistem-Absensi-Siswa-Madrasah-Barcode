import { StudentEntity, Tingkat } from '../types/attendance';

// Realistic generator of 300 students for MA Bojongjati with guardian links
const FIRST_NAMES = [
  'Abdullah', 'Ahmad', 'Ali', 'Aisyah', 'Anisa', 'Alif', 'Arya', 'Arif', 'Azizah', 'Bagas',
  'Bilal', 'Bima', 'Chairul', 'Danial', 'Dewi', 'Dian', 'Fadli', 'Farhan', 'Fatima', 'Fikri',
  'Galih', 'Hafizh', 'Hamzah', 'Hana', 'Hasan', 'Husain', 'Ibrahim', 'Ilham', 'Indah', 'Irfan',
  'Jafar', 'Kamila', 'Khalid', 'Laila', 'Luqman', 'Mahmud', 'Malik', 'Maryam', 'Maulana', 'Miftah',
  'Muhammad', 'Mustafa', 'Nabil', 'Nadia', 'Najwa', 'Nurul', 'Putri', 'Rafi', 'Rahman', 'Raihan',
  'Rani', 'Rasyid', 'Ridwan', 'Rifqi', 'Rizky', 'Salma', 'Salman', 'Siti', 'Syifa', 'Taufiq',
  'Umar', 'Usman', 'Wahyu', 'Wulan', 'Yafi', 'Yahya', 'Yusuf', 'Zahra', 'Zaid', 'Zulfa'
];

const LAST_NAMES = [
  'Azzam', 'Fauzi', 'Hakim', 'Pratama', 'Hidayat', 'Saputra', 'Ramadhan', 'Kurniawan', 'Setiawan', 'Wijaya',
  'Mahendra', 'Suryana', 'Nugroho', 'Santoso', 'Utomo', 'Siregar', 'Lubis', 'Kusuma', 'Gunawan', 'Permana',
  'Wibowo', 'Pranata', 'Rachman', 'Subagyo', 'Firmansyah', 'Budiman', 'Iskandar', 'Suharto', 'Alamsyah', 'Hasanah',
  'Putra', 'Anggraini', 'Safitri', 'Nurhaliza', 'Wahyuni', 'Lestari', 'Handayani', 'Khadijah', 'Kusumawati', 'Purnama'
];

const GUARDIAN_HONORIFICS = ['Bpk.', 'Ibu'];
const GUARDIAN_ROLES: Array<'Ayah' | 'Ibu' | 'Wali'> = ['Ayah', 'Ibu', 'Wali'];

export function generateInitialStudents(): StudentEntity[] {
  const students: StudentEntity[] = [];

  const classConfigs: Array<{ tingkat: Tingkat; kelas: string; count: number; prefix: string; startId: number }> = [
    { tingkat: 'X', kelas: 'X-A', count: 50, prefix: '2401', startId: 1 },
    { tingkat: 'X', kelas: 'X-B', count: 50, prefix: '2401', startId: 51 },
    { tingkat: 'XI', kelas: 'XI-IPA', count: 50, prefix: '2301', startId: 101 },
    { tingkat: 'XI', kelas: 'XI-IPS', count: 50, prefix: '2301', startId: 151 },
    { tingkat: 'XII', kelas: 'XII-IPA', count: 50, prefix: '2201', startId: 201 },
    { tingkat: 'XII', kelas: 'XII-IPS', count: 50, prefix: '2201', startId: 251 }
  ];

  let idCounter = 1;

  classConfigs.forEach(cfg => {
    for (let i = 0; i < cfg.count; i++) {
      const seq = cfg.startId + i;
      const fn = FIRST_NAMES[(seq * 7 + 13) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(seq * 11 + 3) % LAST_NAMES.length];
      const nis = `${cfg.prefix}${String(seq % 1000).padStart(3, '0')}`;
      const studentId = `STD-${String(idCounter).padStart(3, '0')}`;

      // Guardian info generator
      const guardianHonorific = GUARDIAN_HONORIFICS[seq % 2];
      const guardianRole = GUARDIAN_ROLES[seq % 3];
      const guardianName = `${guardianHonorific} ${LAST_NAMES[(seq * 13 + 5) % LAST_NAMES.length]}`;
      // Indonesian phone format starting with 628
      const phoneDigits = String(10000000 + (seq * 87654) % 90000000);
      const kontakWali = `62812${phoneDigits}`;

      students.push({
        studentId,
        nis,
        nama: `${fn} ${ln}`,
        tingkat: cfg.tingkat,
        kelas: cfg.kelas,
        status: 'ACTIVE',
        namaWali: guardianName,
        kontakWali,
        hubunganWali: guardianRole
      });

      idCounter++;
    }
  });

  return students;
}
