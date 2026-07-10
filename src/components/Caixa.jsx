"use client";
import React, { useState, useMemo } from "react";
import {
  Plus, Wallet, Search, SlidersHorizontal, X, ChevronDown,
  ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Building2,
} from "lucide-react";
import {
  C, Card, Input, Select, SelectCasa, Btn, Empty, Money, Num, Stat, Big,
  Modal, Label, Confirmar, IconeCasa, Avatar, Aviso,
} from "@/lib/ui";
import {
  uid, n, brl, sgn, dBR, hoje, TIPOS, nomeDaConta,
  totalPorTipo, saldoMovimentos, caixaPorCasa,
} from "@/lib/calc";

const diasAtras = (d) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

const PERIODOS = [
  { id: "tudo", label: "Tudo", de: () => "" },
  { id: "hoje", label: "Hoje", de: () => hoje() },
  { id: "7", label: "7 dias", de: () => diasAtras(6) },
  { id: "30", label: "30 dias", de: () => diasAtras(29) },
];

const METODOS = ["PIX", "Cartão", "Boleto", "Transferência", "Outro"];

const VAZIO = {
  busca: "", usuario: "", tipo: "", casa: "", conta: "", metodo: "",
  de: "", ate: "", valorMin: "", valorMax: "", periodo: "tudo",
};

