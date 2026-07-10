"use client";
import React, { useState } from "react";
import { Plus, Building2, Lock, ChevronDown, ExternalLink, Eye, EyeOff, Copy, Pencil, Trash2 } from "lucide-react";
import { C, F, Card, Input, Label, Btn, Modal, Empty } from "@/lib/ui";
import { uid } from "@/lib/calc";

export default function Casas({ casas, bets, salvarCasa, excluirCasa, flash }) {
  const [modal, setModal] = useState(null);
  const [ver, setVer] = useState({});
  const [aberto, setAberto] = useState({});

  const copiar = (t, l) => {
    const ta = document.createElement("textarea");
    ta.value = t || "";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    flash(`${l} copiado`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>Casas</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>Link, login e senha de cada casa.</p>
        </div>
        <Btn kind="green" onClick={() => setModal({ id: uid(), nome: "", url: "", login: "", senha: "", obs: "", nova: true })}>
          <Plus size={17} /> Nova
        </Btn>
      </div>

      <div className="rounded-xl px-4 py-3 flex gap-2.5" style={{ background: C.amberSoft, border: `1px solid ${C.amberBand}` }}>
        <Lock size={15} style={{ color: C.amber, marginTop: 2 }} className="shrink-0" />
        <p style={{ fontSize: 12.5, color: "#8A6212" }}>
          As senhas ficam salvas em texto simples. Qualquer pessoa com conta neste app consegue ver.
        </p>
      </div>

      {casas.length === 0 ? (
        <Card pad={false}><Empty icon={Building2} title="Nenhuma casa cadastrada" hint="Cadastre para vincular apostas e guardar o acesso." /></Card>
      ) : (
        <div className="space-y-3">
          {casas.map((c) => {
            const qtd = bets.filter((b) => b.casaId === c.id).length;
            const op = aberto[c.id];
            return (
              <Card key={c.id} pad={false}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.lineSoft, fontFamily: F.display, fontWeight: 700, color: C.body }}>
                    {c.nome[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{c.nome}</p>
                    <p style={{ fontSize: 12.5, color: C.muted }}>{qtd} aposta{qtd !== 1 ? "s" : ""}</p>
                  </div>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg shrink-0" style={{ color: C.blue }}>
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button onClick={() => setAberto({ ...aberto, [c.id]: !op })} className="px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
                    style={{ background: C.lineSoft, fontSize: 12.5, color: C.body }}>
                    <Lock size={13} /> Acesso
                    <ChevronDown size={13} style={{ transform: op ? "rotate(180deg)" : "", transition: ".15s" }} />
                  </button>
                </div>

                {op && (
                  <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    <div className="grid sm:grid-cols-2 gap-3 pt-4">
                      <div>
                        <Label>Login</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={c.login} />
                          <Btn kind="outline" style={{ padding: "0 12px" }} onClick={() => copiar(c.login, "Login")}><Copy size={15} /></Btn>
                        </div>
                      </div>
                      <div>
                        <Label>Senha</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input readOnly type={ver[c.id] ? "text" : "password"} value={c.senha} style={{ paddingRight: 40, fontFamily: F.mono }} />
                            <button onClick={() => setVer({ ...ver, [c.id]: !ver[c.id] })} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
                              {ver[c.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <Btn kind="outline" style={{ padding: "0 12px" }} onClick={() => copiar(c.senha, "Senha")}><Copy size={15} /></Btn>
                        </div>
                      </div>
                    </div>
                    {c.obs && <p style={{ fontSize: 12.5, color: C.muted }}>{c.obs}</p>}
                    <div className="flex gap-2">
                      <Btn size="sm" kind="ghost" onClick={() => setModal({ ...c })}><Pencil size={14} /> Editar</Btn>
                      <Btn size="sm" kind="ghost" style={{ color: C.red }} onClick={() => {
                        if (qtd && !confirm(`${qtd} aposta(s) usam esta casa. Elas ficam sem casa. Continuar?`)) return;
                        if (!qtd && !confirm("Excluir esta casa?")) return;
                        excluirCasa(c.id);
                      }}><Trash2 size={14} /> Excluir</Btn>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)} title={modal.nova ? "Nova casa" : "Editar casa"}>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={modal.nome} onChange={(e) => setModal({ ...modal, nome: e.target.value })} placeholder="Bet365" autoFocus /></div>
            <div><Label>Link do site</Label><Input value={modal.url} onChange={(e) => setModal({ ...modal, url: e.target.value })} placeholder="https://" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Login</Label><Input value={modal.login} onChange={(e) => setModal({ ...modal, login: e.target.value })} /></div>
              <div><Label>Senha</Label><Input value={modal.senha} onChange={(e) => setModal({ ...modal, senha: e.target.value })} /></div>
            </div>
            <div><Label>Observação</Label><Input value={modal.obs} onChange={(e) => setModal({ ...modal, obs: e.target.value })} placeholder="Chave PIX, conta..." /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn kind="outline" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn kind="green" disabled={!modal.nome.trim()} onClick={() => { salvarCasa(modal); setModal(null); }}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
