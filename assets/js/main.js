/* =========================================================================
   Lamp — comportamento da página
   Sem dependências. Degrada com elegância se algo não existir no DOM.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- menu */
  var header = document.getElementById("header");
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu");
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest(".nav__link")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.matchMedia("(min-width: 761px)").addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });
  }

  /* ------------------------------------------------- header + botão topo */
  var toTop = document.getElementById("toTop");
  var hero = document.getElementById("home");

  /* Barra superior em três estados:
       - sobre a fotografia, fica transparente;
       - passado o hero, ganha fundo sólido;
       - ao descer, recolhe para fora da tela; ao subir, volta.
     O recolher e devolver é o que torna a entrada natural: a barra chega
     quando o leitor sinaliza que quer navegar, em vez de surgir sozinha
     no meio da rolagem. */
  function solidThreshold() {
    if (!hero) return 60;
    return Math.max(hero.offsetHeight - (header ? header.offsetHeight : 68), 60);
  }

  var threshold = solidThreshold();
  window.addEventListener("resize", function () { threshold = solidThreshold(); });

  var lastY = window.scrollY;
  var HIDE_AFTER = 8; // folga para ignorar micro-rolagens e trepidação

  function onScroll() {
    var y = window.scrollY;
    var past = y > threshold;

    if (header) {
      header.classList.toggle("is-solid", past);

      // Só recolhe depois do hero, e nunca com o menu móvel aberto
      var navOpen = nav && nav.classList.contains("is-open");
      var delta = y - lastY;

      if (!past || navOpen) {
        header.classList.remove("is-hidden");
      } else if (delta > HIDE_AFTER) {
        header.classList.add("is-hidden");
      } else if (delta < -HIDE_AFTER) {
        header.classList.remove("is-hidden");
      }
    }

    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    lastY = y;
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* O botão flutua sobre o conteúdo, e no fim da página isso cobriria os
     créditos das fotografias — que as licenças CC BY-SA obrigam a exibir.
     Enquanto o rodapé está à vista, o botão recolhe. */
  var footer = document.querySelector(".site-footer");
  if (toTop && footer && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      toTop.classList.toggle("is-tucked", entradas[0].isIntersecting);
    }).observe(footer);
  }

  /* -------------------------------------------------- troca de idioma */
  /* As duas versões usam os mesmos id de âncora, então a troca pode levar
     a seção em que a pessoa está em vez de devolvê-la ao topo. O destino
     sai do link de navegação ativo, que o scrollspy mantém atualizado —
     mais confiável que location.hash, que fica para trás ao rolar. */
  var langSwitch = document.querySelector(".lang-switch");
  if (langSwitch) {
    var langBase = langSwitch.getAttribute("href").split("#")[0];
    langSwitch.addEventListener("click", function () {
      var ativo = document.querySelector(".nav__link.is-active");
      var secao = ativo ? ativo.getAttribute("href") : "";
      /* So concatena ancora de verdade. Nas paginas de projeto o link ativo
         aponta para outra pagina ("../index.html#projects"), e emendar isso
         no destino produziria URL quebrada — ali o certo e ir para a raiz da
         traducao, que ja e o proprio langBase. */
      var ancora = secao && secao.charAt(0) === "#" && secao !== "#home";
      langSwitch.setAttribute("href", ancora ? langBase + secao : langBase);
    });
  }

  /* -------------------------------------------------- animação de entrada */
  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        revealObserver.unobserve(el);

        /* O atraso escalona a entrada, mas mora no style inline e vale para
           qualquer transicao do elemento, nao so a de entrada. No cartao de
           projeto a regra .work-box substitui a transicao de .reveal por
           inteiro, entao o que ficava atrasado era a troca de fundo no hover:
           cada cartao reagia num tempo e o cabecalho, sem atraso, noutro.
           Some com ele assim que a entrada termina. */
        window.setTimeout(function () { el.style.transitionDelay = ""; }, 800);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 6) * 60 + "ms";
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------ scrollspy */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = links
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    var visible = new Map();

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });

      if (!visible.size) return;

      var best = null;
      var bestRatio = -1;
      visible.forEach(function (ratio, id) {
        if (ratio > bestRatio) { bestRatio = ratio; best = id; }
      });
      if (best) setActive(best);
    }, {
      threshold: [0.1, 0.25, 0.5, 0.75],
      rootMargin: "-70px 0px -45% 0px"
    });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------ e-mail ofuscado */
  /* O endereço não existe em texto claro no HTML: fica em base64 no atributo
     data-mail e só vira mailto aqui. A codificação escolhida não produz
     arroba, então a varredura por expressão regular de endereço não acha
     nem a versão codificada — ela passa reto.

     Isso derruba o coletor comum, que lê o código-fonte e não executa
     JavaScript. Não é barreira contra quem renderiza a página de verdade;
     nenhuma ofuscação é. Sem JavaScript, o conteúdo do elemento continua
     legível por uma pessoa ("augustomohr arroba outlook ponto com").   */
  document.querySelectorAll("[data-mail]").forEach(function (el) {
    var end;
    try {
      end = atob(el.getAttribute("data-mail") || "");
    } catch (e) {
      return; // atributo corrompido: mantém o texto de reserva
    }
    if (end.indexOf("@") < 1) return;

    var a = document.createElement("a");
    a.href = "mailto:" + end;
    a.textContent = end;
    el.textContent = "";
    el.appendChild(a);
  });

  /* -------------------------------------------------------------- galeria */
  /* A galeria nasce empilhada no HTML e so vira uma-por-vez aqui. Quem
     bloqueia script continua vendo todas as imagens, e o clique numa delas
     abre o arquivo inteiro numa aba, em vez de uma caixa morta. */

  var TEXTOS_LB = document.documentElement.lang.indexOf("en") === 0
    ? { fechar: "Close", anterior: "Previous image", proxima: "Next image" }
    : { fechar: "Fechar", anterior: "Imagem anterior", proxima: "Próxima imagem" };

  var ICONE_X = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  var ICONE_ESQ = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
  var ICONE_DIR = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  var lb = null;        // janela de ampliacao, criada so no primeiro clique
  var lbEstado = null;  // { slides, idx, mostrar } da galeria que a abriu

  function lbMostra() {
    var slide = lbEstado.slides[lbEstado.idx];
    var img = slide.querySelector("img");
    var legenda = slide.querySelector(".gal__cap");
    var alvo = lb.querySelector(".lb__img");
    alvo.src = img.currentSrc || img.src;
    alvo.alt = img.alt;
    lb.querySelector(".lb__cap").textContent = legenda ? legenda.textContent : "";
  }

  function lbVai(passo) {
    var n = lbEstado.slides.length;
    lbEstado.idx = (lbEstado.idx + passo + n) % n;
    lbEstado.mostrar(lbEstado.idx);   // a galeria por tras acompanha
    lbMostra();
  }

  function lbFecha() {
    lb.hidden = true;
    document.documentElement.classList.remove("lb-aberto");
    // devolve o foco ao gatilho do slide em que parou, senao quem navega por
    // teclado cai no topo da pagina
    var gatilho = lbEstado.slides[lbEstado.idx].querySelector(".gal__zoom");
    if (gatilho) gatilho.focus();
  }

  function lbCria() {
    var el = document.createElement("div");
    el.className = "lb";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.hidden = true;
    el.innerHTML =
      '<button class="lb__btn lb__x" type="button" aria-label="' + TEXTOS_LB.fechar + '">' + ICONE_X + '</button>' +
      '<button class="lb__btn lb__nav lb__prev" type="button" aria-label="' + TEXTOS_LB.anterior + '">' + ICONE_ESQ + '</button>' +
      '<button class="lb__btn lb__nav lb__next" type="button" aria-label="' + TEXTOS_LB.proxima + '">' + ICONE_DIR + '</button>' +
      '<figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap"></figcaption></figure>';
    document.body.appendChild(el);

    el.querySelector(".lb__x").addEventListener("click", lbFecha);
    el.querySelector(".lb__prev").addEventListener("click", function () { lbVai(-1); });
    el.querySelector(".lb__next").addEventListener("click", function () { lbVai(1); });

    /* Clicar no fundo escuro fecha; clicar na imagem ou na legenda nao. */
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.classList.contains("lb__fig")) lbFecha();
    });

    document.addEventListener("keydown", function (e) {
      if (el.hidden) return;
      if (e.key === "Escape") {
        lbFecha();
      } else if (e.key === "ArrowLeft") {
        lbVai(-1);
      } else if (e.key === "ArrowRight") {
        lbVai(1);
      } else if (e.key === "Tab") {
        /* O foco circula so entre os tres botoes enquanto a janela esta
           aberta; sem isso o Tab sairia para a pagina escondida atras. */
        var botoes = el.querySelectorAll(".lb__btn");
        var primeiro = botoes[0];
        var ultimo = botoes[botoes.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          ultimo.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          primeiro.focus();
          e.preventDefault();
        }
        return;
      } else {
        return;
      }
      e.preventDefault();
    });

    var partida = null;
    el.addEventListener("touchstart", function (e) {
      partida = e.changedTouches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (partida === null) return;
      var dx = e.changedTouches[0].clientX - partida;
      if (Math.abs(dx) > 40) lbVai(dx < 0 ? 1 : -1);
      partida = null;
    }, { passive: true });

    return el;
  }

  function lbAbre(estado) {
    if (!lb) lb = lbCria();
    lbEstado = estado;
    lbMostra();
    lb.hidden = false;
    document.documentElement.classList.add("lb-aberto");
    lb.querySelector(".lb__x").focus();
  }

  document.querySelectorAll(".gal").forEach(function (gal) {
    var slides = Array.prototype.slice.call(gal.querySelectorAll(".gal__slide"));
    var anterior = gal.querySelector("[data-gal=prev]");
    var proxima = gal.querySelector("[data-gal=next]");
    if (slides.length < 2 || !anterior || !proxima) return;

    var atual = 0;
    var contador = gal.querySelector("[data-gal=now]");

    function mostrar(i) {
      atual = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-current", n === atual); });
      if (contador) contador.textContent = String(atual + 1);
    }

    anterior.addEventListener("click", function () { mostrar(atual - 1); });
    proxima.addEventListener("click", function () { mostrar(atual + 1); });

    /* O clique na imagem abre a janela de ampliacao. O preventDefault tira o
       comportamento do link, que sem script abriria o arquivo numa aba. */
    slides.forEach(function (slide, n) {
      var zoom = slide.querySelector(".gal__zoom");
      if (!zoom) return;
      zoom.addEventListener("click", function (e) {
        e.preventDefault();
        lbAbre({ slides: slides, idx: n, mostrar: mostrar });
      });
    });

    /* As setas do teclado valem com o foco em qualquer ponto da galeria, que
       na pratica quer dizer com um dos dois botoes focado. */
    gal.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") mostrar(atual - 1);
      else if (e.key === "ArrowRight") mostrar(atual + 1);
      else return;
      e.preventDefault();
    });

    /* Arrastar com o dedo. O limite de 40px evita que um toque tremido ou o
       comeco de uma rolagem vertical troque de imagem sem querer. */
    var partida = null;
    gal.addEventListener("touchstart", function (e) {
      partida = e.changedTouches[0].clientX;
    }, { passive: true });
    gal.addEventListener("touchend", function (e) {
      if (partida === null) return;
      var dx = e.changedTouches[0].clientX - partida;
      if (Math.abs(dx) > 40) mostrar(atual + (dx < 0 ? 1 : -1));
      partida = null;
    }, { passive: true });

    gal.classList.add("is-live");
    mostrar(0);
  });

  /* ------------------------------------------------------ faixas de fluxo */
  /* Marca as faixas que ainda tem diagrama a direita, para o CSS esmaecer a
     borda. Reavalia ao rolar e ao redimensionar, e o limite de 4px absorve o
     arredondamento de subpixel no fim da rolagem. */
  document.querySelectorAll(".strip__scroll").forEach(function (faixa) {
    function atualiza() {
      var sobra = faixa.scrollWidth - faixa.clientWidth - faixa.scrollLeft;
      faixa.classList.toggle("has-more", sobra > 4);
    }
    atualiza();
    faixa.addEventListener("scroll", atualiza, { passive: true });
    window.addEventListener("resize", atualiza);
  });

  /* ----------------------------------------------------------- ano rodapé */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
