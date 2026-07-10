"use client";
import React, { useMemo } from "react";
import { PieChart } from "lucide-react";
import { C, Card, Empty, Big, Tabela, Usuario, Avatar, IconeCasa } from "@/lib/ui";
import { n, brl, sgn, lucro, fechada } from "@/lib/calc";

export default function Relatorio({ bets, users, casas, cfg, meta, stop, lucroTotal }) {
  const res = bets.filter(fechada);

  const calc = (arr) => {
    const inv = arr.reduce((s, b) => s + n(b.valor), 0);
    const luc = arr.reduce((s, b) => s + lucro(b), 0);
    const g = arr.filter((b) => b.status === "green").length;
    const r = arr.filter((b) => b.status === "red").length;
    return { qtd: arr.length, inv, luc, g, r, roi: inv ? (luc / inv) * 100 : 0, acerto: g + r ? (g / (g + r)) * 100 : 0 };
  };

  const geral = calc(res);

  const dias = useMemo(() => {
    const m = {};
    res.forEach((b) => (m[b.data] ||= []).push(b));
    return Object.entries(m).map(([d, a]) => ({ d, ...calc(a) })).sort((a, b) => b.d.localeCompare(a.d));
  }, [bets]);

  if (!res.length)
    return <Card pad={false}><Empty icon={PieChart} title="Sem dados ainda" hint="Resolva algumas apostas para o relatório aparecer." /></Card>;

  const maxAbs = Math.max(...dias.map((d) => Math.abs(d.luc)), meta);

  return (
    <div className="space-y-5">
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Relatório</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Big k="Lucro total" v={sgn(geral.luc)} cor={geral.luc >= 0 ? C.green : C.red} sub={`${((lucroTotal / cfg.banca) * 100).toFixed(2)}% da banca`} />
        <Big k="ROI" v={`${geral.roi.toFixed(1)}%`} sub={`${brl(geral.inv)} investido`} />
        <Big k="Taxa de acerto" v={`${geral.acerto.toFixed(1)}%`} sub={`${geral.g}G · ${geral.r}R`} />
        <Big k="Dias operados" v={dias.length} sub={`${dias.filter((d) => d.luc >= meta).length} com meta batida`} />
      </div>

      {/* quem apostou o quê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.filter((u) => res.some((b) => b.usuarioId === u.id)).map((u) => {
          const s = calc(res.filter((b) => b.usuarioId === u.id));
          const fatia = geral.inv ? (s.inv / geral.inv) * 100 : 0;
          return (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <Avatar user={u} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: 15, fontWeight: 600 }}>{u.nome}</p>
                  <p className="num" style={{ fontSize: 12, color: C.muted }}>
                    {s.qtd} aposta{s.qtd !== 1 ? "s" : ""} · {fatia.toFixed(0)}% do investido
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="num" style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: s.luc >= 0 ? C.green : C.red }}>
                    {sgn(s.luc)}
                  </p>
                  <p className="num" style={{ fontSize: 11.5, color: C.faint }}>ROI {s.roi.toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <Mini k="Green" v={s.g} cor={C.green} />
                <Mini k="Red" v={s.r} cor={C.red} />
                <Mini k="Acerto" v={`${s.acerto.toFixed(0)}%`} />
                <Mini k="Investido" v={brl(s.inv)} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="mb-5" style={{ fontSize: 17, fontWeight: 600 }}>Resultado por dia</h2>
        <div className="space-y-2.5">
          {dias.slice(0, 20).map((d) => {
            const pos = d.luc >= 0;
            const w = (Math.abs(d.luc) / maxAbs) * 50;
            return (
              <div key={d.d} className="flex items-center gap-3">
                <span className="num shrink-0" style={{ fontSize: 11.5, color: C.muted, width: 44 }}>
                  {d.d.slice(8)}/{d.d.slice(5, 7)}
                </span>
                <div className="flex-1 relative" style={{ height: 24 }}>
                  <div className="absolute inset-y-0" style={{ left: "50%", width: 1, background: C.line }} />
                  <div className="absolute rounded" style={{
                    top: 4, height: 16, left: pos ? "50%" : `${50 - w}%`, width: `${w}%`,
                    background: d.luc >= meta ? C.green : d.luc <= -stop ? C.red : pos ? C.greenBand : C.redBand,
                  }} />
                </div>
                <span className="num shrink-0 text-right" style={{ fontSize: 12.5, fontWeight: 600, color: pos ? C.green : C.red, width: 92 }}>
                  {sgn(d.luc)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card pad={false}>
        <div className="px-6 pt-5 pb-3"><h2 style={{ fontSize: 17, fontWeight: 600 }}>Por usuário</h2></div>
        <Tabela cols={["Usuário", "Apostas", "G/R", "Acerto", "Investido", "Lucro", "ROI"]}
          rows={users.filter((u) => res.some((b) => b.usuarioId === u.id)).map((u) => {
            const s = calc(res.filter((b) => b.usuarioId === u.id));
            return [
              <Usuario key="u" user={u} />,
              s.qtd, `${s.g}/${s.r}`, `${s.acerto.toFixed(0)}%`, brl(s.inv),
              <span key="l" style={{ color: s.luc >= 0 ? C.green : C.red }}>{sgn(s.luc)}</span>,
              `${s.roi.toFixed(1)}%`,
            ];
          })} />
      </Card>

      <Card pad={false}>
        <div className="px-6 pt-5 pb-3"><h2 style={{ fontSize: 17, fontWeight: 600 }}>Por casa</h2></div>
        <Tabela cols={["Casa", "Apostas", "G/R", "Acerto", "Investido", "Lucro", "ROI"]}
          rows={[...casas, { id: null, nome: "Sem casa" }]
            .filter((c) => res.some((b) => (b.casaId || null) === c.id))
            .map((c) => {
              const s = calc(res.filter((b) => (b.casaId || null) === c.id));
              return [
                <span key="c" className="inline-flex items-center gap-2 min-w-0">
                  {c.id && <IconeCasa casa={c} size={20} radius={4} />}
                  <span className="truncate">{c.nome}</span>
                </span>,
                s.qtd, `${s.g}/${s.r}`, `${s.acerto.toFixed(0)}%`, brl(s.inv),
                <span key="l" style={{ color: s.luc >= 0 ? C.green : C.red }}>{sgn(s.luc)}</span>,
                `${s.roi.toFixed(1)}%`,
              ];
            })} />
      </Card>
    </div>
  );
}

const Mini = ({ k, v, cor }) => (
  <div className="flex-1 min-w-0">
    <p style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>{k}</p>
    <p className="num truncate" style={{ fontSize: 14, fontWeight: 600, color: cor || C.ink }}>{v}</p>
  </div>
);
