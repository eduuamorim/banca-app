"use client";
import React, { useState } from "react";
import { Pin, ChevronDown, Pencil, Trash2, Check, X, MoreHorizontal, ExternalLink } from "lucide-react";
import { C, Pill, SeloResultado, Btn, Money, Codigo, IconeCasa, Confirmar, Input, Label, Avatar } from "@/lib/ui";
import { n, brl, lucro, fechada, tituloAposta, dataHoraBR, pernasNormalizadas, agruparPorEvento } from "@/lib/calc";

/* Cada resolução mostra a consequência em reais ANTES de confirmar. */
const ACOES = {
  green: { rotulo: "Ganhou", tom: "green", titulo: "Marcar como Green?", valor: (b) => n(b.valor) * (n(b.odd) - 1), frase: "Vai entrar como lucro no dia." },
  red:   { rotulo: "Perdeu", tom: "red", titulo: "Marcar como Red?", valor: (b) => -n(b.valor), frase: "Vai entrar como prejuízo no dia." },
  void:  { rotulo: "Anulada", tom: "amber", titulo: "Marcar como Anulada?", valor: () => 0, frase: "A stake volta inteira. Não mexe no resultado do dia." },
  cashout: { rotulo: "Cashout", tom: "blue", titulo: "Encerrar por cashout", valor: null, frase: "Digite quanto você recebeu ao encerrar." },
  aberta: { rotulo: "Reabrir", tom: "amber", titulo: "Reabrir esta aposta?", valor: () => 0, frase: "Ela sai do cálculo do dia até você resolver de novo." },
};

