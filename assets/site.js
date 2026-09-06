/* Last Chance Lighting — shared behaviour
   - mobile navigation toggle
   - home hero carousel
   - product catalogue (Products filtering + Product Detail rendering)
   No framework. Every block is a no-op when its markup isn't on the page. */

(function () {
  'use strict';

  /* ---------- preloader ---------- */
  var preloader = document.getElementById('preloader');
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
  var CATEGORIES = [
    'Chandeliers', 'Pendant Lights', 'Wall Lighting', 'Ceiling Lights',
    'LED Systems', 'Outdoor', 'Industrial', 'Smart Systems'
  ];
  var ROOMS = [
    'Living Room', 'Dining Room', 'Bedroom', 'Kitchen & Dining',
    'Outdoor & Garden', 'Office & Study', 'Retail & Hospitality'
  ];
  var PRODUCTS = [
    { id: 'cinnamon-chandelier', name: 'The Cinnamon Chandelier', category: 'Chandeliers',
      rooms: ['Living Room', 'Dining Room'], wattage: '6 × 4W E14 LED', lumens: '2,200 lm',
      colorTemp: '2700K warm white', dimensions: 'Ø820 × H650 mm', materials: 'Brass frame, hand-cut crystal drops',
      tagline: 'A quiet centrepiece for a room that entertains.',
      description: 'Hand-assembled on a solid brass frame, each drop cut and hung individually in our Colombo workshop. Built for rooms with tall ceilings and long dinners.' },
    { id: 'colombo-grand-chandelier', name: 'Colombo Grand Chandelier', category: 'Chandeliers',
      rooms: ['Dining Room'], wattage: '12 × 4W E14 LED', lumens: '4,800 lm',
      colorTemp: '2700K warm white', dimensions: 'Ø1100 × H900 mm', materials: 'Brass, blown glass',
      tagline: 'Scaled for entrance halls and grand dining rooms.',
      description: 'Our largest chandelier, specified for double-height foyers and formal dining halls. Every tier ships pre-wired and is hung by our own installation team.' },
    { id: 'tea-estate-pendant', name: 'Tea Estate Pendant', category: 'Pendant Lights',
      rooms: ['Kitchen & Dining', 'Living Room'], wattage: '1 × 9W LED', lumens: '750 lm',
      colorTemp: '3000K soft white', dimensions: 'Ø280 × H320 mm', materials: 'Woven rattan, brass fittings',
      tagline: 'Warm, woven light over a kitchen island.',
      description: 'Rattan woven by artisans in the hill country, paired with a brass gimbal so the shade can be angled once it’s hung. A favourite over kitchen counters and breakfast tables.' },
    { id: 'arabian-sea-pendant-trio', name: 'Arabian Sea Pendant Trio', category: 'Pendant Lights',
      rooms: ['Dining Room', 'Kitchen & Dining'], wattage: '3 × 7W LED', lumens: '1,500 lm total',
      colorTemp: '3000K soft white', dimensions: 'Adjustable drop to 900 mm', materials: 'Hand-blown glass, brass',
      tagline: 'Three softly blown globes, hung at staggered heights.',
      description: 'Each globe is mouth-blown, so no two catch the light quite the same way. Supplied with adjustable drop rods to suit your ceiling height and table below.' },
    { id: 'kandy-wall-sconce', name: 'Kandy Wall Sconce', category: 'Wall Lighting',
      rooms: ['Living Room', 'Bedroom'], wattage: '1 × 6W LED', lumens: '420 lm',
      colorTemp: '2700K warm white', dimensions: 'W180 × H260 mm', materials: 'Brushed brass, alabaster glass',
      tagline: 'A soft wash of light beside the bed or the sofa.',
      description: 'The alabaster diffuser takes the edge off a bare bulb’s glare, giving a warm, even wash rather than a hot spot — kind to reading in bed or a quiet corner of the living room.' },
    { id: 'fort-facade-wall-light', name: 'Fort Facade Wall Light', category: 'Wall Lighting',
      rooms: ['Outdoor & Garden', 'Office & Study'], wattage: '1 × 8W LED', lumens: '600 lm',
      colorTemp: '3000K soft white', dimensions: 'W140 × H220 mm', ipRating: 'IP54', materials: 'Powder-coated aluminium',
      tagline: 'Weatherproofed for verandas and entrance walls.',
      description: 'Rated for covered outdoor use, this fixture holds up against Colombo’s monsoon humidity without losing its finish. A common choice for entrance porticoes and covered walkways.' },
    { id: 'nilgala-flush-mount', name: 'Nilgala Flush Mount', category: 'Ceiling Lights',
      rooms: ['Bedroom', 'Office & Study'], wattage: '18W LED panel', lumens: '1,600 lm',
      colorTemp: '4000K neutral white', dimensions: 'Ø400 × H60 mm', materials: 'Aluminium body, opal acrylic diffuser',
      tagline: 'Even, glare-free light for low ceilings.',
      description: 'Sits close to the ceiling for rooms where a pendant would hang too low. The opal diffuser spreads light evenly across the room instead of casting a single bright disc.' },
    { id: 'ella-ring-ceiling-light', name: 'Ella Ring Ceiling Light', category: 'Ceiling Lights',
      rooms: ['Living Room', 'Dining Room'], wattage: '24W LED ring', lumens: '2,100 lm',
      colorTemp: '2700K–6000K adjustable', dimensions: 'Ø600 × H80 mm', materials: 'Spun aluminium',
      tagline: 'One fixture that shifts from warm evenings to crisp daylight.',
      description: 'A remote-adjustable colour temperature lets the same fixture serve a relaxed dinner and a bright afternoon of schoolwork or admin, without swapping bulbs.' },
    { id: 'linear-cove-led-strip', name: 'Linear Cove LED Strip', category: 'LED Systems',
      rooms: ['Living Room', 'Office & Study', 'Retail & Hospitality'], wattage: '14.4W per metre', lumens: '1,200 lm/m',
      colorTemp: '3000K soft white', dimensions: 'Cut to length, IP20', materials: 'Aluminium channel, flexible PCB',
      tagline: 'Hidden light that traces a ceiling or a shelf.',
      description: 'Supplied in an aluminium channel that diffuses the individual LEDs into a single even line — for cove ceilings, joinery shelves and display cabinets, cut to your exact run.' },
    { id: 'trackline-spotlight-system', name: 'TrackLine Spotlight System', category: 'LED Systems',
      rooms: ['Retail & Hospitality', 'Office & Study'], wattage: '3 × 10W adjustable heads', lumens: '900 lm per head',
      colorTemp: '3000K–4000K', dimensions: '1m track, expandable', materials: 'Aluminium track, die-cast heads',
      tagline: 'Aim it at what you want customers to see.',
      description: 'Each head rotates and tilts independently on a shared track, so a single run of ceiling can highlight a changing shop window or gallery wall without rewiring.' },
    { id: 'monsoon-bollard-light', name: 'Monsoon-Ready Bollard Light', category: 'Outdoor',
      rooms: ['Outdoor & Garden'], wattage: '10W LED', lumens: '850 lm',
      colorTemp: '3000K soft white', dimensions: 'H600 mm', ipRating: 'IP65', materials: 'Marine-grade aluminium',
      tagline: 'Path lighting built for the wet season.',
      description: 'Sealed against driving rain and salt air alike, these bollards mark garden paths and driveways through a full monsoon without corroding or fogging.' },
    { id: 'garden-wash-uplighter', name: 'Garden Wash Uplighter', category: 'Outdoor',
      rooms: ['Outdoor & Garden'], wattage: '6W LED', lumens: '480 lm',
      colorTemp: '3000K soft white', dimensions: 'Ø90 × H120 mm', ipRating: 'IP67', materials: 'Stainless steel, tempered glass',
      tagline: 'Uplights a tree trunk or a garden wall after dark.',
      description: 'A tight beam angle grazes texture — brick, bark, stone — rather than flooding it, the way a single frangipani looks lit at night rather than floodlit.' },
    { id: 'warehouse-high-bay', name: 'Warehouse High Bay', category: 'Industrial',
      rooms: ['Retail & Hospitality', 'Office & Study'], wattage: '100W LED', lumens: '13,000 lm',
      colorTemp: '5000K daylight', dimensions: 'Ø400 × H350 mm', ipRating: 'IP54', materials: 'Die-cast aluminium heat sink',
      tagline: 'Bright, even coverage for tall ceilings.',
      description: 'Engineered for warehouse and factory ceilings 6 metres and above, where the light needs to reach the floor evenly without a forest of fixtures.' },
    { id: 'factory-floor-batten', name: 'Factory Floor Batten', category: 'Industrial',
      rooms: ['Office & Study'], wattage: '36W LED', lumens: '4,200 lm',
      colorTemp: '5000K daylight', dimensions: 'L1200 × W80 mm', ipRating: 'IP44', materials: 'Polycarbonate, aluminium',
      tagline: 'Dependable rows of light for workshops and stores.',
      description: 'A simple, robust batten fixture specified by the row for workshops, stockrooms and back-of-house areas that just need reliable, even light.' },
    { id: 'smart-scene-dimmer-panel', name: 'Smart Scene Dimmer Panel', category: 'Smart Systems',
      rooms: ['Living Room', 'Office & Study'], wattage: 'Wall-mounted controller', lumens: 'Controls up to 40 fixtures',
      colorTemp: 'App + physical panel', dimensions: 'W86 × H86 mm', materials: 'Aluminium frame, glass touch panel',
      tagline: 'One tap for ‘movie night’, one tap for ‘dinner’.',
      description: 'Replaces a wall of switches with saved scenes — set once by our technicians during install, then recalled with a tap or a voice command.' },
    { id: 'whole-home-lighting-hub', name: 'Whole-Home Lighting Hub', category: 'Smart Systems',
      rooms: ['Living Room', 'Bedroom', 'Office & Study'], wattage: 'Central hub', lumens: 'Zigbee + Wi-Fi bridge',
      colorTemp: 'Voice-assistant compatible', dimensions: '100 × 100 × 30 mm', materials: 'ABS enclosure',
      tagline: 'Brings every room onto one app, one schedule.',
      description: 'A single hub that speaks to every fixture in the house, so sunset dimming, away-mode and morning routines all run from one app instead of five.' }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plateLabel(name) {
    return '<figure class="plate flush-top ar-4-3"><span class="plate__label">' + esc(name) + '</span></figure>';
  }
  function productCard(p) {
    return '<a href="product-detail.html?id=' + encodeURIComponent(p.id) + '" class="card card--media card--link">' +
      plateLabel(p.name + ' photo') +
      '<div class="card__pad">' +
        '<span class="tag tag-accent">' + esc(p.category) + '</span>' +
        '<div class="card__title">' + esc(p.name) + '</div>' +
        '<p class="card__body">' + esc(p.tagline) + '</p>' +
        '<div class="card__meta"><span>' + esc(p.wattage) + ' · ' + esc(p.lumens) + '</span><span>' + esc(p.dimensions) + '</span></div>' +
      '</div></a>';
  }

  /* ----- Products listing ----- */
  var grid = document.getElementById('catalogue-grid');
  if (grid) {
    var catRow = document.getElementById('filter-categories');
    var roomRow = document.getElementById('filter-rooms');
    var countEl = document.getElementById('catalogue-count');
    var params = new URLSearchParams(window.location.search);
    var startCat = params.get('category');
    var state = {
      category: startCat && CATEGORIES.indexOf(startCat) !== -1 ? startCat : 'All',
      room: 'All'
    };

    function chip(label, active) {
      return '<button type="button" class="chip' + (active ? ' is-active' : '') +
        '" data-value="' + esc(label) + '">' + esc(label) + '</button>';
    }
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TOTAL = PRODUCTS.length;
    var shownCount = null;   // last rendered "showing N"
    var firstPaint = true;

    function renderChips() {
      catRow.innerHTML = ['All'].concat(CATEGORIES).map(function (c) { return chip(c, c === state.category); }).join('');
      roomRow.innerHTML = ['All'].concat(ROOMS).map(function (r) { return chip(r, r === state.room); }).join('');
    }

    // #8 — tween "Showing N of 16 pieces" when the filtered count changes
    function setCount(n) {
      if (shownCount === null || prefersReduced || shownCount === n) {
        countEl.textContent = 'Showing ' + n + ' of ' + TOTAL + ' pieces';
        shownCount = n;
        return;
      }
      var from = shownCount, to = n, t0 = null, dur = 420;
      shownCount = n;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var v = Math.round(from + (to - from) * (p * (2 - p)));
        countEl.textContent = 'Showing ' + v + ' of ' + TOTAL + ' pieces';
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    // #7 — repaint the grid; on filter changes the new cards stagger in
    function paintGrid(list) {
      if (!list.length) {
        grid.className = 'catalogue-empty';
        grid.innerHTML = '<div class="empty-state"><p>No pieces match that combination yet — try a different room, or ask us directly.</p>' +
          '<a href="contact.html" class="btn btn-secondary" style="margin-top:12px">Ask our team</a></div>';
        return;
      }
      grid.className = 'grid cols-4';
      grid.innerHTML = list.map(productCard).join('');
      if (firstPaint || prefersReduced) { firstPaint = false; return; } // first load handled by the scroll-reveal
      Array.prototype.forEach.call(grid.children, function (card, i) {
        card.style.animationDelay = Math.min(i * 45, 270) + 'ms';
        card.classList.add('card--enter');
        card.addEventListener('animationend', function ae() {
          card.classList.remove('card--enter');
          card.style.animationDelay = '';
          card.removeEventListener('animationend', ae);
        });
      });
    }

    function renderGrid() {
      var list = PRODUCTS.filter(function (p) {
        return (state.category === 'All' || p.category === state.category) &&
               (state.room === 'All' || p.rooms.indexOf(state.room) !== -1);
      });
      setCount(list.length);
      paintGrid(list);
    }
    function refresh() { renderChips(); renderGrid(); }

    catRow.addEventListener('click', function (e) {
      var b = e.target.closest('[data-value]'); if (!b) return;
      state.category = b.getAttribute('data-value'); refresh();
    });
    roomRow.addEventListener('click', function (e) {
      var b = e.target.closest('[data-value]'); if (!b) return;
      state.room = b.getAttribute('data-value'); refresh();
    });
    refresh();
  }

  /* ----- Product detail ----- */
  var detail = document.getElementById('product-detail');
  if (detail) {
    var id = new URLSearchParams(window.location.search).get('id');
    var product = PRODUCTS.filter(function (p) { return p.id === id; })[0] || PRODUCTS[0];
    var catHref = 'products.html?category=' + encodeURIComponent(product.category);

    var specs = [
      ['Category', product.category],
      ['Wattage', product.wattage],
      ['Light Output', product.lumens],
      ['Colour Temperature', product.colorTemp],
      ['Dimensions', product.dimensions],
      ['Materials', product.materials]
    ];
    if (product.ipRating) specs.push(['IP Rating', product.ipRating]);

    var related = PRODUCTS.filter(function (p) {
      return p.category === product.category && p.id !== product.id;
    }).slice(0, 3);
    if (!related.length) {
      related = PRODUCTS.filter(function (p) { return p.id !== product.id; }).slice(0, 3);
    }

    document.title = product.name + ' | Last Chance Lighting (Pvt) Ltd';

    detail.innerHTML =
      '<nav class="breadcrumb wrap"><a href="products.html">Products</a> › <a href="' + catHref + '">' +
        esc(product.category) + '</a> › ' + esc(product.name) + '</nav>' +
      '<section class="section wrap split split--wide-media" style="align-items:flex-start">' +
        '<div>' +
          '<figure class="plate ar-4-3"><span class="plate__label">' + esc(product.name) + ' — main photo</span></figure>' +
          '<div class="thumb-row">' +
            '<figure class="plate ar-1-1"><span class="plate__label">Detail</span></figure>' +
            '<figure class="plate ar-1-1"><span class="plate__label">In situ</span></figure>' +
            '<figure class="plate ar-1-1"><span class="plate__label">Finish</span></figure>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<span class="tag tag-accent">' + esc(product.category) + '</span>' +
          '<h1 style="margin:14px 0 10px">' + esc(product.name) + '</h1>' +
          '<p class="lead" style="font-size:16px">' + esc(product.tagline) + '</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:16px 0 22px">' +
            product.rooms.map(function (r) { return '<span class="tag tag-neutral">' + esc(r) + '</span>'; }).join('') +
          '</div>' +
          '<p style="opacity:0.85;line-height:1.7">' + esc(product.description) + '</p>' +
          '<div class="cta-row" style="margin-top:8px">' +
            '<a href="contact.html" class="btn btn-primary">Request a quote</a>' +
            '<a href="contact.html#showroom" class="btn btn-secondary">See it at the showroom</a>' +
          '</div>' +
          '<hr class="rule" style="margin:28px 0 4px">' +
          '<p class="filter-label" style="margin-top:20px">Specifications</p>' +
          '<table class="spec-table"><tbody>' +
            specs.map(function (s) { return '<tr><td>' + esc(s[0]) + '</td><td>' + esc(s[1]) + '</td></tr>'; }).join('') +
          '</tbody></table>' +
        '</div>' +
      '</section>' +
      '<hr class="rule rule--inset">' +
      '<section class="section section--handoff wrap">' +
        '<h2 style="margin-bottom:24px">More From ' + esc(product.category) + '</h2>' +
        '<div class="grid cols-3">' +
          related.map(function (rp) {
            return '<a href="product-detail.html?id=' + encodeURIComponent(rp.id) + '" class="card card--media card--link">' +
              plateLabel(rp.name + ' photo') +
              '<div class="card__pad"><div class="card__title" style="font-size:16px">' + esc(rp.name) + '</div>' +
              '<p class="card__body">' + esc(rp.tagline) + '</p></div></a>';
          }).join('') +
        '</div>' +
      '</section>';
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
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    // the hero runs its own on-load entrance — keep the scroll observer off it
    function skip(el) { return el.closest && el.closest('.hero'); }

    // block-level reveals
    Array.prototype.forEach.call(
      scope.querySelectorAll('.kicker, h1:not(.sr-only), h2, .breadcrumb, .spec-table'),
      function (el) { if (skip(el)) return; el.classList.add('reveal'); io.observe(el); }
    );

    // staggered containers
    Array.prototype.forEach.call(
      scope.querySelectorAll('.grid, .advice__points, .thumb-row, .stat-band__inner'),
      function (container) {
        if (skip(container)) return;
        var kids = Array.prototype.slice.call(container.children);
        if (!kids.length) { container.classList.add('reveal'); io.observe(container); return; }
        kids.forEach(function (kid) { kid.classList.add('reveal'); });
        container.__revealKids = kids;
        io.observe(container);
      }
    );
  })();
})();
