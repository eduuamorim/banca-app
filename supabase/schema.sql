-- ══════════════════════════════════════════════════════════
--  GESTÃO DE BANCA — estrutura do banco
--  Cole tudo isso no SQL Editor do Supabase e clique em RUN.
-- ══════════════════════════════════════════════════════════

-- ─────────── PERFIS ───────────
-- Cada pessoa que cria conta ganha uma linha aqui automaticamente.

create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nome       text not null,
  cor        text not null default '#0E9F6E',
  criado_em  timestamptz not null default now()
);

-- ─────────── CONFIGURAÇÃO DA BANCA ───────────
-- Tabela de uma linha só. Guarda banca, metas e os stakes.

create table if not exists public.config (
  id         int primary key default 1,
  banca      numeric not null default 4800,
  meta_pct   numeric not null default 2,
  stop_pct   numeric not null default 3,
  stakes     jsonb   not null default '[
    {"id":"a","label":"Alta","pct":1.75},
    {"id":"b","label":"Média","pct":0.5},
    {"id":"c","label":"Baixa","pct":0.25}
  ]'::jsonb,
  constraint config_linha_unica check (id = 1)
);

insert into public.config (id) values (1) on conflict (id) do nothing;

-- ─────────── CASAS DE APOSTA ───────────

create table if not exists public.casas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  url        text not null default '',
  login      text not null default '',
  senha      text not null default '',
  obs        text not null default '',
  criado_em  timestamptz not null default now()
);

-- ─────────── APOSTAS ───────────

create table if not exists public.apostas (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.profiles(id) on delete cascade,
  casa_id        uuid references public.casas(id) on delete set null,
  data           date not null default current_date,
  evento         text not null default '',
  stake_pct      numeric not null default 0,
  valor          numeric not null,
  odd            numeric not null,
  status         text not null default 'aberta',
  cashout_valor  numeric,
  obs            text not null default '',
  criado_em      timestamptz not null default now(),
  constraint status_valido check (status in ('aberta','green','red','void','cashout'))
);

create index if not exists apostas_data_idx on public.apostas (data desc);
create index if not exists apostas_usuario_idx on public.apostas (usuario_id);

-- ══════════════════════════════════════════════════════════
--  CRIAÇÃO AUTOMÁTICA DO PERFIL AO CADASTRAR
-- ══════════════════════════════════════════════════════════

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  paleta text[] := array['#0E9F6E','#3A7A9C','#BF861D','#8B5CF6','#CE4444','#0F766E'];
  qtd int;
begin
  select count(*) into qtd from public.profiles;
  insert into public.profiles (id, nome, cor)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome',''), split_part(new.email,'@',1)),
    paleta[(qtd % 6) + 1]
  );
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ══════════════════════════════════════════════════════════
--  SEGURANÇA (RLS)
--  Regra: só quem está logado enxerga ou mexe em qualquer coisa.
--  Ao inserir uma aposta, o dono é sempre quem está logado.
-- ══════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.config   enable row level security;
alter table public.casas    enable row level security;
alter table public.apostas  enable row level security;

-- PROFILES
drop policy if exists p_ler on public.profiles;
create policy p_ler on public.profiles
  for select to authenticated using (true);

drop policy if exists p_editar on public.profiles;
create policy p_editar on public.profiles
  for update to authenticated using (auth.uid() = id);

-- CONFIG
drop policy if exists c_ler on public.config;
create policy c_ler on public.config
  for select to authenticated using (true);

drop policy if exists c_editar on public.config;
create policy c_editar on public.config
  for update to authenticated using (true) with check (true);

-- CASAS
drop policy if exists ca_tudo on public.casas;
create policy ca_tudo on public.casas
  for all to authenticated using (true) with check (true);

-- APOSTAS
drop policy if exists ap_ler on public.apostas;
create policy ap_ler on public.apostas
  for select to authenticated using (true);

drop policy if exists ap_inserir on public.apostas;
create policy ap_inserir on public.apostas
  for insert to authenticated with check (auth.uid() = usuario_id);

drop policy if exists ap_editar on public.apostas;
create policy ap_editar on public.apostas
  for update to authenticated using (true) with check (true);

drop policy if exists ap_excluir on public.apostas;
create policy ap_excluir on public.apostas
  for delete to authenticated using (true);

-- ══════════════════════════════════════════════════════════
--  ATUALIZAÇÃO EM TEMPO REAL
--  Faz a aposta que um cadastra aparecer na tela do outro.
-- ══════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.apostas;
