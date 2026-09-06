/* Last Chance Lighting — shared behaviour
   - mobile navigation toggle
   - home hero carousel
   - product catalogue (Products filtering + Product Detail rendering)
   No framework. Every block is a no-op when its markup isn't on the page. */

(function () {
  'use strict';

  /* ---------- preloader ----------
     The <head> script decides whether this load gets one (cold open or
     refresh — not internal navigation) and marks <html> accordingly. When it
     didn't, drop the element outright rather than running the show/hide
     cycle over something CSS is already hiding. */
  var preloader = document.getElementById('preloader');
  if (preloader && !document.documentElement.classList.contains('preload')) {
    if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    preloader = null;
  }
  if (preloader) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shownAt = Date.now();
    var minShow = reduceMotion ? 0 : 500; // avoid an instant flash on a fast, cached load

    var hidePreloader = function () {
      var wait = Math.max(0, minShow - (Date.now() - shownAt));
      setTimeout(function () {
        preloader.classList.add('is-hidden');
        // fully remove once the fade finishes so it can never block clicks or focus
        setTimeout(function () {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, reduceMotion ? 0 : 550);
      }, wait);
    };

    var pageReady = (document.readyState === 'complete')
      ? Promise.resolve()
      : new Promise(function (resolve) { window.addEventListener('load', resolve, { once: true }); });
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var safetyNet = new Promise(function (resolve) { setTimeout(resolve, 4000); });

    Promise.race([Promise.all([pageReady, fontsReady]), safetyNet]).then(hidePreloader);
  }

  /* ---------- drifting glow orbs ----------
     Soft pools of light wandering behind the page. The drift itself is pure
     CSS keyframes on transform, so it runs on the compositor and never wakes
     the main thread; this only mounts the layer. Built in JS so no-JS pages
     carry nothing. */
  var glowReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!glowReduce) {
    var orbs = document.createElement('div');
    orbs.className = 'glow-orbs';
    orbs.setAttribute('aria-hidden', 'true');
    orbs.innerHTML = '<div class="glow-orb glow-orb--a"></div>' +
                     '<div class="glow-orb glow-orb--b"></div>' +
                     '<div class="glow-orb glow-orb--c"></div>';
    document.body.appendChild(orbs);
    requestAnimationFrame(function () { orbs.classList.add('is-on'); });
  }

  /* ---------- evening mode ----------
     The theme itself is applied synchronously in <head> so there's no flash;
     all this does is flip it and remember the choice. */
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    var isDark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };
    var syncThemeBtn = function () {
      var dark = isDark();
      themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      themeBtn.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to evening mode');
      themeBtn.setAttribute('title', dark ? 'Day mode' : 'Evening mode');
    };
    syncThemeBtn();
    var themeTimer = null;
    themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      var next = isDark() ? 'light' : 'dark';
      /* .theme-switching puts a colour transition on everything, but only for
         the length of the swap — carrying it permanently would drag on hovers */
      root.classList.add('theme-switching');
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('lcl-theme', next); } catch (e) { /* private mode */ }
      syncThemeBtn();
      clearTimeout(themeTimer);
      themeTimer = setTimeout(function () { root.classList.remove('theme-switching'); }, 560);
    });
  }

  /* ---------- soft in-page scrolling ----------
     CSS scroll-behavior:smooth stays as a harmless fallback, but its speed
     isn't ours to tune — this intercepts same-page "#" links and glides to
     them on our own eased timeline instead (offset clear of the sticky nav). */
  var softScrollReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!softScrollReduce) {
    var softScrollTo = function (targetY, duration) {
      var startY = window.pageYOffset;
      var diff = targetY - startY;
      if (Math.abs(diff) < 1) return;
      var startTime = null;
      function step(ts) {
        if (startTime === null) startTime = ts;
        var p = Math.min((ts - startTime) / duration, 1);
        // easeInOutCubic — a slower, softer glide than the browser default
        var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        window.scrollTo(0, Math.round(startY + diff * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a) return;
      var url;
      try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
      if (url.pathname !== window.location.pathname || !url.hash || url.hash === '#') return;
      var target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      var navEl = document.querySelector('.site-nav');
      var offset = (navEl ? navEl.offsetHeight : 0) + 20;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      softScrollTo(Math.max(y, 0), 950);
      if (window.history && window.history.pushState) window.history.pushState(null, '', url.hash);
    });
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('site-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- nav: condense on scroll ---------- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var syncNav = function () {
      nav.classList.toggle('is-scrolled', (window.pageYOffset || document.documentElement.scrollTop) > 24);
    };
    syncNav();
    window.addEventListener('scroll', syncNav, { passive: true });
  }

  /* ---------- lazy, viewport-gated background videos (Projects) ---------- */
  var lazyVids = document.querySelectorAll('video[data-src]');
  if (lazyVids.length) {
    var vidReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var loadVid = function (v) {
      if (!v.getAttribute('src')) { v.setAttribute('src', v.getAttribute('data-src')); v.load(); }
    };
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            loadVid(v);
            if (!vidReduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.25 });
      Array.prototype.forEach.call(lazyVids, function (v) { vio.observe(v); });
    } else {
      Array.prototype.forEach.call(lazyVids, function (v) {
        loadVid(v);
        if (!vidReduce) { v.setAttribute('autoplay', ''); }
      });
    }
  }

  /* ---------- home hero carousel ---------- */
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero__slides > *'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero__dot'));
    var current = document.querySelector('[data-carousel-current]');
    var idx = 0;
    var timer = null;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      if (current) current.textContent = String(idx + 1).padStart(2, '0');
    }
    function start() { stop(); timer = setInterval(function () { show(idx + 1); }, 6000); }
    function stop() { if (timer) clearInterval(timer); }

    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); start(); });
    if (next) next.addEventListener('click', function () { show(idx + 1); start(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);

    show(0);
    start();
  }

  /* ---------- count-up bands (home stat band, About timeline) ---------- */
  var countReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmtCount(el, n) {
    // years and other bare figures opt out of thousands grouping
    return el.hasAttribute('data-count-plain') ? String(n) : n.toLocaleString('en-US');
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1800;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      var eased = p * (2 - p); // easeOutQuad
      if (p < 1) {
        el.textContent = fmtCount(el, Math.round(target * eased)); // suffix held back until the end
        requestAnimationFrame(step);
      } else {
        el.textContent = fmtCount(el, target) + suffix;
      }
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-stats]'), function (band) {
    var nums = Array.prototype.slice.call(band.querySelectorAll('[data-count]'));
    if (!nums.length) return;
    var ran = false;

    function run() {
      if (ran) return;
      ran = true;
      nums.forEach(function (el) {
        if (countReduce) {
          el.textContent = fmtCount(el, parseInt(el.getAttribute('data-count'), 10) || 0)
            + (el.getAttribute('data-suffix') || '');
        } else {
          animateCount(el);
        }
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(band);
    } else {
      run();
    }
  });

  /* ---------- About timeline: draw the connecting rail ---------- */
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    if ('IntersectionObserver' in window) {
      var tlIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { timeline.classList.add('is-lit'); tlIo.disconnect(); }
        });
      }, { threshold: 0.3 });
      tlIo.observe(timeline);
    } else {
      timeline.classList.add('is-lit');
    }
  }

  /* ---------- catalogue ---------- */
  /* The five ranges actually stocked — mirrors the images/ folders. */
  var CATEGORIES = [
    'Chandeliers', 'Ceiling Lights', 'Wall Lights', 'Lamps', 'Outdoor Lighting'
  ];
  /* Every usable photo in images/, by range. Phone screenshots
     (status bar + gallery chrome) are left out. */
  var GALLERY = {
    'Chandeliers': [
      'images/chandeliar/chandelier-01.jpg',
      'images/chandeliar/chandelier-02.jpg',
      'images/chandeliar/chandelier-03.jpg',
      'images/chandeliar/chandelier-04.jpg',
      'images/chandeliar/chandelier-05.jpg',
      'images/chandeliar/chandelier-06.jpg',
      'images/chandeliar/chandelier-07.jpg',
      'images/chandeliar/chandelier-08.jpg',
      'images/chandeliar/chandelier-09.jpg',
      'images/chandeliar/chandelier-11.jpg',
      'images/chandeliar/chandelier-12.jpg',
      'images/chandeliar/chandelier-13.jpg',
      'images/chandeliar/chandelier-14.jpg',
      'images/chandeliar/chandelier-15.jpg',
      'images/chandeliar/chandelier-16.jpg',
      'images/chandeliar/chandelier-17.jpg',
      'images/chandeliar/chandelier-18.jpg',
      'images/chandeliar/chandelier-19.jpg',
      'images/chandeliar/chandelier-20.jpg',
      'images/chandeliar/chandelier-21.jpg',
      'images/chandeliar/chandelier-22.jpg',
      'images/chandeliar/chandelier-23.jpg',
      'images/chandeliar/chandelier-24.jpg',
      'images/chandeliar/chandelier-25.jpg',
      'images/chandeliar/chandelier-27.jpg',
      'images/chandeliar/chandelier-28.jpg'
    ],
    'Ceiling Lights': [
      'images/ceiling_lights/ceiling-01.jpg',
      'images/ceiling_lights/ceiling-02.jpg',
      'images/ceiling_lights/ceiling-03.jpg',
      'images/ceiling_lights/ceiling-04.jpg',
      'images/ceiling_lights/ceiling-06.jpg',
      'images/ceiling_lights/ceiling-07.jpg',
      'images/ceiling_lights/ceiling-08.jpg',
      'images/ceiling_lights/ceiling-09.jpg',
      'images/ceiling_lights/ceiling-10.jpg',
      'images/ceiling_lights/ceiling-11.jpg',
      'images/ceiling_lights/ceiling-12.jpg',
      'images/ceiling_lights/ceiling-13.jpg',
      'images/ceiling_lights/ceiling-14.jpg',
      'images/ceiling_lights/ceiling-15.jpg',
      'images/ceiling_lights/ceiling-16.jpg',
      'images/ceiling_lights/ceiling-17.jpg',
      'images/ceiling_lights/ceiling-18.jpg',
      'images/ceiling_lights/ceiling-19.jpg',
      'images/ceiling_lights/ceiling-20.jpg',
      'images/ceiling_lights/ceiling-21.jpg',
      'images/ceiling_lights/ceiling-22.jpg',
      'images/ceiling_lights/ceiling-23.jpg',
      'images/ceiling_lights/ceiling-24.jpg'
    ],
    'Wall Lights': [
      'images/wall_lights/wall-02.jpg',
      'images/wall_lights/wall-03.jpg',
      'images/wall_lights/wall-04.jpg',
      'images/wall_lights/wall-07.jpg',
      'images/wall_lights/wall-08.jpg',
      'images/wall_lights/wall-09.jpg',
      'images/wall_lights/wall-10.jpg',
      'images/wall_lights/wall-11.jpg',
      'images/wall_lights/wall-12.jpg',
      'images/wall_lights/wall-13.jpg',
      'images/wall_lights/wall-14.jpg',
      'images/wall_lights/wall-15.jpg',
      'images/wall_lights/wall-16.jpg',
      'images/wall_lights/wall-17.jpg',
      'images/wall_lights/wall-18.jpg',
      'images/wall_lights/wall-19.jpg',
      'images/wall_lights/wall-20.jpg',
      'images/wall_lights/wall-21.jpg',
      'images/wall_lights/wall-22.jpg',
      'images/wall_lights/wall-23.jpg',
      'images/wall_lights/wall-24.jpg',
      'images/wall_lights/wall-25.jpg'
    ],
    'Lamps': [
      'images/lamps/lamp-01.jpg',
      'images/lamps/lamp-02.jpg',
      'images/lamps/lamp-03.jpg',
      'images/lamps/lamp-04.jpg',
      'images/lamps/lamp-05.jpg',
      'images/lamps/lamp-06.jpg',
      'images/lamps/lamp-07.jpg',
      'images/lamps/lamp-08.jpg'
    ],
    'Outdoor Lighting': [
      'images/outdoor/outdoor-01.jpg',
      'images/outdoor/outdoor-02.jpg',
      'images/outdoor/outdoor-05.jpg',
      'images/outdoor/outdoor-06.jpg',
      'images/outdoor/outdoor-07.jpg'
    ]
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ----- Products: category chips driving the showroom gallery ----- */
  var catRow = document.getElementById('filter-categories');
  if (catRow) {
    var params = new URLSearchParams(window.location.search);
    var startCat = params.get('category');
    var state = {
      category: startCat && CATEGORIES.indexOf(startCat) !== -1 ? startCat : 'All'
    };

    function chip(label, active) {
      return '<button type="button" class="chip' + (active ? ' is-active' : '') +
        '" data-value="' + esc(label) + '">' + esc(label) + '</button>';
    }
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function renderChips() {
      catRow.innerHTML = ['All'].concat(CATEGORIES).map(function (c) { return chip(c, c === state.category); }).join('');
    }

    /* ----- showroom gallery: same chips, every photo we hold ----- */
    var galleryGrid = document.getElementById('gallery-grid');
    var galleryCount = document.getElementById('gallery-count');
    var lightbox = null, lbImg = null, lbCount = null, lbList = [], lbIndex = 0, lbReturnTo = null;

    function galleryList() {
      if (state.category !== 'All') return (GALLERY[state.category] || []).slice();
      return CATEGORIES.reduce(function (all, c) { return all.concat(GALLERY[c] || []); }, []);
    }

    function renderGallery() {
      if (!galleryGrid) return;
      lbList = galleryList();
      var label = state.category === 'All' ? 'the showroom' : state.category.toLowerCase();
      galleryCount.textContent = lbList.length + ' photo' + (lbList.length === 1 ? '' : 's') + ' from ' + label;
      galleryGrid.innerHTML = lbList.map(function (src, i) {
        return '<button type="button" class="gallery__item" data-i="' + i + '" ' +
          'aria-label="Enlarge photo ' + (i + 1) + ' of ' + lbList.length + '">' +
          '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></button>';
      }).join('');
    }

    function buildLightbox() {
      if (lightbox) return;
      var arrow = function (d) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"><path d="' +
          (d === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6') + '"/></svg>';
      };
      lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Photo viewer');
      lightbox.innerHTML =
        '<img class="lightbox__img" alt="">' +
        '<button type="button" class="lightbox__btn lightbox__close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
        '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous photo">' + arrow('prev') + '</button>' +
        '<button type="button" class="lightbox__btn lightbox__next" aria-label="Next photo">' + arrow('next') + '</button>' +
        '<p class="lightbox__count"></p>';
      document.body.appendChild(lightbox);
      lbImg = lightbox.querySelector('.lightbox__img');
      lbCount = lightbox.querySelector('.lightbox__count');

      lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
      lightbox.querySelector('.lightbox__prev').addEventListener('click', function () { step(-1); });
      lightbox.querySelector('.lightbox__next').addEventListener('click', function () { step(1); });
      // click the backdrop (but not the photo or a control) to dismiss
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    }

    function paintLightbox() {
      lbImg.src = lbList[lbIndex];
      lbCount.textContent = (lbIndex + 1) + ' / ' + lbList.length;
    }
    function step(d) {
      lbIndex = (lbIndex + d + lbList.length) % lbList.length;   // wraps both ways
      paintLightbox();
    }

    function onLightboxKey(e) {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { step(-1); return; }
      if (e.key === 'ArrowRight') { step(1); return; }
      if (e.key !== 'Tab') return;
      // keep focus inside the dialog while it's open
      var f = lightbox.querySelectorAll('button');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openLightbox(i) {
      buildLightbox();
      lbIndex = i;
      lbReturnTo = document.activeElement;
      paintLightbox();
      lightbox.classList.add('is-open');
      requestAnimationFrame(function () { lightbox.classList.add('is-shown'); });
      document.body.style.overflow = 'hidden';        // don't scroll the page behind it
      document.addEventListener('keydown', onLightboxKey);
      lightbox.querySelector('.lightbox__close').focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-shown');
      document.removeEventListener('keydown', onLightboxKey);
      document.body.style.overflow = '';
      setTimeout(function () { lightbox.classList.remove('is-open'); }, prefersReduced ? 0 : 250);
      if (lbReturnTo && lbReturnTo.focus) lbReturnTo.focus();   // back where they came from
    }

    if (galleryGrid) {
      galleryGrid.addEventListener('click', function (e) {
        var b = e.target.closest('.gallery__item');
        if (b) openLightbox(Number(b.getAttribute('data-i')));
      });
    }

    function refresh() { renderChips(); renderGallery(); }

    catRow.addEventListener('click', function (e) {
      var b = e.target.closest('[data-value]'); if (!b) return;
      state.category = b.getAttribute('data-value'); refresh();
    });
    refresh();
  }

  /* ---------- scroll reveal: headings, kickers, and card grids ----------
     Block elements reveal on their own; grid-like containers reveal their
     direct children in a left-to-right stagger. */
  (function () {
    var scope = document.getElementById('main');
    if (!scope) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return; // leave content plainly visible

    var STEP = 70;   // ms between siblings
    var CAP = 420;   // ms — longest stagger delay, so big grids don't drag

    // once an element has finished fading in, drop the helper classes so its
    // own transitions (card hover, etc.) aren't left running at reveal speed
    function show(el) {
      el.classList.add('is-visible');
      el.addEventListener('transitionend', function te(ev) {
        if (ev.target !== el) return;
        el.classList.remove('reveal', 'is-visible');
        el.removeEventListener('transitionend', te);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        var kids = el.__revealKids;
        if (kids) {
          kids.forEach(function (kid, i) {
            setTimeout(function () { show(kid); }, Math.min(i * STEP, CAP));
          });
        } else {
          show(el);
        }
      });
      /* threshold MUST stay 0. A ratio threshold is a fraction of the
         element's own area, so any container taller than the viewport can
         never reach it: the 16-card Products grid collapses to one column on
         a phone, making it many screens tall, so its ratio peaks well under
         0.12 and the cards never reveal. (Zooming out shrank it enough to
         cross the line, which is why it appeared to fix itself.) With 0 it
         fires on first pixel, and rootMargin does the "wait until it's
         properly on screen" job instead — independent of element height. */
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    // the hero runs its own on-load entrance — keep the scroll observer off it
    function skip(el) { return el.closest && el.closest('.hero'); }

    // block-level reveals
    Array.prototype.forEach.call(
      scope.querySelectorAll('.kicker, h1:not(.sr-only), h2'),
      function (el) { if (skip(el)) return; el.classList.add('reveal'); io.observe(el); }
    );

    // staggered containers
    Array.prototype.forEach.call(
      scope.querySelectorAll('.grid, .gallery, .advice__points, .stat-band__inner'),
      function (container) {
        if (skip(container)) return;
        var kids = Array.prototype.slice.call(container.children);
        if (!kids.length) { container.classList.add('reveal'); io.observe(container); return; }
        kids.forEach(function (kid) { kid.classList.add('reveal'); });
        container.__revealKids = kids;
        io.observe(container);
      }
    );

    /* Safety net. Content being permanently invisible is the worst way this
       can fail, and it fails silently. Once everything has loaded, force
       anything still hidden but already on screen into view. */
    window.addEventListener('load', function () {
      setTimeout(function () {
        Array.prototype.forEach.call(
          scope.querySelectorAll('.reveal:not(.is-visible)'),
          function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) show(el);
          }
        );
      }, 400);
    }, { once: true });
  })();
})();
