/* ══════════════════════════════════════════════════════
   Leitura do bilhete direto no navegador, sem chave e
   sem servidor. Usa Tesseract (OCR) e depois interpreta
   o texto com regras feitas para bilhetes brasileiros.

   É a rede de proteção: entra quando não há chave de IA
   configurada, ou quando a IA falha.
══════════════════════════════════════════════════════ */

/** "1.234,56" -> 1234.56 · "84,00" -> 84 · "1.85" -> 1.85 */
function numeroBR(s) {
  if (!s) return NaN;
  let t = String(s).trim();
  const temPonto = t.includes(".");
  const temVirgula = t.includes(",");

  if (temPonto && temVirgula) {
    t = t.replace(/\./g, "").replace(",", ".");        // ponto = milhar
  } else if (temVirgula) {
    t = t.replace(",", ".");                            // vírgula = decimal
  } else if (temPonto) {
    const casas = t.split(".").pop().length;
    if (casas === 3) t = t.replace(/\./g, "");          // 1.234 = milhar
  }
  return parseFloat(t);
}

const perto = (a, b, tol = 0.04) => Math.abs(a - b) <= Math.abs(b) * tol;

/* ─────────── interpretação do texto lido ─────────── */

export function interpretar(texto) {
  const bruto = texto.replace(/\u00a0/g, " ");
  const linhas = bruto.split("\n").map((l) => l.trim()).filter(Boolean);

  // ── todos os valores em reais ──
  const moedas = [...bruto.matchAll(/R\$\s*([\d.]*\d(?:[.,]\d{2})?)/g)]
    .map((m) => numeroBR(m[1]))
    .filter((v) => !isNaN(v) && v > 0);

  // ── odd ──
  // primeiro procura numa linha que fale de odd/cotação
  let odd = NaN;
  const linhaOdd = linhas.find((l) => /odd|cota[cç][aã]o|cotacao|total\s*odds/i.test(l));
  if (linhaOdd) {
    const m = linhaOdd.replace(/R\$\s*[\d.,]+/g, " ").match(/\b(\d{1,3}[.,]\d{2})\b/);
    if (m) odd = numeroBR(m[1]);
  }
  // se não achou, pega o melhor candidato do texto inteiro
  if (isNaN(odd) || odd <= 1.01) {
    const semMoeda = bruto.replace(/R\$\s*[\d.,]+/g, " ");
    const cands = [...semMoeda.matchAll(/\b(\d{1,3}[.,]\d{2})\b/g)]
      .map((m) => numeroBR(m[1]))
      .filter((v) => v > 1.01 && v < 300);
    if (cands.length) odd = cands[0];
  }

  // ── valor apostado ──
  let valor = NaN;
  const linhaStake = linhas.find((l) =>
    /valor\s*(da)?\s*aposta|total\s*apostado|aposta\s*[:\-]|stake|voc[eê]\s*apostou/i.test(l)
  );
  if (linhaStake) {
    const m = linhaStake.match(/R\$\s*([\d.]*\d(?:[.,]\d{2})?)/);
    if (m) valor = numeroBR(m[1]);
  }

  // ainda sem valor: se a odd é confiável, o par (aposta, retorno)
  // satisfaz retorno ≈ aposta × odd. Isso identifica a stake com segurança.
  if (isNaN(valor) && !isNaN(odd) && odd > 1.01 && moedas.length >= 2) {
    for (const a of moedas) {
      for (const b of moedas) {
        if (a !== b && perto(b, a * odd)) { valor = a; break; }
      }
      if (!isNaN(valor)) break;
    }
  }

  // último recurso: a menor quantia da tela costuma ser a stake
  if (isNaN(valor) && moedas.length) valor = Math.min(...moedas);

  // ── casa ──
  const CASAS = ["bet365", "betano", "superbet", "estrela bet", "sportingbet", "kto", "betfair", "novibet", "vbet", "pixbet", "esportes da sorte", "betnacional", "stake"];
  const casa = CASAS.find((c) => bruto.toLowerCase().includes(c)) || "";

  // ── evento ──
  // O mercado apostado quase sempre vem LOGO ABAIXO do confronto.
  // Descartamos nome de casa, rótulos e linhas que são só número.
  const RUIDO = new RegExp(
    `^(${CASAS.join("|")})$|` +
    `odd|cota[cç][aã]o|cotacao|aposta|stake|retorno|poss[ií]vel|ganho|total|bilhete|simples|m[uú]ltipla|combinada`,
    "i"
  );
  const ehRuido = (l) =>
    RUIDO.test(l) || /R\$/.test(l) || /^[\d.,\s]+$/.test(l) || l.length < 4;

  let evento = "";
  const iJogo = linhas.findIndex(
    (l) => /\s(x|vs?\.?)\s/i.test(l) && l.length > 6 && !/R\$/.test(l)
  );
  if (iJogo !== -1) {
    const linhaJogo = linhas[iJogo];
    evento = linhaJogo;
    const mercado =
      linhas.slice(iJogo + 1, iJogo + 3).find((l) => !ehRuido(l)) ||
      linhas.slice(Math.max(0, iJogo - 2), iJogo).reverse().find((l) => !ehRuido(l));
    if (mercado) evento = `${linhaJogo} \u2014 ${mercado}`;
  }

  const achouAlgo = !isNaN(odd) || !isNaN(valor) || !!evento;

  return {
    encontrou: achouAlgo,
    evento: evento || "",
    odd: isNaN(odd) ? null : Number(odd.toFixed(2)),
    valor: isNaN(valor) ? null : Number(valor.toFixed(2)),
    casa,
    confianca: !isNaN(odd) && !isNaN(valor) && evento ? "media" : "baixa",
  };
}

/* ─────────── OCR ─────────── */

let _worker = null;

/**
 * Lê uma imagem de bilhete no próprio aparelho.
 * @param {File|Blob} arquivo
 * @param {(pct:number)=>void} aoProgredir  0 a 100
 */
export async function lerBilheteNoAparelho(arquivo, aoProgredir) {
  const { createWorker } = await import("tesseract.js");

  if (!_worker) {
    _worker = await createWorker("por", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && aoProgredir) {
          aoProgredir(Math.round(m.progress * 100));
        }
      },
    });
  }

  const { data } = await _worker.recognize(arquivo);
  return interpretar(data.text || "");
}

/** Solta a memória do OCR quando o modal fecha. */
export async function encerrarOcr() {
  if (_worker) {
    try { await _worker.terminate(); } catch {}
    _worker = null;
  }
}
