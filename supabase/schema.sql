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
  saldo_banco numeric not null default 0,
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

  -- Bilhete. Uma aposta simples é uma perna só; a múltipla tem várias.
  -- Guardamos as pernas como JSON porque elas sempre viajam junto com
  -- a aposta e são resolvidas em bloco: nunca consultadas em separado.
  tipo           text not null default 'simples',
  pernas         jsonb not null default '[]',
  ganho_potencial numeric,

  constraint status_valido check (status in ('aberta','green','red','void','cashout')),
  constraint tipo_valido check (tipo in ('simples','multipla'))
);

-- Colunas novas. O "if not exists" deixa rodar de novo sem erro,
-- mesmo se você já tinha criado a tabela antes.
alter table public.config  add column if not exists saldo_banco numeric not null default 0;
alter table public.apostas add column if not exists codigo text;
alter table public.apostas add column if not exists editado_em timestamptz;
alter table public.apostas add column if not exists tipo text not null default 'simples';
alter table public.apostas add column if not exists pernas jsonb not null default '[]';
alter table public.apostas add column if not exists ganho_potencial numeric;

-- a trava de tipo pode nao existir em bancos antigos
do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
     where table_schema = 'public' and table_name = 'apostas'
       and constraint_name = 'tipo_valido'
  ) then
    alter table public.apostas add constraint tipo_valido check (tipo in ('simples','multipla'));
  end if;
end
$$;
alter table public.apostas add column if not exists nome text not null default '';
alter table public.casas   add column if not exists icone text not null default '';

create index if not exists apostas_data_idx on public.apostas (data desc);
create index if not exists apostas_usuario_idx on public.apostas (usuario_id);

-- ══════════════════════════════════════════════════════════
--  CÓDIGO CURTO ÚNICO DE CADA APOSTA
--
--  Gera algo como K3F9. Sem as letras I, O e os números
--  0 e 1, que se confundem na leitura. Se sortear um código
--  repetido, tenta de novo.
-- ══════════════════════════════════════════════════════════

create or replace function public.gerar_codigo()
returns text
language plpgsql
as $$
declare
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  tentativa text;
  i int;
  n int;
begin
  for n in 1..40 loop
    tentativa := '';
    for i in 1..4 loop
      tentativa := tentativa || substr(alfabeto, floor(random() * length(alfabeto))::int + 1, 1);
    end loop;
    if not exists (select 1 from public.apostas where codigo = tentativa) then
      return tentativa;
    end if;
  end loop;
  -- praticamente impossível chegar aqui: 32^4 = 1.048.576 combinações
  return tentativa || floor(random() * 90 + 10)::text;
end;
$$;

-- Preenche o código de quem já existia sem ele.
--
-- Precisa ser em laço, uma linha por vez. Um UPDATE único chamaria
-- gerar_codigo() para todas as linhas antes de gravar qualquer uma,
-- e a checagem de duplicata não enxergaria os códigos recém-sorteados.
-- Duas linhas poderiam receber o mesmo código, e o índice único abaixo
-- quebraria.
do $$
declare
  r record;
begin
  for r in select id from public.apostas where codigo is null loop
    update public.apostas set codigo = public.gerar_codigo() where id = r.id;
  end loop;
end
$$;

-- Nome padrão para quem já existia sem ele
update public.apostas
   set nome = 'Aposta ' || codigo
 where nome = '' and codigo is not null;

-- E de agora em diante, todo insert ganha um código sozinho
create or replace function public.antes_de_inserir_aposta()
returns trigger
language plpgsql
as $$
begin
  -- O código é SEMPRE gerado aqui. O que vier de fora é descartado.
  -- Ninguém escolhe o próprio código, nem por engano nem de propósito.
  new.codigo := public.gerar_codigo();

  if new.nome is null or new.nome = '' then
    new.nome := 'Aposta ' || new.codigo;
  end if;
  return new;
end;
$$;

drop trigger if exists ao_inserir_aposta on public.apostas;
create trigger ao_inserir_aposta
  before insert on public.apostas
  for each row execute function public.antes_de_inserir_aposta();

