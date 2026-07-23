"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Layers, X } from "lucide-react";
import { C, Modal, Input, Select, SelectCasa, Label, Btn, ST, Codigo, Avatar } from "@/lib/ui";
import { uid, hoje, n, brl, sgn, nomeDoEvento, tituloAposta, oddTotal, eventoDasPernas, agruparPorEvento, achatarEventos, selecaoVazia, eventoVazio, somarDias, dBR } from "@/lib/calc";

/* ═══════════════════════════════════════════════════════
   Preenchimento automático, em cascata:

   LINK    → servidor busca a página e a IA interpreta
   PRINT   → 1º a IA (Gemini grátis, ou Claude)
             2º se falhar, OCR no próprio aparelho (Tesseract)
   MANUAL  → se nada der certo, os campos ficam livres
═══════════════════════════════════════════════════════ */


/* ═══════════════════════ modal ═══════════════════════ */

export default function BetModal({ bet, onClose, cfg, casas, users, me, bets, valorStake, salvarAposta, dia }) {
  const inicial = bet && bet.id ? {
    ...bet,
    // Aposta antiga (sem pernas) ganha uma perna a partir do evento e da odd.
    pernas: Array.isArray(bet.pernas) && bet.pernas.length
      ? bet.pernas
      : [{ confronto: bet.evento || "", mercado: "", selecao: "", odd: bet.odd || "", dataJogo: "" }],
  } : {
    // Aposta nova. Se veio uma cópia (duplicar), aproveita os dados dela;
    // senão, começa em branco com a stake padrão.
    id: uid(),
    codigo: "",
    nome: bet?.nome || "",
    data: dia || hoje(),
    dataJogo: bet?.dataJogo || dia || hoje(),
    horaJogo: bet?.horaJogo || "",
    usuarioId: me.id,
    casaId: bet?.casaId || "",
    evento: bet?.evento || "",
    stakePct: bet?.stakePct ?? bet?.preStake ?? cfg.stakes[0]?.pct ?? 1,
    valor: bet?.valor ?? (cfg.banca * (bet?.preStake ?? cfg.stakes[0]?.pct ?? 1)) / 100,
    odd: bet?.odd ?? "",
    oddManual: bet?.oddManual ?? false,
    status: "aberta",
    cashoutValor: "",
    obs: bet?.obs || "",
    tipo: bet?.tipo || "simples",
    pernas: Array.isArray(bet?.pernas) && bet.pernas.length
      ? bet.pernas.map((x) => ({ ...x }))
      : [{ confronto: "", selecao: "", mercado: "", odd: "", dataJogo: "" }],
  };

  const [f, setF] = useState(inicial);
  const editando = bets.some((b) => b.id === f.id);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setStake = (pct) => setF((p) => ({ ...p, stakePct: n(pct), valor: (cfg.banca * n(pct)) / 100 }));

  // Stake avulsa, só para esta aposta (não salva nada).
  // Digitar em reais atualiza a %, e digitar em % atualiza os reais.
  const setValorReais = (reais) => setF((p) => {
    const v = n(reais);
    return { ...p, valor: v, stakePct: cfg.banca > 0 ? (v / cfg.banca) * 100 : 0 };
  });
  const setValorPct = (pct) => setF((p) => {
    const pc = n(pct);
    return { ...p, stakePct: pc, valor: (cfg.banca * pc) / 100 };
  });

  // ── pernas ──
  // Os eventos são estado próprio. Antes eles eram recalculados a cada
  // tecla (agrupar + achatar), o que recriava os campos e fazia o cursor
  // se perder: espaço e ponto simplesmente sumiam. Agora editamos os
  // eventos direto e só achatamos em pernas na hora de salvar.
  const [eventos, setEventos] = useState(() => agruparPorEvento(inicial.pernas || []));

  const pernasAtuais = achatarEventos(eventos);
  const oddProduto = oddTotal(pernasAtuais);
  const oddDoBilhete = n(f.odd) > 1 ? n(f.odd) : oddProduto;

  const totalSelecoes = eventos.reduce((s, ev) => s + ev.selecoes.length, 0);
  const multipla = totalSelecoes > 1;

  // Quando as seleções mudam, a odd total acompanha o produto,
  // a menos que você a tenha digitado na mão.
  useEffect(() => {
    if (f.oddManual) return;
    const prod = oddTotal(achatarEventos(eventos));
    setF((p) => ({ ...p, odd: prod > 0 ? String(prod.toFixed(2)) : "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventos]);

  // ── ações sobre eventos ──
  const setConfronto = (ie, valor) =>
    setEventos((evs) => evs.map((ev, i) => (i === ie ? { ...ev, confronto: valor } : ev)));

  const addEvento = () => setEventos((evs) => [...evs, eventoVazio()]);

  const removerEvento = (ie) =>
    setEventos((evs) => {
      const novos = evs.filter((_, i) => i !== ie);
      return novos.length ? novos : [eventoVazio()];
    });

  // ── ações sobre seleções dentro de um evento ──
  const setSelecao = (ie, is, campo, valor) =>
    setEventos((evs) => evs.map((ev, i) => {
      if (i !== ie) return ev;
      return { ...ev, selecoes: ev.selecoes.map((s, j) => (j === is ? { ...s, [campo]: valor } : s)) };
    }));

  const addSelecao = (ie) =>
    setEventos((evs) => evs.map((ev, i) => (i === ie ? { ...ev, selecoes: [...ev.selecoes, selecaoVazia()] } : ev)));

  const removerSelecao = (ie, is) =>
    setEventos((evs) => evs.map((ev, i) => {
      if (i !== ie) return ev;
      const selecoes = ev.selecoes.filter((_, j) => j !== is);
      return { ...ev, selecoes: selecoes.length ? selecoes : [selecaoVazia()] };
    }));

  // Quando você digita na odd total, marca como manual: para de seguir o produto.
  const setOddManual = (v) => setF((p) => ({ ...p, odd: v, oddManual: true }));

  /**
   * Aplica o que foi lido no bilhete.
   *
   * Só EVENTO e ODD vêm do print. A stake é decisão sua e nunca
   * é sobrescrita, mesmo que o bilhete mostre um valor apostado.
   */

  const ok = oddDoBilhete > 1 && n(f.valor) > 0;
  const ganho = n(f.valor) * (oddDoBilhete - 1);
  const dono = users.find((u) => u.id === f.usuarioId);

  // Salvar em um lugar só: usado pelo botão e pela tecla Enter.
  const salvar = () => {
    if (!ok) return;
    const evento = eventoDasPernas({ ...f, pernas: pernasAtuais }, pernasAtuais);
    salvarAposta({
      ...f,
      pernas: pernasAtuais,
      evento,
      nome: nomeDoEvento(evento),
      valor: n(f.valor),
      odd: oddDoBilhete,
      stakePct: n(f.stakePct),
    });
    onClose();
  };

  // Enter confirma. Shift+Enter e campos de texto longo seguem normais.
  const aoTeclar = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const alvo = e.target;
    if (alvo && alvo.tagName === "TEXTAREA") return;   // observação pode ter linhas
    e.preventDefault();
    salvar();
  };

  return (
    <Modal onClose={onClose} wide
      title={editando ? "Editar aposta" : "Nova aposta"}
      sub={
        <span className="inline-flex items-center gap-1.5">
          {editando ? "Registrada por" : "Vai entrar no nome de"}
          <Avatar user={editando ? dono : me} size={17} />
          <b style={{ fontWeight: 600, color: C.body }}>{(editando ? dono : me)?.nome || "\u2014"}</b>
        </span>
      }>
      <div className="space-y-5" onKeyDown={aoTeclar}>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>
              {eventos.length > 1 ? "Bilhete com vários jogos" : "Jogo"}
            </span>
            <div className="flex items-center gap-2">
              {multipla && (
                <span className="inline-flex items-center gap-1" style={{ fontSize: 11.5, color: C.blue, fontWeight: 600 }}>
                  <Layers size={12} /> {totalSelecoes} seleções
                </span>
              )}
              {f.codigo && <Codigo valor={f.codigo} size={11} />}
            </div>
          </div>

          <div className="space-y-3">
            {eventos.map((ev, ie) => (
              <div key={ie} className="rounded-xl p-3"
                style={{ background: "#FBFCFD", border: `1px solid ${eventos.length > 1 ? C.blueBand : C.line}` }}>
                {/* topo do evento: os times, uma vez só */}
                <div className="flex items-center gap-2">
                  {eventos.length > 1 && (
                    <span className="inline-flex items-center justify-center rounded-md shrink-0" style={{ width: 20, height: 20, fontSize: 11, fontWeight: 700, background: C.blueSoft, color: C.blue }}>
                      {ie + 1}
                    </span>
                  )}
                  <div className="flex-1">
                    <Input value={ev.confronto} onChange={(e) => setConfronto(ie, e.target.value)} placeholder="Jogo: França x Espanha" />
                  </div>
                  {eventos.length > 1 && (
                    <button type="button" onClick={() => removerEvento(ie)} className="p-1 rounded-md shrink-0" style={{ color: C.faint }} title="Remover jogo">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* seleções dentro do evento: jogador + tipo + odd */}
                <div className="mt-2 space-y-2">
                  {ev.selecoes.map((s, is) => (
                    <div key={is} className="rounded-lg p-2" style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}>
                      <div className="flex items-center gap-2">
                        <Input value={s.selecao} onChange={(e) => setSelecao(ie, is, "selecao", e.target.value)} placeholder="Jogador ou seleção" />
                        {ev.selecoes.length > 1 && (
                          <button type="button" onClick={() => removerSelecao(ie, is)} className="p-1 rounded-md shrink-0" style={{ color: C.faint }} title="Remover seleção">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <Input value={s.mercado} onChange={(e) => setSelecao(ie, is, "mercado", e.target.value)} placeholder="Tipo da aposta" />
                        <Input type="text" inputMode="decimal" value={s.odd} onChange={(e) => setSelecao(ie, is, "odd", e.target.value)} placeholder="Odd 1.85" />
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addSelecao(ie)}
                  className="w-full mt-2 flex items-center justify-center gap-1 rounded-lg py-2"
                  style={{ border: `1px dashed ${C.line}`, fontSize: 12.5, fontWeight: 600, color: C.blue }}>
                  <Plus size={14} /> Adicionar seleção neste jogo
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addEvento}
            className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5"
            style={{ border: `1.5px dashed ${C.blueBand}`, fontSize: 13, fontWeight: 600, color: C.blue, background: C.blueSoft }}>
            <Plus size={15} /> Adicionar outro jogo
          </button>

          <div className="mt-3 rounded-xl p-3" style={{ background: "#FBFCFD", border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label>Odd total do bilhete</Label>
                <p style={{ fontSize: 11.5, color: C.faint, marginTop: -2 }}>
                  {multipla
                    ? <>a que a casa mostra. Cálculo: {oddProduto.toFixed(2)}
                        {pernasAtuais.filter((p) => n(p.odd) > 0).length > 1 && <> ({pernasAtuais.filter((p) => n(p.odd) > 0).map((p) => n(p.odd).toFixed(2)).join(" × ")})</>}</>
                    : "a cotação da sua aposta"}
                </p>
              </div>
              <div style={{ width: 110 }}>
                <Input type="text" inputMode="decimal" value={f.odd} onChange={(e) => setOddManual(e.target.value)} placeholder={oddProduto ? oddProduto.toFixed(2) : "1.85"} style={{ textAlign: "right", fontWeight: 600 }} />
              </div>
            </div>
            {multipla && n(f.odd) > 1 && Math.abs(n(f.odd) - oddProduto) > 0.005 && (
              <button type="button" onClick={() => setF((p) => ({ ...p, odd: oddProduto.toFixed(2), oddManual: false }))}
                className="mt-2 inline-flex items-center gap-1" style={{ fontSize: 11.5, color: C.blue }}>
                usar o cálculo ({oddProduto.toFixed(2)})
              </button>
            )}
          </div>

          <p className="mt-2" style={{ fontSize: 12, color: C.faint }}>
            Aparece na lista como{" "}
            <b style={{ color: C.body }}>{tituloAposta({ nome: nomeDoEvento(eventoDasPernas({ ...f, pernas: pernasAtuais }, pernasAtuais)), evento: eventoDasPernas({ ...f, pernas: pernasAtuais }, pernasAtuais) })}</b>
            {f.codigo && <>, com o código <b style={{ color: C.body }}>#{f.codigo}</b> ao lado</>}
          </p>
        </div>

        {/* quando o jogo acontece: é esta data que manda no resultado do dia */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Quando é o jogo</Label>
            <span style={{ fontSize: 11.5, color: C.faint }}>manda no resultado do dia</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={f.dataJogo || hoje()}
              onChange={(e) => set("dataJogo", e.target.value)}
              className="rounded-xl px-3"
              style={{ height: 44, fontSize: 16, border: `1px solid ${C.line}`, outline: "none", color: C.ink, background: C.card }} />

            <input type="time" value={f.horaJogo || ""}
              onChange={(e) => set("horaJogo", e.target.value)}
              className="rounded-xl px-3"
              style={{ height: 44, fontSize: 16, border: `1px solid ${C.line}`, outline: "none", color: C.ink, background: C.card }} />

            {[["Hoje", 0], ["Amanhã", 1], ["Depois", 2]].map(([rot, dias]) => {
              const alvo = somarDias(hoje(), dias);
              const on = (f.dataJogo || hoje()) === alvo;
              return (
                <button key={rot} type="button" onClick={() => set("dataJogo", alvo)}
                  className="rounded-lg px-3" style={{
                    height: 34, fontSize: 12.5, fontWeight: on ? 600 : 500,
                    border: `1px solid ${on ? C.green : C.line}`,
                    background: on ? C.greenSoft : C.card,
                    color: on ? C.greenDeep : C.muted,
                  }}>
                  {rot}
                </button>
              );
            })}
          </div>
          {(f.dataJogo || hoje()) !== hoje() && (
            <p className="mt-1.5" style={{ fontSize: 11.5, color: C.blue }}>
              Esta aposta vai contar no resultado de {dBR(f.dataJogo)}, não de hoje.
            </p>
          )}
        </div>

        <div>
          <Label>Stake</Label>
          <div className="grid grid-cols-3 gap-2">
            {cfg.stakes.map((s) => {
              const on = Math.abs(n(f.stakePct) - s.pct) < 0.0001;
              return (
                <button key={s.id} type="button" onClick={() => setStake(s.pct)} className="rounded-xl px-3 py-2.5 text-left"
                  style={{ border: `1.5px solid ${on ? C.green : C.line}`, background: on ? C.greenSoft : C.card }}>
                  <p style={{ fontSize: 11, color: on ? C.greenDeep : C.muted, fontWeight: 600 }}>{s.label} · {s.pct}%</p>
                  <p className="num" style={{ fontSize: 15, fontWeight: 600, color: on ? C.greenDeep : C.ink }}>{brl(valorStake(s.pct))}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-2 rounded-xl p-3" style={{ background: "#FBFCFD", border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: C.muted }}>
                Valor personalizado
              </span>
              <span style={{ fontSize: 11, color: C.faint }}>só para esta aposta</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span style={{ fontSize: 11, color: C.faint }}>Em reais</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span style={{ fontSize: 14, color: C.muted }}>R$</span>
                  <Input type="text" inputMode="decimal" value={f.valor === "" ? "" : Number(n(f.valor).toFixed(2))}
                    onChange={(e) => setValorReais(e.target.value)} placeholder="50,00" />
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: C.faint }}>% da banca</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Input type="text" inputMode="decimal" value={Number(n(f.stakePct).toFixed(3))}
                    onChange={(e) => setValorPct(e.target.value)} placeholder="1,2" />
                  <span style={{ fontSize: 14, color: C.muted }}>%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-3 px-1">
            <span style={{ fontSize: 12.5, color: C.muted }}>Vai apostar</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              {brl(n(f.valor))} <span style={{ fontSize: 12, fontWeight: 400, color: C.faint }}>· {n(f.stakePct).toFixed(2)}% da banca</span>
            </span>
          </div>
        </div>

        {editando && (
          <div>
            <Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        )}

        {editando && f.status === "cashout" && (
          <div><Label>Valor recebido no cashout</Label>
            <Input type="text" inputMode="decimal" value={f.cashoutValor} onChange={(e) => set("cashoutValor", e.target.value)} />
            <p className="mt-1.5" style={{ fontSize: 12.5, color: C.muted }}>Resultado: {sgn(n(f.cashoutValor) - n(f.valor))}</p>
          </div>
        )}

        {ok && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ background: C.greenSoft, border: `1px solid ${C.greenBand}` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.greenDeep, letterSpacing: ".05em" }}>SE GANHAR</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, color: C.greenDeep }}>+{brl(ganho)}</p>
              <p style={{ fontSize: 11.5, color: C.greenDeep, opacity: .7 }}>volta {brl(n(f.valor) * oddDoBilhete)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: C.redSoft, border: `1px solid ${C.redBand}` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.red, letterSpacing: ".05em" }}>SE PERDER</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{"\u2212"}{brl(n(f.valor))}</p>
              <p style={{ fontSize: 11.5, color: C.red, opacity: .7 }}>perde a stake</p>
            </div>
          </div>
        )}

        <div><Label>Casa de aposta</Label>
          <SelectCasa casas={casas} valor={f.casaId} onChange={(id) => set("casaId", id)} />
        </div>

        <div><Label>Observação</Label><Input value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Opcional" /></div>

        <div className="flex justify-end gap-2 pt-1">
          <Btn kind="outline" onClick={onClose}>Cancelar</Btn>
          <Btn kind="green" disabled={!ok} onClick={salvar}>
            {editando ? "Salvar" : "Registrar aposta"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
