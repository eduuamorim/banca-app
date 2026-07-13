"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Trash2, MessageCircle, Check, CheckCheck } from "lucide-react";
import { C, Avatar, Codigo, Empty } from "@/lib/ui";
import { n, brl, dBR, tituloAposta, mensagensPorDia, horaBR } from "@/lib/calc";

/* Cartão de uma aposta anexada dentro de uma mensagem. */
function ApostaAnexada({ aposta, onAbrir }) {
  if (!aposta) {
    return (
      <div className="rounded-lg px-3 py-2 mt-1" style={{ background: "rgba(0,0,0,.04)", border: `1px solid ${C.lineSoft}` }}>
        <span style={{ fontSize: 12, color: C.faint }}>Aposta removida</span>
      </div>
    );
  }
  const l = n(aposta.valor) * n(aposta.odd);
  return (
    <button onClick={() => onAbrir?.(aposta)}
      className="w-full text-left rounded-lg px-3 py-2 mt-1" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <span className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{tituloAposta(aposta)}</span>
        <Codigo valor={aposta.codigo} size={10} copiavel={false} />
      </div>
      <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: 11.5, color: C.muted }}>
        <span className="num">odd {n(aposta.odd).toFixed(2)}</span>
        <span className="num">{brl(n(aposta.valor))}</span>
        <span className="num" style={{ color: C.greenDeep }}>pode voltar {brl(l)}</span>
      </div>
    </button>
  );
}

