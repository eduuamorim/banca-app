/*
  Gravação de áudio pelo navegador.

  Usa a API MediaRecorder, que é nativa. No computador funciona bem
  em Chrome, Edge e Firefox. No iPhone há limitações do sistema
  (todo navegador por lá usa o motor do Safari), então checamos
  o suporte antes e avisamos em vez de quebrar.
*/

/** O navegador consegue gravar áudio? */
export function podeGravar() {
  if (typeof window === "undefined") return false;
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

/** O formato que este navegador aceita gravar. */
function formatoSuportado() {
  if (typeof MediaRecorder === "undefined") return "";
  const opcoes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return opcoes.find((f) => MediaRecorder.isTypeSupported?.(f)) || "";
}

/**
 * Cria um gravador. Uso:
 *   const g = criarGravador();
 *   await g.iniciar();      // pede permissão do microfone
 *   const audio = await g.parar();   // { arquivo, duracao }
 *   g.cancelar();           // descarta
 */
export function criarGravador() {
  let rec = null;
  let trilha = null;
  let pedacos = [];
  let comecouEm = 0;

  const iniciar = async () => {
    if (!podeGravar()) {
      throw new Error("Este navegador não grava áudio. No computador, use Chrome, Edge ou Firefox.");
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      // A pessoa negou, ou não há microfone.
      if (e?.name === "NotAllowedError") throw new Error("Permissão do microfone negada.");
      if (e?.name === "NotFoundError") throw new Error("Nenhum microfone encontrado.");
      throw new Error("Não consegui acessar o microfone.");
    }

    trilha = stream;
    pedacos = [];
    const mime = formatoSuportado();
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (ev) => { if (ev.data?.size) pedacos.push(ev.data); };
    rec.start();
    comecouEm = Date.now();
  };

  const encerrarTrilha = () => {
    trilha?.getTracks?.().forEach((t) => t.stop());
    trilha = null;
  };

  const parar = () =>
    new Promise((resolve, reject) => {
      if (!rec || rec.state === "inactive") {
        encerrarTrilha();
        return reject(new Error("Nada foi gravado."));
      }
      rec.onstop = () => {
        const duracao = Math.max(1, Math.round((Date.now() - comecouEm) / 1000));
        const tipo = rec.mimeType || "audio/webm";
        const blob = new Blob(pedacos, { type: tipo });
        encerrarTrilha();
        if (!blob.size) return reject(new Error("A gravação saiu vazia."));
        const ext = tipo.includes("mp4") ? "m4a" : tipo.includes("ogg") ? "ogg" : "webm";
        const arquivo = new File([blob], `audio-${Date.now()}.${ext}`, { type: tipo });
        resolve({ arquivo, duracao });
      };
      rec.stop();
    });

  const cancelar = () => {
    try { if (rec && rec.state !== "inactive") { rec.onstop = null; rec.stop(); } } catch (e) { /* nada */ }
    pedacos = [];
    encerrarTrilha();
  };

  const segundosGravados = () => (comecouEm ? Math.round((Date.now() - comecouEm) / 1000) : 0);

  return { iniciar, parar, cancelar, segundosGravados };
}
