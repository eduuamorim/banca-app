"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Copy, Check, AlertTriangle, Minus, Clock, RotateCcw } from "lucide-react";
import { brl, sgn } from "./calc";

export const C = {
  bg: "#F6F6F3",
  card: "#FFFFFF",
  nav: "#18262B",
  navSoft: "#243439",
  navLine: "#2E4046",
  line: "#E5E4DD",
  lineSoft: "#F0EFE9",
  ink: "#1B2426",
  body: "#4C5A5C",
  muted: "#7C8A8C",
  faint: "#A7B1B1",
  green: "#0E9F6E",
  greenDeep: "#0A7B55",
  greenSoft: "#E4F3EC",
  greenBand: "#B7E2CE",
  red: "#CE4444",
  redDeep: "#A93636",
  redSoft: "#FAEAEA",
  redBand: "#EEC3C3",
  amber: "#BF861D",
  amberSoft: "#F9F1DF",
  amberBand: "#E8D6AC",
  blue: "#3A7A9C",
  blueSoft: "#E8F1F5",
  blueBand: "#C2DAE5",
};

/** Uma fonte só, em todo lugar. */
export const FONTE = "'Inter', system-ui, -apple-system, sans-serif";
export const F = { display: FONTE, body: FONTE, mono: FONTE };

export const ST = {
  aberta:  { label: "Aberta",  fg: C.muted,     bg: C.lineSoft,  bd: C.line,      icone: "relogio" },
  green:   { label: "Green",   fg: C.greenDeep, bg: C.greenSoft, bd: C.greenBand, icone: "check" },
  red:     { label: "Red",     fg: C.red,       bg: C.redSoft,   bd: C.redBand,   icone: "x" },
  void:    { label: "Anulada", fg: C.amber,     bg: C.amberSoft, bd: C.amberBand, icone: "menos" },
  cashout: { label: "Cashout", fg: C.blue,      bg: C.blueSoft,  bd: C.blueBand,  icone: "cashout" },
};

export const CORES = ["#0E9F6E", "#3A7A9C", "#BF861D", "#8B5CF6", "#CE4444", "#0F766E"];

/* ─────────── números ─────────── */

export const Num = ({ children, size = 14, weight = 500, color, style }) => (
  <span className="num" style={{ fontSize: size, fontWeight: weight, color, ...style }}>{children}</span>
);

export const Money = ({ v, size = 14, weight = 500, color, prefix }) => (
  <Num size={size} weight={weight} color={color}>{prefix ? sgn(v) : brl(v)}</Num>
);

/* ─────────── caixas ─────────── */

