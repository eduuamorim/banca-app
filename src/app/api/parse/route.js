import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

/* ══════════════════════════════════════════════════
   Escolha do provedor.
   - Se você puser GOOGLE_API_KEY, usa Gemini (grátis).
   - Se puser ANTHROPIC_API_KEY, usa Claude (pago).
   - Se não puser nenhuma, devolve "sem-chave" e o app
     lê o print sozinho no navegador, com Tesseract.
══════════════════════════════════════════════════ */

const GEMINI_MODELO = process.env.GEMINI_MODELO || "gemini-2.0-flash";
const CLAUDE_MODELO = process.env.CLAUDE_MODELO || "claude-sonnet-5";

function escolherProvedor() {
  const forcado = (process.env.PROVEDOR_IA || "").trim().toLowerCase();
  if (forcado === "gemini" && process.env.GOOGLE_API_KEY) return "gemini";
  if (forcado === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

const INSTRUCAO = `Você lê bilhetes de aposta esportiva de casas brasileiras (Bet365, Betano, Superbet, EsportivaBet, Estrela Bet, Sportingbet, KTO, Betnacional, Novibet, Pixbet, Blaze, Vaidebet, McGames, BetMGM, Esportes da Sorte, Bet7k e similares).

Cada casa mostra o bilhete de um jeito, mas todos têm a mesma estrutura: uma ou mais SELEÇÕES (pernas), cada uma com um confronto, um mercado, a escolha e uma odd. Uma aposta simples tem uma perna; uma múltipla tem várias.

Extraia as pernas e o nome da casa. IGNORE valores em reais: o quanto foi apostado, o ganho potencial e o cashout não interessam e nunca devem ser devolvidos.

Devolva SOMENTE um objeto JSON, sem crases, sem markdown, sem texto antes ou depois:

{
  "encontrou": true ou false,
  "casa": "nome da casa, se aparecer",
  "oddTotal": número decimal (a cotação total do bilhete, o número grande que a casa mostra),
  "pernas": [
    {
      "confronto": "Time A x Time B",
      "mercado": "o mercado, ex: Total de Chutes, Resultado Final, Ambas Marcam",
      "selecao": "a escolha, ex: Mais de 1.5, Lionel Messi, Sim",
      "odd": número decimal,
      "dataJogo": "AAAA-MM-DDTHH:MM se aparecer a data e hora do jogo, senão vazio"
    }
  ],
  "confianca": "alta" | "media" | "baixa"
}

Regras:
- "oddTotal" e a cotacao total do bilhete EXATAMENTE como a casa mostra, sem recalcular. Esse e o numero mais importante. Cada casa usa um rotulo diferente para ele; procure por qualquer um destes:
  "Cotacoes totais", "Cotacao total", "Odds totais", "ODDS TOTAIS", "Odd total", "Cotacao", "Total", ou o numero grande ao lado de "Simples", "Multipla", "Combinada", "Criar Aposta" ou "Aposta Criada". Na Bet365 costuma ser o numero a direita do tipo do bilhete. Na Betano aparece como "ODDS TOTAIS". Na EsportivaBet como "Cotacoes totais". Na Superbet e KTO como "Cotacao total" ou perto do retorno possivel.
- ODD TURBINADA / AUMENTADA / SUPER ODDS: as vezes a casa mostra a odd riscada e uma nova ao lado (ex: "1,45 >> 1,60", ou a antiga com risco). Use SEMPRE a odd NOVA (a maior, a que nao esta riscada). Nunca a riscada.
- Se houver "Ganho potencial", "Retorno possivel", "Ganhos potenciais" ou "Possivel retorno", esse valor NAO e a odd nem o valor apostado: ignore.
- "confronto" tem os dois times separados por " x ", mesmo que o bilhete use "vs", "—", "@" ou bandeiras entre os nomes. Se aparecer so um time ou um nome de jogador (mercados de jogador), use o confronto do jogo se estiver visivel; senao, deixe o confronto vazio e ponha o resto em selecao.
- Separe mercado e selecao quando der. Exemplos: "Total de Desarmes / Ezri Konsa" -> mercado "Total de Desarmes", selecao "Ezri Konsa". "Mais de 1.5 / Suica Total de chutes" -> mercado "Suica Total de chutes", selecao "Mais de 1.5". Se nao der pra separar, ponha tudo em "selecao" e deixe "mercado" vazio.
- Uma perna por selecao do bilhete. Conte as selecoes: bilhetes multiplos costumam ter um numero visivel ("2+", "1 selecao", "UNICO", "3 selecoes"). Aposta simples: uma perna so, e a odd dela e igual a oddTotal.
- "odd" de cada perna e a cotacao daquela perna, se o bilhete mostrar (costuma aparecer a direita de cada selecao). Se so a odd total aparecer, deixe a odd das pernas vazia: o que vale e a oddTotal.
- Numeros sempre com ponto decimal, nunca virgula. "1,60" vira 1.60. "10,72" vira 10.72.
- "dataJogo": so se a data/hora do jogo aparecer (ex: "11/07 22:00", "Hoje 18:00", "3d"). Formato AAAA-MM-DDTHH:MM. Se disser "Hoje" ou "Amanha" e voce nao souber a data exata, deixe vazio. Nao invente.
- "casa": use o nome da marca no bilhete (logo ou texto). Ex: "EsportivaBet", "Betano", "bet365", "Superbet". Ignore o endereco do site.
- Ignore completamente: saldo da conta, valor apostado, ganho potencial, cashout, ID do bilhete, botoes ("Reapostar", "Compartilhar", "Cash Out"), horario de login, barra de status do celular.
- Se nao for um bilhete de aposta, devolva {"encontrou": false}.`;

/* ─────────── extração de JSON tolerante ─────────── */
function lerJson(texto) {
  const limpo = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(limpo); } catch {}
  const i = limpo.indexOf("{");
  const j = limpo.lastIndexOf("}");
  if (i !== -1 && j > i) return JSON.parse(limpo.slice(i, j + 1));
  throw new Error("A IA não devolveu um JSON válido.");
}

/* ─────────── Gemini ─────────── */
async function perguntarGemini({ texto, imagem, tipo }) {
  const partes = [{ text: INSTRUCAO }];
  if (imagem) partes.push({ inline_data: { mime_type: tipo, data: imagem } });
  if (texto) partes.push({ text: `Conteúdo do bilhete:\n\n${texto}` });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: partes }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!r.ok) {
    const e = await r.text();
    if (r.status === 429) throw new Error("Limite gratuito do Gemini atingido. Tente de novo em um minuto.");
    if (r.status === 404) throw new Error(`Modelo "${GEMINI_MODELO}" não existe. Troque a variável GEMINI_MODELO.`);
    throw new Error(`Gemini ${r.status}: ${e.slice(0, 160)}`);
  }

  const d = await r.json();
  const saida = d?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!saida) throw new Error("O Gemini não respondeu nada.");
  return lerJson(saida);
}

