-- Alternative øvelser (variant-bytte).
-- Kør dette i Supabase SQL Editor på din EKSISTERENDE database.
--
-- Baggrund: nogle øvelser byttes ud fra gang til gang — fx romanian deadlift
-- vs. konventionelt dødløft om onsdagen. Vægtene er vidt forskellige, så de
-- må ikke logges på samme øvelse: så bliver både progressionsforslaget og
-- historik-grafen misvisende. Hver variant er derfor sin egen øvelse, og de
-- knyttes sammen med alternative_for.

-- ---------- 1. Kolonnen der knytter en variant til sin hovedøvelse ----------
-- null = hovedøvelse (den der står i rutinen). Sat = variant af den øvelse.

alter table exercises
  add column if not exists alternative_for bigint references exercises(id) on delete cascade;

create index if not exists idx_exercises_alternative_for on exercises(alternative_for);

-- En variant kan ikke selv have varianter (kun ét niveau).
alter table exercises drop constraint if exists exercises_alt_one_level;
alter table exercises add constraint exercises_alt_one_level
  check (alternative_for is null or alternative_for <> id);

-- ---------- 2. Konventionelt dødløft som variant af romanian deadlift ----------
-- Varianten arver dag og placering fra hovedøvelsen, så den falder samme sted
-- i rutinen når man bytter.

insert into exercises (name, type, day, order_index, alternative_for)
select 'Deadlift', 'compound', p.day, p.order_index, p.id
from exercises p
where p.name = 'Romanian deadlift'
  and p.alternative_for is null
  and not exists (
    select 1 from exercises a
    where a.alternative_for = p.id and a.name = 'Deadlift'
  );

-- ---------- Sådan tilføjer du flere varianter senere ----------
-- insert into exercises (name, type, day, order_index, alternative_for)
-- select '<variantens navn>', '<compound|isolation|plyo>', p.day, p.order_index, p.id
-- from exercises p where p.name = '<hovedøvelsens navn>' and p.alternative_for is null;
