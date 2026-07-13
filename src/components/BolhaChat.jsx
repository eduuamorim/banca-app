"use client";
import React from "react";
import { MessageCircle, X } from "lucide-react";
import { C } from "@/lib/ui";
import Chat from "./Chat";

/*
  Balão de chat flutuante, no canto inferior direito.
  Fica visível em qualquer aba do app. Um pontinho vermelho
  avisa mensagem nova. Toca e abre a conversa por cima de tudo:
  tela cheia no celular, uma janela no canto no computador.
*/
export default function BolhaChat(props) {
  const { naoLidas, aberto, setAberto } = props;

  const abrir = () => setAberto(true);

  return (
    <>
      {/* o botão redondo */}
      {!aberto && (
        <button onClick={abrir}
          className="fixed z-40 flex items-center justify-center rounded-full shadow-lg"
          style={{
            right: 18,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",  // acima da barra mobile
            width: 56, height: 56,
            background: C.blue, color: "#fff",
            boxShadow: "0 6px 20px rgba(58,122,156,.45)",
          }}
          title="Conversa">
          <MessageCircle size={24} />
          {naoLidas > 0 && (
            <span className="num absolute inline-flex items-center justify-center"
              style={{ top: -3, right: -3, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 10, background: C.red, color: "#fff", fontSize: 11, fontWeight: 700, border: "2px solid #fff" }}>
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      )}

      {/* a janela do chat */}
      {aberto && (
        <>
          {/* fundo escurecido (só no desktop; no celular a janela cobre tudo) */}
          <div className="fixed inset-0 z-40 hidden sm:block" style={{ background: "rgba(20,30,33,.35)" }} onClick={() => setAberto(false)} />

          <div className="fixed z-50 flex flex-col bg-white overflow-hidden
                          inset-0
                          sm:inset-auto sm:right-5 sm:bottom-5 sm:rounded-2xl sm:shadow-2xl"
            style={{ width: "100%", height: "100%" }}>
            {/* no desktop, tamanho de janelinha */}
            <style>{`
              @media (min-width: 640px) {
                .bolha-janela { width: 400px !important; height: 620px !important; max-height: calc(100vh - 40px); }
              }
            `}</style>
            <div className="bolha-janela flex flex-col h-full">
              {/* cabeçalho da janela */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: C.blue, color: "#fff" }}>
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Conversa</span>
                </div>
                <button onClick={() => setAberto(false)} className="p-1 rounded-md" style={{ color: "rgba(255,255,255,.85)" }}>
                  <X size={20} />
                </button>
              </div>

              {/* o chat em si */}
              <div className="flex-1 min-h-0 px-3">
                <Chat {...props} embutido />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
