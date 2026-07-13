/*
  Som de notificação, gerado no navegador (Web Audio API).
  Sem arquivo de áudio: nada para baixar, nada para falhar.

  Importante: navegadores só deixam tocar som depois que a pessoa
  interagiu com a página ao menos uma vez. Por isso preparamos o
  contexto de áudio no primeiro toque/clique, e a partir daí o
  som funciona.
*/

let ctx = null;
let liberado = false;

/** Cria o contexto de áudio uma vez, no primeiro gesto do usuário. */
export function prepararSom() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  // Alguns navegadores criam o contexto "suspenso" até um gesto.
  if (ctx.state === "suspended") ctx.resume();
  liberado = true;
}

/**
 * Um "ding" curto e agradável: duas notas rápidas subindo,
 * com um decaimento suave. Nada estridente.
 */
export function tocarDing() {
  if (typeof window === "undefined") return;
  if (!ctx || !liberado) return;   // ainda não houve interação
  if (ctx.state === "suspended") ctx.resume();

  const agora = ctx.currentTime;
  const notas = [880, 1174.66];    // Lá5 e Ré6, um intervalo alegre

  notas.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const inicio = agora + i * 0.09;
    const fim = inicio + 0.18;

    vol.gain.setValueAtTime(0, inicio);
    vol.gain.linearRampToValueAtTime(0.18, inicio + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.0001, fim);

    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(fim);
  });
}
