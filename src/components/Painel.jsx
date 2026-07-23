"use client";
import React from "react";
import { Check, X, ChevronRight, Receipt, TrendingUp, ChevronLeft } from "lucide-react";
import { C, Card, Label, Input, Empty, Money, Faixa } from "@/lib/ui";
import { n, brl, sgn, dBR, hoje, fechada, patrimonio, diaDaAposta, somarDias } from "@/lib/calc";
import BetRow from "./BetRow";
import CalendarioMes from "./CalendarioMes";
import Patrimonio from "./Patrimonio";

export default function Painel(p) {
  const [abaLista, setAbaLista] = React.useState("abertas");
  const { dia, setDia, doDia, lucroDia, meta, stop, cfg, valorStake, casas, users, movs, bets, setModalAposta, mudarStatus, excluirAposta, depositado, sacado, onIrAjustes, fixadas, alternarFixada } = p;

  const abertas = doDia.filter((b) => !fechada(b));

  // Abertas de QUALQUER dia. As fixadas por você sobem para o topo.
  const todasAbertas = bets
    .filter((b) => !fechada(b))
    .slice()
    .sort((a, b) => {
      const fa = fixadas.has(a.id) ? 1 : 0;
      const fb = fixadas.has(b.id) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return (diaDaAposta(b) + (b.criadoEm || "")).localeCompare(diaDaAposta(a) + (a.criadoEm || ""));
    });

  // Resolvidas só do dia selecionado.
  const resolvidasHoje = doDia.filter(fechada);

  // Saldo real e o aviso de divergência com a banca base.
  const saldoReal = patrimonio(cfg.saldoBanco, casas, movs, bets).total;
  const divergencia = cfg.banca > 0 ? Math.abs(saldoReal - cfg.banca) / cfg.banca : 0;
  const avisoBanca = divergencia >= 0.1 && saldoReal > cfg.banca;   // 10% acima

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
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDia(somarDias(dia, -1))}
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 36, height: 40, border: `1px solid ${C.line}`, background: C.card, color: C.muted }}
            title="Dia anterior">
            <ChevronLeft size={18} />
          </button>

          <Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} style={{ width: "auto", height: 40 }} />

          <button onClick={() => setDia(somarDias(dia, 1))}
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 36, height: 40, border: `1px solid ${C.line}`, background: C.card, color: C.muted }}
            title="Próximo dia">
            <ChevronRight size={18} />
          </button>

          {!hd && (
            <button onClick={() => setDia(hoje())}
              className="rounded-lg px-3 shrink-0"
              style={{ height: 40, fontSize: 12.5, fontWeight: 600, border: `1px solid ${C.line}`, background: C.card, color: C.green }}
              title="Voltar para hoje">
              Hoje
            </button>
          )}
        </div>
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

      {/* aviso: seu saldo real cresceu bem acima da banca base? */}
      {avisoBanca && onIrAjustes && (
        <button onClick={onIrAjustes} className="w-full text-left">
          <div className="anim-aviso flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: C.blueSoft, border: `1px solid ${C.blueBand}` }}>
            <TrendingUp size={20} style={{ color: C.blue }} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 600, color: C.blue }}>
                Seu saldo real está em {brl(saldoReal)}
              </p>
              <p style={{ fontSize: 12.5, color: C.body }}>
                Sua banca base ainda é {brl(cfg.banca)}. Se quiser apostar proporcional ao novo tamanho, ajuste a base em Ajustes.
              </p>
            </div>
            <ChevronRight size={18} style={{ color: C.blue }} className="shrink-0" />
          </div>
        </button>
      )}

      {/* saldo real: banco + casas, separado da meta do dia */}
      {(cfg.saldoBanco > 0 || depositado > 0 || sacado > 0) && (
        <Patrimonio cfg={cfg} casas={casas} movs={movs} bets={bets} modo="resumo" />
      )}

      {/* calendário do mês: como foi cada dia */}
      <Card>
        <CalendarioMes bets={bets} meta={meta} stop={stop} dia={dia} setDia={setDia} />
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

      {/* Abas: Em aberto e Resolvidas de hoje */}
      <div>
        <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: C.lineSoft, width: "fit-content" }}>
          {[["abertas", `Em aberto${todasAbertas.length ? ` (${todasAbertas.length})` : ""}`],
            ["resolvidas", `Resolvidas${resolvidasHoje.length ? ` (${resolvidasHoje.length})` : ""}`]].map(([id, rot]) => {
            const on = abaLista === id;
            return (
              <button key={id} onClick={() => setAbaLista(id)}
                className="px-4 py-2 rounded-lg" style={{
                  fontSize: 13, fontWeight: on ? 600 : 500,
                  background: on ? C.card : "transparent",
                  color: on ? C.ink : C.muted,
                  boxShadow: on ? "0 1px 3px rgba(24,38,43,.08)" : "none",
                  transition: "all .13s ease",
                }}>
                {rot}
              </button>
            );
          })}
        </div>

        {abaLista === "abertas" ? (
          <Card pad={false}>
            {todasAbertas.length === 0
              ? <Empty icon={Receipt} title="Nenhuma aposta em aberto" hint="Registre uma aposta escolhendo um stake acima." />
              : todasAbertas.map((b, i) => (
                  <BetRow key={b.id} b={b} casas={casas} users={users} first={i === 0}
                    fixada={fixadas.has(b.id)} alternarFixada={alternarFixada}
                    setModalAposta={setModalAposta} mudarStatus={mudarStatus} excluirAposta={excluirAposta} />
                ))}
          </Card>
        ) : (
          <>
            {resolvidasHoje.length > 0 && (
              <div className="flex items-baseline justify-end mb-2 px-1">
                <span className="num" style={{ fontSize: 12.5, color: C.faint }}>resultado {sgn(lucroDia)}</span>
              </div>
            )}
            <Card pad={false}>
              {resolvidasHoje.length === 0
                ? <Empty icon={Receipt} title={`Nada resolvido ${hd ? "hoje" : dBR(dia)}`} hint="As apostas resolvidas do dia aparecem aqui." />
                : resolvidasHoje.map((b, i) => (
                    <BetRow key={b.id} b={b} casas={casas} users={users} first={i === 0}
                      fixada={fixadas.has(b.id)} alternarFixada={alternarFixada}
                      setModalAposta={setModalAposta} mudarStatus={mudarStatus} excluirAposta={excluirAposta} />
                  ))}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
