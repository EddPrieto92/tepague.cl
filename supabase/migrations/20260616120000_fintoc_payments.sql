create table if not exists public.user_payment_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  holder_name text not null,
  holder_id text not null,
  institution_id text not null,
  account_type text not null,
  account_number text not null,
  authorized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_payment_profiles_user_id_idx
  on public.user_payment_profiles(user_id);

create table if not exists public.payments (
  id text primary key,
  bill_id text not null,
  participant_id text not null,
  amount integer not null check (amount >= 0),
  service_fee_amount integer not null default 0 check (service_fee_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'created'
    check (status in ('created', 'redirected', 'succeeded', 'failed', 'expired', 'requires_action')),
  fintoc_checkout_session_id text,
  fintoc_payment_intent_id text,
  fintoc_redirect_url text,
  raw_webhook_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_bill_id_idx
  on public.payments(bill_id);

create index if not exists payments_participant_id_idx
  on public.payments(participant_id);

create unique index if not exists payments_fintoc_checkout_session_id_idx
  on public.payments(fintoc_checkout_session_id)
  where fintoc_checkout_session_id is not null;

create unique index if not exists payments_fintoc_payment_intent_id_idx
  on public.payments(fintoc_payment_intent_id)
  where fintoc_payment_intent_id is not null;

create table if not exists public.fintoc_webhook_events (
  id text primary key,
  type text not null,
  payment_id text references public.payments(id),
  raw_event jsonb not null,
  processed_at timestamptz not null default now()
);
