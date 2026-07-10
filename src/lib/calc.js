// ── helpers de número, data e dinheiro ──

export const uid = () => Math.random().toString(36).slice(2, 10);
export const hoje = () => new Date().toISOString().slice(0, 10);

export const n = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};

export const brl = (v) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const sgn = (v) =>
  `${v > 0 ? "+" : v < 0 ? "\u2212" : ""}${brl(Math.abs(v))}`;

export const dBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

// ── regra de lucro ──
// aposta aberta não entra em nenhum cálculo

export const lucro = (b) => {
  const v = n(b.valor);
  if (b.status === "green") return v * (n(b.odd) - 1);
  if (b.status === "red") return -v;
  if (b.status === "cashout") return n(b.cashoutValor) - v;
  return 0;
};

export const fechada = (b) => b.status !== "aberta";

// ── banco (snake_case) <-> app (camelCase) ──

export const betFromRow = (r) => ({
  id: r.id,
  codigo: r.codigo || "",
  nome: r.nome || "",
  data: r.data,
  usuarioId: r.usuario_id,
  casaId: r.casa_id || "",
  evento: r.evento || "",
  stakePct: Number(r.stake_pct),
  valor: Number(r.valor),
  odd: Number(r.odd),
  status: r.status,
  cashoutValor: r.cashout_valor == null ? "" : Number(r.cashout_valor),
  obs: r.obs || "",
});

/**
 * Linha para INSERIR uma aposta nova.
 * "nome" vazio faz o banco gravar "Aposta " + código.
 */
export const betToInsert = (b, usuarioId) => ({
  usuario_id: b.usuarioId || usuarioId,
  casa_id: b.casaId || null,
  data: b.data,
  nome: b.nome || "",
  evento: b.evento || "",
  stake_pct: n(b.stakePct),
  valor: n(b.valor),
  odd: n(b.odd),
  status: b.status,
  cashout_valor: b.status === "cashout" ? n(b.cashoutValor) : null,
  obs: b.obs || "",
});

/**
 * Linha para ATUALIZAR uma aposta existente.
 *
 * Nome e evento podem mudar. O "codigo" e o "usuario_id" NÃO
 * entram aqui: são a identidade da aposta. Omitir é a primeira
 * barreira; o banco tem um gatilho que recusa a alteração,
 * mesmo se alguém chamar a API por fora do app.
 */
export const betToUpdate = (b) => ({
  casa_id: b.casaId || null,
  data: b.data,
  nome: b.nome || "",
  evento: b.evento || "",
  stake_pct: n(b.stakePct),
  valor: n(b.valor),
  odd: n(b.odd),
  status: b.status,
  cashout_valor: b.status === "cashout" ? n(b.cashoutValor) : null,
  obs: b.obs || "",
});

/* ── ícone da casa a partir do link ── */

