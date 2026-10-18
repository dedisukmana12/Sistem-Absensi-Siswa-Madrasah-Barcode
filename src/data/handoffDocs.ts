export const GAS_CODE_GS = `/**
 * SISTEM ABSENSI DIGITAL MA BOJONGJATI
 * Dokumen Kanonik: GAS-MAB-ATT-001 v1.0.0
 */

const SHEET_STUDENTS = "Data_Siswa";
const SHEET_ATTENDANCE = "Absensi_Harian";
const SHEET_CONFIG = "Konfigurasi";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📋 Menu Absensi MA Bojongjati")
    .addItem("🚀 Inisialisasi Struktur Sheet", "setupSpreadsheet")
    .addItem("🔍 Validasi NIS & Buat QR Kartu", "validateAndGenerateCardQR")
    .addItem("🧹 Bersihkan Duplikasi Data", "removeDuplicateAttendance")
    .addToUi();
}

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let studentSheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!studentSheet) {
    studentSheet = ss.insertSheet(SHEET_STUDENTS);
    studentSheet.appendRow(["student_id", "nis", "nama", "tingkat", "kelas", "status", "nama_wali", "kontak_wali", "hubungan_wali", "qr_code_image"]);
    studentSheet.getRange("A1:J1").setFontWeight("bold").setBackground("#D9EAD3");
  }

  let attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!attSheet) {
    attSheet = ss.insertSheet(SHEET_ATTENDANCE);
    attSheet.appendRow([
      "event_id", "tanggal", "waktu", "nis", "nama", "tingkat", 
      "kelas", "tipe_kegiatan", "status_kehadiran", "petugas", "source", "idempotency_key"
    ]);
    attSheet.getRange("A1:L1").setFontWeight("bold").setBackground("#CFE2F3");
  }

  let cfgSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!cfgSheet) {
    cfgSheet = ss.insertSheet(SHEET_CONFIG);
    cfgSheet.appendRow(["parameter", "nilai"]);
    cfgSheet.appendRow(["jam_masuk", "07:00"]);
    cfgSheet.appendRow(["toleransi_menit", "5"]);
    cfgSheet.appendRow(["jam_peringatan_absen", "07:15"]);
    cfgSheet.appendRow(["jam_cutoff_pagi", "08:00"]);
    cfgSheet.getRange("A1:B1").setFontWeight("bold");
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "ping") {
      return jsonResponse({ success: true, message: "Server Absensi MA Bojongjati Online" });
    }

    if (action === "get_students") {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      if (!sheet) return jsonResponse({ success: false, error: "Sheet Data_Siswa belum dibuat" });
      
      const data = sheet.getDataRange().getValues();
      const students = [];

      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          students.push({
            student_id: String(data[i][0]),
            nis: String(data[i][1]),
            nama: String(data[i][2]),
            tingkat: String(data[i][3]),
            kelas: String(data[i][4]),
            status: String(data[i][5]),
            nama_wali: String(data[i][6] || ""),
            kontak_wali: String(data[i][7] || ""),
            hubungan_wali: String(data[i][8] || "Wali")
          });
        }
      }
      return jsonResponse({ success: true, count: students.length, data: students });
    }

    return jsonResponse({ success: false, error: "Action tidak dikenal" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const postData = JSON.parse(e.postData.contents);
    const events = Array.isArray(postData.events) ? postData.events : [postData];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);

    const existingData = attSheet.getDataRange().getValues();
    const existingKeys = new Set();
    for (let i = 1; i < existingData.length; i++) {
      const rowKey = existingData[i][11]; // Kolom L: idempotency_key
      if (rowKey) existingKeys.add(String(rowKey));
    }

    let insertedCount = 0;
    let duplicateCount = 0;
    const results = [];
    const now = new Date();
    const defaultDate = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");

    events.forEach(item => {
      const key = item.idempotency_key || (defaultDate + "_" + item.nis + "_" + item.tipe_kegiatan);

      if (existingKeys.has(key)) {
        duplicateCount++;
        results.push({ id: item.event_id, status: "DUPLICATE" });
        return;
      }

      attSheet.appendRow([
        item.event_id || Utilities.getUuid(),
        item.tanggal || defaultDate,
        item.waktu || Utilities.formatDate(now, "Asia/Jakarta", "HH:mm:ss"),
        item.nis,
        item.nama,
        item.tingkat,
        item.kelas,
        item.tipe_kegiatan,
        item.status_kehadiran || "TEPAT_WAKTU",
        item.petugas || "Petugas",
        item.source || "SCAN",
        key
      ]);

      existingKeys.add(key);
      insertedCount++;
      results.push({ id: item.event_id, status: "SUCCESS" });
    });

    return jsonResponse({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      results: results
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function validateAndGenerateCardQR() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const nis = String(data[i][1]).trim();
    if (nis) {
      const formula = '=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + nis + '")';
      sheet.getRange(i + 1, 10).setFormula(formula);
    }
  }
  SpreadsheetApp.getUi().alert("QR Code untuk seluruh kartu siswa berhasil digenerate!");
}

function removeDuplicateAttendance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  const data = sheet.getDataRange().getValues();
  const seen = new Set();
  const toDelete = [];

  for (let i = 1; i < data.length; i++) {
    const key = data[i][11];
    if (key) {
      if (seen.has(key)) toDelete.push(i + 1);
      else seen.add(key);
    }
  }
  for (let i = toDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(toDelete[i]);
  }
  SpreadsheetApp.getUi().alert("Selesai! Dihapus " + toDelete.length + " duplikasi.");
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const ANDROID_GRADLE = `// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    id("com.google.devtools.ksp") version "1.9.22-1.0.17"
}

