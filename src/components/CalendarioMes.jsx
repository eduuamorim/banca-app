"use client";
import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C } from "@/lib/ui";
import { n, brl, lucro, fechada, diaDaAposta, hoje, dataLocal } from "@/lib/calc";

/*
  Calendário do mês: cada dia ganha uma cor conforme o resultado.
  Verde forte quando bateu a meta, verde claro quando lucrou sem bater,
  vermelho forte quando bateu o stop, vermelho claro quando perdeu pouco.
  Dia sem aposta fica neutro. Clique no dia leva o Painel para ele.
*/
export default function CalendarioMes({ bets, meta, stop, dia, setDia }) {
  const [ref, setRef] = useState(() => {
    const [a, m] = (dia || hoje()).split("-").map(Number);
    return { ano: a, mes: m };   // mes 1..12
  });

  // Lucro por dia, considerando a data do JOGO (não a de registro).
  const porDia = useMemo(() => {
    const m = {};
    bets.filter(fechada).forEach((b) => {
      const d = diaDaAposta(b);
      if (!d) return;
      m[d] = (m[d] || 0) + lucro(b);
    });
    return m;
  }, [bets]);

  // Monta a grade do mês, começando no domingo.
  const semanas = useMemo(() => {
    const primeiro = new Date(ref.ano, ref.mes - 1, 1);
    const ultimo = new Date(ref.ano, ref.mes, 0);
    const celulas = [];
    for (let i = 0; i < primeiro.getDay(); i++) celulas.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) {
      celulas.push(dataLocal(new Date(ref.ano, ref.mes - 1, d)));
    }
    while (celulas.length % 7 !== 0) celulas.push(null);
    const linhas = [];
    for (let i = 0; i < celulas.length; i += 7) linhas.push(celulas.slice(i, i + 7));
    return linhas;
  }, [ref]);

  const mudarMes = (passo) => setRef((r) => {
    const d = new Date(r.ano, r.mes - 1 + passo, 1);
    return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
  });

  const nomeMes = new Date(ref.ano, ref.mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // A cor de cada dia conta a história do resultado.
  const corDoDia = (d) => {
    if (!(d in porDia)) return null;                 // sem aposta resolvida
    const v = porDia[d];
    if (v >= meta) return { fundo: C.green, texto: "#fff", borda: C.green };
    if (v > 0)     return { fundo: C.greenSoft, texto: C.greenDeep, borda: C.greenBand };
    if (v <= stop) return { fundo: C.red, texto: "#fff", borda: C.red };
    if (v < 0)     return { fundo: C.redSoft, texto: C.red, borda: C.redBand };
    return { fundo: C.lineSoft, texto: C.muted, borda: C.line };   // zerou
  };

  const hd = hoje();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: 15, fontWeight: 600, textTransform: "capitalize" }}>{nomeMes}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => mudarMes(-1)} className="p-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.muted }}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => mudarMes(1)} className="p-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.muted }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((s, i) => (
          <div key={i} className="text-center" style={{ fontSize: 10.5, fontWeight: 600, color: C.faint }}>{s}</div>
        ))}
      </div>

      <div className="space-y-1">
        {semanas.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {semana.map((d, j) => {
              if (!d) return <div key={j} />;
              const cor = corDoDia(d);
              const numero = Number(d.slice(8, 10));
              const ehHoje = d === hd;
              const selecionado = d === dia;
              return (
                <button key={j} onClick={() => setDia(d)}
                  className="relative flex items-center justify-center rounded-lg"
                  style={{
                    height: 34,
                    fontSize: 12.5,
                    fontWeight: cor || ehHoje ? 600 : 400,
                    background: cor ? cor.fundo : "transparent",
                    color: cor ? cor.texto : (ehHoje ? C.ink : C.muted),
                    border: selecionado
                      ? `2px solid ${C.ink}`
                      : `1px solid ${cor ? cor.borda : "transparent"}`,
                    transition: "all .12s ease",
                  }}
                  title={d in porDia ? `${brl(porDia[d])}` : "sem apostas resolvidas"}>
                  {numero}
                  {ehHoje && !cor && (
                    <span className="absolute" style={{ bottom: 3, width: 3, height: 3, borderRadius: 2, background: C.green }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        {[["Bateu a meta", C.green], ["Lucro", C.greenSoft], ["Prejuízo", C.redSoft], ["Bateu o stop", C.red]].map(([rot, cor]) => (
          <span key={rot} className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: C.muted }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: cor, border: `1px solid ${C.line}` }} />
            {rot}
          </span>
        ))}
      </div>
    </div>
  );
}