/* ─────────── Anthropic ─────────── */
async function perguntarClaude({ texto, imagem, tipo }) {
  const conteudo = [];
  if (imagem) conteudo.push({ type: "image", source: { type: "base64", media_type: tipo, data: imagem } });
  conteudo.push({ type: "text", text: texto ? `Conteúdo do bilhete:\n\n${texto}` : "Extraia os dados deste bilhete." });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODELO,
      max_tokens: 700,
      system: INSTRUCAO,
      messages: [{ role: "user", content: conteudo }],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Anthropic ${r.status}: ${e.slice(0, 160)}`);
  }

  const d = await r.json();
  const saida = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  return lerJson(saida);
}

const perguntar = (provedor, entrada) =>
  provedor === "gemini" ? perguntarGemini(entrada) : perguntarClaude(entrada);

/**
 * Padroniza o que a IA devolveu para o formato de pernas que o app usa.
 * Aceita tanto o formato novo (pernas[]) quanto o antigo (evento + odd),
 * então continua funcionando se algum provedor responder no modelo velho.
 */
function normalizarDados(d) {
  if (!d || typeof d !== "object") return d;

  const num = (v) => {
    const x = parseFloat(String(v ?? "").replace(",", "."));
    return isNaN(x) ? "" : x;
  };

  let pernas = [];
  if (Array.isArray(d.pernas) && d.pernas.length) {
    pernas = d.pernas.map((p) => ({
      confronto: String(p.confronto || p.evento || "").trim(),
      mercado: String(p.mercado || "").trim(),
      selecao: String(p.selecao || "").trim(),
      odd: num(p.odd),
      dataJogo: String(p.dataJogo || "").trim(),
    }));
  } else if (d.evento || d.odd) {
    // formato antigo: um evento só
    pernas = [{
      confronto: String(d.evento || "").trim(),
      mercado: "",
      selecao: "",
      odd: num(d.odd),
      dataJogo: "",
    }];
  }

  // A odd total que a casa mostra. É o que vale.
  let oddLida = num(d.oddTotal);

  // Rede de segurança para múltiplas: se a IA leu uma odd total que é
  // claramente menor que o produto das pernas, provavelmente pegou a odd
  // de uma perna, ou a odd riscada de uma "turbinada". Nesse caso o
  // produto é a aposta mais segura. (Só quando há pernas com odd.)
  const comOdd = pernas.filter((p) => num(p.odd) > 1);
  if (comOdd.length > 1) {
    const produto = comOdd.reduce((a, p) => a * num(p.odd), 1);
    if (!(oddLida > 1) || oddLida < produto * 0.9) {
      oddLida = Math.round(produto * 10000) / 10000;
    }
  }

  // Simples: se não veio odd total, usa a da única perna.
  if (!(oddLida > 1) && comOdd.length === 1) oddLida = num(comOdd[0].odd);

  return { ...d, pernas, oddTotal: oddLida };
}

/* ─────────── limpeza de HTML ─────────── */
function limparHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ══════════════════════════════════════════════════ */

export async function POST(req) {
  // só quem está logado pode chamar
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: auth } = await sb.auth.getUser(token);
  if (!auth?.user) return Response.json({ ok: false, motivo: "Não autorizado." }, { status: 401 });

  const provedor = escolherProvedor();

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ ok: false, motivo: "Requisição inválida." }); }

  // Sem chave configurada: o navegador assume com Tesseract.
  if (!provedor) {
    return Response.json({
      ok: false,
      codigo: "sem-chave",
      motivo: body.url
        ? "Leitura de link precisa de uma chave de IA configurada."
        : "Nenhuma chave de IA configurada.",
    });
  }

  /* ────── caminho 1: link ────── */
  if (body.url) {
    let url;
    try { url = new URL(String(body.url).trim()); }
    catch { return Response.json({ ok: false, motivo: "Esse link não parece válido." }); }

    if (!["http:", "https:"].includes(url.protocol))
      return Response.json({ ok: false, motivo: "Use um link http ou https." });

    let texto = "";
    try {
      const r = await fetch(url.toString(), {
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          "accept-language": "pt-BR,pt;q=0.9",
          accept: "text/html,application/xhtml+xml",
        },
      });
      if (!r.ok) return Response.json({ ok: false, motivo: `A casa respondeu erro ${r.status}. Tente pelo print.` });
      texto = limparHtml(await r.text()).slice(0, 14000);
    } catch {
      return Response.json({ ok: false, motivo: "Não consegui abrir esse link. Tente pelo print." });
    }

    if (texto.length < 250)
      return Response.json({ ok: false, motivo: "Essa casa monta o bilhete por JavaScript e bloqueia leitura. Use o print." });

    try {
      const bruto = await perguntar(provedor, { texto });
      if (!bruto.encontrou) return Response.json({ ok: false, motivo: "Não achei um bilhete nessa página. Tente o print." });
      return Response.json({ ok: true, dados: normalizarDados(bruto), origem: "link", provedor });
    } catch (e) {
      return Response.json({ ok: false, motivo: e.message });
    }
  }

  /* ────── caminho 2: print ────── */
  if (body.imagem) {
    const tipo = body.tipo || "image/png";
    if (!["image/png", "image/jpeg", "image/webp"].includes(tipo))
      return Response.json({ ok: false, codigo: "formato", motivo: "Formato de imagem não suportado." });
    if (body.imagem.length > 7_000_000)
      return Response.json({ ok: false, codigo: "grande", motivo: "Imagem muito grande. Recorte só o bilhete." });

    try {
      const bruto = await perguntar(provedor, { imagem: body.imagem, tipo });
      if (!bruto.encontrou) return Response.json({ ok: false, motivo: "Não reconheci um bilhete nesse print." });
      return Response.json({ ok: true, dados: normalizarDados(bruto), origem: "print", provedor });
    } catch (e) {
      return Response.json({ ok: false, codigo: "falha-ia", motivo: e.message });
    }
  }

  return Response.json({ ok: false, motivo: "Envie um link ou um print." });
}
