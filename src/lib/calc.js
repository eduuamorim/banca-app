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

export const betToRow = (b, usuarioId) => ({
  usuario_id: b.usuarioId || usuarioId,
  casa_id: b.casaId || null,
  data: b.data,
  evento: b.evento || "",
  stake_pct: n(b.stakePct),
  valor: n(b.valor),
  odd: n(b.odd),
  status: b.status,
  cashout_valor: b.status === "cashout" ? n(b.cashoutValor) : null,
  obs: b.obs || "",
});

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