-- ══════════════════════════════════════════════════════════
--  O CÓDIGO E O DONO SÃO IMUTÁVEIS
--
--  O nome e o evento podem ser corrigidos depois. O código,
--  não: ele é a identidade da aposta, e é por ele que vocês
--  se referem a ela. O dono também não muda.
--
--  Esta regra vive no banco, não na tela. Mesmo que alguém
--  chame a API direto, o banco recusa a alteração.
-- ══════════════════════════════════════════════════════════

create or replace function public.travar_identidade_aposta()
returns trigger
language plpgsql
as $$
begin
  -- Um código que já existe nunca muda. Preencher um que estava
  -- vazio é permitido: é o que a migração faz nas apostas antigas.
  if old.codigo is not null and old.codigo <> ''
     and new.codigo is distinct from old.codigo then
    raise exception 'O código da aposta não pode ser alterado.';
  end if;

  if new.usuario_id is distinct from old.usuario_id then
    raise exception 'A aposta não pode trocar de dono.';
  end if;

  -- O momento do registro (criado_em) é imutável.
  new.criado_em := old.criado_em;

  -- Carimba quando foi editada. Só conta como edição real se
  -- algum campo visível mudou, não em toda gravação.
  if new.nome is distinct from old.nome
     or new.evento is distinct from old.evento
     or new.casa_id is distinct from old.casa_id
     or new.valor is distinct from old.valor
     or new.odd is distinct from old.odd
     or new.stake_pct is distinct from old.stake_pct
     or new.tipo is distinct from old.tipo
     or new.pernas is distinct from old.pernas
     or new.obs is distinct from old.obs then
    new.editado_em := now();
  end if;

  return new;
end;
$$;

drop trigger if exists ao_atualizar_aposta on public.apostas;
create trigger ao_atualizar_aposta
  before update on public.apostas
  for each row execute function public.travar_identidade_aposta();

-- Garante que dois códigos nunca se repitam
create unique index if not exists apostas_codigo_idx on public.apostas (codigo);

-- ══════════════════════════════════════════════════════════
--  CONTAS DE ACESSO
--
--  Uma casa pode ter várias contas. Cada conta pertence a
--  quem a cadastrou, e esse dono nunca muda.
--
--  As senhas ficam em texto simples, como combinado.
-- ══════════════════════════════════════════════════════════

create table if not exists public.contas (
  id          uuid primary key default gen_random_uuid(),
  casa_id     uuid not null references public.casas(id) on delete cascade,
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  apelido     text not null default '',
  login       text not null default '',
  senha       text not null default '',
  obs         text not null default '',
  criado_em   timestamptz not null default now()
);

create index if not exists contas_casa_idx on public.contas (casa_id);
create index if not exists contas_usuario_idx on public.contas (usuario_id);

-- O dono da conta nunca muda
create or replace function public.travar_dono_conta()
returns trigger
language plpgsql
as $$
begin
  if new.usuario_id is distinct from old.usuario_id then
    raise exception 'A conta não pode trocar de dono.';
  end if;
  return new;
end;
$$;

drop trigger if exists ao_atualizar_conta on public.contas;
create trigger ao_atualizar_conta
  before update on public.contas
  for each row execute function public.travar_dono_conta();

-- ── Migração das casas antigas ──
-- Quem já tinha login e senha na casa ganha uma conta com eles.
-- Roda uma vez só: a segunda vez não encontra nada.
do $$
declare
  c record;
  dono uuid;
begin
  -- o primeiro perfil criado vira dono das contas migradas
  select id into dono from public.profiles order by criado_em limit 1;
  if dono is null then return; end if;

  for c in
    select id, login, senha, obs from public.casas
     where (coalesce(login, '') <> '' or coalesce(senha, '') <> '')
       and not exists (select 1 from public.contas where casa_id = casas.id)
  loop
    insert into public.contas (casa_id, usuario_id, apelido, login, senha, obs)
    values (c.id, dono, 'Principal', coalesce(c.login, ''), coalesce(c.senha, ''), coalesce(c.obs, ''));
  end loop;
end
$$;