/** Extrai o domínio limpo de uma URL qualquer. */
export const dominio = (url) => {
  if (!url) return "";
  let u = String(url).trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Monta o endereço do favicon. Vazio se a URL não servir. */
export const faviconDe = (url, tamanho = 64) => {
  const d = dominio(url);
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=${tamanho}` : "";
};

/* ══════════════════════════════════════════════════
   NOME DA APOSTA NA TELA

   O nome e o código são coisas SEPARADAS.

   - Nome:   texto livre, editável, vem do evento.
             Sem evento, é apenas "APOSTA".
   - Código: chip próprio, imutável, sempre ao lado.

   Um nunca entra dentro do outro.

   Maiúsculas só na exibição. O banco guarda o texto
   como você digitou.
══════════════════════════════════════════════════ */

/** O nome quando não há evento. Nunca inclui o código. */
export const nomePadrao = () => "APOSTA";

/**
 * O nome que aparece na lista, no modal e nas confirmações.
 * Uma função só, para as telas nunca divergirem.
 *
 * Apostas antigas foram gravadas como "Aposta LX8Z", com o
 * código grudado no nome. Aqui esse resíduo é removido: o
 * código tem o chip dele.
 */
export const tituloAposta = (b) => {
  if (!b) return nomePadrao();

  let base = (b.nome || nomeDoEvento(b.evento) || "").trim();
  if (!base) return nomePadrao();

  // Limpa o código que versões antigas grudaram no nome:
  // "Aposta LX8Z", "APOSTA #LX8Z" -> "APOSTA"
  if (b.codigo) {
    const limpo = base.toUpperCase().replace(/^APOSTA\s+#?/, "");
    if (limpo === b.codigo.toUpperCase()) return nomePadrao();
  }

  return base.toUpperCase();
};

/**
 * Tira o confronto de dentro do evento, para virar o nome da aposta.
 *
 * "Flamengo x Palmeiras — Mais de 1.5 gols"  -> "Flamengo x Palmeiras"
 * "Mais de 1.5 gols - Flamengo x Palmeiras"  -> "Flamengo x Palmeiras"
 * "Vencedor: Corinthians vs São Paulo"       -> "Corinthians vs São Paulo"
 * "Múltipla de 3 seleções"                   -> "Múltipla de 3 seleções"
 */
export const nomeDoEvento = (evento) => {
  if (!evento) return "";
  const bruto = String(evento).replace(/\s+/g, " ").trim();
  if (!bruto) return "";

  const corta = (s) => (s.length > 48 ? s.slice(0, 45).trimEnd() + "\u2026" : s);

  // Um time: letras, números, ponto, apóstrofo, hífen e espaço. Sem dígitos soltos.
  const TIME = "[\\p{L}][\\p{L}\\p{N}.'\\-]*(?: [\\p{L}][\\p{L}\\p{N}.'\\-]*){0,3}";
  // Separadores de confronto. Guardamos qual foi usado para devolver igual.
  const SEP = "(x|vs\\.?|v)";

  const re = new RegExp(`(${TIME})\\s+${SEP}\\s+(${TIME})`, "iu");
  const m = bruto.match(re);

  if (m) {
    const a = m[1].trim();
    const sep = m[2].toLowerCase().startsWith("vs") ? "vs" : "x";
    const b = m[3].trim();
    if (a && b) return corta(`${a} ${sep} ${b}`);
  }

  // Sem confronto: primeiro pedaço antes de travessão, barra vertical ou hífen cercado.
  const pedaco = bruto.split(/\s+[\u2014\u2013|]\s+|\s+-\s+/)[0].trim();
  return corta(pedaco || bruto);
};

export const cfgFromRow = (r) => ({
  banca: Number(r.banca),
  metaPct: Number(r.meta_pct),
  stopPct: Number(r.stop_pct),
  stakes: r.stakes || [],
});

export const cfgToRow = (c) => ({
  banca: n(c.banca),
  meta_pct: n(c.metaPct),
  stop_pct: n(c.stopPct),
  stakes: c.stakes.map((s) => ({ ...s, pct: n(s.pct) })),
});

/* ══════════════════════════════════════════════════
   DEPÓSITOS E SAQUES

   Movimento de caixa entre você e as casas.
   NÃO é lucro. Não entra na meta nem no stop loss.
══════════════════════════════════════════════════ */

export const TIPOS = {
  deposito: { label: "Depósito", sinal: +1, verbo: "depositou" },
  saque:    { label: "Saque",    sinal: -1, verbo: "sacou" },
};

export const movFromRow = (r) => ({
  id: r.id,
  usuarioId: r.usuario_id,
  casaId: r.casa_id || "",          // vazio se a casa foi excluída
  contaId: r.conta_id || "",
  tipo: r.tipo,
  valor: Number(r.valor),
  data: r.data,
  metodo: r.metodo || "",
  obs: r.obs || "",
});

export const movToInsert = (m, usuarioId) => ({
  usuario_id: m.usuarioId || usuarioId,
  casa_id: m.casaId || null,
  conta_id: m.contaId || null,
  tipo: m.tipo,
  valor: n(m.valor),
  data: m.data,
  metodo: m.metodo || "",
  obs: m.obs || "",
});

/** Não inclui usuario_id: o dono nunca muda. O banco também recusa. */
export const movToUpdate = (m) => ({
  casa_id: m.casaId || null,
  conta_id: m.contaId || null,
  tipo: m.tipo,
  valor: n(m.valor),
  data: m.data,
  metodo: m.metodo || "",
  obs: m.obs || "",
});

/* ══════════════════════════════════════════════════
   CONTAS DE ACESSO

   Uma casa pode ter várias. Cada conta pertence a quem
   a cadastrou, e o dono nunca muda.
══════════════════════════════════════════════════ */

export const contaFromRow = (r) => ({
  id: r.id,
  casaId: r.casa_id,
  usuarioId: r.usuario_id,
  apelido: r.apelido || "",
  login: r.login || "",
  senha: r.senha || "",
  obs: r.obs || "",
});

export const contaToInsert = (c, usuarioId) => ({
  casa_id: c.casaId,
  usuario_id: c.usuarioId || usuarioId,
  apelido: c.apelido || "",
  login: c.login || "",
  senha: c.senha || "",
  obs: c.obs || "",
});

/** Sem usuario_id: o dono é imutável. */
export const contaToUpdate = (c) => ({
  apelido: c.apelido || "",
  login: c.login || "",
  senha: c.senha || "",
  obs: c.obs || "",
});

/** "Principal" quando não há apelido, ou o próprio login. */
export const nomeDaConta = (c) => {
  if (!c) return "";
  return c.apelido || c.login || "Conta sem nome";
};

/** Quanto entrou menos quanto saiu. Positivo = você pôs mais do que tirou. */
export const saldoMovimentos = (movs) =>
  movs.reduce((s, m) => s + TIPOS[m.tipo].sinal * n(m.valor), 0);

export const totalPorTipo = (movs, tipo) =>
  movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + n(m.valor), 0);

/**
 * Caixa de cada casa: o que foi depositado, menos o sacado,
 * mais o lucro das apostas resolvidas naquela casa.
 *
 * É uma estimativa do que deve estar lá dentro agora.
 */
export const caixaPorCasa = (casas, movs, bets) =>
  casas.map((c) => {
    const m = movs.filter((x) => x.casaId === c.id);
    const b = bets.filter((x) => x.casaId === c.id && fechada(x));
    const dep = totalPorTipo(m, "deposito");
    const saq = totalPorTipo(m, "saque");
    const luc = b.reduce((s, x) => s + lucro(x), 0);
    return { casa: c, dep, saq, luc, caixa: dep - saq + luc, qtd: m.length };
  });
