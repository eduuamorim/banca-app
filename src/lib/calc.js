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
 * Não inclui "nome", "evento", "codigo" nem "usuario_id".
 * Esses campos são a identidade da aposta e nunca mudam depois
 * de cadastrada. Omitir aqui é a garantia de verdade: mesmo que
 * alguém force a tela, o update não carrega esses valores.
 *
 * O banco também recusa a alteração, por gatilho.
 */
export const betToUpdate = (b) => ({
  casa_id: b.casaId || null,
  data: b.data,
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

/* ── nome padrão da aposta ── */

/** "Aposta K3F9" quando a leitura não trouxe nada. */
export const nomePadrao = (codigo) => (codigo ? `Aposta ${codigo}` : "Aposta");

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