-- ══════════════════════════════════════════════════════════
--  APOSTAS FIXADAS (por usuário)
--
--  Cada pessoa fixa as suas. O alfinete de um não aparece
--  para o outro. Uma linha por par (usuário, aposta).
-- ══════════════════════════════════════════════════════════

create table if not exists public.fixadas (
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  aposta_id   uuid not null references public.apostas(id) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (usuario_id, aposta_id)
);

create index if not exists fixadas_usuario_idx on public.fixadas (usuario_id);

alter table public.fixadas enable row level security;

-- Você só enxerga e mexe nas suas próprias fixadas.
drop policy if exists fx_ler on public.fixadas;
create policy fx_ler on public.fixadas
  for select to authenticated using (auth.uid() = usuario_id);

drop policy if exists fx_inserir on public.fixadas;
create policy fx_inserir on public.fixadas
  for insert to authenticated with check (auth.uid() = usuario_id);

drop policy if exists fx_excluir on public.fixadas;
create policy fx_excluir on public.fixadas
  for delete to authenticated using (auth.uid() = usuario_id);

-- ══════════════════════════════════════════════════════════
--  CHAT ENTRE OS DOIS USUÁRIOS
--
--  Uma conversa só, compartilhada. Como o app é de duas
--  pessoas, não precisa de "salas": toda mensagem é da
--  dupla. Quem enviou fica registrado em autor_id.
--
--  Uma aposta pode vir anexada (aposta_id): a mensagem
--  então mostra o bilhete como um cartão clicável.
-- ══════════════════════════════════════════════════════════

create table if not exists public.mensagens (
  id         uuid primary key default gen_random_uuid(),
  autor_id   uuid not null references public.profiles(id) on delete cascade,
  texto      text not null default '',
  aposta_id  uuid references public.apostas(id) on delete set null,
  criado_em  timestamptz not null default now()
);

create index if not exists mensagens_criado_idx on public.mensagens (criado_em);

alter table public.mensagens enable row level security;

-- Os dois leem tudo. Cada um só envia em seu próprio nome.
drop policy if exists msg_ler on public.mensagens;
create policy msg_ler on public.mensagens
  for select to authenticated using (true);

drop policy if exists msg_inserir on public.mensagens;
create policy msg_inserir on public.mensagens
  for insert to authenticated with check (auth.uid() = autor_id);

-- Você pode apagar as suas mensagens.
drop policy if exists msg_excluir on public.mensagens;
create policy msg_excluir on public.mensagens
  for delete to authenticated using (auth.uid() = autor_id);

-- ══════════════════════════════════════════════════════════
--  LEITURA DO CHAT (por usuário)
--
--  Guarda até quando cada pessoa já leu a conversa. Assim,
--  ao abrir o app, contamos como "não lida" só o que chegou
--  depois da última leitura. É individual: cada um tem a sua.
-- ══════════════════════════════════════════════════════════

create table if not exists public.leitura_chat (
  usuario_id  uuid primary key references public.profiles(id) on delete cascade,
  lido_ate    timestamptz not null default now()
);

alter table public.leitura_chat enable row level security;

-- Todos podem VER as marcas de leitura (é o que permite o "visto":
-- eu preciso saber até quando você leu). Mas só o dono EDITA a sua.
drop policy if exists lc_ler on public.leitura_chat;
create policy lc_ler on public.leitura_chat
  for select to authenticated using (true);

drop policy if exists lc_inserir on public.leitura_chat;
create policy lc_inserir on public.leitura_chat
  for insert to authenticated with check (auth.uid() = usuario_id);

drop policy if exists lc_editar on public.leitura_chat;
create policy lc_editar on public.leitura_chat
  for update to authenticated using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ══════════════════════════════════════════════════════════
--  DEPÓSITOS E SAQUES
--
--  Movimento de caixa entre você e as casas de aposta.
--  NÃO é lucro. Não entra na meta nem no stop loss.
--  Serve para saber quanto dinheiro está em cada casa.
-- ══════════════════════════════════════════════════════════

