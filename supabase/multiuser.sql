-- Multi-bruger-migrering for gymtracker.
-- Kør dette i Supabase SQL Editor på din EKSISTERENDE database.
--
-- VIGTIGT — rækkefølge:
--   1. Opret FØRST din egen konto via appens login-skærm (eller i
--      Supabase-dashboardet under Authentication > Users), så der findes
--      en række i auth.users at tilskrive dine nuværende data til.
--   2. Indsæt din email nedenfor (to steder) og kør så hele scriptet.
--
-- Anbefaling: Slå email-bekræftelse fra mens du onboarder venner
--   (Authentication > Providers > Email > "Confirm email" = OFF),
--   så signup virker med det samme uden at vente på en mail.

-- ---------- 1. Tilføj user_id (nullable først, så eksisterende rækker overlever) ----------

alter table workouts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table sets     add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ---------- 2. Backfill: tilskriv eksisterende data til dig (ejeren) ----------
-- ERSTAT 'DIN_EMAIL@example.com' med den email du oprettede din konto med.

update workouts
  set user_id = (select id from auth.users where email = 'DIN_EMAIL@example.com')
  where user_id is null;

update sets
  set user_id = (select id from auth.users where email = 'DIN_EMAIL@example.com')
  where user_id is null;

-- Sikkerhedstjek: hvis dette returnerer rækker, matchede din email ikke.
-- Ret emailen ovenfor og kør igen, FØR du fortsætter til step 3.
--   select count(*) from workouts where user_id is null;
--   select count(*) from sets     where user_id is null;

-- ---------- 3. Lås kolonnen: not null + auto-udfyld ved insert ----------

alter table workouts alter column user_id set not null;
alter table sets     alter column user_id set not null;

alter table workouts alter column user_id set default auth.uid();
alter table sets     alter column user_id set default auth.uid();

create index if not exists idx_workouts_user on workouts(user_id);
create index if not exists idx_sets_user     on sets(user_id);

-- ---------- 4. Erstat de åbne RLS-policyer med per-bruger-policyer ----------

drop policy if exists "anon all exercises" on exercises;
drop policy if exists "anon all workouts"  on workouts;
drop policy if exists "anon all sets"       on sets;

-- workouts/sets: hver bruger ser kun sine egne rækker.
create policy "own workouts" on workouts for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own sets" on sets for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- exercises: fælles rutine, kun læsning for indloggede brugere.
-- (Rediger selve øvelserne via Supabase-dashboardet.)
create policy "read exercises" on exercises for select
  to authenticated using (true);
