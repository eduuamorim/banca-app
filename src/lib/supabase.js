"use client";
import { createClient } from "@supabase/supabase-js";

// Criado só uma vez, e só quando o navegador precisa.
// Assim o build na Vercel não quebra se algo estiver faltando.
let _cliente = null;

function criar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Confira as Environment Variables na Vercel ou o arquivo .env.local."
    );
  }
  return createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export const supabase = new Proxy(
  {},
  {
    get(_alvo, prop) {
      if (!_cliente) _cliente = criar();
      const v = _cliente[prop];
      return typeof v === "function" ? v.bind(_cliente) : v;
    },
  }
);
