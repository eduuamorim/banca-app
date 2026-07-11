"use client";
import React from "react";
import { Landmark, Wallet, TrendingUp } from "lucide-react";
import { C, Card, Num } from "@/lib/ui";
import { IconeCasa } from "@/lib/ui";
import { brl, sgn, patrimonio } from "@/lib/calc";

/**
 * Patrimônio: banco + casas. Depositar não muda o total,
 * só ganhar ou perder aposta muda. Separado da banca.
 *
 * modo "resumo" no Painel, "completo" na aba.
 */
export default function Patrimonio({ cfg, casas, movs, bets, modo = "resumo" }) {
  const p = patrimonio(cfg.saldoBanco, casas, movs, bets);

  if (modo === "resumo") {
    return (
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Patrimônio</h2>
          <p style={{ fontSize: 12, color: C.faint }}>banco + casas</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Bloco icone={Landmark} k="Na conta" v={brl(p.saldoBanco)} cor={C.ink} />
          <Bloco icone={Wallet} k="Nas casas" v={brl(p.nasCasas + p.foraDeCasa)} cor={C.ink} />
          <div>
            <p style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>Total</p>
            <Num size={19} weight={700} color={C.green} style={{ display: "block", marginTop: 4 }}>{brl(p.total)}</Num>
          </div>
        </div>
      </Card>
    );
  }

  // modo completo, na aba
  return (
    <div className="space-y-5">
      <Card>
        <p style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
          Patrimônio total
        </p>
        <p className="num mt-1.5" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", color: C.ink }}>
          {brl(p.total)}
        </p>
        <p className="mt-1" style={{ fontSize: 13, color: C.muted }}>
          Tudo que é seu: {brl(p.saldoBanco)} na conta e {brl(p.nasCasas + p.foraDeCasa)} nas casas.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5 pt-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.lineSoft, color: C.body }}>
              <Landmark size={18} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>NA CONTA DO BANCO</p>
              <Num size={18} weight={600}>{brl(p.saldoBanco)}</Num>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.greenSoft, color: C.greenDeep }}>
              <Wallet size={18} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>NAS CASAS</p>
              <Num size={18} weight={600}>{brl(p.nasCasas + p.foraDeCasa)}</Num>
            </div>
          </div>
        </div>
      </Card>

      {p.casas.length > 0 && (
        <Card>
          <div className="flex items-baseline justify-between mb-4">
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>Em cada casa</h2>
            <p style={{ fontSize: 12, color: C.faint }}>depósito − saque + lucro</p>
          </div>
          <div className="space-y-2.5">
            {p.casas
              .slice()
              .sort((a, b) => b.caixa - a.caixa)
              .map(({ casa, dep, saq, luc, caixa }) => (
                <div key={casa.id} className="flex items-center gap-3 py-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <IconeCasa casa={casa} size={26} radius={6} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{casa.nome}</p>
                    <p className="num" style={{ fontSize: 11.5, color: C.faint }}>
                      +{brl(dep)} · −{brl(saq)} ·{" "}
                      <span style={{ color: luc > 0 ? C.green : luc < 0 ? C.red : C.faint }}>lucro {sgn(luc)}</span>
                    </p>
                  </div>
                  <Num size={16} weight={600} color={caixa >= 0 ? C.ink : C.red}>{brl(caixa)}</Num>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.blueSoft, color: C.blue }}>
            <TrendingUp size={17} />
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>Depositar não muda seu patrimônio</p>
            <p className="mt-1" style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Quando você tira da conta e põe numa casa, o total continua igual: o dinheiro só trocou de lugar. Ele só sobe quando você ganha uma aposta, e só cai quando perde. Por isso a banca (a régua das stakes) fica separada, em Ajustes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

const Bloco = ({ icone: I, k, v, cor }) => (
  <div>
    <p className="flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
      <I size={12} style={{ color: C.faint }} /> {k}
    </p>
    <Num size={18} weight={600} color={cor} style={{ display: "block", marginTop: 4 }}>{v}</Num>
  </div>
);
