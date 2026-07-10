"use client";
import React, { useState } from "react";
import { ChevronDown, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { C, F, Pill, Btn, Money, Info } from "@/lib/ui";
import { n, brl, lucro, fechada } from "@/lib/calc";

export default function BetRow({ b, casas, users, first, setModalAposta, mudarStatus, excluirAposta }) {
  const [open, setOpen] = useState(false);
  const casa = casas.find((c) => c.id === b.casaId);
  const u = users.find((x) => x.id === b.usuarioId);
  const l = lucro(b);
  const previsto = n(b.valor) * (n(b.odd) - 1);

  const resolver = (status) => {
    if (status === "cashout") {
      const v = prompt("Quanto você recebeu no cashout? (só números)");
      if (v === null) return;
      return mudarStatus(b, "cashout", v);
    }
    mudarStatus(b, status);
  };

  const excluir = () => { if (confirm("Excluir esta aposta?")) excluirAposta(b.id); };

  return (
    <div style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}>
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: u?.cor || C.line, color: "#fff", fontSize: 12, fontWeight: 600 }}>
          {u ? u.nome[0].toUpperCase() : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: 14.5, fontWeight: 500 }}>{b.evento || "Sem descrição"}</p>
          <p className="truncate" style={{ fontSize: 12.5, color: C.muted, fontFamily: F.mono }}>
            {brl(n(b.valor))} · odd {n(b.odd).toFixed(2)}{casa ? ` · ${casa.nome}` : ""}
          </p>
        </div>
        <div className="hidden sm:block"><Pill status={b.status} /></div>
        <div className="text-right shrink-0" style={{ minWidth: 92 }}>
          {fechada(b)
            ? <Money v={l} prefix size={15} weight={600} color={l > 0 ? C.green : l < 0 ? C.red : C.faint} />
            : <span style={{ fontFamily: F.mono, fontSize: 13.5, color: C.faint }}>+{brl(previsto)}</span>}
        </div>
        <ChevronDown size={16} style={{ color: C.faint, transform: open ? "rotate(180deg)" : "", transition: ".15s" }} />
      </div>

      {open && (
        <div className="px-5 pb-5" style={{ background: "#FBFBF9" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            <Info k="Stake" v={`${Number(b.stakePct).toFixed(2)}%`} />
            <Info k="Se ganhar volta" v={brl(n(b.valor) * n(b.odd))} />
            <Info k="Casa" v={casa ? (casa.url
              ? <a href={casa.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1" style={{ color: C.blue }}>{casa.nome}<ExternalLink size={11} /></a>
              : casa.nome) : "\u2014"} />
            <Info k="Registrada por" v={u?.nome || "\u2014"} />
          </div>
          {b.obs && <p className="pb-3" style={{ fontSize: 13, color: C.body }}>{b.obs}</p>}

          <div className="flex flex-wrap gap-2 items-center">
            {!fechada(b) ? (
              <>
                <Btn size="sm" kind="green" onClick={() => resolver("green")}>Ganhou</Btn>
                <Btn size="sm" kind="red" onClick={() => resolver("red")}>Perdeu</Btn>
                <Btn size="sm" kind="outline" onClick={() => resolver("void")}>Anulada</Btn>
                <Btn size="sm" kind="outline" onClick={() => resolver("cashout")}>Cashout</Btn>
              </>
            ) : (
              <>
                <Pill status={b.status} />
                <Btn size="sm" kind="ghost" onClick={() => mudarStatus(b, "aberta")}>Reabrir</Btn>
              </>
            )}
            <div className="flex-1" />
            <Btn size="sm" kind="ghost" onClick={() => setModalAposta(b)}><Pencil size={14} /></Btn>
            <Btn size="sm" kind="ghost" onClick={excluir} style={{ color: C.red }}><Trash2 size={14} /></Btn>
          </div>
        </div>
      )}
    </div>
  );
}
