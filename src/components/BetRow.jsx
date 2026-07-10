"use client";
import React, { useState } from "react";
import { ChevronDown, ExternalLink, Pencil, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import { C, Pill, Btn, Num, Money, Info, Codigo, IconeCasa, Confirmar, Input, Label } from "@/lib/ui";
import { n, brl, lucro, fechada, tituloAposta } from "@/lib/calc";

/* Cada resolução mostra a consequência em reais ANTES de confirmar. */
const ACOES = {
  green: {
    rotulo: "Ganhou", botao: "green", tom: "green",
    titulo: "Marcar como Green?",
    valor: (b) => n(b.valor) * (n(b.odd) - 1),
    frase: "Vai entrar como lucro no dia.",
  },
  red: {
    rotulo: "Perdeu", botao: "red", tom: "red",
    titulo: "Marcar como Red?",
    valor: (b) => -n(b.valor),
    frase: "Vai entrar como prejuízo no dia.",
  },
  void: {
    rotulo: "Anulada", botao: "outline", tom: "amber",
    titulo: "Marcar como Anulada?",
    valor: () => 0,
    frase: "A stake volta inteira. Não mexe no resultado do dia.",
  },
  cashout: {
    rotulo: "Cashout", botao: "outline", tom: "blue",
    titulo: "Encerrar por cashout",
    valor: null,
    frase: "Digite quanto você recebeu ao encerrar.",
  },
  aberta: {
    rotulo: "Reabrir", botao: "ghost", tom: "amber",
    titulo: "Reabrir esta aposta?",
    valor: () => 0,
    frase: "Ela sai do cálculo do dia até você resolver de novo.",
  },
};

export default function BetRow({ b, casas, users, first, setModalAposta, mudarStatus, excluirAposta }) {
  const [open, setOpen] = useState(false);
  const [mais, setMais] = useState(false);            // anulada/cashout na própria linha
  const [confirmar, setConfirmar] = useState(null);   // chave de ACOES
  const [cashout, setCashout] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  const casa = casas.find((c) => c.id === b.casaId);
  const u = users.find((x) => x.id === b.usuarioId);
  const l = lucro(b);
  const previsto = n(b.valor) * (n(b.odd) - 1);
  // Nome e código são coisas separadas. O chip aparece sempre.
  const titulo = tituloAposta(b);

  const pedir = (chave) => {
    if (chave === "cashout") setCashout(String(n(b.valor).toFixed(2)));
    setConfirmar(chave);
  };

  const aplicar = () => {
    if (confirmar === "cashout") mudarStatus(b, "cashout", cashout);
    else mudarStatus(b, confirmar);
    setConfirmar(null);
    setMais(false);
  };

  const a = confirmar ? ACOES[confirmar] : null;
  const resultadoCashout = n(cashout) - n(b.valor);

  return (
    <>
      <div style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}>
        {/* ── linha ── */}
        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setOpen(!open)}
          style={{ transition: "background .13s ease" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: u?.cor || C.line, color: "#fff", fontSize: 12, fontWeight: 600 }}>
            {u ? u.nome[0].toUpperCase() : "?"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>
                {titulo}
              </p>
              <Codigo valor={b.codigo} destaque />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {casa && <IconeCasa casa={casa} size={13} radius={3} />}
              <p className="num truncate" style={{ fontSize: 12.5, color: C.muted }}>
                {brl(n(b.valor))} · odd {n(b.odd).toFixed(2)}
                {casa && (
                  <>
                    {" · "}
                    {casa.url ? (
                      <a
                        href={casa.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                        style={{ color: C.blue }}
                        title={`Abrir ${casa.nome}`}
                      >
                        {casa.nome}
                      </a>
                    ) : casa.nome}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Selo do status. Nas abertas some no celular, para caber os botões. */}
          <div className={fechada(b) ? "" : "hidden md:block"}>
            <Pill status={b.status} />
          </div>

          {/* Aposta aberta: resolve direto daqui, sem abrir o detalhe. */}
          {!fechada(b) && (
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Rapido tom="green" titulo="Marcar como Green" onClick={() => pedir("green")}><Check size={15} /></Rapido>
              <Rapido tom="red" titulo="Marcar como Red" onClick={() => pedir("red")}><X size={15} /></Rapido>
              <Rapido tom="cinza" ativo={mais} titulo="Anulada ou cashout" onClick={() => setMais(!mais)}>
                <MoreHorizontal size={15} />
              </Rapido>
            </div>
          )}

          <div className={`text-right shrink-0 ${fechada(b) ? "" : "hidden sm:block"}`} style={{ minWidth: 92 }}>
            {fechada(b)
              ? <Money v={l} prefix size={15} weight={600} color={l > 0 ? C.green : l < 0 ? C.red : C.faint} />
              : <Num size={13.5} color={C.faint}>+{brl(previsto)}</Num>}
          </div>

          <ChevronDown size={16} style={{ color: C.faint, transform: open ? "rotate(180deg)" : "", transition: "transform .16s ease" }} />
        </div>

        {/* ── anulada / cashout, sem abrir o detalhe ── */}
        {mais && !fechada(b) && (
          <div className="anim-detalhe flex flex-wrap items-center gap-2 px-5 pb-3 -mt-1">
            <span style={{ fontSize: 12.5, color: C.muted }}>Resolver como</span>
            <Btn size="sm" kind="outline" onClick={() => pedir("void")}>Anulada</Btn>
            <Btn size="sm" kind="outline" onClick={() => pedir("cashout")}>Cashout</Btn>
            <Btn size="sm" kind="ghost" onClick={() => setMais(false)}>Fechar</Btn>
          </div>
        )}

        {/* ── detalhe ── */}
        {open && (
          <div className="anim-detalhe px-5 pb-5" style={{ background: "#FBFBF9" }}>
            {b.evento && b.evento !== titulo && (
              <p className="pt-4 pb-1" style={{ fontSize: 13.5, color: C.body }}>{b.evento}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
              <Info k="Código" v={<Codigo valor={b.codigo} size={12} />} />
              <Info k="Stake" v={`${Number(b.stakePct).toFixed(2)}%`} />
              <Info k="Se ganhar volta" v={brl(n(b.valor) * n(b.odd))} />
              <Info k="Casa" v={casa ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconeCasa casa={casa} size={14} radius={3} />
                  {casa.url
                    ? <a href={casa.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1" style={{ color: C.blue }}>
                        {casa.nome}<ExternalLink size={11} />
                      </a>
                    : casa.nome}
                </span>
              ) : "\u2014"} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4">
              <Info k="Registrada por" v={u?.nome || "\u2014"} />
              {b.obs && <div className="col-span-2 sm:col-span-3"><Info k="Observação" v={b.obs} /></div>}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {!fechada(b) ? (
                <>
                  <Btn size="sm" kind="green" onClick={() => pedir("green")}>Ganhou</Btn>
                  <Btn size="sm" kind="red" onClick={() => pedir("red")}>Perdeu</Btn>
                  <Btn size="sm" kind="outline" onClick={() => pedir("void")}>Anulada</Btn>
                  <Btn size="sm" kind="outline" onClick={() => pedir("cashout")}>Cashout</Btn>
                </>
              ) : (
                <Btn size="sm" kind="ghost" onClick={() => pedir("aberta")}>Reabrir</Btn>
              )}
              <div className="flex-1" />
              <Btn size="sm" kind="ghost" onClick={() => setModalAposta(b)}><Pencil size={14} /></Btn>
              <Btn size="sm" kind="ghost" onClick={() => setExcluindo(true)} style={{ color: C.red }}><Trash2 size={14} /></Btn>
            </div>
          </div>
        )}
      </div>

      {/* ── confirmação de status ── */}
      {a && confirmar !== "cashout" && (
        <Confirmar
          titulo={a.titulo}
          mensagem={a.frase}
          tom={a.tom}
          rotuloOk={a.rotulo}
          onCancelar={() => setConfirmar(null)}
          onOk={aplicar}
          detalhe={
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{titulo}</p>
                <Codigo valor={b.codigo} copiavel={false} size={11} />
              </div>
              <div className="flex items-baseline justify-between">
                <span style={{ fontSize: 12.5, color: C.muted }}>Impacto no dia</span>
                <Money v={a.valor(b)} prefix size={20} weight={700}
                  color={a.valor(b) > 0 ? C.green : a.valor(b) < 0 ? C.red : C.muted} />
              </div>
              <p className="num mt-1" style={{ fontSize: 11.5, color: C.faint }}>
                {brl(n(b.valor))} · odd {n(b.odd).toFixed(2)}
              </p>
            </div>
          }
        />
      )}

      {/* ── confirmação de cashout, com valor ── */}
      {confirmar === "cashout" && (
        <Confirmar
          titulo="Encerrar por cashout"
          mensagem="Digite quanto você recebeu ao encerrar a aposta."
          tom="blue"
          rotuloOk="Confirmar cashout"
          onCancelar={() => setConfirmar(null)}
          onOk={() => n(cashout) >= 0 && aplicar()}
          detalhe={
            <div>
              <Label>Valor recebido</Label>
              <Input type="number" step="0.01" value={cashout} autoFocus
                onChange={(e) => setCashout(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} />
              <div className="flex items-baseline justify-between mt-3">
                <span style={{ fontSize: 12.5, color: C.muted }}>
                  Recebido menos {brl(n(b.valor))}
                </span>
                <Money v={resultadoCashout} prefix size={18} weight={700}
                  color={resultadoCashout > 0 ? C.green : resultadoCashout < 0 ? C.red : C.muted} />
              </div>
            </div>
          }
        />
      )}

      {/* ── confirmação de exclusão ── */}
      {excluindo && (
        <Confirmar
          titulo="Excluir esta aposta?"
          mensagem="Não dá para desfazer."
          tom="red"
          rotuloOk="Excluir"
          onCancelar={() => setExcluindo(false)}
          onOk={() => { excluirAposta(b.id); setExcluindo(false); }}
          detalhe={
            <div className="flex items-center gap-2">
              <p className="truncate flex-1" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{titulo}</p>
              <Codigo valor={b.codigo} copiavel={false} size={11} />
            </div>
          }
        />
      )}
    </>
  );
}

/* ── botão redondo de resolver, na própria linha ── */

function Rapido({ tom, titulo, onClick, children, ativo }) {
  const [sobre, setSobre] = useState(false);
  const cores = {
    green: { fg: C.greenDeep, bg: C.greenSoft, bd: C.greenBand, on: C.green },
    red:   { fg: C.red,       bg: C.redSoft,   bd: C.redBand,   on: C.red },
    cinza: { fg: C.muted,     bg: C.lineSoft,  bd: C.line,      on: C.body },
  }[tom];
  const aceso = sobre || ativo;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      title={titulo}
      aria-label={titulo}
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: 30, height: 30, borderRadius: 9,
        background: aceso ? cores.on : cores.bg,
        border: `1px solid ${aceso ? cores.on : cores.bd}`,
        color: aceso ? "#fff" : cores.fg,
        transition: "background .13s ease, color .13s ease, border-color .13s ease",
      }}
    >
      {children}
    </button>
  );
}
