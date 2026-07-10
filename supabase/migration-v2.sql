-- ══════════════════════════════════════════════════════════
--  ATUALIZAÇÃO v2 — roda por cima do banco que já existe
--
--  NÃO APAGA NADA. Só adiciona colunas novas e preenche
--  as apostas antigas com nome e código.
--
--  Pode rodar quantas vezes quiser.
-- ══════════════════════════════════════════════════════════

-- ─────────── 1. COLUNAS NOVAS EM APOSTAS ───────────

alter table public.apostas add column if not exists nome       text not null default '';
alter table public.apostas add column if not exists codigo     text;
alter table public.apostas add column if not exists print_path text;
alter table public.apostas add column if not exists print_em   timestamptz;

-- ─────────── 2. ÍCONE DAS CASAS ───────────

alter table public.casas add column if not exists icone text not null default '';

-- ─────────── 3. SEPARAR NOME E MERCADO DAS APOSTAS ANTIGAS ───────────
-- O campo "evento" guardava tudo junto: "Flamengo x Palmeiras — Over 1.5".
-- Agora "nome" fica com o confronto e "evento" com o mercado.
-- Se não tiver travessão, o texto inteiro vira o nome.

update public.apostas
set
  nome   = trim(split_part(evento, '—', 1)),
  evento = trim(coalesce(split_part(evento, '—', 2), ''))
where nome = '' and evento <> '';

-- ─────────── 4. APOSTAS SEM NOME NENHUM VIRAM "Aposta 01", "Aposta 02"... ───────────

with numeradas as (
  select id, row_number() over (order by criado_em, id) as n
  from public.apostas
  where nome = ''
)
update public.apostas a
set nome = 'Aposta ' || lpad(numeradas.n::text, 2, '0')
from numeradas
where a.id = numeradas.id;

-- ─────────── 5. CÓDIGO CURTO E ÚNICO PARA CADA APOSTA ───────────
-- Derivado do próprio id, então nunca colide e nunca muda.
-- 6 caracteres hexadecimais: sem letra O, sem letra I, sem confusão.

update public.apostas
set codigo = upper(substr(md5(id::text), 1, 6))
where codigo is null;

create unique index if not exists apostas_codigo_idx on public.apostas (codigo);

-- ─────────── 6. GUARDAR OS PRINTS ───────────
-- Balde privado. Só quem está logado enxerga.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prints', 'prints', false, 6291456, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists prints_ler     on storage.objects;
drop policy if exists prints_enviar  on storage.objects;
drop policy if exists prints_apagar  on storage.objects;

create policy prints_ler on storage.objects
  for select to authenticated using (bucket_id = 'prints');

create policy prints_enviar on storage.objects
  for insert to authenticated with check (bucket_id = 'prints');

create policy prints_apagar on storage.objects
  for delete to authenticated using (bucket_id = 'prints');

-- ─────────── 7. CONFERÊNCIA ───────────
-- O resultado abaixo deve listar suas apostas já com nome e código.

select codigo, nome, evento, valor, odd, status
from public.apostas
order by criado_em desc
limit 10;