/* Seletor de aposta para anexar. */
function SeletorAposta({ bets, onEscolher, onFechar }) {
  const [busca, setBusca] = useState("");
  const lista = bets
    .filter((b) => {
      const alvo = `${b.codigo} ${b.nome} ${b.evento}`.toLowerCase();
      return alvo.includes(busca.toLowerCase());
    })
    .slice(0, 40);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(20,30,33,.45)" }} onClick={onFechar}>
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Anexar aposta</h3>
          <button onClick={onFechar} style={{ color: C.faint }}><X size={18} /></button>
        </div>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por código ou nome"
          className="w-full rounded-xl px-3 py-2.5 mb-3" style={{ fontSize: 16, border: `1px solid ${C.line}`, outline: "none" }} autoFocus />
        <div className="overflow-y-auto -mx-1 px-1">
          {lista.length === 0
            ? <p className="text-center py-6" style={{ fontSize: 13, color: C.faint }}>Nenhuma aposta encontrada.</p>
            : lista.map((b) => (
                <button key={b.id} onClick={() => onEscolher(b)}
                  className="w-full text-left rounded-xl px-3 py-2.5 mb-1" style={{ border: `1px solid ${C.lineSoft}` }}>
                  <div className="flex items-center gap-2">
                    <span className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{tituloAposta(b)}</span>
                    <Codigo valor={b.codigo} size={10} copiavel={false} />
                  </div>
                  <span className="num" style={{ fontSize: 11.5, color: C.muted }}>odd {n(b.odd).toFixed(2)} · {brl(n(b.valor))}</span>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}

export default function Chat(p) {
  const { msgs, users, me, bets, enviarMensagem, excluirMensagem, setModalAposta, embutido, leituras = {} } = p;
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState(null);       // aposta escolhida para anexar
  const [seletor, setSeletor] = useState(false);
  const fim = useRef(null);

  // Rola para a última mensagem sempre que chega uma nova.
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const enviar = () => {
    const t = texto.trim();
    if (!t && !anexo) return;
    enviarMensagem({ texto: t, apostaId: anexo?.id || "" });
    setTexto("");
    setAnexo(null);
  };

  // Uma mensagem minha foi "lida" se o outro usuário marcou leitura
  // até um instante posterior ao envio dela.
  const foiLida = (m) => {
    if (!m.criadoEm) return false;
    const tMsg = new Date(m.criadoEm).getTime();
    return Object.entries(leituras).some(([uid, lido]) =>
      uid !== me.id && lido && new Date(lido).getTime() >= tMsg
    );
  };

  const porDia = mensagensPorDia(msgs);
  const outro = users.find((u) => u.id !== me.id);

  return (
    <div className="flex flex-col" style={embutido ? { height: "100%" } : { height: "calc(100dvh - 140px)", minHeight: 420 }}>
      {/* topo (só quando é aba; na bolha o cabeçalho é da própria janela) */}
      {!embutido && (
        <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <MessageCircle size={18} style={{ color: C.blue }} />
          <h1 style={{ fontSize: 17, fontWeight: 600 }}>Conversa</h1>
          {outro && (
            <span className="ml-auto inline-flex items-center gap-1.5" style={{ fontSize: 12.5, color: C.muted }}>
              com <Avatar user={outro} size={18} /> {outro.nome}
            </span>
          )}
        </div>
      )}

      {/* mensagens */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {msgs.length === 0 ? (
          <Empty icon={MessageCircle} title="Nenhuma mensagem ainda" hint="Escreva abaixo para começar a conversa." />
        ) : (
          porDia.map(([dia, doDay]) => (
            <div key={dia}>
              <div className="flex justify-center mb-3">
                <span className="rounded-full px-3 py-1" style={{ fontSize: 11, color: C.muted, background: C.lineSoft }}>{dBR(dia)}</span>
              </div>
              <div className="space-y-2">
                {doDay.map((m) => {
                  const meu = m.autorId === me.id;
                  const autor = users.find((u) => u.id === m.autorId);
                  const aposta = m.apostaId ? bets.find((b) => b.id === m.apostaId) : null;
                  return (
                    <div key={m.id} className={`flex ${meu ? "justify-end" : "justify-start"}`}>
                      <div className="group max-w-[80%]">
                        <div className="rounded-2xl px-3.5 py-2.5" style={{
                          background: meu ? C.blue : C.card,
                          border: meu ? "none" : `1px solid ${C.line}`,
                          borderBottomRightRadius: meu ? 4 : 16,
                          borderBottomLeftRadius: meu ? 16 : 4,
                        }}>
                          {!meu && autor && (
                            <p style={{ fontSize: 11, fontWeight: 600, color: autor.cor || C.muted, marginBottom: 2 }}>{autor.nome}</p>
                          )}
                          {m.texto && (
                            <p style={{ fontSize: 14, lineHeight: 1.4, color: meu ? "#fff" : C.ink, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.texto}</p>
                          )}
                          {m.apostaId && (
                            <ApostaAnexada aposta={aposta} onAbrir={(ap) => { setModalAposta?.(ap); }} />
                          )}
                          <div className="flex items-center gap-1.5 justify-end mt-1">
                            <span className="num" style={{ fontSize: 10, color: meu ? "rgba(255,255,255,.7)" : C.faint }}>{horaBR(m.criadoEm)}</span>
                            {meu && !String(m.id).startsWith("tmp-") && (
                              <span title={foiLida(m) ? "Lida" : "Enviada"} style={{ display: "inline-flex", color: foiLida(m) ? "#8FD4FF" : "rgba(255,255,255,.6)" }}>
                                {foiLida(m) ? <CheckCheck size={13} /> : <Check size={12} />}
                              </span>
                            )}
                            {meu && (
                              <button onClick={() => excluirMensagem(m.id)} className="opacity-0 group-hover:opacity-100 transition" style={{ color: "rgba(255,255,255,.7)" }} title="Apagar">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={fim} />
      </div>

      {/* anexo escolhido */}
      {anexo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: C.blueSoft, border: `1px solid ${C.blueBand}` }}>
          <Paperclip size={14} style={{ color: C.blue }} />
          <span className="truncate flex-1" style={{ fontSize: 12.5, color: C.ink }}>{tituloAposta(anexo)}</span>
          <Codigo valor={anexo.codigo} size={10} copiavel={false} />
          <button onClick={() => setAnexo(null)} style={{ color: C.faint }}><X size={15} /></button>
        </div>
      )}

      {/* barra de digitar */}
      <div className="flex items-end gap-2 pt-1">
        <button onClick={() => setSeletor(true)} className="shrink-0 p-2.5 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.blue }} title="Anexar aposta">
          <Paperclip size={18} />
        </button>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escreva uma mensagem"
          rows={1}
          className="flex-1 rounded-xl px-3.5 py-2.5 resize-none"
          style={{ fontSize: 16, border: `1px solid ${C.line}`, outline: "none", maxHeight: 120 }}
        />
        <button onClick={enviar} disabled={!texto.trim() && !anexo}
          className="shrink-0 p-2.5 rounded-xl" style={{ background: (texto.trim() || anexo) ? C.blue : C.line, color: "#fff" }}>
          <Send size={18} />
        </button>
      </div>

      {seletor && (
        <SeletorAposta bets={bets} onFechar={() => setSeletor(false)}
          onEscolher={(b) => { setAnexo(b); setSeletor(false); }} />
      )}
    </div>
  );
}
