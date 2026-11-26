// Contador de visitas proprio: cada pagina vista vira uma mensagem num topico do
// ntfy.sh, que guarda as mensagens por 12 horas. Um coletor no computador do
// dono (bases_empresas/contatos/visitas.py) busca o topico e grava tudo num CSV
// local. Nada fica num banco online.
//
// Links por contato: ?ref=codigo marca a visita e fica guardado na sessao, para
// as paginas seguintes tambem saberem de onde a pessoa veio. Os e-mails de
// candidatura levam um codigo por empresa no link do portfolio e no do CV.
// ?nao-contar=1 desliga a contagem neste navegador (?nao-contar=0 religa).
(function () {
  var DESTINO = 'https://ntfy.sh/visitas-bd92004a297e78507327';

  function guardado(armazem, chave, valor) {
    try {
      if (valor !== undefined) armazem.setItem(chave, valor);
      return armazem.getItem(chave);
    } catch (e) { return valor || null; }
  }

  var params = new URLSearchParams(location.search);
  if (params.has('nao-contar')) guardado(localStorage, 'visitas-ignorar', params.get('nao-contar') === '0' ? '' : '1');
  if (guardado(localStorage, 'visitas-ignorar') === '1') return;
  if (navigator.webdriver || /bot|crawl|spider|slurp|headless|preview|lighthouse/i.test(navigator.userAgent)) return;

  var ref = params.get('ref');
  ref = ref ? guardado(sessionStorage, 'visitas-ref', ref.slice(0, 80)) : guardado(sessionStorage, 'visitas-ref');

  var visitante = guardado(localStorage, 'visitas-id');
  if (!visitante) {
    visitante = Math.random().toString(36).slice(2) + Date.now().toString(36);
    guardado(localStorage, 'visitas-id', visitante);
  }

  var cortar = function (s, n) { return s ? String(s).slice(0, n) : null; };
  var corpo = JSON.stringify({
    pagina: cortar(location.pathname, 300),
    ref: ref,
    origem: cortar(document.referrer, 300),
    idioma: cortar(navigator.language, 40),
    tela: screen.width + 'x' + screen.height,
    visitante: visitante.slice(0, 40),
    user_agent: cortar(navigator.userAgent, 400)
  });
  // sendBeacon sobrevive a troca de pagina (as paginas de CV redirecionam para o PDF).
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(DESTINO, corpo)) return;
  } catch (e) {}
  fetch(DESTINO, { method: 'POST', keepalive: true, body: corpo }).catch(function () {});
})();
