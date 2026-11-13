-- Jalankan di Supabase SQL Editor. Semua nominal disimpan sebagai integer rupiah.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 created_at timestamptz not null default now()
);
create table if not exists public.wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 available_balance bigint not null default 0 check(available_balance>=0),
 pending_balance bigint not null default 0 check(pending_balance>=0),
 approved_jobs integer not null default 0 check(approved_jobs>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.job_submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 task_code text not null,
 task_title text not null default 'Uji alur email sandbox',
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reward_amount bigint not null default 4000 check(reward_amount=4000),
 evidence text,
 reviewer_id uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.wallet_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('job_reward','withdrawal','withdrawal_refund','adjustment')),
 amount bigint not null check(amount>0),
 status text not null default 'completed',
 description text,
 reference_id uuid,
 created_at timestamptz not null default now()
);
create table if not exists public.withdrawal_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 amount bigint not null check(amount>=10000),
 dana_number text not null,
 recipient_name text not null,
 status text not null default 'pending' check(status in ('pending','processing','paid','rejected','failed')),
 provider_reference text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.admins(user_id uuid primary key references auth.users(id) on delete cascade);

create or replace function public.bootstrap_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(user_id) values(new.id) on conflict do nothing;
 insert into public.wallets(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created_lutzz on auth.users;
create trigger on_auth_user_created_lutzz after insert on auth.users for each row execute procedure public.bootstrap_user();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.job_submissions enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.admins enable row level security;
create policy "profile own read" on public.profiles for select using(auth.uid()=user_id);
create policy "wallet own read" on public.wallets for select using(auth.uid()=user_id);
create policy "jobs own read" on public.job_submissions for select using(auth.uid()=user_id or exists(select 1 from public.admins where user_id=auth.uid()));
create policy "transactions own read" on public.wallet_transactions for select using(auth.uid()=user_id or exists(select 1 from public.admins where user_id=auth.uid()));
create policy "withdraw own read" on public.withdrawal_requests for select using(auth.uid()=user_id or exists(select 1 from public.admins where user_id=auth.uid()));
create policy "admin self read" on public.admins for select using(auth.uid()=user_id);
-- No client insert/update policies for wallet, transactions, jobs or withdrawals.
-- Privileged mutations occur only in Edge Functions using service-role key.
