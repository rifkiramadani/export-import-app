-- =====================================================================
-- 000 HELPERS  (jalankan PALING PERTAMA)
-- Dipakai oleh policy admin di semua tabel lain.
-- =====================================================================

-- Cek admin tanpa rekursi RLS (security definer melewati RLS profiles).
-- Isi fungsi baru dievaluasi saat dipanggil, jadi aman dibuat sebelum tabel
-- profiles ada.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end $$;