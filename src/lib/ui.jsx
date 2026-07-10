"use client";
import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
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
  redSoft: "#FAEAEA",
  redBand: "#EEC3C3",
  amber: "#BF861D",
  amberSoft: "#F9F1DF",
  amberBand: "#E8D6AC",
  blue: "#3A7A9C",
  blueSoft: "#E8F1F5",
};

export const F = {
  display: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

export const ST = {
  aberta:  { label: "Aberta",  fg: C.muted,     bg: C.lineSoft,  bd: C.line },
  green:   { label: "Green",   fg: C.greenDeep, bg: C.greenSoft, bd: C.greenBand },
  red:     { label: "Red",     fg: C.red,       bg: C.redSoft,   bd: C.redBand },
  void:    { label: "Anulada", fg: C.amber,     bg: C.amberSoft, bd: C.amberBand },
  cashout: { label: "Cashout", fg: C.blue,      bg: C.blueSoft,  bd: "#C2DAE5" },
};

export const CORES = ["#0E9F6E", "#3A7A9C", "#BF861D", "#8B5CF6", "#CE4444", "#0F766E"];

export const Money = ({ v, size = 14, weight = 500, color, prefix }) => (
  <span style={{ fontFamily: F.mono, fontSize: size, fontWeight: weight, color, letterSpacing: "-0.02em" }}>
    {prefix ? sgn(v) : brl(v)}
  </span>
);

export function Card({ children, className = "", pad = true, style }) {
  return (
    <div
      className={`rounded-2xl ${pad ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <span
      className="block mb-1.5"
      style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted }}
    >
      {children}
    </span>
  );
}

export function Input({ style, ...p }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      {...p}
      onFocus={(e) => { setFoc(true); p.onFocus?.(e); }}
      onBlur={(e) => { setFoc(false); p.onBlur?.(e); }}
      className={`w-full outline-none transition ${p.className || ""}`}
      style={{
        height: 44, padding: "0 14px", borderRadius: 12, background: C.card,
        border: `1.5px solid ${foc ? C.green : C.line}`,
        boxShadow: foc ? `0 0 0 3px ${C.greenSoft}` : "none",
        fontFamily: p.type === "number" ? F.mono : F.body,
        fontSize: 14.5, color: C.ink, ...style,
      }}
    />
  );
}

export function Select({ children, ...p }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="relative">
      <select
        {...p}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        className="w-full appearance-none outline-none transition cursor-pointer"
        style={{
          height: 44, padding: "0 38px 0 14px", borderRadius: 12, background: C.card,
          border: `1.5px solid ${foc ? C.green : C.line}`,
          boxShadow: foc ? `0 0 0 3px ${C.greenSoft}` : "none",
          fontFamily: F.body, fontSize: 14.5, color: C.ink,
        }}
      >
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
    borderRadius: 12, fontFamily: F.body,
    fontSize: size === "sm" ? 13 : 14.5, fontWeight: 500,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    cursor: p.disabled ? "not-allowed" : "pointer", opacity: p.disabled ? 0.4 : 1,
    transition: "all .15s", whiteSpace: "nowrap", border: "1.5px solid transparent",
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

export function Pill({ status }) {
  const s = ST[status];
  return (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: s.fg, background: s.bg, border: `1px solid ${s.bd}` }}>
      {s.label}
    </span>
  );
}

export function Modal({ onClose, title, sub, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 flex items-start justify-center" style={{ background: "rgba(24,38,43,.45)" }}>
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl overflow-hidden`} style={{ background: C.card, boxShadow: "0 24px 60px rgba(24,38,43,.22)" }}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>{title}</h3>
            {sub && <p className="mt-0.5" style={{ fontSize: 13, color: C.muted }}>{sub}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg shrink-0" style={{ color: C.faint }}><X size={18} /></button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon: I, title, hint, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: C.lineSoft, color: C.faint }}><I size={22} /></div>
      <p style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</p>
      {hint && <p className="mt-1 max-w-xs" style={{ fontSize: 13.5, color: C.muted }}>{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Info = ({ k, v }) => (
  <div>
    <p style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>{k}</p>
    <p className="mt-0.5" style={{ fontSize: 13.5, fontFamily: F.mono, color: C.ink }}>{v}</p>
  </div>
);

export const Stat = ({ k, v, cor }) => (
  <div>
    <p style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>{k}</p>
    <p className="mt-0.5" style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: cor || C.ink }}>{v}</p>
  </div>
);

export const Big = ({ k, v, sub, cor }) => (
  <Card>
    <p style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>{k}</p>
    <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 23, fontWeight: 600, letterSpacing: "-0.03em", color: cor || C.ink }}>{v}</p>
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
                <td key={j} className={`px-6 py-3 ${j ? "text-right" : ""}`}
                  style={{ fontFamily: j ? F.mono : F.body, fontWeight: 500, color: C.ink, whiteSpace: "nowrap" }}>
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

// ── medidor da faixa do dia ──
export function Faixa({ v, meta, stop, seGanhar, sePerder, temAbertas }) {
  const min = -stop * 1.35, max = meta * 1.45;
  const L = 26, R = 774;
  const X = (val) => L + ((Math.max(min, Math.min(max, val)) - min) / (max - min)) * (R - L);
  const cor = v >= meta ? C.green : v <= -stop ? C.red : C.ink;
  const px = X(v);
  const lw = 100;
  const lx = Math.max(L, Math.min(R - lw, px - lw / 2));

  return (
    <svg viewBox="0 0 800 112" className="w-full" style={{ height: 112 }}>
      <defs><clipPath id="trk"><rect x={L} y={52} width={R - L} height={18} rx={9} /></clipPath></defs>
      <g clipPath="url(#trk)">
        <rect x={X(min)} y={52} width={X(-stop) - X(min)} height={18} fill={C.redBand} />
        <rect x={X(-stop)} y={52} width={X(0) - X(-stop)} height={18} fill={C.redSoft} />
        <rect x={X(0)} y={52} width={X(meta) - X(0)} height={18} fill={C.greenSoft} />
        <rect x={X(meta)} y={52} width={X(max) - X(meta)} height={18} fill={C.greenBand} />
      </g>
      {temAbertas && (
        <g opacity="0.55">
          <path d={`M${X(sePerder)} 48 l5 -7 l-10 0 z`} fill={C.red} />
          <path d={`M${X(seGanhar)} 48 l5 -7 l-10 0 z`} fill={C.green} />
        </g>
      )}
      {[[-stop, `\u2212${brl(stop)}`, C.red, "STOP"], [0, brl(0), C.faint, ""], [meta, `+${brl(meta)}`, C.green, "META"]].map(([val, txt, col, tag]) => (
        <g key={val}>
          <line x1={X(val)} y1={48} x2={X(val)} y2={74} stroke={col} strokeWidth={val === 0 ? 1 : 2} strokeDasharray={val === 0 ? "2 3" : ""} />
          {tag && <text x={X(val)} y={90} textAnchor="middle" style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, fill: col, letterSpacing: ".08em" }}>{tag}</text>}
          <text x={X(val)} y={tag ? 105 : 90} textAnchor="middle" style={{ fontFamily: F.mono, fontSize: 11, fill: C.muted }}>{txt}</text>
        </g>
      ))}
      <rect x={lx} y={2} width={lw} height={26} rx={8} fill={cor} />
      <text x={lx + lw / 2} y={19} textAnchor="middle" style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 600, fill: "#fff" }}>{sgn(v)}</text>
      <path d={`M${px} 36 l7 -8 l-14 0 z`} fill={cor} />
      <rect x={px - 2.5} y={48} width={5} height={26} rx={2.5} fill={cor} />
    </svg>
  );
}
