# 🍎 Panduan Build & Rilis iOS (.ipa) — Evoscan

**Target OS:** `iOS 17.2+` (Kompatibel dengan iOS 17 dan iOS 18)  
**Bundle Identifier:** `com.evofranklin.evoscan`  
**Framework:** `SwiftUI 5.0 + WKWebView Native Engine`  
**Entitas Developer:** `Evofranklin Technology / PT. Profit Multi Sarana`

---

## 📁 Struktur Berkas Native iOS (`ios/Evoscan/`)

* **`EvoscanApp.swift`** ➔ Entry point aplikasi dengan tema gelap AMOLED (`#080B11`) dan konfigurasi status bar.
* **`Views/ContentView.swift`** ➔ Antarmuka utama dengan penyesuaian layar Dynamic Island, indikator progress bar cyan, dan proteksi keyboard.
* **`Views/WebViewContainer.swift`** ➔ Jantung integrasi WKWebView dengan:
  * Pull-to-Refresh asli iOS + getaran *Haptic Feedback*.
  * User-Agent khusus: `EvoFranklin-Evoscan-iOS/1.0.0`.
  * Dukungan media inline & DOM storage.
* **`Resources/Info.plist`** ➔ Konfigurasi perizinan Apple App Store & security policy.

---

## 🛠️ Cara Build Menjadi Berkas `.ipa`

### Metode 1: Menggunakan Xcode di Mac (Rekomendasi Developer Apple)
1. Salin folder `ios/` ke Mac Anda.
2. Buka terminal di Mac atau buat project baru via Xcode:
   * Target: **iOS App**
   * Interface: **SwiftUI**
   * Language: **Swift**
   * Bundle Identifier: `com.evofranklin.evoscan`
   * Minimum Deployments: **iOS 17.2**
3. Masukkan file-file dari folder `ios/Evoscan/` ke dalam proyek Xcode.
4. Pilih target perangkat: **Any iOS Device (arm64)**.
5. Klik menu **Product ➔ Archive**.
6. Setelah proses Archive selesai, di jendela *Organizer*:
   * Klik **Distribute App**.
   * Pilih **Ad Hoc** (untuk menghasilkan berkas `.ipa` mandiri) atau **App Store Connect / TestFlight**.
   * Pilih sertifikat Apple Developer resmi Anda.
   * Simpan file **`Evoscan.ipa`**.

---

### Metode 2: Pasang Langsung ke iPhone Sekarang Juga (PWA Standalone)
Tanpa perlu menunggu build Xcode:
1. Buka browser **Safari** di iPhone Anda.
2. Buka URL: **`https://evoscan-1.ai.studio`**
3. Tekan tombol **Share** (kotak panah ke atas di bagian bawah Safari).
4. Gulir ke bawah dan pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
5. Beri nama **Evoscan** lalu tekan **Tambah**.
6. Aplikasi Evoscan akan muncul di layar utama iPhone dan berjalan fullscreen tanpa bar Safari (sama persis seperti aplikasi native App Store).
