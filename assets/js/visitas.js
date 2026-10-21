// Contador de visitas proprio: uma linha por pagina vista na tabela visitas do
// Supabase. A chave abaixo e a publishable (feita para ficar no navegador) e so
// consegue inserir; a leitura e pelo painel "Visitas" do home.
//
// Links por contato: ?ref=nome marca a visita e fica guardado na sessao, para
// as paginas seguintes tambem saberem de onde a pessoa veio.
// ?nao-contar=1 desliga a contagem neste navegador (?nao-contar=0 religa).
(function () {
  var URL = 'https://khkedvcesmaaczwboocb.supabase.co/rest/v1/visitas';
  var CHAVE = 'sb_publishable_FauiYZecNitgttk5ZGtjiw_OPUEGdwq';

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
  fetch(URL, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: CHAVE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      pagina: cortar(location.pathname, 300),
      ref: ref,
      origem: cortar(document.referrer, 300),
      idioma: cortar(navigator.language, 40),
      tela: screen.width + 'x' + screen.height,
      visitante: visitante.slice(0, 40),
      user_agent: cortar(navigator.userAgent, 400)
    })
  }).catch(function () {});
})();
