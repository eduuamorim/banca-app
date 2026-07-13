"use client";
import React, { useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { C, Modal, Input, Select, SelectCasa, Label, Btn, ST, Codigo, Avatar } from "@/lib/ui";
import { uid, hoje, n, brl, sgn, nomeDoEvento, tituloAposta, pernaVazia, oddTotal, eventoDasPernas } from "@/lib/calc";

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
    id: uid(),
    codigo: "",
    nome: "",
    data: dia || hoje(),
    usuarioId: me.id,
    casaId: "",
    evento: "",
    stakePct: bet?.preStake ?? cfg.stakes[0]?.pct ?? 1,
    valor: (cfg.banca * (bet?.preStake ?? cfg.stakes[0]?.pct ?? 1)) / 100,
    odd: "",
    status: "aberta",
    cashoutValor: "",
    obs: "",
    pernas: [pernaVazia()],
  };

  const [f, setF] = useState(inicial);
  const editando = bets.some((b) => b.id === f.id);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setStake = (pct) => setF((p) => ({ ...p, stakePct: n(pct), valor: (cfg.banca * n(pct)) / 100 }));

  // ── pernas ──
  const pernas = f.pernas || [];
  const multipla = pernas.length > 1;
  const oddProduto = oddTotal(pernas);
  // A odd que vale: a que você digitou, ou o produto das pernas.
  const oddDoBilhete = n(f.odd) > 1 ? n(f.odd) : oddProduto;

  // Enquanto você não editar a odd total na mão, ela acompanha o produto.
  // Essa flag é mais confiável que comparar números com ponto flutuante.
  const setPerna = (i, k, v) => setF((p) => {
    const arr = p.pernas.map((perna, idx) => (idx === i ? { ...perna, [k]: v } : perna));
    const prod = oddTotal(arr);
    return { ...p, pernas: arr, odd: p.oddManual ? p.odd : (prod > 0 ? String(prod.toFixed(2)) : "") };
  });
  const addPerna = () => setF((p) => {
    const arr = [...p.pernas, pernaVazia()];
    return { ...p, pernas: arr };
  });
  const removerPerna = (i) => setF((p) => {
    const arr = p.pernas.filter((_, idx) => idx !== i);
    const nova = arr.length ? arr : [pernaVazia()];
    const prod = oddTotal(nova);
    return { ...p, pernas: nova, odd: p.oddManual ? p.odd : (prod > 0 ? String(prod.toFixed(2)) : "") };
  });

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
      <div className="space-y-5">

        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>
              {multipla ? "Bilhete múltiplo" : "Seleção"}
            </span>
            <div className="flex items-center gap-2">
              {multipla && (
                <span className="inline-flex items-center gap-1" style={{ fontSize: 11.5, color: C.blue, fontWeight: 600 }}>
                  <Layers size={12} /> {pernas.length} seleções
                </span>
              )}
              {f.codigo && <Codigo valor={f.codigo} size={11} />}
            </div>
          </div>

          <div className="space-y-3">
            {pernas.map((perna, i) => (
              <div key={i} className="rounded-xl p-3"
                style={{ background: multipla ? "#FBFCFD" : C.card, border: `1px solid ${multipla ? C.blueBand : C.line}` }}>
                {multipla && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center rounded-md" style={{ width: 20, height: 20, fontSize: 11, fontWeight: 700, background: C.blueSoft, color: C.blue }}>
                      {i + 1}
                    </span>
                    <button type="button" onClick={() => removerPerna(i)} className="p-1 rounded-md" style={{ color: C.faint }} title="Remover seleção">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <Input
                  value={perna.confronto}
                  onChange={(e) => setPerna(i, "confronto", e.target.value)}
                  placeholder="Times: Inglaterra x Argentina"
                />

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input value={perna.mercado} onChange={(e) => setPerna(i, "mercado", e.target.value)} placeholder="Mercado" />
                  <Input type="text" inputMode="decimal" value={perna.odd} onChange={(e) => setPerna(i, "odd", e.target.value)} placeholder="Odd 1.85" />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addPerna}
            className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5"
            style={{ border: `1.5px dashed ${C.line}`, fontSize: 13, fontWeight: 600, color: C.blue, background: C.card }}>
            <Plus size={15} /> Adicionar seleção (múltipla)
          </button>

          <div className="mt-3 rounded-xl p-3" style={{ background: "#FBFCFD", border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label>Odd total do bilhete</Label>
                <p style={{ fontSize: 11.5, color: C.faint, marginTop: -2 }}>
                  {multipla
                    ? <>a que a casa mostra. Cálculo: {oddProduto.toFixed(2)}
                        {pernas.filter((p) => n(p.odd) > 0).length > 1 && <> ({pernas.filter((p) => n(p.odd) > 0).map((p) => n(p.odd).toFixed(2)).join(" × ")})</>}</>
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
            <b style={{ color: C.body }}>{tituloAposta({ nome: nomeDoEvento(eventoDasPernas(f, pernas)), evento: eventoDasPernas(f, pernas) })}</b>
            {f.codigo && <>, com o código <b style={{ color: C.body }}>#{f.codigo}</b> ao lado</>}
          </p>
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
          <div className="flex items-baseline justify-between mt-3 px-1">
            <span style={{ fontSize: 12.5, color: C.muted }}>Vai apostar</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              {brl(n(f.valor))} <span style={{ fontSize: 12, fontWeight: 400, color: C.faint }}>· {n(f.stakePct)}% da banca</span>
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
          <Btn kind="green" disabled={!ok} onClick={() => {
            const evento = eventoDasPernas(f, pernas);
            salvarAposta({
              ...f,
              evento,
              nome: nomeDoEvento(evento),
              valor: n(f.valor),
              odd: oddDoBilhete,
              stakePct: n(f.stakePct),
            });
            onClose();
          }}>
            {editando ? "Salvar" : "Registrar aposta"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