export default function Caixa(p) {
  const { movs, casas, contas, users, bets, me, salvarMov, excluirMov, flash } = p;
  const [f, setF] = useState(VAZIO);
  const [avancado, setAvancado] = useState(false);
  const [modal, setModal] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const usarPeriodo = (id) => {
    const p = PERIODOS.find((x) => x.id === id);
    setF((x) => ({ ...x, periodo: id, de: p.de(), ate: "" }));
  };

  const ativos = useMemo(() => {
    let c = 0;
    for (const [k, v] of Object.entries(f)) {
      if (k === "periodo") { if (v !== "tudo") c++; continue; }
      if (k === "de" && f.periodo !== "tudo") continue;
      if (v) c++;
    }
    return c;
  }, [f]);

  const lista = useMemo(() => {
    const termo = f.busca.trim().toLowerCase();
    return movs
      .filter((m) => {
        if (f.usuario && m.usuarioId !== f.usuario) return false;
        if (f.tipo && m.tipo !== f.tipo) return false;
        if (f.casa && m.casaId !== f.casa) return false;
        if (f.conta && m.contaId !== f.conta) return false;
        if (f.metodo && m.metodo !== f.metodo) return false;
        if (f.de && m.data < f.de) return false;
        if (f.ate && m.data > f.ate) return false;
        if (f.valorMin && n(m.valor) < n(f.valorMin)) return false;
        if (f.valorMax && n(m.valor) > n(f.valorMax)) return false;
        if (termo) {
          const casa = casas.find((c) => c.id === m.casaId)?.nome || "";
          const user = users.find((u) => u.id === m.usuarioId)?.nome || "";
          const conta = nomeDaConta(contas.find((c) => c.id === m.contaId));
          const alvo = `${casa} ${user} ${conta} ${m.metodo} ${m.obs}`.toLowerCase();
          if (!alvo.includes(termo)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.data + b.id).localeCompare(a.data + a.id));
  }, [movs, casas, contas, users, f]);

  const dep = totalPorTipo(lista, "deposito");
  const saq = totalPorTipo(lista, "saque");
  const saldo = saldoMovimentos(lista);

  const caixas = useMemo(
    () => caixaPorCasa(casas, movs, bets).filter((c) => c.qtd > 0),
    [casas, movs, bets]
  );

  const grupos = useMemo(() => {
    const m = {};
    lista.forEach((x) => (m[x.data] ||= []).push(x));
    return Object.entries(m);
  }, [lista]);

  const abrirNovo = (tipo) =>
    setModal({
      id: uid(), novo: true, tipo, data: hoje(),
      usuarioId: me.id, casaId: casas[0]?.id || "", contaId: "",
      valor: "", metodo: "PIX", obs: "",
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Caixa</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>Depósitos e saques nas casas de aposta.</p>
        </div>
        <div className="flex gap-2">
          <Btn kind="green" onClick={() => abrirNovo("deposito")} disabled={!casas.length}>
            <ArrowDownLeft size={16} /> Depósito
          </Btn>
          <Btn kind="outline" onClick={() => abrirNovo("saque")} disabled={!casas.length}>
            <ArrowUpRight size={16} /> Saque
          </Btn>
        </div>
      </div>

      {!casas.length && (
        <Aviso icone={Building2}>
          Cadastre uma casa em <b>Casas</b> antes de registrar depósito ou saque.
        </Aviso>
      )}

      {/* ── números do que está filtrado ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Big k="Depositado" v={brl(dep)} cor={C.green} sub={`${lista.filter((m) => m.tipo === "deposito").length} depósitos`} />
        <Big k="Sacado" v={brl(saq)} cor={C.red} sub={`${lista.filter((m) => m.tipo === "saque").length} saques`} />
        <Big k="Saldo movimentado" v={sgn(saldo)} cor={saldo >= 0 ? C.ink : C.red}
          sub={saldo >= 0 ? "você pôs mais do que tirou" : "você tirou mais do que pôs"} />
      </div>

      {/* ── caixa estimado por casa ── */}
      {caixas.length > 0 && (
        <Card>
          <div className="flex items-baseline justify-between mb-4">
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>Caixa por casa</h2>
            <p style={{ fontSize: 12, color: C.faint }}>depósitos − saques + lucro das apostas</p>
          </div>
          <div className="space-y-2.5">
            {caixas.map(({ casa, dep, saq, luc, caixa }) => (
              <div key={casa.id} className="flex items-center gap-3 py-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <IconeCasa casa={casa} size={26} radius={6} />
                <div className="min-w-0 flex-1">
                  {casa.url ? (
                    <a href={casa.url} target="_blank" rel="noreferrer" className="hover:underline truncate block"
                      style={{ fontSize: 14, fontWeight: 500, color: C.blue }}>
                      {casa.nome}
                    </a>
                  ) : (
                    <p className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{casa.nome}</p>
                  )}
                  <p className="num" style={{ fontSize: 11.5, color: C.faint }}>
                    +{brl(dep)} · −{brl(saq)} · lucro {sgn(luc)}
                  </p>
                </div>
                <Num size={16} weight={600} color={caixa >= 0 ? C.ink : C.red}>{brl(caixa)}</Num>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── filtros ── */}
      <Card>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
          <Input value={f.busca} onChange={(e) => set("busca", e.target.value)}
            placeholder="Buscar por casa, pessoa, método ou observação"
            style={{ paddingLeft: 40, paddingRight: f.busca ? 40 : 14 }} />
          {f.busca && (
            <button onClick={() => set("busca", "")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {PERIODOS.map((p) => {
            const on = f.periodo === p.id;
            return (
              <button key={p.id} onClick={() => usarPeriodo(p.id)} className="px-3 py-1.5 rounded-lg"
                style={{
                  fontSize: 12.5, fontWeight: on ? 600 : 400,
                  color: on ? C.greenDeep : C.body,
                  background: on ? C.greenSoft : C.card,
                  border: `1px solid ${on ? C.greenBand : C.line}`,
                  transition: "all .13s ease",
                }}>
                {p.label}
              </button>
            );
          })}

          {[["deposito", "Depósitos"], ["saque", "Saques"]].map(([id, label]) => {
            const on = f.tipo === id;
            return (
              <button key={id} onClick={() => set("tipo", on ? "" : id)} className="px-3 py-1.5 rounded-lg"
                style={{
                  fontSize: 12.5, fontWeight: on ? 600 : 400,
                  color: on ? (id === "deposito" ? C.greenDeep : C.red) : C.body,
                  background: on ? (id === "deposito" ? C.greenSoft : C.redSoft) : C.card,
                  border: `1px solid ${on ? (id === "deposito" ? C.greenBand : C.redBand) : C.line}`,
                  transition: "all .13s ease",
                }}>
                {label}
              </button>
            );
          })}

          <div className="flex-1" />

          <button onClick={() => setAvancado(!avancado)} className="px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
            style={{
              fontSize: 12.5, color: avancado ? C.greenDeep : C.body,
              background: avancado ? C.greenSoft : C.card,
              border: `1px solid ${avancado ? C.greenBand : C.line}`,
              transition: "all .13s ease",
            }}>
            <SlidersHorizontal size={13} />
            Mais filtros
            {ativos > 0 && (
              <span className="num inline-flex items-center justify-center"
                style={{ minWidth: 16, height: 16, borderRadius: 8, fontSize: 10, fontWeight: 700, background: C.green, color: "#fff", padding: "0 4px" }}>
                {ativos}
              </span>
            )}
            <ChevronDown size={13} style={{ transform: avancado ? "rotate(180deg)" : "", transition: "transform .16s ease" }} />
          </button>

          {ativos > 0 && (
            <button onClick={() => setF(VAZIO)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: 12.5, color: C.red }}>
              Limpar
            </button>
          )}
        </div>

        {avancado && (
          <div className="anim-detalhe mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={f.usuario} onChange={(e) => set("usuario", e.target.value)}>
                <option value="">Todos usuários</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
              <Select value={f.casa} onChange={(e) => set("casa", e.target.value)}>
                <option value="">Todas casas</option>
                {casas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
              <Select value={f.metodo} onChange={(e) => set("metodo", e.target.value)}>
                <option value="">Todos métodos</option>
                {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            {contas.length > 0 && (
              <Select value={f.conta} onChange={(e) => set("conta", e.target.value)}>
                <option value="">Todas as contas</option>
                {contas.map((c) => {
                  const casa = casas.find((x) => x.id === c.casaId);
                  return <option key={c.id} value={c.id}>{casa?.nome} · {nomeDaConta(c)}</option>;
                })}
              </Select>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>Período</p>
                <div className="flex gap-2">
                  <Input type="date" value={f.de} onChange={(e) => { set("de", e.target.value); set("periodo", "tudo"); }} />
                  <Input type="date" value={f.ate} onChange={(e) => { set("ate", e.target.value); set("periodo", "tudo"); }} />
                </div>
              </div>
              <div>
                <p className="mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>Valor R$</p>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="mín" value={f.valorMin} onChange={(e) => set("valorMin", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="máx" value={f.valorMax} onChange={(e) => set("valorMax", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {lista.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <Stat k="Movimentos" v={lista.length} />
            <Stat k="Entrou" v={brl(dep)} cor={C.green} />
            <Stat k="Saiu" v={brl(saq)} cor={C.red} />
            <Stat k="Saldo" v={sgn(saldo)} cor={saldo >= 0 ? C.ink : C.red} />
          </div>
        )}
      </Card>

      {/* ── lista ── */}
      {lista.length === 0 ? (
        <Card pad={false}>
          <Empty icon={Wallet}
            title={movs.length ? "Nada com esses filtros" : "Nenhum movimento ainda"}
            hint={movs.length ? "Afrouxe a busca ou limpe os filtros." : "Registre seu primeiro depósito."}
            action={movs.length
              ? <Btn kind="outline" onClick={() => setF(VAZIO)}>Limpar filtros</Btn>
              : casas.length
                ? <Btn kind="green" onClick={() => abrirNovo("deposito")}><Plus size={16} /> Novo depósito</Btn>
                : null} />
        </Card>
      ) : (
        grupos.map(([data, arr]) => {
          const s = saldoMovimentos(arr);
          return (
            <div key={data}>
              <div className="flex items-center justify-between px-1 mb-2">
                <p style={{ fontSize: 13, fontWeight: 600, color: C.body }}>
                  {dBR(data)}{data === hoje() && <span style={{ color: C.green, fontWeight: 500 }}> · hoje</span>}
                </p>
                <Money v={s} prefix size={13} weight={600} color={s > 0 ? C.green : s < 0 ? C.red : C.faint} />
              </div>
              <Card pad={false}>
                {arr.map((m, i) => (
                  <Linha key={m.id} m={m} casas={casas} contas={contas} users={users} first={i === 0}
                    onEditar={() => setModal({ ...m })} onExcluir={() => setExcluindo(m)} />
                ))}
              </Card>
            </div>
          );
        })
      )}

      {modal && (
        <MovModal modal={modal} setModal={setModal} casas={casas} contas={contas} users={users} me={me} salvarMov={salvarMov} />
      )}

      {excluindo && (
        <Confirmar
          titulo={`Excluir este ${TIPOS[excluindo.tipo].label.toLowerCase()}?`}
          mensagem="Não dá para desfazer."
          tom="red" rotuloOk="Excluir"
          onCancelar={() => setExcluindo(null)}
          onOk={() => { excluirMov(excluindo.id); setExcluindo(null); }}
          detalhe={
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 min-w-0">
                <IconeCasa casa={casas.find((c) => c.id === excluindo.casaId)} size={20} />
                <span className="truncate" style={{ fontSize: 13.5, fontWeight: 500 }}>
                  {casas.find((c) => c.id === excluindo.casaId)?.nome || "\u2014"}
                </span>
              </span>
              <Num size={16} weight={700} color={excluindo.tipo === "deposito" ? C.green : C.red}>
                {brl(n(excluindo.valor))}
              </Num>
            </div>
          }
        />
      )}
    </div>
  );
}

/* ── uma linha do extrato ── */

function Linha({ m, casas, contas, users, first, onEditar, onExcluir }) {
  const casa = casas.find((c) => c.id === m.casaId);
  const conta = contas.find((c) => c.id === m.contaId);
  const u = users.find((x) => x.id === m.usuarioId);
  const dep = m.tipo === "deposito";
  const cor = dep ? C.green : C.red;

  return (
    <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: dep ? C.greenSoft : C.redSoft, color: cor, border: `1px solid ${dep ? C.greenBand : C.redBand}` }}>
        {dep ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          {casa && <IconeCasa casa={casa} size={14} radius={3} />}
          {casa?.url ? (
            <a href={casa.url} target="_blank" rel="noreferrer" className="truncate hover:underline"
              style={{ fontSize: 14.5, fontWeight: 500, color: C.blue }}>
              {casa.nome}
            </a>
          ) : (
            <p className="truncate" style={{ fontSize: 14.5, fontWeight: 500, color: casa ? C.ink : C.faint }}>
              {casa?.nome || "Casa excluída"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <Avatar user={u} size={14} />
          <p className="num truncate" style={{ fontSize: 12.5, color: C.muted }}>
            {u?.nome || "\u2014"}
            {conta && ` · ${nomeDaConta(conta)}`}
            {m.metodo && ` · ${m.metodo}`}
            {m.obs && ` · ${m.obs}`}
          </p>
        </div>
      </div>

      <Num size={15} weight={600} color={cor}>{dep ? "+" : "\u2212"}{brl(n(m.valor))}</Num>

      <div className="flex gap-1 shrink-0">
        <button onClick={onEditar} className="p-1.5 rounded-md" style={{ color: C.faint }}><Pencil size={14} /></button>
        <button onClick={onExcluir} className="p-1.5 rounded-md" style={{ color: C.faint }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

/* ── cadastro ── */

function MovModal({ modal, setModal, casas, contas, users, me, salvarMov }) {
  const [f, setF] = useState(modal);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const dep = f.tipo === "deposito";
  const dono = users.find((u) => u.id === f.usuarioId);
  const ok = n(f.valor) > 0 && f.casaId;

  // Só as contas da casa escolhida. Trocar de casa limpa a conta.
  const contasDaCasa = contas.filter((c) => c.casaId === f.casaId);

  const trocarCasa = (id) => setF((p) => ({ ...p, casaId: id, contaId: "" }));

  return (
    <Modal onClose={() => setModal(null)}
      title={f.novo ? `Novo ${TIPOS[f.tipo].label.toLowerCase()}` : `Editar ${TIPOS[f.tipo].label.toLowerCase()}`}
      sub={
        <span className="inline-flex items-center gap-1.5">
          {f.novo ? "Vai entrar no nome de" : "Registrado por"}
          <Avatar user={f.novo ? me : dono} size={17} />
          <b style={{ fontWeight: 600, color: C.body }}>{(f.novo ? me : dono)?.nome || "\u2014"}</b>
        </span>
      }>
      <div className="space-y-4">
        {/* tipo */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TIPOS).map(([k, v]) => {
            const on = f.tipo === k;
            const verde = k === "deposito";
            return (
              <button key={k} type="button" onClick={() => set("tipo", k)}
                className="rounded-xl px-3 py-3 inline-flex items-center justify-center gap-2"
                style={{
                  border: `1.5px solid ${on ? (verde ? C.green : C.red) : C.line}`,
                  background: on ? (verde ? C.greenSoft : C.redSoft) : C.card,
                  color: on ? (verde ? C.greenDeep : C.red) : C.body,
                  fontSize: 14, fontWeight: on ? 600 : 400,
                  transition: "all .13s ease",
                }}>
                {verde ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Data</Label><Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} /></div>
          <div><Label>Valor R$</Label>
            <Input type="number" step="0.01" value={f.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" autoFocus />
          </div>
        </div>

        <div><Label>Casa de aposta</Label>
          <SelectCasa casas={casas} valor={f.casaId} onChange={trocarCasa}
            permitirVazio={false} rotuloVazio="Selecione" />
        </div>

        {contasDaCasa.length > 0 && (
          <div><Label>Conta</Label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => set("contaId", "")}
                className="px-3 py-2 rounded-lg"
                style={{
                  fontSize: 13, fontWeight: !f.contaId ? 600 : 400,
                  color: !f.contaId ? C.greenDeep : C.body,
                  background: !f.contaId ? C.greenSoft : C.card,
                  border: `1px solid ${!f.contaId ? C.greenBand : C.line}`,
                  transition: "all .13s ease",
                }}>
                Não informar
              </button>
              {contasDaCasa.map((c) => {
                const on = f.contaId === c.id;
                const dono = users.find((u) => u.id === c.usuarioId);
                return (
                  <button key={c.id} type="button" onClick={() => set("contaId", c.id)}
                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2"
                    style={{
                      fontSize: 13, fontWeight: on ? 600 : 400,
                      color: on ? C.greenDeep : C.body,
                      background: on ? C.greenSoft : C.card,
                      border: `1px solid ${on ? C.greenBand : C.line}`,
                      transition: "all .13s ease",
                    }}>
                    <Avatar user={dono} size={16} />
                    {nomeDaConta(c)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div><Label>Método</Label>
          <div className="flex flex-wrap gap-2">
            {METODOS.map((m) => {
              const on = f.metodo === m;
              return (
                <button key={m} type="button" onClick={() => set("metodo", m)} className="px-3 py-2 rounded-lg"
                  style={{
                    fontSize: 13, fontWeight: on ? 600 : 400,
                    color: on ? C.greenDeep : C.body,
                    background: on ? C.greenSoft : C.card,
                    border: `1px solid ${on ? C.greenBand : C.line}`,
                    transition: "all .13s ease",
                  }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {n(f.valor) > 0 && (
          <div className="rounded-xl p-4 flex items-baseline justify-between"
            style={{ background: dep ? C.greenSoft : C.redSoft, border: `1px solid ${dep ? C.greenBand : C.redBand}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: dep ? C.greenDeep : C.red }}>
              {dep ? "ENTRA NA CASA" : "SAI DA CASA"}
            </span>
            <Num size={22} weight={700} color={dep ? C.greenDeep : C.red}>
              {dep ? "+" : "\u2212"}{brl(n(f.valor))}
            </Num>
          </div>
        )}

        <div><Label>Observação</Label>
          <Input value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Opcional" />
        </div>

        <p style={{ fontSize: 12, color: C.faint }}>
          Depósitos e saques não são lucro. Eles não mexem na meta nem no stop loss do dia.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Btn kind="outline" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn kind="green" disabled={!ok} onClick={() => { salvarMov({ ...f, valor: n(f.valor) }); setModal(null); }}>
            {f.novo ? "Registrar" : "Salvar"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
