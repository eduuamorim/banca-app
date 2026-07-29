"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Paperclip, X, Trash2, MessageCircle, Check, CheckCheck,
  Pencil, Reply, Image as IconeImagem, Mic, Play, Pause, Loader2, Timer, EyeOff,
} from "lucide-react";
import { C, Avatar, Codigo, Empty } from "@/lib/ui";
import { n, brl, dBR, tituloAposta, mensagensPorDia, horaBR, comprimirImagem, duracaoBonita, tamanhoBonito } from "@/lib/calc";
import { podeGravar, criarGravador } from "@/lib/gravador";
import { supabase } from "@/lib/supabase";

/* ── cartão de aposta anexada ── */
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

/* ── imagem: o bucket é privado, então pedimos um link temporário ── */
function ImagemChat({ caminho, meu }) {
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState(false);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data, error } = await supabase.storage.from("chat").createSignedUrl(caminho, 3600);
      if (!vivo) return;
      if (error || !data?.signedUrl) return setErro(true);
      setUrl(data.signedUrl);
    })();
    return () => { vivo = false; };
  }, [caminho]);

  if (erro) {
    return <p style={{ fontSize: 12, color: meu ? "rgba(255,255,255,.8)" : C.faint }}>Não consegui carregar a imagem.</p>;
  }
  if (!url) {
    return (
      <div className="flex items-center justify-center rounded-lg" style={{ width: 200, height: 140, background: "rgba(0,0,0,.06)" }}>
        <Loader2 size={18} className="animate-spin" style={{ color: C.faint }} />
      </div>
    );
  }
  return (
    <>
      <button onClick={() => setAberta(true)} className="block">
        <img src={url} alt="" className="rounded-lg" style={{ maxWidth: 240, maxHeight: 280, objectFit: "cover", display: "block" }} />
      </button>
      {aberta && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(10,16,18,.9)" }} onClick={() => setAberta(false)}>
          <img src={url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          <button className="absolute" style={{ top: 16, right: 16, color: "#fff" }} onClick={() => setAberta(false)}>
            <X size={26} />
          </button>
        </div>
      )}
    </>
  );
}

/* ── áudio: player simples com play e barra ── */
const VELOCIDADES = [1, 1.5, 1.7, 2, 2.2];

function AudioChat({ caminho, duracao, meu, onOuvir, velocidade, onTrocarVelocidade }) {
  const [url, setUrl] = useState("");
  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracaoReal, setDuracaoReal] = useState(duracao || 0);
  const audioRef = useRef(null);
  const barraRef = useRef(null);
  const jaContou = useRef(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data } = await supabase.storage.from("chat").createSignedUrl(caminho, 3600);
      if (vivo && data?.signedUrl) setUrl(data.signedUrl);
    })();
    return () => { vivo = false; };
  }, [caminho]);

  // A velocidade vem de fora (é a mesma para todos os áudios) e é
  // aplicada assim que muda, mesmo com o áudio já tocando.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = velocidade;
  }, [velocidade, url]);

  const alternar = () => {
    const a = audioRef.current;
    if (!a) return;
    if (tocando) { a.pause(); setTocando(false); }
    else {
      a.playbackRate = velocidade;
      a.play();
      setTocando(true);
      if (!jaContou.current) { jaContou.current = true; onOuvir?.(); }
    }
  };

  // Clicar (ou arrastar) na barra move o áudio para aquele ponto.
  const total = duracaoReal || duracao || 0;
  const irPara = (clientX) => {
    const barra = barraRef.current;
    const a = audioRef.current;
    if (!barra || !a || !total) return;
    const r = barra.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    a.currentTime = frac * total;
    setPosicao(frac * total);
  };

  const pct = total ? Math.min(100, (posicao / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2" style={{ minWidth: 200 }}>
      <button onClick={alternar} disabled={!url}
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 32, height: 32, background: meu ? "rgba(255,255,255,.22)" : C.greenSoft, color: meu ? "#fff" : C.greenDeep }}>
        {tocando ? <Pause size={15} /> : <Play size={15} />}
      </button>

      <div className="flex-1">
        {/* barra clicável e arrastável */}
        <div
          ref={barraRef}
          onClick={(e) => irPara(e.clientX)}
          onPointerDown={(e) => {
            irPara(e.clientX);
            const mover = (ev) => irPara(ev.clientX);
            const soltar = () => {
              window.removeEventListener("pointermove", mover);
              window.removeEventListener("pointerup", soltar);
            };
            window.addEventListener("pointermove", mover);
            window.addEventListener("pointerup", soltar);
          }}
          className="relative rounded-full"
          style={{ height: 12, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}>
          <div className="rounded-full w-full" style={{ height: 4, background: meu ? "rgba(255,255,255,.25)" : C.lineSoft }}>
            <div className="rounded-full" style={{ height: 4, width: `${pct}%`, background: meu ? "#fff" : C.green }} />
          </div>
          <span className="absolute rounded-full" style={{
            left: `calc(${pct}% - 5px)`, width: 10, height: 10,
            background: meu ? "#fff" : C.green, boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }} />
        </div>
        <span className="num" style={{ fontSize: 10.5, color: meu ? "rgba(255,255,255,.75)" : C.muted }}>
          {duracaoBonita(posicao || total)}
        </span>
      </div>

      <button onClick={onTrocarVelocidade}
        className="num shrink-0 rounded-md px-1.5"
        style={{
          height: 21, fontSize: 10.5, fontWeight: 700,
          background: meu ? "rgba(255,255,255,.22)" : C.lineSoft,
          color: meu ? "#fff" : C.body,
        }}
        title="Velocidade (vale para todos os áudios)">
        {velocidade}x
      </button>

      {url && (
        <audio ref={audioRef} src={url} preload="none"
          onLoadedMetadata={(e) => { if (isFinite(e.target.duration)) setDuracaoReal(e.target.duration); }}
          onTimeUpdate={(e) => setPosicao(e.target.currentTime)}
          onEnded={() => { setTocando(false); setPosicao(0); }} />
      )}
    </div>
  );
}