export function Card({ children, className = "", pad = true, style }) {
  return (
    <div className={`rounded-2xl ${pad ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <span className="block mb-1.5"
      style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}>
      {children}
    </span>
  );
}

/* ─────────── campos ─────────── */

export function Input({ style, numerico, ...p }) {
  const [foc, setFoc] = useState(false);
  const tab = numerico || p.type === "number";
  return (
    <input
      {...p}
      onFocus={(e) => { setFoc(true); p.onFocus?.(e); }}
      onBlur={(e) => { setFoc(false); p.onBlur?.(e); }}
      className={`w-full outline-none ${tab ? "num" : ""} ${p.className || ""}`}
      style={{
        height: 44, padding: "0 14px", borderRadius: 12, background: C.card,
        border: `1.5px solid ${foc ? C.green : C.line}`,
        boxShadow: foc ? `0 0 0 3px ${C.greenSoft}` : "none",
        fontSize: 16, color: C.ink,
        transition: "border-color .13s ease, box-shadow .13s ease",
        ...style,
      }}
    />
  );
}

export function Select({ children, ...p }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="relative">
      <select {...p} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        className="w-full appearance-none outline-none cursor-pointer"
        style={{
          height: 44, padding: "0 38px 0 14px", borderRadius: 12, background: C.card,
          border: `1.5px solid ${foc ? C.green : C.line}`,
          boxShadow: foc ? `0 0 0 3px ${C.greenSoft}` : "none",
          fontSize: 16, color: C.ink,
          transition: "border-color .13s ease, box-shadow .13s ease",
        }}>
        {children}
      </select>
      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.faint }} />
    </div>
  );
}

export function Btn({ kind = "solid", size = "md", style, children, ...p }) {
  const base = {
    height: size === "sm" ? 34 : 44,
    padding: size === "sm" ? "0 12px" : "0 18px",
    borderRadius: 12,
    fontSize: size === "sm" ? 13 : 14.5, fontWeight: 500,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    cursor: p.disabled ? "not-allowed" : "pointer", opacity: p.disabled ? 0.4 : 1,
    transition: "filter .13s ease, background .13s ease, opacity .13s ease",
    whiteSpace: "nowrap", border: "1.5px solid transparent",
  };
  const kinds = {
    solid:   { background: C.ink, color: "#fff" },
    green:   { background: C.green, color: "#fff" },
    red:     { background: C.red, color: "#fff" },
    outline: { background: C.card, color: C.body, borderColor: C.line },
    ghost:   { background: "transparent", color: C.muted },
  };
  return <button {...p} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}

/** O ícone de cada status, para bater o olho no resultado. */
export function IconeStatus({ status, size = 12 }) {
  const nome = ST[status]?.icone;
  if (nome === "check") return <Check size={size} />;
  if (nome === "x") return <X size={size} />;
  if (nome === "menos") return <Minus size={size} />;
  if (nome === "cashout") return <RotateCcw size={size} />;
  return <Clock size={size} />;
}

export function Pill({ status }) {
  const s = ST[status];
  return (
    <span className="shrink-0 inline-flex items-center gap-1" style={{ padding: "3px 9px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", color: s.fg, background: s.bg, border: `1px solid ${s.bd}` }}>
      <IconeStatus status={status} size={11} />
      {s.label}
    </span>
  );
}

/**
 * Selo redondo do resultado, para identificar rápido numa lista.
 * Verde com check, vermelho com x, e assim por diante.
 */
export function SeloResultado({ status, size = 28 }) {
  const s = ST[status];
  return (
    <span className="inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: "50%", background: s.bg, color: s.fg, border: `1.5px solid ${s.bd}` }}>
      <IconeStatus status={status} size={size * 0.5} />
    </span>
  );
}

/* ─────────── código curto da aposta ─────────── */

/**
 * Copia um texto sem depender de HTTPS nem de permissão.
 * Devolve true se deu certo.
 */
export function copiarTexto(texto) {
  try {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * O código da aposta. Mostra "#S5NU", copia só "S5NU".
 *
 * O "#" é enfeite. Ele não faz parte do código, não vai
 * para a área de transferência, e nunca entra no banco.
 *
 * Nunca é editável. É um <span>, não um campo.
 */
export function Codigo({ valor, size = 11.5, copiavel = true, destaque }) {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return null;

  const copiar = (e) => {
    e.stopPropagation();
    if (copiarTexto(valor)) {               // sem o "#"
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
    }
  };

  const cor = copiado ? C.greenDeep : destaque ? C.body : C.muted;
  const fundo = copiado ? C.greenSoft : destaque ? "#EDECE6" : C.lineSoft;
  const borda = copiado ? C.greenBand : C.line;

  return (
    <span
      onClick={copiavel ? copiar : undefined}
      title={copiavel ? `Copiar ${valor}` : undefined}
      className="num inline-flex items-center gap-1 shrink-0 select-none"
      style={{
        padding: "2px 7px", borderRadius: 6, fontSize: size,
        fontWeight: destaque ? 700 : 600,
        letterSpacing: ".06em",
        color: cor, background: fundo, border: `1px solid ${borda}`,
        cursor: copiavel ? "pointer" : "default",
        transition: "background .13s ease, color .13s ease, border-color .13s ease",
      }}
    >
      <span style={{ opacity: .45 }}>#</span>{valor}
      {copiavel && (copiado ? <Check size={10} /> : <Copy size={10} style={{ opacity: .45 }} />)}
    </span>
  );
}

/* ─────────── avatar do usuário ─────────── */

export function Avatar({ user, size = 24, borda }) {
  if (!user) {
    return (
      <span className="inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size, borderRadius: size / 2, background: C.line, color: "#fff", fontSize: size * 0.42, fontWeight: 600 }}>
        ?
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: size / 2,
        background: user.cor, color: "#fff",
        fontSize: size * 0.42, fontWeight: 600,
        border: borda ? `2px solid ${borda}` : "none",
      }}>
      {user.nome[0].toUpperCase()}
    </span>
  );
}

/** Avatar mais nome, na mesma linha. */
export function Usuario({ user, size = 22, peso = 500, cor, tamanho = 13.5 }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Avatar user={user} size={size} />
      <span className="truncate" style={{ fontSize: tamanho, fontWeight: peso, color: cor || C.ink }}>
        {user?.nome || "\u2014"}
      </span>
    </span>
  );
}

/* ─────────── ícone da casa ─────────── */

export function IconeCasa({ casa, size = 20, radius = 6 }) {
  const [quebrou, setQuebrou] = useState(false);
  useEffect(() => setQuebrou(false), [casa?.icone]);

  const letra = (casa?.nome?.[0] || "?").toUpperCase();

  if (!casa?.icone || quebrou) {
    return (
      <span className="inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size, borderRadius: radius, background: C.lineSoft, color: C.body, fontSize: size * 0.48, fontWeight: 700 }}>
        {letra}
      </span>
    );
  }
  return (
    <img
      src={casa.icone}
      alt=""
      width={size}
      height={size}
      onError={() => setQuebrou(true)}
      className="shrink-0 object-contain"
      style={{ width: size, height: size, borderRadius: radius, background: "#fff" }}
    />
  );
}

/* ─────────── seletor de casa, com logo ─────────── */

/**
 * Um <select> nativo não aceita imagem dentro de <option>.
 * Este é um dropdown próprio, para a logo aparecer na lista.
 *
 * Fecha ao clicar fora, ao apertar Esc, e navega pelo teclado.
 */
export function SelectCasa({ casas, valor, onChange, permitirVazio = true, rotuloVazio = "Sem casa" }) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(-1);
  const caixa = useRef(null);

  const escolhida = casas.find((c) => c.id === valor);
  const opcoes = permitirVazio ? [{ id: "", nome: rotuloVazio }, ...casas] : casas;

  useEffect(() => {
    if (!aberto) return;
    const foraDaCaixa = (e) => {
      if (caixa.current && !caixa.current.contains(e.target)) setAberto(false);
    };
    const tecla = (e) => {
      if (e.key === "Escape") { setAberto(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setFoco((i) => Math.min(i + 1, opcoes.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setFoco((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && foco >= 0) {
        e.preventDefault();
        onChange(opcoes[foco].id);
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", foraDaCaixa);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", foraDaCaixa);
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto, foco, opcoes, onChange]);

  // Se não couber embaixo, a lista abre para cima.
  const [paraCima, setParaCima] = useState(false);

  const abrir = () => {
    const r = caixa.current?.getBoundingClientRect();
    if (r) {
      const espacoAbaixo = window.innerHeight - r.bottom;
      const altura = Math.min(264, opcoes.length * 45 + 8);
      setParaCima(espacoAbaixo < altura + 16 && r.top > altura);
    }
    setFoco(opcoes.findIndex((o) => o.id === valor));
    setAberto(true);
  };

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        className="w-full flex items-center gap-2.5 outline-none text-left"
        style={{
          height: 44, padding: "0 38px 0 12px", borderRadius: 12, background: C.card,
          border: `1.5px solid ${aberto ? C.green : C.line}`,
          boxShadow: aberto ? `0 0 0 3px ${C.greenSoft}` : "none",
          fontSize: 16, color: escolhida ? C.ink : C.muted,
          transition: "border-color .13s ease, box-shadow .13s ease",
        }}
      >
        {escolhida
          ? <IconeCasa casa={escolhida} size={22} radius={5} />
          : <span className="inline-flex items-center justify-center shrink-0"
              style={{ width: 22, height: 22, borderRadius: 5, background: C.lineSoft, color: C.faint, fontSize: 12 }}>
              ?
            </span>}
        <span className="truncate">{escolhida?.nome || rotuloVazio}</span>
      </button>

      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: C.faint, transform: aberto ? "translateY(-50%) rotate(180deg)" : "", transition: "transform .16s ease" }} />

      {aberto && (
        <div className="anim-caixa absolute z-50 left-0 right-0 overflow-hidden rounded-xl"
          style={{
            background: C.card, border: `1px solid ${C.line}`,
            boxShadow: "0 12px 32px rgba(24,38,43,.14)",
            maxHeight: 264, overflowY: "auto",
            ...(paraCima ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
          }}>
          {opcoes.map((c, i) => {
            const on = c.id === valor;
            const sob = i === foco;
            return (
              <button
                key={c.id || "vazio"}
                type="button"
                onMouseEnter={() => setFoco(i)}
                onClick={() => { onChange(c.id); setAberto(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                style={{
                  background: on ? C.greenSoft : sob ? C.lineSoft : "transparent",
                  color: on ? C.greenDeep : C.ink,
                  fontSize: 14.5, fontWeight: on ? 600 : 400,
                  transition: "background .1s ease",
                }}
              >
                {c.id
                  ? <IconeCasa casa={c} size={22} radius={5} />
                  : <span className="inline-flex items-center justify-center shrink-0"
                      style={{ width: 22, height: 22, borderRadius: 5, background: C.lineSoft, color: C.faint, fontSize: 12 }}>
                      ?
                    </span>}
                <span className="truncate flex-1">{c.nome}</span>
                {on && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── modais ─────────── */

export function Modal({ onClose, title, sub, children, wide }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="anim-fundo fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center"
      style={{ background: "rgba(24,38,43,.45)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`anim-caixa w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl overflow-hidden`}
        style={{ background: C.card, boxShadow: "0 24px 60px rgba(24,38,43,.22)" }}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{title}</h3>
            {sub && <div className="mt-0.5" style={{ fontSize: 13, color: C.muted }}>{sub}</div>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg shrink-0" style={{ color: C.faint, transition: "color .13s" }}>
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** Modal de confirmação, com destaque para a consequência. */
export function Confirmar({ titulo, mensagem, detalhe, tom = "green", rotuloOk = "Confirmar", onOk, onCancelar }) {
  const cores = {
    green: { bg: C.greenSoft, bd: C.greenBand, fg: C.greenDeep, btn: "green" },
    red:   { bg: C.redSoft,   bd: C.redBand,   fg: C.redDeep,   btn: "red" },
    amber: { bg: C.amberSoft, bd: C.amberBand, fg: "#8A6212",   btn: "solid" },
    blue:  { bg: C.blueSoft,  bd: C.blueBand,  fg: C.blue,      btn: "solid" },
  }[tom];

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onCancelar();
      if (e.key === "Enter") onOk();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onOk, onCancelar]);

  return (
    <div className="anim-fundo fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(24,38,43,.5)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className="anim-caixa w-full max-w-sm rounded-2xl p-6"
        style={{ background: C.card, boxShadow: "0 24px 60px rgba(24,38,43,.25)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{titulo}</h3>
        {mensagem && <p className="mt-1.5" style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{mensagem}</p>}

        {detalhe && (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: cores.bg, border: `1px solid ${cores.bd}` }}>
            {detalhe}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <Btn kind="outline" onClick={onCancelar}>Cancelar</Btn>
          <Btn kind={cores.btn} onClick={onOk} autoFocus>{rotuloOk}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─────────── avisos e vazios ─────────── */

export function Aviso({ tom = "amber", icone: I = AlertTriangle, children }) {
  const c = {
    amber: { bg: C.amberSoft, bd: C.amberBand, fg: "#8A6212", ic: C.amber },
    green: { bg: C.greenSoft, bd: C.greenBand, fg: C.greenDeep, ic: C.greenDeep },
    blue:  { bg: C.blueSoft,  bd: C.blueBand,  fg: C.blue, ic: C.blue },
  }[tom];
  return (
    <div className="anim-aviso flex items-start gap-2 rounded-lg px-3 py-2"
      style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
      <I size={14} style={{ color: c.ic, marginTop: 2 }} className="shrink-0" />
      <p style={{ fontSize: 12.5, color: c.fg, lineHeight: 1.45 }}>{children}</p>
    </div>
  );
}

export function Empty({ icon: I, title, hint, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: C.lineSoft, color: C.faint }}>
        <I size={22} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</p>
      {hint && <p className="mt-1 max-w-xs" style={{ fontSize: 13.5, color: C.muted }}>{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─────────── blocos de dado ─────────── */

export const Info = ({ k, v }) => (
  <div>
    <p style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>{k}</p>
    <div className="num mt-0.5" style={{ fontSize: 13.5, color: C.ink }}>{v}</div>
  </div>
);

export const Stat = ({ k, v, cor }) => (
  <div>
    <p style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>{k}</p>
    <p className="num mt-0.5" style={{ fontSize: 16, fontWeight: 600, color: cor || C.ink }}>{v}</p>
  </div>
);

export const Big = ({ k, v, sub, cor }) => (
  <Card>
    <p style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>{k}</p>
    <p className="num mt-1.5" style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", color: cor || C.ink }}>{v}</p>
    <p className="mt-1" style={{ fontSize: 12, color: C.faint }}>{sub}</p>
  </Card>
);

export function Tabela({ cols, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontSize: 13.5 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            {cols.map((c, i) => (
              <th key={i} className={`px-6 py-2.5 ${i ? "text-right" : "text-left"}`}
                style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600, whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
              {r.map((c, j) => (
                <td key={j} className={`px-6 py-3 ${j ? "text-right num" : ""}`}
                  style={{ fontWeight: 500, color: C.ink, whiteSpace: "nowrap" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────── medidor da faixa do dia ─────────── */

export function Faixa({ v, meta, stop, seGanhar, sePerder, temAbertas }) {
  const min = -stop * 1.35, max = meta * 1.45;
  const L = 26, R = 774;
  const X = (val) => L + ((Math.max(min, Math.min(max, val)) - min) / (max - min)) * (R - L);
  const cor = v >= meta ? C.green : v <= -stop ? C.red : C.ink;
  const px = X(v);
  const lw = 128;
  const lx = Math.max(L, Math.min(R - lw, px - lw / 2));

  return (
    <svg viewBox="0 0 800 128" className="w-full" style={{ height: "auto", minHeight: 116 }} preserveAspectRatio="xMidYMid meet">
      <defs><clipPath id="trk"><rect x={L} y={58} width={R - L} height={22} rx={11} /></clipPath></defs>
      <g clipPath="url(#trk)">
        <rect x={X(min)} y={58} width={X(-stop) - X(min)} height={22} fill={C.redBand} />
        <rect x={X(-stop)} y={58} width={X(0) - X(-stop)} height={22} fill={C.redSoft} />
        <rect x={X(0)} y={58} width={X(meta) - X(0)} height={22} fill={C.greenSoft} />
        <rect x={X(meta)} y={58} width={X(max) - X(meta)} height={22} fill={C.greenBand} />
      </g>
      {temAbertas && (
        <g opacity="0.55">
          <path d={`M${X(sePerder)} 54 l6 -8 l-12 0 z`} fill={C.red} />
          <path d={`M${X(seGanhar)} 54 l6 -8 l-12 0 z`} fill={C.green} />
        </g>
      )}
      {[[-stop, `\u2212${brl(stop)}`, C.red, "STOP"], [0, brl(0), C.faint, ""], [meta, `+${brl(meta)}`, C.green, "META"]].map(([val, txt, col, tag]) => (
        <g key={val}>
          <line x1={X(val)} y1={54} x2={X(val)} y2={84} stroke={col} strokeWidth={val === 0 ? 1.5 : 2.5} strokeDasharray={val === 0 ? "2 3" : ""} />
          {tag && <text x={X(val)} y={102} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: col, letterSpacing: ".08em" }}>{tag}</text>}
          <text x={X(val)} y={tag ? 120 : 102} textAnchor="middle" className="num" style={{ fontSize: 13, fill: C.muted }}>{txt}</text>
        </g>
      ))}
      <rect x={lx} y={2} width={lw} height={30} rx={9} fill={cor} style={{ transition: "x .2s cubic-bezier(.16,1,.3,1)" }} />
      <text x={lx + lw / 2} y={22} textAnchor="middle" className="num" style={{ fontSize: 15, fontWeight: 600, fill: "#fff" }}>{sgn(v)}</text>
      <path d={`M${px} 40 l8 -9 l-16 0 z`} fill={cor} />
      <rect x={px - 3} y={54} width={6} height={30} rx={3} fill={cor} />
    </svg>
  );
}
