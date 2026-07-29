"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Plus, Receipt, Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { C, Card, Input, Select, Btn, Empty, Money, Stat, ST, InputData } from "@/lib/ui";
import { n, brl, sgn, dBR, hoje, lucro, fechada, diaDaAposta, dataLocal, pinAtivo, apostasPorProximidade } from "@/lib/calc";
import BetRow from "./BetRow";

/* ── atalhos de período ── */
const diasAtras = (d) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return dataLocal(t);   // dia no fuso local, não em UTC
};

const PERIODOS = [
  { id: "tudo", label: "Tudo", de: () => "" },
  { id: "hoje", label: "Hoje", de: () => hoje() },
  { id: "7", label: "7 dias", de: () => diasAtras(6) },
  { id: "30", label: "30 dias", de: () => diasAtras(29) },
];

const VAZIO = {
  busca: "", usuario: "", status: "", casa: "",
  de: "", ate: "", oddMin: "", oddMax: "", valorMin: "", valorMax: "",
  periodo: "tudo",
};

export default function Apostas(p) {
  const { bets, casas, users, setModalAposta, mudarStatus, excluirAposta, fixadas, alternarFixada } = p;
  const [f, setF] = useState(VAZIO);
  const [aba, setAba] = useState("abertas");
  const [pagina, setPagina] = useState(1);
  const [avancado, setAvancado] = useState(false);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const usarPeriodo = (id) => {
    const p = PERIODOS.find((x) => x.id === id);
    setF((x) => ({ ...x, periodo: id, de: p.de(), ate: "" }));
  };

  /* quantos filtros estão ativos além do padrão */
  const ativos = useMemo(() => {
    let c = 0;
    for (const [k, v] of Object.entries(f)) {
      if (k === "periodo") { if (v !== "tudo") c++; continue; }
      if (k === "de" && f.periodo !== "tudo") continue;   // já contado no período
      if (v) c++;
    }
    return c;
  }, [f]);

  const lista = useMemo(() => {
    const termo = f.busca.trim().toLowerCase();
    return bets.filter((b) => {
      if (f.usuario && b.usuarioId !== f.usuario) return false;
      if (f.status && b.status !== f.status) return false;
      if (f.casa && (b.casaId || "") !== f.casa) return false;
      if (f.de && diaDaAposta(b) < f.de) return false;
      if (f.ate && diaDaAposta(b) > f.ate) return false;

      if (f.oddMin && n(b.odd) < n(f.oddMin)) return false;
      if (f.oddMax && n(b.odd) > n(f.oddMax)) return false;
      if (f.valorMin && n(b.valor) < n(f.valorMin)) return false;
      if (f.valorMax && n(b.valor) > n(f.valorMax)) return false;

      if (termo) {
        const casa = casas.find((c) => c.id === b.casaId)?.nome || "";
        const textoPernas = (b.pernas || []).map((x) => `${x.confronto} ${x.mercado} ${x.selecao}`).join(" ");
        const alvo = `${b.codigo} ${b.nome} ${b.evento} ${textoPernas} ${b.obs} ${casa}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [bets, casas, f]);

  const inv = lista.filter(fechada).reduce((s, b) => s + n(b.valor), 0);
  const luc = lista.filter(fechada).reduce((s, b) => s + lucro(b), 0);
  const listaAbertas = lista.filter((b) => !fechada(b));
  const abertas = listaAbertas.length;

  // Previsão de todas as abertas (respeita o filtro atual da tela).
  // Se todas ganharem: soma dos lucros potenciais. Se todas perderem: menos a soma das stakes.
  const seGanharTudo = listaAbertas.reduce((s, b) => s + n(b.valor) * (n(b.odd) - 1), 0);
  const sePerderTudo = -listaAbertas.reduce((s, b) => s + n(b.valor), 0);

  // ── abas: em aberto / resolvidas, sobre TODAS as apostas filtradas ──
  const listaResolvidas = lista.filter(fechada);
  const daAba = aba === "abertas" ? listaAbertas : listaResolvidas;

  // ── paginação: 30 por página ──
  const POR_PAGINA = 30;
  const totalPaginas = Math.max(1, Math.ceil(daAba.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const daPagina = daAba.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  // Mudou filtro ou busca: volta para a primeira página.
  useEffect(() => { setPagina(1); }, [f]);

  const grupos = useMemo(() => {
    // Em aberto: divide por proximidade do jogo (Hoje, Amanhã, ...),
    // do mais próximo ao mais distante, com rótulos amigáveis.
    if (aba === "abertas") {
      return apostasPorProximidade(daPagina).map((g) => [g.rotulo, g.apostas]);
    }
    // Resolvidas: agrupa por dia do jogo, mais recente primeiro.
    const m = {};
    daPagina.forEach((b) => (m[diaDaAposta(b)] ||= []).push(b));
    return Object.entries(m)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([data, arr]) => [dBR(data), arr]);
  }, [daPagina, aba]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Apostas</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>
            {lista.length === bets.length
              ? `${bets.length} no total`
              : `${lista.length} de ${bets.length}`}
          </p>
        </div>
        <Btn kind="green" onClick={() => setModalAposta(true)}><Plus size={17} /> Nova</Btn>
      </div>

      {/* ══ filtros ══ */}
      <Card>
        {/* busca */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
          <Input
            value={f.busca}
            onChange={(e) => set("busca", e.target.value)}
            placeholder="Buscar por código, nome, evento ou casa"
            style={{ paddingLeft: 40, paddingRight: f.busca ? 40 : 14 }}
          />
          {f.busca && (
            <button onClick={() => set("busca", "")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* atalhos de período */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PERIODOS.map((p) => {
            const on = f.periodo === p.id;
            return (
              <button key={p.id} onClick={() => usarPeriodo(p.id)}
                className="px-3 py-1.5 rounded-lg"
                style={{
                  fontSize: 12.5, fontWeight: on ? 600 : 400,
                  color: on ? C.greenDeep : C.body,
                  background: on ? C.greenSoft : C.card,
                  border: `1px solid ${on ? C.greenBand : C.line}`,
                  transition: "all .13s ease",
                }}>
                {p.label}
              </button>
            );
          })}

          <div className="flex-1" />

          <button onClick={() => setAvancado(!avancado)}
            className="px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
            style={{
              fontSize: 12.5, color: avancado ? C.greenDeep : C.body,
              background: avancado ? C.greenSoft : C.card,
              border: `1px solid ${avancado ? C.greenBand : C.line}`,
              transition: "all .13s ease",
            }}>
            <SlidersHorizontal size={13} />
            Mais filtros
            {ativos > 0 && (
              <span className="num inline-flex items-center justify-center"
                style={{ minWidth: 16, height: 16, borderRadius: 8, fontSize: 10, fontWeight: 700, background: C.green, color: "#fff", padding: "0 4px" }}>
                {ativos}
              </span>
            )}
            <ChevronDown size={13} style={{ transform: avancado ? "rotate(180deg)" : "", transition: "transform .16s ease" }} />
          </button>

          {ativos > 0 && (
            <button onClick={() => setF(VAZIO)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: 12.5, color: C.red }}>
              Limpar
            </button>
          )}
        </div>

        {/* painel avançado */}
        {avancado && (
          <div className="anim-detalhe mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={f.usuario} onChange={(e) => set("usuario", e.target.value)}>
                <option value="">Todos usuários</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
              <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
                <option value="">Todos status</option>
                {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Select value={f.casa} onChange={(e) => set("casa", e.target.value)}>
                <option value="">Todas casas</option>
                {casas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>Período</p>
                <div className="flex gap-2">
                  <InputData value={f.de} onChange={(iso) => { set("de", iso); set("periodo", "tudo"); }} />
                  <InputData value={f.ate} onChange={(iso) => { set("ate", iso); set("periodo", "tudo"); }} />
                </div>
              </div>
              <div>
                <p className="mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>Odd</p>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="mín" value={f.oddMin} onChange={(e) => set("oddMin", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="máx" value={f.oddMax} onChange={(e) => set("oddMax", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>Valor R$</p>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="mín" value={f.valorMin} onChange={(e) => set("valorMin", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="máx" value={f.valorMax} onChange={(e) => set("valorMax", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* totais do que está filtrado */}
        {lista.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <Stat k="Apostas" v={lista.length} />
            {abertas > 0 && <Stat k="Abertas" v={abertas} cor={C.muted} />}
            <Stat k="Investido" v={brl(inv)} />
            <Stat k="Resultado" v={sgn(luc)} cor={luc > 0 ? C.green : luc < 0 ? C.red : C.ink} />
            <Stat k="ROI" v={inv ? `${((luc / inv) * 100).toFixed(1)}%` : "\u2014"} />
          </div>
        )}

        {/* previsão de todas as abertas */}
        {abertas > 0 && (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <span style={{ fontSize: 12.5, color: C.muted }}>
              Se as {abertas} abertas ganharem <Money v={seGanharTudo} prefix color={C.green} weight={700} />
            </span>
            <span style={{ fontSize: 12.5, color: C.muted }}>
              Se todas perderem <Money v={sePerderTudo} prefix color={C.red} weight={700} />
            </span>
          </div>
        )}
      </Card>

      {/* ══ abas: em aberto / resolvidas (todas as apostas) ══ */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: C.lineSoft, width: "fit-content" }}>
        {[["abertas", "Em aberto", listaAbertas.length],
          ["resolvidas", "Resolvidas", listaResolvidas.length]].map(([id, rot, qtd]) => {
          const on = aba === id;
          return (
            <button key={id} onClick={() => { setAba(id); setPagina(1); }}
              className="px-4 py-2 rounded-lg" style={{
                fontSize: 13, fontWeight: on ? 600 : 500,
                background: on ? C.card : "transparent",
                color: on ? C.ink : C.muted,
                boxShadow: on ? "0 1px 3px rgba(24,38,43,.08)" : "none",
                transition: "all .13s ease",
              }}>
              {rot}{qtd > 0 && ` (${qtd})`}
            </button>
          );
        })}
      </div>

      {/* ══ lista ══ */}
      {daAba.length === 0 ? (
        <Card pad={false}>
          <Empty
            icon={Receipt}
            title={bets.length
              ? (aba === "abertas" ? "Nenhuma aposta em aberto" : "Nenhuma aposta resolvida")
              : "Nenhuma aposta ainda"}
            hint={bets.length ? "Troque de aba ou ajuste os filtros." : "Registre a primeira aposta."}
            action={bets.length
              ? <Btn kind="outline" onClick={() => setF(VAZIO)}>Limpar filtros</Btn>
              : <Btn kind="green" onClick={() => setModalAposta(true)}><Plus size={16} /> Nova aposta</Btn>}
          />
        </Card>
      ) : (
        grupos.map(([rotulo, arr]) => {
          const total = arr.filter(fechada).reduce((s, b) => s + lucro(b), 0);
          const temFechada = arr.some(fechada);
          return (
            <div key={rotulo}>
              <div className="flex items-center justify-between px-1 mb-2">
                <p style={{ fontSize: 13, fontWeight: 600, color: C.body }}>
                  {rotulo}
                </p>
                {temFechada && (
                  <Money v={total} prefix size={13} weight={600} color={total > 0 ? C.green : total < 0 ? C.red : C.faint} />
                )}
              </div>
              <Card pad={false}>
                {arr.map((b, i) => (
                  <BetRow key={b.id} b={b} casas={casas} users={users} first={i === 0}
                    fixada={pinAtivo(b, fixadas[b.id])} alternarFixada={alternarFixada}
                    setModalAposta={setModalAposta} mudarStatus={mudarStatus} excluirAposta={excluirAposta} />
                ))}
              </Card>
            </div>
          );
        })
      )}

      {/* ══ paginação ══ */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <Btn kind="outline" size="sm" disabled={paginaSegura <= 1}
            onClick={() => setPagina((x) => Math.max(1, x - 1))}>
            <ChevronLeft size={15} /> Anterior
          </Btn>

          <span className="num" style={{ fontSize: 12.5, color: C.muted }}>
            página {paginaSegura} de {totalPaginas}
            <span style={{ color: C.faint }}> · {daAba.length} apostas</span>
          </span>

          <Btn kind="outline" size="sm" disabled={paginaSegura >= totalPaginas}
            onClick={() => setPagina((x) => Math.min(totalPaginas, x + 1))}>
            Próxima <ChevronRight size={15} />
          </Btn>
        </div>
      )}
    </div>
  );
}
