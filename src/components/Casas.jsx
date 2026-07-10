"use client";
import React, { useState, useEffect } from "react";
import {
  Plus, Building2, Lock, ChevronDown, ExternalLink, Eye, EyeOff,
  Copy, Check, Pencil, Trash2, Globe, KeyRound, UserPlus,
} from "lucide-react";
import {
  C, Card, Input, Label, Btn, Modal, Empty, Confirmar,
  Aviso, IconeCasa, Avatar, copiarTexto,
} from "@/lib/ui";
import { uid, faviconDe, dominio, nomeDaConta } from "@/lib/calc";

export default function Casas(p) {
  const { casas, contas, bets, movs, users, me, salvarCasa, excluirCasa, salvarConta, excluirConta, flash } = p;

  const [modalCasa, setModalCasa] = useState(null);
  const [modalConta, setModalConta] = useState(null);
  const [aberto, setAberto] = useState({});
  const [excluindoCasa, setExcluindoCasa] = useState(null);
  const [excluindoConta, setExcluindoConta] = useState(null);

  const contasDa = (casaId) => contas.filter((c) => c.casaId === casaId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Casas</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>Cada casa pode ter várias contas de acesso.</p>
        </div>
        <Btn kind="green" onClick={() => setModalCasa({ id: uid(), nome: "", url: "", icone: "", obs: "", nova: true })}>
          <Plus size={17} /> Nova casa
        </Btn>
      </div>

      <Aviso icone={Lock}>
        As senhas ficam salvas em texto simples. Qualquer pessoa com conta neste app consegue ver.
      </Aviso>

      {casas.length === 0 ? (
        <Card pad={false}>
          <Empty icon={Building2} title="Nenhuma casa cadastrada" hint="Cadastre para vincular apostas e guardar os acessos." />
        </Card>
      ) : (
        <div className="space-y-3">
          {casas.map((c) => {
            const qtdApostas = bets.filter((b) => b.casaId === c.id).length;
            const lista = contasDa(c.id);
            const op = aberto[c.id];

            return (
              <Card key={c.id} pad={false}>
                {/* cabeçalho da casa */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}>
                    <IconeCasa casa={c} size={26} radius={5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{c.nome}</p>
                    <p className="num" style={{ fontSize: 12.5, color: C.muted }}>
                      {qtdApostas} aposta{qtdApostas !== 1 ? "s" : ""}
                      {c.url ? ` · ${dominio(c.url)}` : ""}
                    </p>
                  </div>

                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg shrink-0" style={{ color: C.blue }}>
                      <ExternalLink size={16} />
                    </a>
                  )}

                  <button onClick={() => setAberto({ ...aberto, [c.id]: !op })}
                    className="px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
                    style={{ background: op ? C.greenSoft : C.lineSoft, color: op ? C.greenDeep : C.body, fontSize: 12.5, transition: "background .13s" }}>
                    <KeyRound size={13} />
                    {lista.length} acesso{lista.length !== 1 ? "s" : ""}
                    <ChevronDown size={13} style={{ transform: op ? "rotate(180deg)" : "", transition: "transform .16s ease" }} />
                  </button>
                </div>

                {/* acessos */}
                {op && (
                  <div className="anim-detalhe" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    {lista.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p style={{ fontSize: 13.5, color: C.muted }}>Nenhum acesso cadastrado nesta casa.</p>
                        <Btn kind="outline" size="sm" className="mt-3"
                          onClick={() => setModalConta({ id: uid(), casaId: c.id, usuarioId: me.id, apelido: "", login: "", senha: "", obs: "", nova: true })}
                          style={{ marginTop: 12 }}>
                          <UserPlus size={14} /> Adicionar acesso
                        </Btn>
                      </div>
                    ) : (
                      <div>
                        {lista.map((conta, i) => (
                          <Acesso key={conta.id} conta={conta} users={users} movs={movs} first={i === 0} flash={flash}
                            onEditar={() => setModalConta({ ...conta })}
                            onExcluir={() => setExcluindoConta({ ...conta, casa: c })} />
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 px-5 py-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                      {lista.length > 0 && (
                        <Btn size="sm" kind="outline"
                          onClick={() => setModalConta({ id: uid(), casaId: c.id, usuarioId: me.id, apelido: "", login: "", senha: "", obs: "", nova: true })}>
                          <UserPlus size={14} /> Adicionar acesso
                        </Btn>
                      )}
                      <div className="flex-1" />
                      <Btn size="sm" kind="ghost" onClick={() => setModalCasa({ ...c })}><Pencil size={14} /> Editar casa</Btn>
                      <Btn size="sm" kind="ghost" style={{ color: C.red }}
                        onClick={() => setExcluindoCasa({ ...c, qtdApostas, qtdContas: lista.length })}>
                        <Trash2 size={14} /> Excluir
                      </Btn>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modalCasa && <CasaModal modal={modalCasa} setModal={setModalCasa} salvarCasa={salvarCasa} />}

      {modalConta && (
        <ContaModal modal={modalConta} setModal={setModalConta} salvarConta={salvarConta}
          casa={casas.find((c) => c.id === modalConta.casaId)} users={users} me={me} />
      )}

      {excluindoCasa && (
        <Confirmar
          titulo="Excluir esta casa?"
          mensagem={
            [
              excluindoCasa.qtdApostas && `${excluindoCasa.qtdApostas} aposta${excluindoCasa.qtdApostas > 1 ? "s" : ""} ficará${excluindoCasa.qtdApostas > 1 ? "o" : ""} sem casa.`,
              excluindoCasa.qtdContas && `${excluindoCasa.qtdContas} acesso${excluindoCasa.qtdContas > 1 ? "s serão apagados" : " será apagado"}.`,
            ].filter(Boolean).join(" ") || "Não dá para desfazer."
          }
          tom="red" rotuloOk="Excluir"
          onCancelar={() => setExcluindoCasa(null)}
          onOk={() => { excluirCasa(excluindoCasa.id); setExcluindoCasa(null); }}
          detalhe={
            <div className="flex items-center gap-2.5">
              <IconeCasa casa={excluindoCasa} size={20} />
              <p style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>{excluindoCasa.nome}</p>
            </div>
          }
        />
      )}

      {excluindoConta && (
        <Confirmar
          titulo="Excluir este acesso?"
          mensagem="O login e a senha serão apagados. As apostas e os movimentos continuam."
          tom="red" rotuloOk="Excluir"
          onCancelar={() => setExcluindoConta(null)}
          onOk={() => { excluirConta(excluindoConta.id); setExcluindoConta(null); }}
          detalhe={
            <div className="flex items-center gap-2.5">
              <IconeCasa casa={excluindoConta.casa} size={20} />
              <div className="min-w-0">
                <p className="truncate" style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>{nomeDaConta(excluindoConta)}</p>
                <p className="truncate" style={{ fontSize: 12, color: C.muted }}>{excluindoConta.casa?.nome}</p>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

/* ─────────── um acesso ─────────── */

function Acesso({ conta, users, movs, first, flash, onEditar, onExcluir }) {
  const [ver, setVer] = useState(false);
  const [copiado, setCopiado] = useState("");

  const dono = users.find((u) => u.id === conta.usuarioId);
  const usada = movs.filter((m) => m.contaId === conta.id).length;

  const copiar = (texto, rotulo) => {
    if (!texto) return flash("Nada para copiar");
    if (copiarTexto(texto)) {
      setCopiado(rotulo);
      setTimeout(() => setCopiado(""), 1400);
      flash(`${rotulo} copiado`);
    }
  };

  return (
    <div className="px-5 py-4" style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}>
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar user={dono} size={22} />
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{nomeDaConta(conta)}</p>
          <p className="truncate" style={{ fontSize: 11.5, color: C.muted }}>
            {dono?.nome || "\u2014"}
            {usada > 0 && ` · ${usada} movimento${usada > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEditar} className="p-1.5 rounded-md" style={{ color: C.faint }} title="Editar"><Pencil size={14} /></button>
          <button onClick={onExcluir} className="p-1.5 rounded-md" style={{ color: C.faint }} title="Excluir"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Login</Label>
          <div className="flex gap-2">
            <Input readOnly value={conta.login} placeholder="\u2014" />
            <Btn kind="outline" style={{ padding: "0 12px" }} onClick={() => copiar(conta.login, "Login")}>
              {copiado === "Login" ? <Check size={15} style={{ color: C.green }} /> : <Copy size={15} />}
            </Btn>
          </div>
        </div>
        <div>
          <Label>Senha</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input readOnly numerico type={ver ? "text" : "password"} value={conta.senha} placeholder="\u2014" style={{ paddingRight: 40 }} />
              <button onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Btn kind="outline" style={{ padding: "0 12px" }} onClick={() => copiar(conta.senha, "Senha")}>
              {copiado === "Senha" ? <Check size={15} style={{ color: C.green }} /> : <Copy size={15} />}
            </Btn>
          </div>
        </div>
      </div>

      {conta.obs && <p className="mt-2.5" style={{ fontSize: 12.5, color: C.muted }}>{conta.obs}</p>}
    </div>
  );
}

/* ─────────── cadastro da casa ─────────── */

function CasaModal({ modal, setModal, salvarCasa }) {
  const [f, setF] = useState(modal);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const [manual, setManual] = useState(!!modal.icone && !modal.nova);

  useEffect(() => {
    if (manual) return;
    const auto = faviconDe(f.url);
    if (auto !== f.icone) set("icone", auto);
  }, [f.url, manual]);

  const d = dominio(f.url);

  return (
    <Modal onClose={() => setModal(null)} title={f.nova ? "Nova casa" : "Editar casa"}>
      <div className="space-y-4">
        <div><Label>Nome</Label>
          <Input value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Bet365" autoFocus />
        </div>

        <div><Label>Link do site</Label>
          <Input value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://www.bet365.com" />
          {d && <p className="mt-1.5" style={{ fontSize: 12, color: C.faint }}>O ícone vem de {d}</p>}
        </div>

        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#FBFBF9", border: `1px solid ${C.line}` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <IconeCasa casa={f} size={28} radius={5} />
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 12, fontWeight: 600, color: C.body }}>Ícone da casa</p>
            <p style={{ fontSize: 12, color: C.faint }}>
              {f.icone ? (manual ? "Endereço definido por você" : "Puxado do site automaticamente") : "Sem link, mostra a inicial do nome"}
            </p>
          </div>
          {f.icone && !manual && (
            <button onClick={() => setManual(true)} className="shrink-0 px-2.5 py-1.5 rounded-lg"
              style={{ fontSize: 11.5, color: C.body, border: `1px solid ${C.line}`, background: "#fff" }}>
              Trocar
            </button>
          )}
        </div>

        {manual && (
          <div><Label>Endereço da imagem</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
                <Input value={f.icone} onChange={(e) => set("icone", e.target.value)} placeholder="https://.../logo.png" style={{ paddingLeft: 38 }} />
              </div>
              <Btn kind="outline" onClick={() => { setManual(false); set("icone", faviconDe(f.url)); }}>Automático</Btn>
            </div>
          </div>
        )}

        <div><Label>Observação</Label>
          <Input value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Opcional" />
        </div>

        <p style={{ fontSize: 12, color: C.faint }}>
          Login e senha ficam nos acessos, dentro da casa. Uma casa pode ter vários.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Btn kind="outline" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn kind="green" disabled={!f.nome.trim()} onClick={() => { salvarCasa(f); setModal(null); }}>Salvar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────── cadastro do acesso ─────────── */

function ContaModal({ modal, setModal, salvarConta, casa, users, me }) {
  const [f, setF] = useState(modal);
  const [ver, setVer] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const dono = users.find((u) => u.id === f.usuarioId);
  const ok = f.login.trim() || f.senha.trim();

  return (
    <Modal onClose={() => setModal(null)}
      title={f.nova ? "Novo acesso" : "Editar acesso"}
      sub={
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {casa && <IconeCasa casa={casa} size={16} radius={3} />}
          <b style={{ fontWeight: 600, color: C.body }}>{casa?.nome}</b>
          <span>· {f.nova ? "vai ficar no nome de" : "cadastrado por"}</span>
          <Avatar user={f.nova ? me : dono} size={16} />
          <b style={{ fontWeight: 600, color: C.body }}>{(f.nova ? me : dono)?.nome}</b>
        </span>
      }>
      <div className="space-y-4">
        <div><Label>Apelido</Label>
          <Input value={f.apelido} onChange={(e) => set("apelido", e.target.value)} placeholder="Principal, Secundária..." autoFocus />
          <p className="mt-1.5" style={{ fontSize: 12, color: C.faint }}>
            Ajuda a diferenciar quando a casa tem mais de uma conta.
          </p>
        </div>

        <div><Label>Login</Label>
          <Input value={f.login} onChange={(e) => set("login", e.target.value)} placeholder="e-mail, CPF ou usuário" />
        </div>

        <div><Label>Senha</Label>
          <div className="relative">
            <Input type={ver ? "text" : "password"} value={f.senha} onChange={(e) => set("senha", e.target.value)} style={{ paddingRight: 40 }} />
            <button onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
              {ver ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div><Label>Observação</Label>
          <Input value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Chave PIX, banco, agência..." />
        </div>

        <Aviso icone={Lock}>A senha fica em texto simples. Quem tem conta no app enxerga.</Aviso>

        <div className="flex justify-end gap-2 pt-1">
          <Btn kind="outline" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn kind="green" disabled={!ok} onClick={() => { salvarConta(f); setModal(null); }}>Salvar acesso</Btn>
        </div>
      </div>
    </Modal>
  );
}
