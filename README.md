# LUTZZ GMAIL JOB — starter project

UI dark-purple responsif + Supabase Auth/DB + server-side wallet ledger + antrean penarikan DANA.

## Penting: apa yang sudah dan belum live
- UI, login/daftar Supabase, pembacaan saldo, job submission, dan request withdrawal disiapkan.
- Reward Rp4.000 hanya ditambahkan oleh fungsi review server-side setelah admin menyetujui job.
- Withdrawal baru membuat permintaan dan mengunci saldo. Ini **belum mengirim uang**.
- Pencairan DANA otomatis membutuhkan akun bisnis/provider payout yang disetujui, API credentials, verifikasi webhook, dan konfigurasi khusus provider. Tidak ada kredensial rahasia yang boleh ditaruh di HTML.
- Job saat ini adalah antrean uji email sandbox. Admin harus menyediakan lingkungan uji dan instruksi; tidak ada pembuatan akun Gmail massal, spam, pengumpulan password/OTP, atau bypass verifikasi.

## Setup lokal
1. Buat project Supabase.
2. Jalankan `supabase/schema.sql` lalu `supabase/migrations/002_wallet_functions.sql` di SQL Editor.
3. Salin `config.example.js` menjadi `config.js`, isi Project URL dan anon/publishable key.
4. Tambahkan `<script src="config.js"></script>` sebelum `app.js` di `index.html`.
5. Jalankan dengan static server lokal (mis. `npx serve .`) atau deploy ke hosting static.
6. Deploy Edge Functions: `submit-job`, `request-withdrawal`, `review-job`, `payout-webhook`.
7. Set secrets untuk Edge Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Service-role hanya di server.
8. Daftarkan akun admin melalui Supabase Auth, lalu masukkan UUID admin ke tabel `admins` dari SQL Editor:
   `insert into public.admins(user_id) values ('UUID_ADMIN');`

## Aktifkan payout DANA
Pilih provider resmi yang menyediakan disbursement ke DANA untuk badan usaha/merchant yang memenuhi syarat. Lengkapi KYC/kontrak provider, lalu implementasikan adapter payout server-side sesuai dokumentasi resmi provider. Verifikasi signature webhook sebelum mengubah withdrawal menjadi `paid`. Tambahkan alur refund atomik untuk status gagal agar saldo dikembalikan satu kali saja. Jangan mengklaim withdraw instan sebelum transaksi provider sukses.

## Keamanan sebelum produksi
- Tambahkan rate limit dan CAPTCHA anti-bot pada auth/job endpoints.
- Sediakan job sandbox yang benar-benar bisa diuji dan simpan bukti non-rahasia.
- Tambahkan halaman admin untuk meninjau job dan withdrawal.
- Tambahkan verifikasi nomor penerima, persetujuan kebijakan privasi, syarat layanan, dan kontak bantuan.
- Gunakan HTTPS, backup DB, audit log, serta pemeriksaan hukum/pajak/ketentuan provider.
- Uji race condition dan idempotency pada payout.
