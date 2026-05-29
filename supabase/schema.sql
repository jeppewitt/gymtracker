-- Gymtracker schema + seed
-- Kør hele scriptet i Supabase SQL Editor.
-- Single-user app: RLS slået fra med vilje.

-- ---------- Tabeller ----------

create table if not exists exercises (
  id          bigint generated always as identity primary key,
  name        text not null,
  type        text not null check (type in ('compound', 'isolation', 'plyo')),
  day         text not null check (day in ('mon', 'wed', 'fri')),
  order_index int  not null
);

create table if not exists workouts (
  id         bigint generated always as identity primary key,
  day        text not null check (day in ('mon', 'wed', 'fri')),
  created_at timestamptz not null default now()
);

create table if not exists sets (
  id          bigint generated always as identity primary key,
  workout_id  bigint not null references workouts(id) on delete cascade,
  exercise_id bigint not null references exercises(id) on delete cascade,
  set_number  int not null,            -- 0 = warmup, 1/2 = arbejdssæt
  is_warmup   boolean not null default false,
  reps        int,                     -- null for warmup
  weight      numeric not null,        -- kg; for pull-ups = tillægsvægt (0 = kropsvægt)
  created_at  timestamptz not null default now()
);

create index if not exists idx_sets_workout  on sets(workout_id);
create index if not exists idx_sets_exercise on sets(exercise_id);
create index if not exists idx_workouts_day   on workouts(day);

-- RLS: single-user app uden auth. Vi slår RLS TIL og laver åbne policies, så
-- anon-nøglen kan læse/skrive alt. (Mere robust end at disable RLS, som kan
-- håndhæves alligevel for anon via PostgREST.)
alter table exercises enable row level security;
alter table workouts  enable row level security;
alter table sets      enable row level security;

drop policy if exists "anon all exercises" on exercises;
drop policy if exists "anon all workouts"  on workouts;
drop policy if exists "anon all sets"       on sets;

create policy "anon all exercises" on exercises for all
  to anon, authenticated using (true) with check (true);
create policy "anon all workouts" on workouts for all
  to anon, authenticated using (true) with check (true);
create policy "anon all sets" on sets for all
  to anon, authenticated using (true) with check (true);

-- ---------- Seed: øvelser ----------
-- Idempotent: tømmer kun hvis tom, så seed ikke duplikeres ved gentagne kørsler.

insert into exercises (name, type, day, order_index)
select * from (values
  -- Mandag
  ('Box jumps',                'plyo',      'mon', 1),
  ('Smith incline bench',      'compound',  'mon', 2),
  ('Squats',                   'compound',  'mon', 3),
  ('Plate loaded row maskine', 'compound',  'mon', 4),
  ('Leg curls',                'isolation', 'mon', 5),
  ('Incline DB curls',         'isolation', 'mon', 6),
  ('Dips',                     'compound',  'mon', 7),

  -- Onsdag
  ('Broad jumps',              'plyo',      'wed', 1),
  ('Lateral bounds',           'plyo',      'wed', 2),
  ('DB bench press',           'compound',  'wed', 3),
  ('Romanian deadlift',        'compound',  'wed', 4),
  ('Pull-ups',                 'compound',  'wed', 5),
  ('Walking lunges',           'compound',  'wed', 6),
  ('Lateral raises',           'isolation', 'wed', 7),

  -- Fredag
  ('Single-leg hop',           'plyo',      'fri', 1),
  ('Med ball slam',            'plyo',      'fri', 2),
  ('Military press',           'compound',  'fri', 3),
  ('Cable rows',               'compound',  'fri', 4),
  ('Hip thrust',               'compound',  'fri', 5),
  ('Leg extension',            'isolation', 'fri', 6),
  ('Reverse cable flyes',      'isolation', 'fri', 7)
) as v(name, type, day, order_index)
where not exists (select 1 from exercises);
