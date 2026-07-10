"use client";
import React, { useState } from "react";
import { Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { C, F, Input, Label, Btn } from "@/lib/ui";

export default function Login() {
  const [modo, setModo] = useState("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const traduzir = (m) => {
    if (/Invalid login/i.test(m)) return "E-mail ou senha incorretos.";
    if (/already registered/i.test(m)) return "Esse e-mail já tem conta. Entre por ele.";
    if (/at least 6/i.test(m)) return "A senha precisa de pelo menos 6 caracteres.";
    if (/Email not confirmed/i.test(m)) return "Confirme o e-mail antes de entrar.";
    return m;
  };

  const enviar = async () => {
    setErro(""); setAviso(""); setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() } },
        });
        if (error) throw error;
        if (!data.session) setAviso("Conta criada. Confirme o link enviado no seu e-mail e volte para entrar.");
      }
    } catch (e) {
      setErro(traduzir(e.message || "Algo deu errado."));
    } finally {
      setCarregando(false);
    }
  };

  const valido = email.includes("@") && senha.length >= 6 && (modo === "entrar" || nome.trim());

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: C.nav, fontFamily: F.body }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.green }}>
            <Gauge size={19} color="#fff" />
          </div>
          <span style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: "#fff" }}>Gestão de Banca</span>
        </div>

        <div className="rounded-2xl p-6" style={{ background: C.card }}>
          <h2 style={{ fontFamily: F.display, fontSize: 21, fontWeight: 600, color: C.ink }}>
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h2>
          <p className="mt-1 mb-5" style={{ fontSize: 13.5, color: C.muted }}>
            {modo === "entrar"
              ? "Suas apostas ficam registradas no seu nome."
              : "O nome aparece em cada aposta e no relatório."}
          </p>

          <div className="space-y-4">
            {modo === "criar" && (
              <div>
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" />
              </div>
            )}
            <div>
              <Label>E-mail</Label>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valido && !carregando && enviar()}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {erro && (
              <p className="rounded-lg px-3 py-2" style={{ fontSize: 12.5, color: C.red, background: C.redSoft, border: `1px solid ${C.redBand}` }}>
                {erro}
              </p>
            )}
            {aviso && (
              <p className="rounded-lg px-3 py-2" style={{ fontSize: 12.5, color: C.greenDeep, background: C.greenSoft, border: `1px solid ${C.greenBand}` }}>
                {aviso}
              </p>
            )}

            <Btn kind="green" style={{ width: "100%" }} disabled={!valido || carregando} onClick={enviar}>
              {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
            </Btn>
          </div>

          <button
            onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setErro(""); setAviso(""); }}
            className="w-full mt-5 pt-4"
            style={{ fontSize: 13, color: C.muted, borderTop: `1px solid ${C.lineSoft}` }}
          >
            {modo === "entrar" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>
        </div>

        <p className="text-center mt-5" style={{ fontSize: 12, color: "#5E7178" }}>
          Cada pessoa cria a própria conta. Todos veem a mesma banca.
        </p>
      </div>
    </div>
  );
}
