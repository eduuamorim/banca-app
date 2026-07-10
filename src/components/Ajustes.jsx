"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Download, LogOut } from "lucide-react";
import { C, F, Card, Input, Label, Btn } from "@/lib/ui";
import { uid, n, brl, hoje } from "@/lib/calc";

export default function Ajustes({ cfg, salvarCfg, users, bets, casas, me, sair }) {
  const [f, setF] = useState(cfg);
  useEffect(() => setF(cfg), [cfg]);
  const dirty = JSON.stringify(f) !== JSON.stringify(cfg);

  const exportar = () => {
    const blob = new Blob([JSON.stringify({ cfg, bets, casas, users }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `banca-${hoje()}.json`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Ajustes</h1>

      <Card>
        <h2 className="mb-1" style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600 }}>Banca e metas</h2>
        <p className="mb-5" style={{ fontSize: 13, color: C.muted }}>
          Mudar a banca recalcula meta, stop e todos os stakes. Apostas já registradas mantêm o valor original.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div><Label>Banca inicial</Label>
            <Input type="number" step="0.01" value={f.banca} onChange={(e) => setF({ ...f, banca: e.target.value })} />
          </div>
          <div><Label>Meta de lucro %</Label>
            <Input type="number" step="0.01" value={f.metaPct} onChange={(e) => setF({ ...f, metaPct: e.target.value })} />
            <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 12.5, color: C.green }}>+{brl((n(f.banca) * n(f.metaPct)) / 100)}</p>
          </div>
          <div><Label>Stop loss %</Label>
            <Input type="number" step="0.01" value={f.stopPct} onChange={(e) => setF({ ...f, stopPct: e.target.value })} />
            <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 12.5, color: C.red }}>{"\u2212"}{brl((n(f.banca) * n(f.stopPct)) / 100)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <Label>Stakes</Label>
            <Btn size="sm" kind="ghost" onClick={() => setF({ ...f, stakes: [...f.stakes, { id: uid(), label: "Novo", pct: 1 }] })}>
              <Plus size={14} /> Adicionar
            </Btn>
          </div>
          <div className="space-y-2">
            {f.stakes.map((s, i) => (
              <div key={s.id} className="flex gap-2 items-center">
                <Input value={s.label} onChange={(e) => setF({ ...f, stakes: f.stakes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <Input type="number" step="0.01" value={s.pct} style={{ width: 92 }}
                  onChange={(e) => setF({ ...f, stakes: f.stakes.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)) })} />
                <span className="text-right shrink-0" style={{ width: 100, fontFamily: F.mono, fontSize: 13.5, color: C.muted }}>
                  {brl((n(f.banca) * n(s.pct)) / 100)}
                </span>
                <button disabled={f.stakes.length <= 1} onClick={() => setF({ ...f, stakes: f.stakes.filter((_, j) => j !== i) })}
                  className="p-2 rounded-lg shrink-0" style={{ color: C.faint }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {dirty && (
          <div className="flex justify-end gap-2 mt-6 pt-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <Btn kind="outline" onClick={() => setF(cfg)}>Descartar</Btn>
            <Btn kind="green" onClick={() => salvarCfg(f)}>Salvar alterações</Btn>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1" style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600 }}>Quem usa o app</h2>
        <p className="mb-5" style={{ fontSize: 13, color: C.muted }}>
          Para adicionar alguém, peça que a pessoa entre no link e clique em Criar conta. Ela aparece aqui sozinha.
        </p>
        <div className="space-y-2">
          {users.map((u) => {
            const qtd = bets.filter((b) => b.usuarioId === u.id).length;
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: u.cor, color: "#fff", fontWeight: 600, fontSize: 13 }}>
                  {u.nome[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {u.nome}{u.id === me.id && <span style={{ fontSize: 11.5, color: C.green }}> · você</span>}
                  </p>
                  <p style={{ fontSize: 12, color: C.muted }}>{qtd} aposta{qtd !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <Btn kind="ghost" onClick={sair}><LogOut size={15} /> Sair da conta</Btn>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1" style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600 }}>Backup</h2>
        <p className="mb-5" style={{ fontSize: 13, color: C.muted }}>
          Seus dados já ficam salvos no banco. Isso aqui é só uma cópia extra para o seu computador.
        </p>
        <Btn kind="outline" onClick={exportar}><Download size={16} /> Baixar cópia dos dados</Btn>
      </Card>
    </div>
  );
}
