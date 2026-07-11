"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Gauge, Receipt, PieChart, Building2, Settings, Plus, Check, LogOut, Wallet, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/ui";
import { hoje, brl, sgn, lucro, fechada, betFromRow, betToInsert, betToUpdate, cfgFromRow, cfgToRow, movFromRow, movToInsert, movToUpdate, contaFromRow, contaToInsert, contaToUpdate, totalPorTipo, n } from "@/lib/calc";

import Login from "./Login";
import Painel from "./Painel";
import Apostas from "./Apostas";
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
    const [c, p, ca, ap, mv, ct] = await Promise.all([
      supabase.from("config").select("*").eq("id", 1).single(),
      supabase.from("profiles").select("*").order("criado_em"),
      supabase.from("casas").select("*").order("nome"),
      supabase.from("apostas").select("*").order("data", { ascending: false }).order("criado_em", { ascending: false }),
      supabase.from("movimentos").select("*").order("data", { ascending: false }).order("criado_em", { ascending: false }),
      supabase.from("contas").select("*").order("criado_em"),
    ]);
    if (c.data) setCfg(cfgFromRow(c.data));
    if (p.data) setUsers(p.data);
    if (ca.data) setCasas(ca.data);
    if (ap.data) setBets(ap.data.map(betFromRow));
    if (mv.data) setMovs(mv.data.map(movFromRow));
    if (ct.data) setContas(ct.data.map(contaFromRow));
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
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [sessao, carregar]);

  // ── ações no banco ──
  const meId = sessao?.user?.id;
  const me = users.find((u) => u.id === meId);

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
    doDia, lucroDia, lucroTotal, depositado, sacado,
    setModalAposta, salvarAposta, mudarStatus, excluirAposta,
    salvarCasa, excluirCasa, salvarConta, excluirConta, salvarMov, excluirMov, sair, sessao,
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
              <i.icon size={17} />
              <span className="truncate w-full text-center" style={{ fontSize: 9, fontWeight: on ? 600 : 400 }}>
                {i.curto || i.label}
              </span>
            </button>
          );
        })}
      </nav>

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
