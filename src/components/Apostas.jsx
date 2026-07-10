"use client";
import React, { useState, useMemo } from "react";
import { Plus, Receipt } from "lucide-react";
import { C, F, Card, Input, Select, Btn, Empty, Money, Stat, ST } from "@/lib/ui";
import { n, brl, sgn, dBR, lucro, fechada } from "@/lib/calc";
import BetRow from "./BetRow";

export default function Apostas(p) {
  const { bets, casas, users, setModalAposta, mudarStatus, excluirAposta } = p;
  const [fu, setFu] = useState("");
  const [fs, setFs] = useState("");
  const [fc, setFc] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const lista = useMemo(
    () =>
      bets
        .filter((b) => !fu || b.usuarioId === fu)
        .filter((b) => !fs || b.status === fs)
        .filter((b) => !fc || b.casaId === fc)
        .filter((b) => !de || b.data >= de)
        .filter((b) => !ate || b.data <= ate),
    [bets, fu, fs, fc, de, ate]
  );

  const inv = lista.filter(fechada).reduce((s, b) => s + n(b.valor), 0);
  const luc = lista.filter(fechada).reduce((s, b) => s + lucro(b), 0);

  const grupos = useMemo(() => {
    const m = {};
    lista.forEach((b) => (m[b.data] ||= []).push(b));
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [lista]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Apostas</h1>
        <Btn kind="green" onClick={() => setModalAposta(true)}><Plus size={17} /> Nova</Btn>
      </div>

      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={fu} onChange={(e) => setFu(e.target.value)}>
            <option value="">Todos usuários</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </Select>
          <Select value={fs} onChange={(e) => setFs(e.target.value)}>
            <option value="">Todos status</option>
            {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Select value={fc} onChange={(e) => setFc(e.target.value)}>
            <option value="">Todas casas</option>
            {casas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        {lista.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <Stat k="Apostas" v={lista.length} />
            <Stat k="Investido" v={brl(inv)} />
            <Stat k="Resultado" v={sgn(luc)} cor={luc > 0 ? C.green : luc < 0 ? C.red : C.ink} />
            <Stat k="ROI" v={inv ? `${((luc / inv) * 100).toFixed(1)}%` : "\u2014"} />
          </div>
        )}
      </Card>

      {lista.length === 0 ? (
        <Card pad={false}>
          <Empty icon={Receipt} title="Nenhuma aposta encontrada" hint="Ajuste os filtros ou registre uma nova."
            action={<Btn kind="green" onClick={() => setModalAposta(true)}><Plus size={16} /> Nova aposta</Btn>} />
        </Card>
      ) : (
        grupos.map(([data, arr]) => {
          const total = arr.filter(fechada).reduce((s, b) => s + lucro(b), 0);
          return (
            <div key={data}>
              <div className="flex items-center justify-between px-1 mb-2">
                <p style={{ fontSize: 13, fontWeight: 600, color: C.body }}>{dBR(data)}</p>
                <Money v={total} prefix size={13} weight={600} color={total > 0 ? C.green : total < 0 ? C.red : C.faint} />
              </div>
              <Card pad={false}>
                {arr.map((b, i) => (
                  <BetRow key={b.id} b={b} casas={casas} users={users} first={i === 0}
                    setModalAposta={setModalAposta} mudarStatus={mudarStatus} excluirAposta={excluirAposta} />
                ))}
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
