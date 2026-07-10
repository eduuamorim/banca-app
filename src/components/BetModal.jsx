"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link2, ImagePlus, Loader2, Sparkles, AlertTriangle, X, Wand2, Cpu, Lock } from "lucide-react";
import { C, Modal, Input, Select, Label, Btn, ST, Codigo, IconeCasa, Aviso, Avatar } from "@/lib/ui";
import { uid, hoje, n, brl, sgn, nomeDoEvento, nomePadrao } from "@/lib/calc";
import { lerBilheteNoAparelho, encerrarOcr } from "@/lib/ocrLocal";

/* ═══════════════════════════════════════════════════════
   Preenchimento automático, em cascata:

   LINK    → servidor busca a página e a IA interpreta
   PRINT   → 1º a IA (Gemini grátis, ou Claude)
             2º se falhar, OCR no próprio aparelho (Tesseract)
   MANUAL  → se nada der certo, os campos ficam livres
═══════════════════════════════════════════════════════ */

function AutoFill({ token, onDados, me }) {
  const [url, setUrl] = useState("");
  const [fase, setFase] = useState(null);      // 'link' | 'ia' | 'ocr' | null
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef(null);

  useEffect(() => () => { encerrarOcr(); }, []);

  const chamarApi = async (corpo) => {
    const r = await fetch("/api/parse", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(corpo),
    });
    return r.json();
  };

  /* ── link ── */
  const lerLink = async () => {
    setFase("link"); setErro(""); setSucesso("");
    try {
      const j = await chamarApi({ url });
      if (!j.ok) { setErro(j.motivo || "Não consegui ler o link."); return; }
      onDados(j.dados);
      setSucesso("Lido pelo link. Confira os campos.");
    } catch {
      setErro("Falha de conexão.");
    } finally { setFase(null); }
  };

  /* ── print: IA primeiro, OCR local depois ── */
  const lerImagem = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setErro(""); setSucesso(""); setProgresso(0);

    // tentativa 1 — IA no servidor
    setFase("ia");
    let motivoIA = "";
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const j = await chamarApi({ imagem: base64, tipo: file.type });
      if (j.ok) {
        onDados(j.dados);
        setSucesso(`Lido pela IA (${j.provedor === "gemini" ? "Gemini" : "Claude"}). Confira os campos.`);
        setFase(null);
        return;
      }
      motivoIA = j.motivo || "";
      // formato ou tamanho não adianta tentar de novo
      if (j.codigo === "formato" || j.codigo === "grande") {
        setErro(motivoIA); setFase(null); return;
      }
    } catch {
      motivoIA = "Servidor indisponível.";
    }

    // tentativa 2 — OCR no próprio aparelho
    setFase("ocr");
    try {
      const d = await lerBilheteNoAparelho(file, setProgresso);
      if (d.encontrou) {
        onDados(d);
        setSucesso("Lido no seu aparelho. Confirme os campos com atenção.");
      } else {
        setErro(motivoIA ? `${motivoIA} O OCR também não achou nada.` : "Não reconheci um bilhete nesse print.");
      }
    } catch {
      setErro("Não consegui ler a imagem nem no aparelho.");
    } finally {
      setFase(null); setProgresso(0);
    }
  }, [onDados, token]);

  // colar com Ctrl+V em qualquer canto do modal
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) { e.preventDefault(); lerImagem(item.getAsFile()); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [lerImagem]);

  const ocupado = fase !== null;

  return (
    <div className="rounded-2xl p-4" style={{ background: "#FBFBF9", border: `1px dashed ${C.line}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={15} style={{ color: C.green }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.body }}>Preencher automático</span>
        <span style={{ fontSize: 11.5, color: C.faint }}>opcional</span>
        <div className="flex-1" />
        <span className="inline-flex items-center gap-1.5">
          <Avatar user={me} size={18} />
          <span style={{ fontSize: 11.5, color: C.muted }}>{me?.nome}</span>
        </span>
      </div>

      {/* link */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErro(""); }}
            onKeyDown={(e) => e.key === "Enter" && url.trim() && !ocupado && lerLink()}
            placeholder="Cole o link de compartilhar do bilhete"
            style={{ paddingLeft: 38, height: 42 }}
          />
        </div>
        <Btn kind="outline" disabled={!url.trim() || ocupado} onClick={lerLink} style={{ height: 42 }}>
          {fase === "link" ? <Loader2 size={15} className="animate-spin" /> : "Ler"}
        </Btn>
      </div>

      <div className="flex items-center gap-3 my-3">
        <div className="flex-1" style={{ height: 1, background: C.line }} />
        <span style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>OU</span>
        <div className="flex-1" style={{ height: 1, background: C.line }} />
      </div>

      {/* print */}
      <div
        onClick={() => !ocupado && inputArquivo.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); lerImagem(e.dataTransfer.files?.[0]); }}
        className="flex flex-col items-center justify-center rounded-xl py-6 cursor-pointer transition"
        style={{ border: `1.5px dashed ${arrastando ? C.green : C.line}`, background: arrastando ? C.greenSoft : C.card }}
      >
        {fase === "ia" && (
          <>
            <Loader2 size={20} className="animate-spin mb-2" style={{ color: C.green }} />
            <p style={{ fontSize: 13, color: C.body }}>Lendo o bilhete...</p>
          </>
        )}

        {fase === "ocr" && (
          <>
            <Cpu size={20} className="mb-2" style={{ color: C.blue }} />
            <p style={{ fontSize: 13, color: C.body }}>Lendo no seu aparelho...</p>
            <div className="mt-2 rounded-full overflow-hidden" style={{ width: 160, height: 4, background: C.line }}>
              <div style={{ width: `${progresso}%`, height: "100%", background: C.blue, transition: "width .2s" }} />
            </div>
            <p className="mt-1.5" style={{ fontSize: 11, color: C.faint }}>primeira vez demora um pouco mais</p>
          </>
        )}

        {!ocupado && (
          <>
            <ImagePlus size={20} className="mb-2" style={{ color: C.faint }} />
            <p style={{ fontSize: 13.5, fontWeight: 500, color: C.body }}>Cole o print com Ctrl+V</p>
            <p className="mt-0.5" style={{ fontSize: 12, color: C.faint }}>ou arraste a imagem, ou toque para escolher</p>
          </>
        )}

        <input ref={inputArquivo} type="file" accept="image/*" className="hidden"
          onChange={(e) => { lerImagem(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      {erro && <div className="mt-3"><Aviso tom="amber" icone={AlertTriangle}>{erro} Preencha na mão abaixo.</Aviso></div>}
      {sucesso && <div className="mt-3"><Aviso tom="green" icone={Sparkles}>{sucesso}</Aviso></div>}
    </div>
  );
}

/* ═══════════════════════ modal ═══════════════════════ */

export default function BetModal({ bet, onClose, cfg, casas, users, me, bets, valorStake, salvarAposta, dia, sessao }) {
  const inicial = bet && bet.id ? bet : {
    id: uid(),
    codigo: "",
    nome: "",
    data: dia || hoje(),
    usuarioId: me.id,
    casaId: "",
    evento: "",
    stakePct: bet?.preStake ?? cfg.stakes[0]?.pct ?? 1,
    valor: (cfg.banca * (bet?.preStake ?? cfg.stakes[0]?.pct ?? 1)) / 100,
    odd: "",
    status: "aberta",
    cashoutValor: "",
    obs: "",
  };

  const [f, setF] = useState(inicial);
  const [auto, setAuto] = useState(false);
  const editando = bets.some((b) => b.id === f.id);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setStake = (pct) => setF((p) => ({ ...p, stakePct: n(pct), valor: (cfg.banca * n(pct)) / 100 }));

  /**
   * Aplica o que foi lido no bilhete.
   *
   * Só EVENTO e ODD vêm do print. A stake é decisão sua e nunca
   * é sobrescrita, mesmo que o bilhete mostre um valor apostado.
   */
  const aplicar = useCallback((d) => {
    setF((p) => {
      const novo = { ...p };
      if (d.evento) {
        novo.evento = d.evento;
        novo.nome = nomeDoEvento(d.evento);
      }
      if (d.odd) novo.odd = d.odd;
      if (d.casa) {
        const alvo = String(d.casa).toLowerCase();
        const achou = casas.find(
          (c) => alvo.includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(alvo)
        );
        if (achou) novo.casaId = achou.id;
      }
      return novo;
    });
    setAuto(true);
  }, [casas]);

  const ok = n(f.odd) > 1 && n(f.valor) > 0;
  const ganho = n(f.valor) * (n(f.odd) - 1);
  const dono = users.find((u) => u.id === f.usuarioId);

  return (
    <Modal onClose={onClose} wide
      title={editando ? "Editar aposta" : "Nova aposta"}
      sub={
        <span className="inline-flex items-center gap-1.5">
          {editando ? "Registrada por" : "Vai entrar no nome de"}
          <Avatar user={editando ? dono : me} size={17} />
          <b style={{ fontWeight: 600, color: C.body }}>{(editando ? dono : me)?.nome || "\u2014"}</b>
        </span>
      }>
      <div className="space-y-5">

        {!editando && <AutoFill token={sessao.access_token} onDados={aplicar} me={me} />}

        {auto && (
          <div className="anim-aviso flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.blueSoft, border: `1px solid ${C.blueBand}` }}>
            <p style={{ fontSize: 12.5, color: C.blue }}>Evento e odd vieram do bilhete. A stake continua sendo sua escolha.</p>
            <button onClick={() => setAuto(false)} style={{ color: C.blue }}><X size={14} /></button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Data</Label><Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} /></div>
          <div><Label>Casa de aposta</Label>
            <div className="flex gap-2 items-center">
              {f.casaId && (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                  <IconeCasa casa={casas.find((c) => c.id === f.casaId)} size={24} radius={4} />
                </div>
              )}
              <div className="flex-1">
                <Select value={f.casaId} onChange={(e) => set("casaId", e.target.value)}>
                  <option value="">Sem casa</option>
                  {casas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>Evento</span>
            {f.codigo && <Codigo valor={f.codigo} size={11} />}
          </div>
          {editando ? (
            <>
              <div className="flex items-center gap-2 rounded-xl px-3.5"
                style={{ height: 44, background: C.lineSoft, border: `1.5px solid ${C.line}` }}>
                <Lock size={14} style={{ color: C.faint }} className="shrink-0" />
                <span className="truncate" style={{ fontSize: 14.5, color: C.body }}>
                  {f.evento || nomePadrao(f.codigo)}
                </span>
              </div>
              <p className="mt-1.5" style={{ fontSize: 12, color: C.faint }}>
                O evento e o nome não mudam depois de cadastrada, para a aposta continuar rastreável pelo código.
              </p>
            </>
          ) : (
            <>
              <Input value={f.evento} onChange={(e) => set("evento", e.target.value)}
                placeholder="Flamengo x Palmeiras \u2014 Mais de 1.5 gols" />
              <p className="mt-1.5" style={{ fontSize: 12, color: C.faint }}>
                {f.evento
                  ? <>Vai aparecer na lista como <b style={{ color: C.body }}>{nomeDoEvento(f.evento)}</b></>
                  : <>Sem evento, ela nasce como <b style={{ color: C.body }}>Aposta + código</b>, tipo Aposta K3F9</>}
              </p>
            </>
          )}
        </div>

        <div>
          <Label>Stake</Label>
          <div className="grid grid-cols-3 gap-2">
            {cfg.stakes.map((s) => {
              const on = Math.abs(n(f.stakePct) - s.pct) < 0.0001;
              return (
                <button key={s.id} type="button" onClick={() => setStake(s.pct)} className="rounded-xl px-3 py-2.5 text-left"
                  style={{ border: `1.5px solid ${on ? C.green : C.line}`, background: on ? C.greenSoft : C.card }}>
                  <p style={{ fontSize: 11, color: on ? C.greenDeep : C.muted, fontWeight: 600 }}>{s.label} · {s.pct}%</p>
                  <p className="num" style={{ fontSize: 15, fontWeight: 600, color: on ? C.greenDeep : C.ink }}>{brl(valorStake(s.pct))}</p>
                </button>
              );
            })}
          </div>
          <div className="flex items-baseline justify-between mt-3 px-1">
            <span style={{ fontSize: 12.5, color: C.muted }}>Vai apostar</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              {brl(n(f.valor))} <span style={{ fontSize: 12, fontWeight: 400, color: C.faint }}>· {n(f.stakePct)}% da banca</span>
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Odd</Label><Input type="number" step="0.01" value={f.odd} onChange={(e) => set("odd", e.target.value)} placeholder="1.85" /></div>
          <div><Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        </div>

        {f.status === "cashout" && (
          <div><Label>Valor recebido no cashout</Label>
            <Input type="number" step="0.01" value={f.cashoutValor} onChange={(e) => set("cashoutValor", e.target.value)} />
            <p className="mt-1.5" style={{ fontSize: 12.5, color: C.muted }}>Resultado: {sgn(n(f.cashoutValor) - n(f.valor))}</p>
          </div>
        )}

        {ok && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ background: C.greenSoft, border: `1px solid ${C.greenBand}` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.greenDeep, letterSpacing: ".05em" }}>SE GANHAR</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, color: C.greenDeep }}>+{brl(ganho)}</p>
              <p style={{ fontSize: 11.5, color: C.greenDeep, opacity: .7 }}>volta {brl(n(f.valor) * n(f.odd))}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: C.redSoft, border: `1px solid ${C.redBand}` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.red, letterSpacing: ".05em" }}>SE PERDER</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{"\u2212"}{brl(n(f.valor))}</p>
              <p style={{ fontSize: 11.5, color: C.red, opacity: .7 }}>perde a stake</p>
            </div>
          </div>
        )}

        <div><Label>Observação</Label><Input value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Opcional" /></div>

        <div className="flex justify-end gap-2 pt-1">
          <Btn kind="outline" onClick={onClose}>Cancelar</Btn>
          <Btn kind="green" disabled={!ok} onClick={() => {
            const base = { ...f, valor: n(f.valor), odd: n(f.odd), stakePct: n(f.stakePct) };
            // Numa aposta nova o nome nasce do evento. Vazio = o banco usa "Aposta " + código.
            // Editando, nome e evento não são enviados: são imutáveis.
            salvarAposta(editando ? base : { ...base, nome: nomeDoEvento(f.evento) });
            onClose();
          }}>
            {editando ? "Salvar" : "Registrar aposta"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