/* ── mídia temporária: precisa abrir, e some depois de duas vezes ── */
function MidiaTemporaria({ msg, meu, onVer, children }) {
  const [aberta, setAberta] = useState(false);
  const [vistas, setVistas] = useState(msg.vistas || 0);

  if (msg.expirada) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{
          background: meu ? "rgba(255,255,255,.12)" : C.lineSoft,
          border: `1px dashed ${meu ? "rgba(255,255,255,.35)" : C.line}`,
        }}>
        <EyeOff size={14} style={{ color: meu ? "rgba(255,255,255,.8)" : C.faint }} />
        <span style={{ fontSize: 12, fontStyle: "italic", color: meu ? "rgba(255,255,255,.8)" : C.faint }}>
          {msg.tipo === "audio" ? "Áudio temporário expirado" : "Imagem temporária expirada"}
        </span>
      </div>
    );
  }

  if (!aberta) {
    const restam = Math.max(0, 2 - vistas);
    return (
      <button onClick={async () => {
          setAberta(true);
          const r = await onVer?.();
          if (r) setVistas(r.vistas);
        }}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 w-full text-left"
        style={{
          background: meu ? "rgba(255,255,255,.16)" : C.amberSoft,
          border: `1px solid ${meu ? "rgba(255,255,255,.35)" : C.amberBand}`,
        }}>
        <Timer size={15} style={{ color: meu ? "#fff" : C.amber }} />
        <div className="min-w-0">
          <p style={{ fontSize: 12.5, fontWeight: 600, color: meu ? "#fff" : C.amber }}>
            {msg.tipo === "audio" ? "Áudio temporário" : "Imagem temporária"}
          </p>
          <p style={{ fontSize: 11, color: meu ? "rgba(255,255,255,.8)" : C.amber }}>
            toque para {msg.tipo === "audio" ? "ouvir" : "ver"} · {restam} {restam === 1 ? "vez restante" : "vezes restantes"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div>
      {children}
      <p className="mt-1" style={{ fontSize: 10.5, color: meu ? "rgba(255,255,255,.75)" : C.amber }}>
        temporária · {Math.max(0, 2 - vistas)} {Math.max(0, 2 - vistas) === 1 ? "vez restante" : "vezes restantes"}
      </p>
    </div>
  );
}

/* ── seletor de aposta para anexar ── */
function SeletorAposta({ bets, onEscolher, onFechar }) {
  const [busca, setBusca] = useState("");
  const lista = bets
    .filter((b) => `${b.codigo} ${b.nome} ${b.evento}`.toLowerCase().includes(busca.toLowerCase()))
    .slice(0, 40);

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center" style={{ background: "rgba(20,30,33,.45)" }} onClick={onFechar}>
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

/* ── trecho da mensagem sendo respondida ── */
function TrechoResposta({ msg, users, meId, meu, compacto }) {
  if (!msg) {
    return <p style={{ fontSize: 11.5, color: meu ? "rgba(255,255,255,.7)" : C.faint }}>mensagem apagada</p>;
  }
  const autor = users.find((u) => u.id === msg.autorId);
  const nome = msg.autorId === meId ? "Você" : (autor?.nome || "");
  const resumo =
    msg.tipo === "imagem" ? "Imagem" :
    msg.tipo === "audio" ? `Áudio ${duracaoBonita(msg.duracao)}` :
    (msg.texto || "").slice(0, 70);

  return (
    <div className="rounded-md px-2 py-1"
      style={{
        borderLeft: `3px solid ${meu ? "rgba(255,255,255,.6)" : C.green}`,
        background: meu ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.035)",
        marginBottom: compacto ? 0 : 4,
      }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: meu ? "rgba(255,255,255,.9)" : C.greenDeep }}>{nome}</p>
      <p className="truncate" style={{ fontSize: 11.5, color: meu ? "rgba(255,255,255,.8)" : C.muted }}>{resumo}</p>
    </div>
  );
}