android {
    namespace = "id.sch.mabojongjati.attendance"
    compileSdk = 34

    defaultConfig {
        applicationId = "id.sch.mabojongjati.attendance"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.02.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Room Database (SQLite Engine)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // AndroidX WorkManager (Tugas Terjadwal 07:15 Pagi)
    val workVersion = "2.9.0"
    implementation("androidx.work:work-runtime-ktx:$workVersion")

    // CameraX & ML Kit Barcode Scanning
    val cameraxVersion = "1.3.2"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")

    // Networking (Retrofit + OkHttp)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-scalars:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}`;

export const ANDROID_MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Izin Kamera untuk Scanner Barcode/QR -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />

    <!-- Izin Notifikasi Push (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Izin Jaringan untuk Sync Google Sheets -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Package Visibility untuk WhatsApp Intent Resmi -->
    <queries>
        <package android:name="com.whatsapp" />
        <package android:name="com.whatsapp.w4b" />
    </queries>

    <application
        android:name=".AttendanceApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Absensi MAB"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

export const ANDROID_ROOM_ENTITIES = `package id.sch.mabojongjati.attendance.data.local.entities

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "students")
data class StudentEntity(
    @PrimaryKey val studentId: String, // "STD-001"
    val nis: String,                   // "2401001"
    val nama: String,
    val tingkat: String,               // "X", "XI", "XII"
    val kelas: String,                 // "X-A", "XI-IPA", dll.
    val status: String,                // "ACTIVE" / "INACTIVE"
    val namaWali: String,              // "Bpk. Bambang"
    val kontakWali: String,            // "628123456789"
    val hubunganWali: String           // "Ayah", "Ibu", "Wali"
)

@Entity(
    tableName = "attendance_records",
    indices = [Index(value = ["idempotencyKey"], unique = true)]
)
data class AttendanceRecordEntity(
    @PrimaryKey val eventId: String,   // UUID / Timestamp
    val tanggal: String,               // "YYYY-MM-DD"
    val waktu: String,                 // "HH:mm:ss"
    val nis: String,
    val nama: String,
    val tingkat: String,
    val kelas: String,
    val tipeKegiatan: String,          // "KEDATANGAN", "KEPULANGAN", "ZUHUR"
    val statusKehadiran: String,       // "TEPAT_WAKTU", "TERLAMBAT"
    val petugas: String,
    val source: String,                // "SCAN" atau "MANUAL"
    val catatanManual: String? = null,
    val idempotencyKey: String,        // "YYYY-MM-DD_NIS_TIPE"
    val isSynced: Boolean = false
)

@Dao
interface AttendanceDao {
    // Riwayat Kronologis dengan Rentang Tanggal
    @Query("""
        SELECT * FROM attendance_records 
        WHERE (:nis IS NULL OR nis = :nis) 
          AND tanggal BETWEEN :startDate AND :endDate 
        ORDER BY tanggal DESC, waktu DESC
    """)
    fun getAttendanceHistory(nis: String?, startDate: String, endDate: String): Flow<List<AttendanceRecordEntity>>
}`;

export const ANDROID_WORKER_CODE = `package id.sch.mabojongjati.attendance.worker

import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import id.sch.mabojongjati.attendance.R
import id.sch.mabojongjati.attendance.data.repository.AttendanceRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Scheduled Job yang berjalan pada pukul 07:15 WIB.
 * Memeriksa siswa yang belum tercatat 'KEDATANGAN' dan mengirimkan Push Notification ke perangkat.
 */
class AttendanceReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val repository: AttendanceRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val unrecordedStudents = repository.getUnrecordedStudentsToday(today)

        if (unrecordedStudents.isNotEmpty()) {
            val count = unrecordedStudents.size
            val notification = NotificationCompat.Builder(applicationContext, "MAB_ATTENDANCE_CHANNEL")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("MA Bojongjati: Peringatan Absensi 07:15 WIB")
                .setContentText(count.toString() + " siswa belum melakukan presensi kedatangan.")
                .setStyle(NotificationCompat.BigTextStyle().bigText(
                    count.toString() + " siswa belum tercatat presensi kedatangan hari ini. Ketuk untuk mengirim pengingat ke wali murid."
                ))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(applicationContext).notify(1001, notification)
        }

        return Result.success()
    }
}`;
