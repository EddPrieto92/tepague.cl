create table if not exists public.bills (
  id text primary key,
  share_id text not null unique,
  title text not null,
  status text not null,
  expected_participant_count integer not null default 1 check (expected_participant_count >= 1),
  receipt_total integer,
  entered_total integer not null default 0,
  missing_amount integer not null default 0,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bill_items (
  id text primary key,
  bill_id text not null references public.bills(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity >= 1),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  split_mode text not null check (split_mode in ('unit', 'shared_by_claimants', 'split_all', 'invited_by', 'excluded')),
  paid_by_participant_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id text primary key,
  bill_id text not null references public.bills(id) on delete cascade,
  name text not null,
  status text not null check (status in ('selecting', 'confirmed', 'payment_pending', 'paid', 'failed', 'expired')),
  include_tip boolean not null default true,
  total_amount integer not null default 0,
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.participant_items (
  id text primary key,
  participant_id text not null references public.participants(id) on delete cascade,
  bill_item_id text not null references public.bill_items(id) on delete cascade,
  quantity integer not null check (quantity >= 0),
  amount integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (participant_id, bill_item_id)
);

create table if not exists public.payment_profiles (
  id text primary key,
  bill_id text not null unique references public.bills(id) on delete cascade,
  holder_name text not null,
  holder_id text not null,
  institution_id text not null,
  account_type text not null check (account_type in ('checking_account', 'sight_account')),
  account_number text not null,
  authorized boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.payments add column if not exists bill_share_id text;
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('created', 'redirected', 'pending', 'succeeded', 'failed', 'expired', 'requires_action'));

create index if not exists bill_items_bill_id_idx on public.bill_items(bill_id);
create index if not exists participants_bill_id_idx on public.participants(bill_id);
create index if not exists participant_items_participant_id_idx on public.participant_items(participant_id);

alter table public.bills enable row level security;
alter table public.bill_items enable row level security;
alter table public.participants enable row level security;
alter table public.participant_items enable row level security;
alter table public.payment_profiles enable row level security;

-- Public access goes through server API routes using the service role. No anonymous table policies are created.
