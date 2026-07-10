"use client";
import React from "react";
import { Check, X, ChevronRight, Receipt } from "lucide-react";
import { C, Card, Label, Input, Empty, Money, Faixa } from "@/lib/ui";
import { n, brl, sgn, dBR, hoje, fechada } from "@/lib/calc";
import BetRow from "./BetRow";

export default function Painel(p) {
  const { dia, setDia, doDia, lucroDia, meta, stop, cfg, valorStake, casas, users, setModalAposta, mudarStatus, excluirAposta } = p;

  const abertas = doDia.filter((b) => !fechada(b));
  const seGanhar = lucroDia + abertas.reduce((s, b) => s + n(b.valor) * (n(b.odd) - 1), 0);
  const sePerder = lucroDia - abertas.reduce((s, b) => s + n(b.valor), 0);
  const fech = doDia.filter(fechada);
  const g = fech.filter((b) => b.status === "green").length;
  const r = fech.filter((b) => b.status === "red").length;

  const estado = lucroDia >= meta ? "meta" : lucroDia <= -stop ? "stop" : "livre";
  const aviso = {
    meta: { txt: "Meta batida. Encerre o dia por aqui.", bg: C.green },
    stop: { txt: "Stop loss atingido. Pare de apostar hoje.", bg: C.red },
    livre: null,
  }[estado];
  const hd = dia === hoje();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>{hd ? "Hoje" : dBR(dia)}</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>
            {doDia.length
              ? `${doDia.length} aposta${doDia.length > 1 ? "s" : ""} · ${abertas.length} aberta${abertas.length !== 1 ? "s" : ""}`
              : "Nada registrado ainda"}
          </p>
        </div>
        <Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} style={{ width: "auto", height: 40 }} />
      </div>

      {aviso && (
        <div className="anim-aviso flex items-center gap-3 px-5 py-3.5 rounded-2xl" style={{ background: aviso.bg, color: "#fff" }}>
          {estado === "meta" ? <Check size={18} /> : <X size={18} />}
          <p style={{ fontSize: 14.5, fontWeight: 500 }}>{aviso.txt}</p>
        </div>
      )}

      <Card>
        <div className="flex items-start justify-between mb-5">
          <div>
            <Label>Resultado do dia</Label>
            <p className="num" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, color: lucroDia > 0 ? C.green : lucroDia < 0 ? C.red : C.ink }}>
              {sgn(lucroDia)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p style={{ fontSize: 11.5, color: C.muted }}>Green / Red</p>
            <p className="num" style={{ fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: C.green }}>{g}</span> <span style={{ color: C.faint }}>/</span> <span style={{ color: C.red }}>{r}</span>
            </p>
          </div>
        </div>

        <Faixa v={lucroDia} meta={meta} stop={stop} seGanhar={seGanhar} sePerder={sePerder} temAbertas={abertas.length > 0} />

        {abertas.length > 0 && (
          <div className="mt-4 pt-4 flex flex-wrap gap-x-8 gap-y-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p style={{ fontSize: 12.5, color: C.muted }}>Se todas as abertas ganharem <Money v={seGanhar} prefix color={C.green} /></p>
            <p style={{ fontSize: 12.5, color: C.muted }}>Se todas perderem <Money v={sePerder} prefix color={C.red} /></p>
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Stakes disponíveis</h2>
          <p style={{ fontSize: 12.5, color: C.muted }}>base {brl(cfg.banca)}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cfg.stakes.map((s) => (
            <button key={s.id} onClick={() => setModalAposta({ preStake: s.pct })} className="text-left rounded-2xl p-5"
              style={{ background: C.card, border: `1px solid ${C.line}`, transition: "border-color .13s ease, transform .13s ease" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: C.body }}>{s.label}</span>
                <span className="num px-2 py-0.5 rounded-md" style={{ fontSize: 11, background: C.lineSoft, color: C.muted }}>{s.pct}%</span>
              </div>
              <p className="num mt-3" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em" }}>{brl(valorStake(s.pct))}</p>
              <p className="mt-2 flex items-center gap-1" style={{ fontSize: 12.5, color: C.green }}>Apostar <ChevronRight size={13} /></p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3" style={{ fontSize: 17, fontWeight: 600 }}>Apostas de {hd ? "hoje" : dBR(dia)}</h2>
        <Card pad={false}>
          {doDia.length === 0
            ? <Empty icon={Receipt} title="Dia limpo" hint="Registre uma aposta escolhendo um stake acima." />
            : doDia.map((b, i) => (
                <BetRow key={b.id} b={b} casas={casas} users={users} first={i === 0}
                  setModalAposta={setModalAposta} mudarStatus={mudarStatus} excluirAposta={excluirAposta} />
              ))}
        </Card>
      </div>
    </div>
  );
}