export default function Chat(p) {
  const {
    msgs, users, me, bets, enviarMensagem, excluirMensagem, editarMensagem,
    enviarArquivo, verMidiaTemporaria, setModalAposta, embutido, leituras = {},
    atividade, avisarAtividade,
  } = p;

  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState(null);
  const [seletor, setSeletor] = useState(false);
  const [respondendo, setRespondendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [aviso, setAviso] = useState("");
  const [velocidadeAudio, setVelocidadeAudio] = useState(1);   // mesma para todos os áudios

  const trocarVelocidade = () => {
    setVelocidadeAudio((v) => VELOCIDADES[(VELOCIDADES.indexOf(v) + 1) % VELOCIDADES.length]);
  };
  const [perguntando, setPerguntando] = useState(null);   // { arquivo, tipo, duracao }

  const fim = useRef(null);
  const rolagem = useRef(null);
  const jaPosicionou = useRef(false);
  const arquivoRef = useRef(null);
  const gravadorRef = useRef(null);
  const relogioRef = useRef(null);
  const campoRef = useRef(null);
  const pararDigitar = useRef(null);

  // Avisa que você está digitando, e para de avisar depois de um tempo parado.
  const aoDigitar = (valor) => {
    setTexto(valor);
    if (!avisarAtividade) return;
    avisarAtividade("digitando");
    clearTimeout(pararDigitar.current);
    pararDigitar.current = setTimeout(() => avisarAtividade("parou"), 2500);
  };

  // Ao abrir, já aparece embaixo. Depois, mensagem nova desce suave.
  useEffect(() => {
    const caixa = rolagem.current;
    if (!caixa) return;
    if (!jaPosicionou.current) {
      jaPosicionou.current = true;
      caixa.scrollTop = caixa.scrollHeight;
    } else {
      fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [msgs.length]);

  // Se o chat fechar no meio de uma gravação, encerra o microfone.
  useEffect(() => () => {
    clearInterval(relogioRef.current);
    clearTimeout(pararDigitar.current);
    gravadorRef.current?.cancelar?.();
  }, []);

  const porId = useCallback((id) => msgs.find((m) => m.id === id), [msgs]);

  const foiLida = (m) => {
    if (!m.criadoEm) return false;
    const tMsg = new Date(m.criadoEm).getTime();
    return Object.entries(leituras).some(([uid, lido]) =>
      uid !== me.id && lido && new Date(lido).getTime() >= tMsg
    );
  };

  const enviar = () => {
    const t = texto.trim();

    if (editando) {
      if (t && t !== editando.texto) editarMensagem(editando.id, t);
      setEditando(null);
      setTexto("");
      return;
    }

    if (!t && !anexo) return;
    clearTimeout(pararDigitar.current);
    avisarAtividade?.("parou");
    enviarMensagem({ texto: t, apostaId: anexo?.id || "", respondeA: respondendo?.id || "" });
    setTexto("");
    setAnexo(null);
    setRespondendo(null);
  };

  const comecarEdicao = (m) => {
    setEditando(m);
    setRespondendo(null);
    setTexto(m.texto || "");
    setTimeout(() => campoRef.current?.focus(), 30);
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setTexto("");
  };

  const responder = (m) => {
    setRespondendo(m);
    setEditando(null);
    setTimeout(() => campoRef.current?.focus(), 30);
  };

  // ── imagem ──
  const escolherImagem = async (ev) => {
    const arquivo = ev.target.files?.[0];
    ev.target.value = "";
    if (!arquivo || !arquivo.type.startsWith("image/")) return;

    setEnviandoArquivo(true);
    setAviso("");
    try {
      const menor = await comprimirImagem(arquivo);
      if (menor.size > 10 * 1024 * 1024) {
        setAviso(`Imagem muito grande (${tamanhoBonito(menor.size)}). O limite é 10 MB.`);
        return;
      }
      setPerguntando({ arquivo: menor, tipo: "imagem" });   // pergunta antes de enviar
    } catch (e) {
      setAviso(e.message || "Não consegui preparar a imagem.");
    } finally {
      setEnviandoArquivo(false);
    }
  };

  // Envia de fato, depois de você escolher se é temporária.
  const confirmarEnvio = async (temporaria) => {
    const item = perguntando;
    setPerguntando(null);
    if (!item) return;
    setEnviandoArquivo(true);
    try {
      await enviarArquivo({
        arquivo: item.arquivo,
        tipo: item.tipo,
        duracao: item.duracao,
        respondeA: respondendo?.id || "",
        temporaria,
      });
      setRespondendo(null);
    } catch (e) {
      setAviso(e.message || "Não consegui enviar.");
    } finally {
      setEnviandoArquivo(false);
    }
  };

  // ── áudio ──
  const iniciarGravacao = async () => {
    setAviso("");
    if (!podeGravar()) {
      setAviso("Este navegador não grava áudio. No computador, use Chrome, Edge ou Firefox.");
      return;
    }
    const g = criarGravador();
    try {
      await g.iniciar();
    } catch (e) {
      setAviso(e.message || "Não consegui acessar o microfone.");
      return;
    }
    gravadorRef.current = g;
    avisarAtividade?.("gravando");
    setGravando(true);
    setSegundos(0);
    relogioRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
  };

  const pararGravacao = async () => {
    clearInterval(relogioRef.current);
    avisarAtividade?.("parou");
    const g = gravadorRef.current;
    setGravando(false);
    if (!g) return;
    try {
      const { arquivo, duracao } = await g.parar();
      setPerguntando({ arquivo, tipo: "audio", duracao });   // pergunta antes de enviar
    } catch (e) {
      setAviso(e.message || "A gravação falhou.");
    } finally {
      gravadorRef.current = null;
      setSegundos(0);
    }
  };

  const cancelarGravacao = () => {
    clearInterval(relogioRef.current);
    avisarAtividade?.("parou");
    gravadorRef.current?.cancelar();
    gravadorRef.current = null;
    setGravando(false);
    setSegundos(0);
  };

  const porDia = mensagensPorDia(msgs);
  const outro = users.find((u) => u.id !== me.id);

  return (
    <div className="flex flex-col" style={embutido ? { height: "100%" } : { height: "calc(100dvh - 140px)", minHeight: 420 }}>
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
      <div ref={rolagem} className="flex-1 overflow-y-auto py-4 space-y-4">
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
                  const provisoria = String(m.id).startsWith("tmp-");
                  const respondida = m.respondeA ? porId(m.respondeA) : null;

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

                          {m.respondeA && (
                            <TrechoResposta msg={respondida} users={users} meId={me.id} meu={meu} />
                          )}

                          {m.tipo === "imagem" && (
                            m.temporaria ? (
                              <MidiaTemporaria msg={m} meu={meu} onVer={() => verMidiaTemporaria(m.id)}>
                                {m.arquivoUrl && <ImagemChat caminho={m.arquivoUrl} meu={meu} />}
                              </MidiaTemporaria>
                            ) : (
                              m.arquivoUrl && <ImagemChat caminho={m.arquivoUrl} meu={meu} />
                            )
                          )}

                          {m.tipo === "audio" && (
                            m.temporaria ? (
                              <MidiaTemporaria msg={m} meu={meu} onVer={() => verMidiaTemporaria(m.id)}>
                                {m.arquivoUrl && <AudioChat caminho={m.arquivoUrl} duracao={m.duracao} meu={meu} velocidade={velocidadeAudio} onTrocarVelocidade={trocarVelocidade} />}
                              </MidiaTemporaria>
                            ) : (
                              m.arquivoUrl && <AudioChat caminho={m.arquivoUrl} duracao={m.duracao} meu={meu} velocidade={velocidadeAudio} onTrocarVelocidade={trocarVelocidade} />
                            )
                          )}

                          {m.texto && (
                            <p style={{ fontSize: 14, lineHeight: 1.4, color: meu ? "#fff" : C.ink, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.texto}</p>
                          )}

                          {m.apostaId && <ApostaAnexada aposta={aposta} onAbrir={(ap) => setModalAposta?.(ap)} />}

                          <div className="flex items-center gap-1.5 justify-end mt-1">
                            {m.editadoEm && (
                              <span style={{ fontSize: 9.5, fontStyle: "italic", color: meu ? "rgba(255,255,255,.65)" : C.faint }}>editada</span>
                            )}
                            <span className="num" style={{ fontSize: 10, color: meu ? "rgba(255,255,255,.7)" : C.faint }}>{horaBR(m.criadoEm)}</span>
                            {meu && !provisoria && (
                              <span title={foiLida(m) ? "Lida" : "Enviada"} style={{ display: "inline-flex", color: foiLida(m) ? "#8FD4FF" : "rgba(255,255,255,.6)" }}>
                                {foiLida(m) ? <CheckCheck size={13} /> : <Check size={12} />}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ações: responder, editar, apagar */}
                        {!provisoria && (
                          <div className={`flex items-center gap-2.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition ${meu ? "justify-end" : "justify-start"}`}>
                            <button onClick={() => responder(m)} style={{ color: C.faint }} title="Responder">
                              <Reply size={13} />
                            </button>
                            {meu && m.tipo === "texto" && (
                              <button onClick={() => comecarEdicao(m)} style={{ color: C.faint }} title="Editar">
                                <Pencil size={12} />
                              </button>
                            )}
                            {meu && (
                              <button onClick={() => excluirMensagem(m.id)} style={{ color: C.faint }} title="Apagar">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
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

      {/* fulano está digitando / gravando */}
      {atividade && (() => {
        const quem = users.find((u) => u.id === atividade.usuarioId);
        if (!quem) return null;
        const acao = atividade.tipo === "gravando" ? "está gravando áudio" : "está digitando";
        return (
          <div className="flex items-center gap-2 px-1 pb-1.5">
            <Avatar user={quem} size={16} />
            <span style={{ fontSize: 12, color: C.muted }}>{quem.nome} {acao}</span>
            <span className="inline-flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="rounded-full" style={{
                  width: 4, height: 4, background: C.faint,
                  animation: `pontinho 1.2s ${i * 0.18}s infinite ease-in-out`,
                }} />
              ))}
            </span>
          </div>
        );
      })()}

      {/* temporária ou não? */}
      {perguntando && (
        <div className="rounded-xl p-3 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>
            {perguntando.tipo === "audio" ? "Enviar este áudio como:" : "Enviar esta imagem como:"}
          </p>
          <p style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>
            A temporária some depois de vista duas vezes, ou em 7 dias.
          </p>
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button onClick={() => confirmarEnvio(false)}
              className="rounded-lg px-3 py-2" style={{ fontSize: 12.5, fontWeight: 600, background: C.green, color: "#fff" }}>
              Guardar na conversa
            </button>
            <button onClick={() => confirmarEnvio(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2"
              style={{ fontSize: 12.5, fontWeight: 600, background: C.amberSoft, color: C.amber, border: `1px solid ${C.amberBand}` }}>
              <Timer size={13} /> Temporária
            </button>
            <button onClick={() => setPerguntando(null)}
              className="rounded-lg px-3 py-2" style={{ fontSize: 12.5, color: C.muted, border: `1px solid ${C.line}` }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* aviso de erro */}
      {aviso && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: C.amberSoft, border: `1px solid ${C.amberBand}` }}>
          <span className="flex-1" style={{ fontSize: 12, color: C.amber }}>{aviso}</span>
          <button onClick={() => setAviso("")} style={{ color: C.amber }}><X size={14} /></button>
        </div>
      )}

      {/* respondendo */}
      {respondendo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: C.greenSoft, border: `1px solid ${C.greenBand}` }}>
          <Reply size={14} style={{ color: C.greenDeep }} />
          <div className="flex-1 min-w-0">
            <TrechoResposta msg={respondendo} users={users} meId={me.id} compacto />
          </div>
          <button onClick={() => setRespondendo(null)} style={{ color: C.faint }}><X size={15} /></button>
        </div>
      )}

      {/* editando */}
      {editando && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: C.blueSoft, border: `1px solid ${C.blueBand}` }}>
          <Pencil size={14} style={{ color: C.blue }} />
          <span className="flex-1 truncate" style={{ fontSize: 12.5, color: C.ink }}>Editando a mensagem</span>
          <button onClick={cancelarEdicao} style={{ color: C.faint }}><X size={15} /></button>
        </div>
      )}

      {/* aposta anexada */}
      {anexo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: C.blueSoft, border: `1px solid ${C.blueBand}` }}>
          <Paperclip size={14} style={{ color: C.blue }} />
          <span className="truncate flex-1" style={{ fontSize: 12.5, color: C.ink }}>{tituloAposta(anexo)}</span>
          <Codigo valor={anexo.codigo} size={10} copiavel={false} />
          <button onClick={() => setAnexo(null)} style={{ color: C.faint }}><X size={15} /></button>
        </div>
      )}

      {/* barra de baixo: gravando ou normal */}
      {gravando ? (
        <div className="flex items-center gap-2 pt-1">
          <button onClick={cancelarGravacao} className="shrink-0 p-2.5 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.faint }} title="Cancelar">
            <X size={18} />
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.redSoft, border: `1px solid ${C.redBand}` }}>
            <span className="rounded-full" style={{ width: 9, height: 9, background: C.red }} />
            <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>Gravando</span>
            <span className="num ml-auto" style={{ fontSize: 13, color: C.red }}>{duracaoBonita(segundos)}</span>
          </div>
          <button onClick={pararGravacao} className="shrink-0 p-2.5 rounded-xl" style={{ background: C.green, color: "#fff" }} title="Enviar áudio">
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2 pt-1">
          <button onClick={() => setSeletor(true)} disabled={enviandoArquivo}
            className="shrink-0 p-2.5 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.blue }} title="Anexar aposta">
            <Paperclip size={18} />
          </button>

          <button onClick={() => arquivoRef.current?.click()} disabled={enviandoArquivo}
            className="shrink-0 p-2.5 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.blue }} title="Enviar imagem">
            {enviandoArquivo ? <Loader2 size={18} className="animate-spin" /> : <IconeImagem size={18} />}
          </button>
          <input ref={arquivoRef} type="file" accept="image/*" onChange={escolherImagem} style={{ display: "none" }} />

          <textarea
            ref={campoRef}
            value={texto}
            onChange={(e) => aoDigitar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
              if (e.key === "Escape") { cancelarEdicao(); setRespondendo(null); }
            }}
            placeholder={editando ? "Edite a mensagem" : "Escreva uma mensagem"}
            rows={1}
            className="flex-1 rounded-xl px-3.5 resize-none"
            style={{
              fontSize: 16,
              border: `1px solid ${editando ? C.blueBand : C.line}`,
              outline: "none",
              minHeight: 44,
              maxHeight: 120,
              paddingTop: 11,
              paddingBottom: 11,
              lineHeight: 1.35,
            }}
          />

          {(texto.trim() || anexo || editando) ? (
            <button onClick={enviar} className="shrink-0 p-2.5 rounded-xl" style={{ background: editando ? C.blue : C.green, color: "#fff" }}
              title={editando ? "Salvar edição" : "Enviar"}>
              {editando ? <Check size={18} /> : <Send size={18} />}
            </button>
          ) : (
            <button onClick={iniciarGravacao} disabled={enviandoArquivo}
              className="shrink-0 p-2.5 rounded-xl" style={{ background: C.green, color: "#fff" }} title="Gravar áudio">
              <Mic size={18} />
            </button>
          )}
        </div>
      )}

      {seletor && (
        <SeletorAposta bets={bets} onFechar={() => setSeletor(false)}
          onEscolher={(b) => { setAnexo(b); setSeletor(false); }} />
      )}
    </div>
  );
}
