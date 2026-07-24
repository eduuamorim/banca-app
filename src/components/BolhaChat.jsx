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
  const { naoLidas, aberto, setAberto, atividade } = props;

  // Detecta desktop para dimensionar a janela: compacta no PC, cheia no celular.
  const [desktop, setDesktop] = React.useState(false);
  React.useEffect(() => {
    const check = () => setDesktop(window.matchMedia("(min-width: 640px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
            background: C.green, color: "#fff",
            boxShadow: "0 6px 20px rgba(14,159,110,.45)",
          }}
          title="Conversa">
          {atividade ? (
            <span className="inline-flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="rounded-full" style={{
                  width: 5, height: 5, background: "#fff",
                  animation: `pontinho 1.2s ${i * 0.18}s infinite ease-in-out`,
                }} />
              ))}
            </span>
          ) : (
            <MessageCircle size={24} />
          )}
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
          {desktop && (
            <div className="fixed inset-0 z-40" style={{ background: "rgba(20,30,33,.35)" }} onClick={() => setAberto(false)} />
          )}

          <div className="fixed z-50 flex flex-col bg-white overflow-hidden shadow-2xl"
            style={desktop
              ? { right: 20, bottom: 20, width: 440, height: 680, maxHeight: "calc(100vh - 40px)", borderRadius: 16 }
              : { inset: 0 }}>
            {/* cabeçalho da janela */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: C.green, color: "#fff" }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Conversa</span>
              </div>
              <button onClick={() => setAberto(false)} className="p-1 rounded-md" style={{ color: "rgba(255,255,255,.85)" }}>
                <X size={20} />
              </button>
            </div>

            {/* o chat em si */}
            <div className="flex-1 min-h-0 px-3 pb-2">
              <Chat {...props} embutido />
            </div>
          </div>
        </>
      )}
    </>
  );
}