export default function BetRow({ b, casas, users, first, fixada, alternarFixada, setModalAposta, mudarStatus, excluirAposta }) {
  const [mais, setMais] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [cashout, setCashout] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [aberto, setAberto] = useState(true);  // começa aberto; o cabeçalho fecha/abre

  const casa = casas.find((c) => c.id === b.casaId);
  const u = users.find((x) => x.id === b.usuarioId);
  const l = lucro(b);
  const resolvida = fechada(b);
  const titulo = tituloAposta(b);

  const pernasBilhete = pernasNormalizadas({ pernas: b.pernas, evento: b.evento, odd: b.odd });
  const eventosBilhete = agruparPorEvento(pernasBilhete);
  const multipla = (b.tipo === "multipla") || pernasBilhete.length > 1;

  // O nome do bilhete: o confronto cadastrado, com o tipo na frente.
  // Simples: "Inglaterra x Argentina". Múltipla: "Múltipla · Inglaterra x Argentina +1".
  const primeiroConfronto = (pernasBilhete[0]?.confronto || "").trim() || tituloAposta(b);
  const tituloBilhete = multipla
    ? `Múltipla · ${primeiroConfronto}${pernasBilhete.length > 1 ? ` +${pernasBilhete.length - 1}` : ""}`
    : primeiroConfronto;
  const ganhoPotencial = n(b.valor) * n(b.odd);

  const pedir = (chave) => {
    if (chave === "cashout") setCashout(String(n(b.valor).toFixed(2)));
    setConfirmar(chave);
    setMais(false);
  };
  const aplicar = () => {
    if (confirmar === "cashout") mudarStatus(b, "cashout", cashout);
    else mudarStatus(b, confirmar);
    setConfirmar(null);
  };

  const a = confirmar ? ACOES[confirmar] : null;
  const resultadoCashout = n(cashout) - n(b.valor);

  // Cor da faixa lateral: verde se lucrou, vermelho se perdeu, neutra se aberta.
  const corBorda = !resolvida ? C.line
    : l > 0 ? C.greenBand
    : l < 0 ? C.redBand
    : C.amberBand;

  return (
    <>
      <div className="px-3 sm:px-4 py-3" style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${corBorda}`, background: C.card }}>

          {/* ── cabeçalho do bilhete (clique alterna aberto/fechado) ── */}
          <div className="flex items-center gap-2.5 px-4 py-3 cursor-pointer select-none" style={{ borderBottom: aberto ? `1px solid ${C.lineSoft}` : "none", background: "#FCFCFA" }}
            onClick={() => setAberto((v) => !v)}>
            <button onClick={(e) => { e.stopPropagation(); alternarFixada(b.id); }} title={fixada ? "Desafixar" : "Fixar no topo"}
              className="shrink-0 p-1 rounded-md" style={{ color: fixada ? C.amber : C.faint }}>
              {fixada ? <Pin size={16} fill={C.amber} /> : <Pin size={16} />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()} style={{ cursor: "auto", width: "fit-content", maxWidth: "100%" }}>
                <span className="truncate" style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                  {tituloBilhete}
                </span>
                <Codigo valor={b.codigo} destaque size={11} />
              </div>
            </div>

            <span className="num shrink-0" style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
              {n(b.odd).toFixed(2)}
            </span>

            {resolvida
              ? <SeloResultado status={b.status} size={26} />
              : <Pill status={b.status} />}

            <ChevronDown size={16} className="shrink-0" style={{ color: C.faint, transform: aberto ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
          </div>

          {aberto && (
          <div className="anim-detalhe">

          {/* ── seleções agrupadas por jogo ── */}
          <div>
            {eventosBilhete.map((ev, ie) => (
              <div key={ie} style={{ borderTop: ie === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                {ev.confronto && (
                  <p className="px-4 pt-3 pb-1" style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{ev.confronto}</p>
                )}
                {ev.selecoes.map((s, is) => (
                  <div key={is} className="px-4 py-2 flex items-start justify-between gap-3" style={{ paddingLeft: ev.confronto ? 18 : 16 }}>
                    <div className="min-w-0">
                      {s.selecao && <p style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{s.selecao}</p>}
                      {s.mercado && <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{s.mercado}</p>}
                    </div>
                    {n(s.odd) > 0 && multipla && (
                      <span className="num shrink-0" style={{ fontSize: 12.5, fontWeight: 600, color: C.body }}>{n(s.odd).toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── rodapé: valores ── */}
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12.5, color: C.muted }}>Aposta</span>
              <span className="num" style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{brl(n(b.valor))}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: 12.5, color: C.muted }}>
                {resolvida ? "Resultado" : "Ganho potencial"}
              </span>
              {resolvida
                ? <Money v={l} prefix size={15} weight={700} color={l > 0 ? C.green : l < 0 ? C.red : C.muted} />
                : <span className="num" style={{ fontSize: 15, fontWeight: 700, color: C.greenDeep }}>{brl(ganhoPotencial)}</span>}
            </div>
            {b.status === "cashout" && n(b.cashoutValor) > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span style={{ fontSize: 12.5, color: C.muted }}>Recebido no cashout</span>
                <span className="num" style={{ fontSize: 13, color: C.body }}>{brl(n(b.cashoutValor))}</span>
              </div>
            )}
          </div>

          {/* ── barra de quem e casa ── */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: `1px solid ${C.lineSoft}`, background: "#FCFCFA" }}>
            <Avatar user={u} size={18} />
            <span className="truncate" style={{ fontSize: 12, color: C.muted }}>{u?.nome || "\u2014"}</span>
            {casa && (
              <>
                <span style={{ color: C.faint }}>·</span>
                <IconeCasa casa={casa} size={14} radius={3} />
                {casa.url
                  ? <a href={casa.url} target="_blank" rel="noreferrer" className="truncate inline-flex items-center gap-1 hover:underline" style={{ fontSize: 12, color: C.blue }}>
                      {casa.nome}<ExternalLink size={10} />
                    </a>
                  : <span className="truncate" style={{ fontSize: 12, color: C.muted }}>{casa.nome}</span>}
              </>
            )}
            {b.criadoEm && (
              <span className="num ml-auto shrink-0" style={{ fontSize: 11, color: C.faint }}>{dataHoraBR(b.criadoEm)}</span>
            )}
          </div>

          {/* ── ações ── */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            {!resolvida ? (
              <>
                <Btn size="sm" kind="green" onClick={() => pedir("green")}><Check size={14} /> Green</Btn>
                <Btn size="sm" kind="red" onClick={() => pedir("red")}><X size={14} /> Red</Btn>
                <Btn size="sm" kind="outline" onClick={() => setMais(!mais)}><MoreHorizontal size={14} /></Btn>
              </>
            ) : (
              <Btn size="sm" kind="outline" onClick={() => pedir("aberta")}>Reabrir</Btn>
            )}
            <div className="flex-1" />
            <button onClick={() => setModalAposta(b)} className="p-1.5 rounded-md" style={{ color: C.faint }} title="Editar"><Pencil size={15} /></button>
            <button onClick={() => setExcluindo(true)} className="p-1.5 rounded-md" style={{ color: C.faint }} title="Excluir"><Trash2 size={15} /></button>
          </div>

          {/* anulada / cashout */}
          {mais && !resolvida && (
            <div className="anim-detalhe flex flex-wrap items-center gap-2 px-4 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>Resolver como</span>
              <Btn size="sm" kind="outline" onClick={() => pedir("void")}>Anulada</Btn>
              <Btn size="sm" kind="outline" onClick={() => pedir("cashout")}>Cashout</Btn>
            </div>
          )}
          </div>
          )}
        </div>
      </div>

      {/* ── confirmações ── */}
      {a && confirmar !== "cashout" && (
        <Confirmar titulo={a.titulo} mensagem={a.frase} tom={a.tom} rotuloOk={a.rotulo}
          onCancelar={() => setConfirmar(null)} onOk={aplicar}
          detalhe={
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{titulo}</p>
                <Codigo valor={b.codigo} copiavel={false} size={11} />
              </div>
              <div className="flex items-baseline justify-between">
                <span style={{ fontSize: 12.5, color: C.muted }}>Impacto no dia</span>
                <Money v={a.valor(b)} prefix size={20} weight={700} color={a.valor(b) > 0 ? C.green : a.valor(b) < 0 ? C.red : C.muted} />
              </div>
              <p className="num mt-1" style={{ fontSize: 11.5, color: C.faint }}>{brl(n(b.valor))} · odd {n(b.odd).toFixed(2)}</p>
            </div>
          } />
      )}

      {confirmar === "cashout" && (
        <Confirmar titulo="Encerrar por cashout" mensagem="Digite quanto você recebeu ao encerrar a aposta." tom="blue" rotuloOk="Confirmar cashout"
          onCancelar={() => setConfirmar(null)} onOk={() => n(cashout) >= 0 && aplicar()}
          detalhe={
            <div>
              <Label>Valor recebido</Label>
              <Input type="number" step="0.01" value={cashout} autoFocus onChange={(e) => setCashout(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
              <div className="flex items-baseline justify-between mt-3">
                <span style={{ fontSize: 12.5, color: C.muted }}>Recebido menos {brl(n(b.valor))}</span>
                <Money v={resultadoCashout} prefix size={18} weight={700} color={resultadoCashout > 0 ? C.green : resultadoCashout < 0 ? C.red : C.muted} />
              </div>
            </div>
          } />
      )}

      {excluindo && (
        <Confirmar titulo="Excluir esta aposta?" mensagem="Não dá para desfazer." tom="red" rotuloOk="Excluir"
          onCancelar={() => setExcluindo(false)} onOk={() => { excluirAposta(b.id); setExcluindo(false); }}
          detalhe={
            <div className="flex items-center gap-2">
              <p className="truncate flex-1" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{titulo}</p>
              <Codigo valor={b.codigo} copiavel={false} size={11} />
            </div>
          } />
      )}
    </>
  );
}
