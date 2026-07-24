// ── helpers de número, data e dinheiro ──

export const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * A data de hoje no fuso do aparelho, no formato AAAA-MM-DD.
 *
 * NÃO usar toISOString(): ela devolve UTC, então às 21h em Brasília
 * (UTC−3) já viraria o dia seguinte. Aqui montamos a data a partir
 * dos componentes locais, então "hoje" é o hoje de quem está olhando.
 */
export const hoje = () => dataLocal(new Date());

/** Uma data qualquer no formato AAAA-MM-DD, no fuso local. */
export const dataLocal = (d) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

/** Data e hora local: "10/07/2026 às 21h34". Para carimbo de registro. */
export const dataHoraBR = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} \u00e0s ${hh}h${mm}`;
};

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
  criadoEm: r.criado_em || null,
  editadoEm: r.editado_em || null,
  data: r.data,
  dataJogo: r.data_jogo || r.data,      // quando a bola rola (manda no dia)
  horaJogo: r.hora_jogo || "",
  usuarioId: r.usuario_id,
  casaId: r.casa_id || "",
  evento: r.evento || "",
  stakePct: Number(r.stake_pct),
  valor: Number(r.valor),
  odd: Number(r.odd),
  status: r.status,
  cashoutValor: r.cashout_valor == null ? "" : Number(r.cashout_valor),
  obs: r.obs || "",
  tipo: r.tipo || "simples",
  pernas: pernasNormalizadas(r),
  ganhoPotencial: r.ganho_potencial == null ? null : Number(r.ganho_potencial),
});

/**
 * Linha para INSERIR uma aposta nova.
 * "nome" vazio faz o banco gravar "Aposta " + código.
 */
export const betToInsert = (b, usuarioId) => {
  const pernas = pernasLimpas(b);
  const tipo = pernas.length > 1 ? "multipla" : "simples";
  // A odd do bilhete é a que veio do print ou que você digitou.
  // Só cai no produto das pernas se não houver odd informada.
  const odd = n(b.odd) > 1 ? n(b.odd) : oddTotal(pernas);
  return {
    usuario_id: b.usuarioId || usuarioId,
    casa_id: b.casaId || null,
    data: b.data,
  data_jogo: b.dataJogo || b.data,
  hora_jogo: (b.horaJogo || "").trim(),
    nome: b.nome || "",
    evento: eventoDasPernas(b, pernas),
    stake_pct: n(b.stakePct),
    valor: n(b.valor),
    odd,
    status: b.status,
    cashout_valor: b.status === "cashout" ? n(b.cashoutValor) : null,
    obs: b.obs || "",
    tipo,
    pernas,
    ganho_potencial: n(b.valor) * odd,
  };
};

/**
 * Linha para ATUALIZAR uma aposta existente.
 *
 * Nome e evento podem mudar. O "codigo" e o "usuario_id" NÃO
 * entram aqui: são a identidade da aposta. Omitir é a primeira
 * barreira; o banco tem um gatilho que recusa a alteração,
 * mesmo se alguém chamar a API por fora do app.
 */
export const betToUpdate = (b) => {
  const pernas = pernasLimpas(b);
  const tipo = pernas.length > 1 ? "multipla" : "simples";
  const odd = n(b.odd) > 1 ? n(b.odd) : oddTotal(pernas);
  return {
    casa_id: b.casaId || null,
    data: b.data,
  data_jogo: b.dataJogo || b.data,
  hora_jogo: (b.horaJogo || "").trim(),
    nome: b.nome || "",
    evento: eventoDasPernas(b, pernas),
    stake_pct: n(b.stakePct),
    valor: n(b.valor),
    odd,
    status: b.status,
    cashout_valor: b.status === "cashout" ? n(b.cashoutValor) : null,
    obs: b.obs || "",
    tipo,
    pernas,
    ganho_potencial: n(b.valor) * odd,
  };
};

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

/* ══════════════════════════════════════════════════
   PERNAS DO BILHETE

   Uma aposta simples é uma perna só. Uma múltipla tem
   várias, e a odd total é o produto das odds.

   Guardamos as pernas como JSON dentro da aposta porque
   elas sempre viajam junto e são resolvidas em bloco.
   Cada perna tem: confronto, mercado, seleção, odd, dataJogo.
══════════════════════════════════════════════════ */

export const pernaVazia = () => ({
  confronto: "",
  mercado: "",
  selecao: "",
  odd: "",
  dataJogo: "",
});

/** A odd total do bilhete: o produto das odds das pernas válidas. */
export const oddTotal = (pernas) => {
  const validas = (pernas || []).filter((p) => n(p.odd) > 0);
  if (!validas.length) return 0;
  return validas.reduce((a, p) => a * n(p.odd), 1);
};

/**
 * As pernas de uma aposta vinda do banco.
 * Apostas antigas não têm pernas: viram uma perna a partir
 * do evento e da odd que já estavam salvos.
 */
export const pernasNormalizadas = (r) => {
  const p = r.pernas;
  if (Array.isArray(p) && p.length) return p;
  return [{
    confronto: r.evento || "",
    mercado: "",
    selecao: "",
    odd: r.odd == null ? "" : Number(r.odd),
    dataJogo: "",
  }];
};

/** As pernas de um formulário, sem as vazias, prontas para gravar. */
export const pernasLimpas = (b) => {
  const p = Array.isArray(b.pernas) ? b.pernas : [];
  const validas = p
    .filter((x) => (x.confronto || "").trim() || (x.selecao || "").trim() || n(x.odd) > 0)
    .map((x) => ({
      confronto: (x.confronto || "").trim(),
      mercado: (x.mercado || "").trim(),
      selecao: (x.selecao || "").trim(),
      odd: n(x.odd),
      dataJogo: x.dataJogo || "",
    }));
  // Nenhuma perna preenchida: cai no modo antigo (evento + odd num campo só).
  if (!validas.length && (b.evento || n(b.odd) > 0)) {
    return [{ confronto: (b.evento || "").trim(), mercado: "", selecao: "", odd: n(b.odd), dataJogo: "" }];
  }
  return validas;
};

/**
 * O texto do campo "evento" a partir das pernas.
 * Mantém compatibilidade: telas e buscas antigas leem "evento".
 * Simples: o confronto da perna. Múltipla: "Confronto (+N seleções)".
 */
export const eventoDasPernas = (b, pernas) => {
  const ps = pernas || pernasLimpas(b);
  if (!ps.length) return (b.evento || "").trim();
  if (ps.length === 1) return ps[0].confronto || (b.evento || "").trim();
  const primeiro = ps[0].confronto || ps[0].selecao || "Múltipla";
  return `${primeiro} (+${ps.length - 1})`;
};

/** Resumo curto de uma perna para a lista: "Mercado · Seleção". */
export const resumoPerna = (p) => {
  if (!p) return "";
  const partes = [p.mercado, p.selecao].map((x) => (x || "").trim()).filter(Boolean);
  return partes.join(" \u00b7 ");
};

export const cfgFromRow = (r) => ({
  banca: Number(r.banca),
  saldoBanco: Math.round(Number(r.saldo_banco || 0) * 100) / 100,
  metaPct: Number(r.meta_pct),
  stopPct: Number(r.stop_pct),
  stakes: r.stakes || [],
});

export const cfgToRow = (c) => ({
  banca: n(c.banca),
  saldo_banco: n(c.saldoBanco),
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


/* ══════════════════════════════════════════════════
   PATRIMÔNIO

   Quanto dinheiro você tem, somando tudo:
   - o que está parado na conta do banco (você informa)
   - o que está em cada casa (depósito - saque + lucro)

   A grande ideia: depositar não muda o total, porque o
   dinheiro só troca de bolso. Só muda quando você ganha
   ou perde uma aposta.

   Isto é SEPARADO da banca. A banca é a régua fixa que
   define stakes e metas. O patrimônio sobe e desce.
══════════════════════════════════════════════════ */

export const patrimonio = (saldoBanco, casas, movs, bets) => {
  const casasComSaldo = caixaPorCasa(casas, movs, bets);
  const nasCasas = casasComSaldo.reduce((s, c) => s + c.caixa, 0);

  // Movimentos de casas que foram excluídas ainda contam no dinheiro em jogo.
  const idsCasas = new Set(casas.map((c) => c.id));
  const orfaos = movs.filter((m) => !m.casaId || !idsCasas.has(m.casaId));
  const depOrfao = totalPorTipo(orfaos, "deposito");
  const saqOrfao = totalPorTipo(orfaos, "saque");
  const foraDeCasa = depOrfao - saqOrfao;

  return {
    saldoBanco: n(saldoBanco),
    nasCasas,
    foraDeCasa,
    casas: casasComSaldo.filter((c) => c.qtd > 0 || c.luc !== 0),
    total: n(saldoBanco) + nasCasas + foraDeCasa,
  };
};

/* ══════════════════════════════════════════════════
   MENSAGENS DO CHAT

   Uma conversa só, entre os dois usuários. Cada mensagem
   tem um autor, um texto, e pode carregar uma aposta anexada.
══════════════════════════════════════════════════ */

export const msgFromRow = (r) => ({
  id: r.id,
  autorId: r.autor_id,
  texto: r.texto || "",
  apostaId: r.aposta_id || "",
  criadoEm: r.criado_em || null,
  editadoEm: r.editado_em || null,
  respondeA: r.responde_a || "",
  tipo: r.tipo || "texto",            // texto, imagem ou audio
  arquivoUrl: r.arquivo_url || "",
  duracao: r.duracao ?? null,         // segundos, para o áudio
  temporaria: !!r.temporaria,         // some depois de vista 2 vezes
  vistas: r.vistas ?? 0,
  expirada: !!r.expirada,
});

export const msgToInsert = (m, autorId) => ({
  autor_id: m.autorId || autorId,
  texto: (m.texto || "").trim(),
  aposta_id: m.apostaId || null,
  responde_a: m.respondeA || null,
  tipo: m.tipo || "texto",
  arquivo_url: m.arquivoUrl || "",
  duracao: m.duracao ?? null,
  temporaria: !!m.temporaria,
});

/** Agrupa mensagens por dia, para separadores de data na conversa. */
export const mensagensPorDia = (msgs) => {
  const grupos = {};
  for (const m of msgs) {
    const dia = (m.criadoEm || "").slice(0, 10);
    (grupos[dia] = grupos[dia] || []).push(m);
  }
  return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
};

/** "14h59", para a bolha da mensagem. */
export const horaBR = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
};

/* ══════════════════════════════════════════════════
   EVENTOS DO BILHETE (agrupamento visual)

   As pernas continuam planas no banco (cada uma com seu
   confronto). Na tela, agrupamos por confronto para mostrar
   "eventos": um jogo com várias seleções dentro.

   Assim uma aposta pode ter vários eventos, cada um com
   quantas seleções você quiser, sem mudar o banco.
══════════════════════════════════════════════════ */

/** Agrupa as pernas por confronto, preservando a ordem. */
export const agruparPorEvento = (pernas) => {
  const grupos = [];
  const indice = {};
  for (const p of (pernas || [])) {
    const chave = (p.confronto || "").trim();
    if (!(chave in indice)) {
      indice[chave] = grupos.length;
      grupos.push({ confronto: chave, selecoes: [] });
    }
    grupos[indice[chave]].selecoes.push({
      selecao: p.selecao || "",
      mercado: p.mercado || "",
      odd: p.odd ?? "",
    });
  }
  return grupos.length ? grupos : [{ confronto: "", selecoes: [selecaoVazia()] }];
};

/** Desmonta os eventos de volta em pernas planas, para gravar. */
export const achatarEventos = (eventos) => {
  const pernas = [];
  for (const ev of (eventos || [])) {
    for (const s of (ev.selecoes || [])) {
      pernas.push({
        confronto: (ev.confronto || "").trim(),
        selecao: (s.selecao || "").trim(),
        mercado: (s.mercado || "").trim(),
        odd: n(s.odd),
        dataJogo: "",
      });
    }
  }
  return pernas;
};

/** Uma seleção vazia (jogador + tipo + odd). */
export const selecaoVazia = () => ({ selecao: "", mercado: "", odd: "" });

/** Um evento vazio (um jogo com uma seleção em branco). */
export const eventoVazio = () => ({ confronto: "", selecoes: [selecaoVazia()] });


/**
 * A data que manda numa aposta: a do jogo.
 * A aposta pertence ao dia em que a bola rola, não ao dia em que
 * você a registrou. Apostas antigas (sem data de jogo) caem na
 * data de registro, mantendo o comportamento anterior.
 */
export const diaDaAposta = (b) => b?.dataJogo || b?.data || "";

/** Soma dias a uma data YYYY-MM-DD, no fuso local. */
export const somarDias = (data, dias) => {
  const [a, m, d] = String(data || hoje()).split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  dt.setDate(dt.getDate() + Number(dias || 0));
  return dataLocal(dt);
};

/* ══════════════════════════════════════════════════
   DATA E HORA NO FORMATO BRASILEIRO

   O navegador mostra data e hora conforme o idioma do
   sistema, o que traz AM/PM e mês antes do dia. Aqui
   controlamos o formato: dd/mm/aaaa e 24 horas.
══════════════════════════════════════════════════ */

/** "2026-07-23" vira "23/07/2026". */
export const paraBR = (iso) => {
  if (!iso) return "";
  const [a, m, d] = String(iso).split("-");
  return d && m && a ? `${d}/${m}/${a}` : "";
};

/** "23/07/2026" vira "2026-07-23". Devolve vazio se estiver incompleta. */
export const deBR = (br) => {
  const so = String(br || "").replace(/\D/g, "");
  if (so.length !== 8) return "";
  const d = so.slice(0, 2), m = so.slice(2, 4), a = so.slice(4, 8);
  const dia = Number(d), mes = Number(m);
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return "";
  return `${a}-${m}-${d}`;
};

/** Vai formatando a data enquanto a pessoa digita: 23 -> 23/07 -> 23/07/2026 */
export const mascaraData = (texto) => {
  const so = String(texto || "").replace(/\D/g, "").slice(0, 8);
  if (so.length <= 2) return so;
  if (so.length <= 4) return `${so.slice(0, 2)}/${so.slice(2)}`;
  return `${so.slice(0, 2)}/${so.slice(2, 4)}/${so.slice(4)}`;
};

/** Máscara de hora em 24h: 22 -> 22:00 -> 22:30. Sem AM/PM. */
export const mascaraHora = (texto) => {
  const so = String(texto || "").replace(/\D/g, "").slice(0, 4);
  if (so.length <= 2) return so;
  return `${so.slice(0, 2)}:${so.slice(2)}`;
};

/** Confere se a hora está entre 00:00 e 23:59. */
export const horaValida = (h) => {
  const m = String(h || "").match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return false;
  return Number(m[1]) <= 23 && Number(m[2]) <= 59;
};

/** "22:30" vira "22h30". Só para mostrar. */
export const horaBonita = (h) => {
  if (!h) return "";
  const [hh, mm] = String(h).split(":");
  return mm ? `${hh}h${mm}` : `${hh}h`;
};

/* ══════════════════════════════════════════════════
   ARQUIVOS DO CHAT

   Imagem de celular tem vários MB. Antes de enviar,
   reduzimos o tamanho e a qualidade: fica com algumas
   centenas de KB, sem diferença visível na tela, e o
   armazenamento gratuito dura muito mais.
══════════════════════════════════════════════════ */

/**
 * Reduz uma imagem antes do envio.
 * Devolve um arquivo menor, pronto para subir.
 */
export const comprimirImagem = (arquivo, larguraMax = 1600, qualidade = 0.82) =>
  new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type?.startsWith("image/")) return resolve(arquivo);
    // GIF animado perde a animação se redesenhado: passa direto.
    if (arquivo.type === "image/gif") return resolve(arquivo);

    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não consegui ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const l = Math.round(img.width * escala);
        const a = Math.round(img.height * escala);

        const tela = document.createElement("canvas");
        tela.width = l;
        tela.height = a;
        const ctx = tela.getContext("2d");
        ctx.drawImage(img, 0, 0, l, a);

        tela.toBlob(
          (blob) => {
            if (!blob) return resolve(arquivo);         // deu ruim: manda o original
            if (blob.size >= arquivo.size) return resolve(arquivo);  // não melhorou
            resolve(new File([blob], trocarExtensao(arquivo.name, "jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          qualidade
        );
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });

const trocarExtensao = (nome, nova) =>
  String(nome || "imagem").replace(/\.[^.]+$/, "") + "." + nova;

/** Caminho do arquivo no Storage: cada um na sua pasta. */
export const caminhoArquivo = (usuarioId, nome) => {
  const limpo = String(nome || "arquivo").replace(/[^\w.-]/g, "_").slice(-60);
  return `${usuarioId}/${Date.now()}-${limpo}`;
};

/** "1:05" a partir de segundos, para a duração do áudio. */
export const duracaoBonita = (segundos) => {
  const s = Math.max(0, Math.round(Number(segundos) || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

/** Tamanho legível, para avisar quando um arquivo é grande demais. */
export const tamanhoBonito = (bytes) => {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};
