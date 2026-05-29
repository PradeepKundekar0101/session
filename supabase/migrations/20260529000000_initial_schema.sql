-- Session MVP — initial schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('learner', 'mentor', 'admin');
create type public.mentor_status as enum ('pending', 'approved', 'denied');
create type public.booking_status as enum (
  'requested',
  'approved',
  'denied',
  'expired',
  'completed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'learner',
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  slug text not null unique,
  headline text not null default '',
  bio text not null default '',
  expertise text[] not null default '{}',
  rate_cents integer not null check (rate_cents > 0),
  status public.mentor_status not null default 'pending',
  stripe_account_id text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now(),
  unique (mentor_id, weekday, start_time, end_time)
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  exception_date date not null,
  is_available boolean not null default false,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  unique (mentor_id, exception_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id),
  mentor_id uuid not null references public.mentor_profiles (id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.booking_status not null default 'requested',
  amount_cents integer not null,
  stripe_payment_intent_id text,
  meeting_url text,
  daily_room_name text,
  approval_deadline timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  recipient_email text not null,
  template text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create index bookings_learner_id_idx on public.bookings (learner_id);
create index bookings_mentor_id_idx on public.bookings (mentor_id);
create index bookings_status_idx on public.bookings (status);
create index mentor_profiles_status_idx on public.mentor_profiles (status);
create index mentor_profiles_slug_idx on public.mentor_profiles (slug);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'learner')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger mentor_profiles_updated_at
  before update on public.mentor_profiles
  for each row execute function public.set_updated_at();

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- RLS helpers
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings enable row level security;
alter table public.email_log enable row level security;

-- profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- mentor_profiles
create policy "Approved mentors are public"
  on public.mentor_profiles for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());

create policy "Mentors can insert own mentor profile"
  on public.mentor_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "Mentors can update own mentor profile"
  on public.mentor_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- availability
create policy "Mentors manage own availability rules"
  on public.availability_rules for all to authenticated
  using (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and (m.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and (m.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Anyone can read availability rules for approved mentors"
  on public.availability_rules for select
  using (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and m.status = 'approved'
    )
  );

create policy "Mentors manage own availability exceptions"
  on public.availability_exceptions for all to authenticated
  using (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and (m.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and (m.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Anyone can read exceptions for approved mentors"
  on public.availability_exceptions for select
  using (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and m.status = 'approved'
    )
  );

-- bookings
create policy "Learners see own bookings"
  on public.bookings for select to authenticated
  using (
    learner_id = auth.uid()
    or exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and m.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Learners create bookings"
  on public.bookings for insert to authenticated
  with check (learner_id = auth.uid());

create policy "Learners and mentors update relevant bookings"
  on public.bookings for update to authenticated
  using (
    learner_id = auth.uid()
    or exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and m.user_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    learner_id = auth.uid()
    or exists (
      select 1 from public.mentor_profiles m
      where m.id = mentor_id and m.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- email_log (admin only)
create policy "Admins read email log"
  on public.email_log for select to authenticated
  using (public.is_admin());

create policy "Service inserts email log"
  on public.email_log for insert to authenticated
  with check (true);
