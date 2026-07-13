"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Gauge, Receipt, PieChart, Building2, Settings, Plus, Check, LogOut, Wallet, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/ui";
import { hoje, brl, sgn, lucro, fechada, betFromRow, betToInsert, betToUpdate, cfgFromRow, cfgToRow, movFromRow, movToInsert, movToUpdate, contaFromRow, contaToInsert, contaToUpdate, totalPorTipo, n, msgFromRow, msgToInsert } from "@/lib/calc";

import Login from "./Login";
import Painel from "./Painel";
import Apostas from "./Apostas";
import BolhaChat from "./BolhaChat";
import { prepararSom, tocarDing } from "@/lib/som";
import Relatorio from "./Relatorio";
import Casas from "./Casas";
import Caixa from "./Caixa";
import Patrimonio from "./Patrimonio";
import Ajustes from "./Ajustes";
import BetModal from "./BetModal";

export default function Root() {
  const [sessao, setSessao] = useState(undefined); // undefined = ainda checando
  const [carregado, setCarregado] = useState(false);

  const [cfg, setCfg] = useState({ banca: 4800, metaPct: 2, stopPct: 3, stakes: [] });
  const [bets, setBets] = useState([]);
  const [casas, setCasas] = useState([]);
  const [users, setUsers] = useState([]);
  const [movs, setMovs] = useState([]);
  const [contas, setContas] = useState([]);
  const [fixadas, setFixadas] = useState(new Set());
  const [msgs, setMsgs] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const qtdMsgAntes = useRef(null);   // quantas msgs havia na última verificação
  const tabRef = useRef("painel");    // aba atual, para o efeito enxergar sem recriar
  const [chatAberto, setChatAberto] = useState(false);
  const [lidoAte, setLidoAte] = useState(null);
  const [leituras, setLeituras] = useState({});   // usuarioId -> lido_ate (para o "visto")
  const chatAbertoRef = useRef(false);

  const [tab, setTab] = useState("painel");
  const [dia, setDia] = useState(hoje());
  const [toast, setToast] = useState(null);
  const [modalAposta, setModalAposta] = useState(null);

  const timer = useRef(null);
  const flash = useCallback((m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ── sessão ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── carregar tudo ──
  const carregar = useCallback(async () => {
    const [c, p, ca, ap, mv, ct, fx, ms, lc] = await Promise.all([
      supabase.from("config").select("*").eq("id", 1).single(),
      supabase.from("profiles").select("*").order("criado_em"),
      supabase.from("casas").select("*").order("nome"),
      supabase.from("apostas").select("*").order("data", { ascending: false }).order("criado_em", { ascending: false }),
      supabase.from("movimentos").select("*").order("data", { ascending: false }).order("criado_em", { ascending: false }),
      supabase.from("contas").select("*").order("criado_em"),
      supabase.from("fixadas").select("aposta_id"),
      supabase.from("mensagens").select("*").order("criado_em"),
      supabase.from("leitura_chat").select("usuario_id, lido_ate"),
    ]);
    if (c.data) setCfg(cfgFromRow(c.data));
    if (p.data) setUsers(p.data);
    if (ca.data) setCasas(ca.data);
    if (ap.data) setBets(ap.data.map(betFromRow));
    if (mv.data) setMovs(mv.data.map(movFromRow));
    if (ct.data) setContas(ct.data.map(contaFromRow));
    if (fx.data) setFixadas(new Set(fx.data.map((r) => r.aposta_id)));
    if (ms.data) setMsgs(ms.data.map(msgFromRow));
    if (lc?.data) {
      const mapa = {};
      lc.data.forEach((r) => { mapa[r.usuario_id] = r.lido_ate; });
      setLeituras(mapa);
      if (mapa[meId]) {
        setLidoAte(mapa[meId]);
      } else {
        // Primeira vez sem marca: assume que já viu o que existia.
        // NÃO grava no banco aqui (isso causaria recarga em loop);
        // só define na memória. A gravação real acontece ao abrir o chat.
        const ultimasMsgs = (ms.data || []).map(msgFromRow);
        const ultima = ultimasMsgs.length ? ultimasMsgs[ultimasMsgs.length - 1].criadoEm : new Date().toISOString();
        setLidoAte(ultima);
      }
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!sessao) return;
    carregar();
    const canal = supabase
      .channel("banca")
      .on("postgres_changes", { event: "*", schema: "public", table: "apostas" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "movimentos" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "contas" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "fixadas" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens" }, carregar)
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [sessao, carregar]);

  // ── ações no banco ──
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { chatAbertoRef.current = chatAberto; }, [chatAberto]);
  const meId = sessao?.user?.id;
  const me = users.find((u) => u.id === meId);

  // Prepara o áudio no primeiro toque/clique (exigência dos navegadores).
  useEffect(() => {
    const liberar = () => prepararSom();
    window.addEventListener("pointerdown", liberar, { once: true });
    window.addEventListener("keydown", liberar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", liberar);
      window.removeEventListener("keydown", liberar);
    };
  }, []);

  // Detecta mensagem nova da outra pessoa: toca o som se acabou de chegar.
  // A CONTAGEM de não lidas vem da marca de leitura (lidoAte), não da sessão.
  useEffect(() => {
    const antes = qtdMsgAntes.current;
    qtdMsgAntes.current = msgs.length;
    if (antes === null || !meId) return;      // primeira carga: sem som
    if (msgs.length <= antes) return;

    const novas = msgs.slice(antes);
    const deOutro = novas.filter((m) => m.autorId && m.autorId !== meId && !String(m.id).startsWith("tmp-"));
    if (!deOutro.length) return;
    if (chatAbertoRef.current) return;         // já está lendo

    tocarDing();                                // só o som; a contagem é recalculada abaixo
  }, [msgs, meId]);

  // Conta as não lidas comparando com a marca de leitura.
  // Só o que o OUTRO enviou DEPOIS da sua última leitura conta.
  useEffect(() => {
    if (!meId) return;
    if (chatAberto) { setNaoLidas(0); return; }
    const marca = lidoAte ? new Date(lidoAte).getTime() : 0;
    const qtd = msgs.filter((m) =>
      m.autorId && m.autorId !== meId &&
      !String(m.id).startsWith("tmp-") &&
      m.criadoEm && new Date(m.criadoEm).getTime() > marca
    ).length;
    setNaoLidas(qtd);
  }, [msgs, meId, lidoAte, chatAberto]);

  // Ao ABRIR o chat (transição para aberto), grava a leitura uma vez.
  useEffect(() => {
    if (chatAberto && meId) marcarLido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatAberto]);

  const salvarCfg = async (novo) => {
    setCfg(novo);
    const { error } = await supabase.from("config").update(cfgToRow(novo)).eq("id", 1);
    if (error) return flash("Erro ao salvar a banca.");
    flash("Banca atualizada");
  };

  const salvarAposta = async (b) => {
    const existe = bets.some((x) => x.id === b.id);
    if (existe) {
      const { error } = await supabase.from("apostas").update(betToUpdate(b)).eq("id", b.id);
      if (error) return flash("Erro ao salvar.");
      flash("Aposta atualizada");
    } else {
      const { error } = await supabase.from("apostas").insert(betToInsert(b, meId));
      if (error) return flash("Erro ao registrar.");
      flash("Aposta registrada");
    }
    carregar();
  };

  const mudarStatus = async (b, status, cashoutValor = null) => {
    const { error } = await supabase
      .from("apostas")
      .update({ status, cashout_valor: status === "cashout" ? n(cashoutValor) : null })
      .eq("id", b.id);
    if (error) return flash("Erro ao atualizar.");
    carregar();
  };

  const excluirAposta = async (id) => {
    const { error } = await supabase.from("apostas").delete().eq("id", id);
    if (error) return flash("Erro ao excluir.");
    flash("Aposta excluída");
    carregar();
  };

  const salvarCasa = async (c) => {
    const existe = casas.some((x) => x.id === c.id);
    const linha = { nome: c.nome, url: c.url, icone: c.icone || "", obs: c.obs || "" };
    const { error } = existe
      ? await supabase.from("casas").update(linha).eq("id", c.id)
      : await supabase.from("casas").insert(linha);
    if (error) return flash("Erro ao salvar a casa.");
    flash(existe ? "Casa atualizada" : "Casa cadastrada");
    carregar();
  };

  const excluirCasa = async (id) => {
    const { error } = await supabase.from("casas").delete().eq("id", id);
    if (error) return flash("Erro ao excluir.");
    flash("Casa excluída");
    carregar();
  };

  // Marca a conversa como lida até agora, no banco. Chamado ao abrir o chat.
  const marcarLido = async () => {
    const agora = new Date().toISOString();
    setLidoAte(agora);
    setNaoLidas(0);
    if (!meId) return;
    // Se a tabela de leitura ainda não existe (schema não rodado), não trava o app.
    try {
      await supabase.from("leitura_chat").upsert({ usuario_id: meId, lido_ate: agora }, { onConflict: "usuario_id" });
    } catch (e) {
      // silencioso: a marca de leitura é um extra, não pode quebrar a conversa
    }
  };

  const enviarMensagem = async (m) => {
    const texto = (m.texto || "").trim();
    if (!texto && !m.apostaId) return;
    // Otimista: aparece na hora. O realtime sincroniza com o outro.
    const provisorio = { id: "tmp-" + Date.now(), autorId: meId, texto, apostaId: m.apostaId || "", criadoEm: new Date().toISOString() };
    setMsgs((arr) => [...arr, provisorio]);
    const { error } = await supabase.from("mensagens").insert(msgToInsert(m, meId));
    if (error) {
      // desfaz o provisório se falhou
      setMsgs((arr) => arr.filter((x) => x.id !== provisorio.id));
      // mostra a causa real para dar para resolver
      const causa = (error.message || "").toLowerCase();
      if (causa.includes("row-level security") || causa.includes("policy")) {
        flash("Envio bloqueado pela segurança. Confirme que você está logado.");
      } else if (causa.includes("value too long") || causa.includes("too long")) {
        flash("Mensagem muito longa. Tente encurtar.");
      } else {
        flash("Não consegui enviar: " + (error.message || "erro desconhecido"));
      }
    }
  };

  const excluirMensagem = async (id) => {
    setMsgs((arr) => arr.filter((x) => x.id !== id));
    await supabase.from("mensagens").delete().eq("id", id);
  };

  const alternarFixada = async (apostaId) => {
    const jaFixada = fixadas.has(apostaId);
    // atualização otimista: muda na hora, o banco confirma depois
    setFixadas((s) => {
      const nova = new Set(s);
      if (jaFixada) nova.delete(apostaId); else nova.add(apostaId);
      return nova;
    });
    if (jaFixada) {
      await supabase.from("fixadas").delete().eq("usuario_id", meId).eq("aposta_id", apostaId);
    } else {
      await supabase.from("fixadas").insert({ usuario_id: meId, aposta_id: apostaId });
    }
  };

  const salvarConta = async (c) => {
    const existe = contas.some((x) => x.id === c.id);
    const { error } = existe
      ? await supabase.from("contas").update(contaToUpdate(c)).eq("id", c.id)
      : await supabase.from("contas").insert(contaToInsert(c, meId));
    if (error) return flash("Erro ao salvar o acesso.");
    flash(existe ? "Acesso atualizado" : "Acesso cadastrado");
    carregar();
  };

  const excluirConta = async (id) => {
    const { error } = await supabase.from("contas").delete().eq("id", id);
    if (error) return flash("Erro ao excluir.");
    flash("Acesso excluído");
    carregar();
  };

  const salvarMov = async (m) => {
    const existe = movs.some((x) => x.id === m.id);
    const { error } = existe
      ? await supabase.from("movimentos").update(movToUpdate(m)).eq("id", m.id)
      : await supabase.from("movimentos").insert(movToInsert(m, meId));
    if (error) return flash("Erro ao salvar o movimento.");
    flash(existe ? "Movimento atualizado" : "Movimento registrado");
    carregar();
  };

  const excluirMov = async (id) => {
    const { error } = await supabase.from("movimentos").delete().eq("id", id);
    if (error) return flash("Erro ao excluir.");
    flash("Movimento excluído");
    carregar();
  };

  const sair = () => supabase.auth.signOut();

  // ── derivados ──
  const meta = (cfg.banca * cfg.metaPct) / 100;
  const stop = (cfg.banca * cfg.stopPct) / 100;
  const valorStake = (pct) => (cfg.banca * pct) / 100;
  const lucroTotal = useMemo(() => bets.filter(fechada).reduce((s, b) => s + lucro(b), 0), [bets]);
  const doDia = useMemo(() => bets.filter((b) => b.data === dia), [bets, dia]);
  const lucroDia = useMemo(() => doDia.filter(fechada).reduce((s, b) => s + lucro(b), 0), [doDia]);

  const depositado = useMemo(() => totalPorTipo(movs, "deposito"), [movs]);
  const sacado = useMemo(() => totalPorTipo(movs, "saque"), [movs]);

  // ── telas de espera ──
  if (sessao === undefined) return <Espera />;
  if (!sessao) return <Login />;
  if (!carregado || !me) return <Espera />;

  const nav = [
    { id: "painel", label: "Painel", icon: Gauge },
    { id: "apostas", label: "Apostas", icon: Receipt },
    { id: "relatorio", label: "Relatório", icon: PieChart },
    { id: "patrimonio", label: "Patrimônio", curto: "Patrim.", icon: Landmark },
    { id: "caixa", label: "Caixa", icon: Wallet },
    { id: "casas", label: "Casas", icon: Building2 },
    { id: "ajustes", label: "Ajustes", icon: Settings },
  ];

  const ctx = {
    cfg, salvarCfg, bets, casas, contas, users, movs, me, meta, stop, valorStake, flash, dia, setDia,
    fixadas, alternarFixada,
    msgs, enviarMensagem, excluirMensagem, setTab, leituras,
    doDia, lucroDia, lucroTotal, depositado, sacado,
    setModalAposta, salvarAposta, mudarStatus, excluirAposta,
    salvarCasa, excluirCasa, salvarConta, excluirConta, salvarMov, excluirMov, sair, sessao,
    onIrAjustes: () => setTab("ajustes"),
  };

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, color: C.ink }}>
      {/* ── barra lateral ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen" style={{ background: C.nav }}>
        <div className="px-5 py-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.green }}><Gauge size={17} color="#fff" /></div>
          <span style={{ fontSize: 16.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Banca</span>
        </div>

        <div className="px-4 pb-5">
          <div className="rounded-xl px-4 py-3.5" style={{ background: C.navSoft }}>
            <p style={{ fontSize: 10.5, letterSpacing: ".07em", color: "#7E9298", fontWeight: 600 }}>SALDO ATUAL</p>
            <p className="mt-1" className="num" style={{ fontSize: 21, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>{brl(cfg.banca + lucroTotal)}</p>
            <p className="mt-0.5" className="num" style={{ fontSize: 11.5, color: lucroTotal >= 0 ? "#5BC79B" : "#E58A8A" }}>{sgn(lucroTotal)} acumulado</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map((i) => {
            const on = tab === i.id;
            return (
              <button key={i.id} onClick={() => setTab(i.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
                style={{ background: on ? C.navSoft : "transparent", color: on ? "#fff" : "#8FA1A6", fontWeight: on ? 500 : 400, fontSize: 14.5 }}>
                <i.icon size={17} />{i.label}
                {i.badge > 0 && (
                  <span className="num ml-auto inline-flex items-center justify-center" style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: C.red, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                    {i.badge > 9 ? "9+" : i.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3">
          <button onClick={() => setModalAposta(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mb-3"
            style={{ background: C.green, color: "#fff", fontSize: 14.5, fontWeight: 500 }}>
            <Plus size={17} /> Nova aposta
          </button>
          <div className="flex items-center gap-2.5 px-2 pt-3" style={{ borderTop: `1px solid ${C.navLine}` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: me.cor, color: "#fff", fontSize: 13, fontWeight: 600 }}>{me.nome[0].toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 13.5, color: "#fff", fontWeight: 500 }}>{me.nome}</p>
              <p style={{ fontSize: 11, color: "#7E9298" }}>{bets.filter((b) => b.usuarioId === me.id).length} apostas</p>
            </div>
            <button onClick={sair} className="p-1.5 rounded-md shrink-0" style={{ color: "#7E9298" }} title="Sair"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      {/* ── conteúdo ── */}
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between" style={{ background: C.nav }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: ".07em", color: "#7E9298", fontWeight: 600 }}>SALDO ATUAL</p>
            <p className="num" style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{brl(cfg.banca + lucroTotal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalAposta(true)} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.green }}><Plus size={18} color="#fff" /></button>
            <button onClick={sair} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: me.cor, color: "#fff", fontSize: 13, fontWeight: 600 }}>{me.nome[0].toUpperCase()}</button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {tab === "painel" && <Painel {...ctx} />}
          {tab === "apostas" && <Apostas {...ctx} />}
          {tab === "relatorio" && <Relatorio {...ctx} />}
          {tab === "patrimonio" && <Patrimonio cfg={cfg} casas={casas} movs={movs} bets={bets} modo="completo" />}
          {tab === "caixa" && <Caixa {...ctx} />}
          {tab === "casas" && <Casas {...ctx} />}
          {tab === "ajustes" && <Ajustes {...ctx} />}
        </main>
      </div>

      {/* ── nav do celular ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
        {nav.map((i) => {
          const on = tab === i.id;
          return (
            <button key={i.id} onClick={() => setTab(i.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 min-w-0"
              style={{ color: on ? C.green : C.faint, transition: "color .13s ease" }}>
              <span className="relative">
                <i.icon size={17} />
                {i.badge > 0 && (
                  <span className="num absolute inline-flex items-center justify-center" style={{ top: -6, right: -9, minWidth: 15, height: 15, padding: "0 4px", borderRadius: 8, background: C.red, color: "#fff", fontSize: 9.5, fontWeight: 700 }}>
                    {i.badge > 9 ? "9+" : i.badge}
                  </span>
                )}
              </span>
              <span className="truncate w-full text-center" style={{ fontSize: 9, fontWeight: on ? 600 : 400 }}>
                {i.curto || i.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* balão de chat flutuante, visível em qualquer aba */}
      <BolhaChat {...ctx} naoLidas={naoLidas} aberto={chatAberto} setAberto={setChatAberto} />

      {modalAposta && (
        <BetModal
          bet={typeof modalAposta === "object" ? modalAposta : null}
          {...ctx}
          onClose={() => setModalAposta(null)}
        />
      )}

      {toast && (
        <div className="anim-aviso fixed z-50 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ bottom: 88, background: C.ink, color: "#fff", fontSize: 13.5 }}>
          <Check size={15} style={{ color: "#5BC79B" }} />{toast}
        </div>
      )}
    </div>
  );
}

function Espera() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: C.line }} />
    </div>
  );
}