create table if not exists public.movimentos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  -- Um depósito é um fato financeiro. Apagar a casa não apaga o histórico:
  -- o movimento sobrevive, apenas sem casa. Igual às apostas.
  casa_id     uuid references public.casas(id) on delete set null,
  tipo        text not null,
  valor       numeric not null,
  data        date not null default current_date,
  metodo      text not null default '',
  obs         text not null default '',
  criado_em   timestamptz not null default now(),
  constraint tipo_valido  check (tipo in ('deposito','saque')),
  constraint valor_positivo check (valor > 0)
);

-- Em qual conta o dinheiro entrou ou saiu. Opcional.
alter table public.movimentos add column if not exists conta_id uuid references public.contas(id) on delete set null;

-- ── Correção para quem criou a tabela na versão anterior ──
-- Lá, apagar a casa apagava os movimentos dela. Não deve.
-- Aqui a regra vira "set null": o histórico financeiro sobrevive.
do $$
declare
  nome_fk text;
begin
  -- só mexe se a coluna ainda for obrigatória
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'movimentos'
       and column_name = 'casa_id' and is_nullable = 'NO'
  ) then
    alter table public.movimentos alter column casa_id drop not null;
  end if;

  -- troca a chave estrangeira de CASCADE para SET NULL
  select tc.constraint_name into nome_fk
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
   where tc.table_schema = 'public'
     and tc.table_name = 'movimentos'
     and tc.constraint_type = 'FOREIGN KEY'
     and kcu.column_name = 'casa_id'
   limit 1;

  if nome_fk is not null then
    execute format('alter table public.movimentos drop constraint %I', nome_fk);
  end if;

  alter table public.movimentos
    add constraint movimentos_casa_id_fkey
    foreign key (casa_id) references public.casas(id) on delete set null;
end
$$;

create index if not exists movimentos_data_idx on public.movimentos (data desc);
create index if not exists movimentos_casa_idx on public.movimentos (casa_id);
create index if not exists movimentos_usuario_idx on public.movimentos (usuario_id);

-- O dono do movimento nunca muda
create or replace function public.travar_dono_movimento()
returns trigger
language plpgsql
as $$
begin
  if new.usuario_id is distinct from old.usuario_id then
    raise exception 'O movimento não pode trocar de dono.';
  end if;
  return new;
end;
$$;

drop trigger if exists ao_atualizar_movimento on public.movimentos;
create trigger ao_atualizar_movimento
  before update on public.movimentos
  for each row execute function public.travar_dono_movimento();

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

alter table public.profiles   enable row level security;
alter table public.config     enable row level security;
alter table public.casas      enable row level security;
alter table public.apostas    enable row level security;
alter table public.contas     enable row level security;
alter table public.movimentos enable row level security;

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

-- CONTAS
drop policy if exists ct_ler on public.contas;
create policy ct_ler on public.contas
  for select to authenticated using (true);

drop policy if exists ct_inserir on public.contas;
create policy ct_inserir on public.contas
  for insert to authenticated with check (auth.uid() = usuario_id);

drop policy if exists ct_editar on public.contas;
create policy ct_editar on public.contas
  for update to authenticated using (true) with check (true);

drop policy if exists ct_excluir on public.contas;
create policy ct_excluir on public.contas
  for delete to authenticated using (true);

-- MOVIMENTOS
drop policy if exists mv_ler on public.movimentos;
create policy mv_ler on public.movimentos
  for select to authenticated using (true);

drop policy if exists mv_inserir on public.movimentos;
create policy mv_inserir on public.movimentos
  for insert to authenticated with check (auth.uid() = usuario_id);

drop policy if exists mv_editar on public.movimentos;
create policy mv_editar on public.movimentos
  for update to authenticated using (true) with check (true);

drop policy if exists mv_excluir on public.movimentos;
create policy mv_excluir on public.movimentos
  for delete to authenticated using (true);

-- ══════════════════════════════════════════════════════════
--  ATUALIZAÇÃO EM TEMPO REAL
--  Faz a aposta que um cadastra aparecer na tela do outro.
--
--  O bloco abaixo só adiciona a tabela se ela ainda não
--  estiver lá. Assim você pode rodar este arquivo quantas
--  vezes quiser, sem erro.
-- ══════════════════════════════════════════════════════════

do $$
declare
  t text;
begin
  foreach t in array array['apostas', 'movimentos', 'contas', 'fixadas', 'mensagens'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
