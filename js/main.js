// Countdown to the first day of the wedding weekend (midnight Mountain Time, UTC-6 in August).
(function () {
  var el = document.getElementById('days');
  if (!el) return;
  var target = new Date('2027-08-06T00:00:00-06:00').getTime();
  var days = Math.ceil((target - Date.now()) / 86400000);
  var label = el.parentElement;
  if (days > 1) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = days; }
    else {
      var start = null;
      var tick = function (t) {
        if (start === null) start = t;
        var k = Math.min((t - start) / 1400, 1);
        el.textContent = Math.round(days * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  else if (days === 1) { el.textContent = '1'; label.lastElementChild.textContent = 'day to go'; }
  else { label.textContent = 'See you in the mountains.'; }
})();

// Photo gallery lightbox
(function () {
  var box = document.getElementById('lightbox');
  var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
  if (!box || !links.length || typeof box.showModal !== 'function') return;
  var img = box.querySelector('.lightbox__img');
  var current = 0;

  function show(i) {
    current = (i + links.length) % links.length;
    var thumb = links[current].querySelector('img');
    img.src = links[current].getAttribute('data-full');
    img.alt = thumb.alt;
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); show(i); box.showModal(); });
  });
  box.querySelector('.lightbox__close').addEventListener('click', function () { box.close(); });
  box.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();

// RSVP form embed
(function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.rsvpFormUrl) return;
  var sep = cfg.rsvpFormUrl.indexOf('?') === -1 ? '?' : '&';
  document.getElementById('rsvp-iframe').src = cfg.rsvpFormUrl + sep + 'embedded=true';
  document.getElementById('rsvp-link').href = cfg.rsvpFormUrl;
  document.getElementById('rsvp-frame').hidden = false;
  document.getElementById('rsvp-fallback').hidden = false;
  document.getElementById('rsvp-soon').hidden = true;
})();

// Potluck and lawn game sign-up list (reads a published Google Sheet)
(function () {
  var cfg = window.SITE_CONFIG || {};
  var dishList = document.getElementById('dish-list');
  var gameList = document.getElementById('game-list');
  var summary = document.getElementById('dish-summary');
  if (!dishList || !gameList) return;

  if (cfg.signupFormUrl) {
    var add = document.getElementById('signup-link');
    add.href = cfg.signupFormUrl;
    add.hidden = false;
  }

  function setMessage(list, text) {
    list.textContent = '';
    var li = document.createElement('li');
    li.className = 'empty';
    li.textContent = text;
    list.appendChild(li);
  }

  if (!cfg.signupSheetCsvUrl) {
    setMessage(dishList, 'The sign-up list opens soon.');
    setMessage(gameList, 'The sign-up list opens soon.');
    return;
  }

  // Minimal CSV parser (handles quoted fields and commas inside quotes)
  function parseCsv(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function col(header, word) {
    for (var i = 0; i < header.length; i++) {
      if (header[i].toLowerCase().indexOf(word) !== -1) return i;
    }
    return -1;
  }

  function render(list, items, emptyText) {
    list.textContent = '';
    if (!items.length) { setMessage(list, emptyText); return; }
    items.forEach(function (it) {
      var li = document.createElement('li');
      var strong = document.createElement('strong');
      strong.textContent = it.what;
      li.appendChild(strong);
      var meta = document.createElement('span');
      var bits = [it.name];
      if (it.details) bits.push(it.details);
      meta.textContent = bits.join(', ');
      li.appendChild(meta);
      list.appendChild(li);
    });
  }

  fetch(cfg.signupSheetCsvUrl, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('bad response'); return r.text(); })
    .then(function (text) {
      var rows = parseCsv(text);
      var header = rows.shift() || [];
      var iName = col(header, 'name'), iType = col(header, 'bringing'), iWhat = col(header, 'what is it'),
          iCat = col(header, 'category'), iDet = col(header, 'details');
      var dishes = [], games = [], cats = {};
      rows.forEach(function (r) {
        var what = (r[iWhat] || '').trim();
        if (!what) return;
        var item = { what: what, name: (r[iName] || '').trim(), details: (r[iDet] || '').trim() };
        var type = (r[iType] || '').toLowerCase();
        if (type.indexOf('game') !== -1) { games.push(item); }
        else {
          dishes.push(item);
          var cat = (r[iCat] || '').trim().toLowerCase();
          if (cat) cats[cat] = (cats[cat] || 0) + 1;
        }
      });
      render(dishList, dishes, 'Nothing yet. Be the first to add a dish.');
      render(gameList, games, 'No games yet. Bring your favourite.');
      var parts = Object.keys(cats).map(function (k) { return k.charAt(0).toUpperCase() + k.slice(1) + ' (' + cats[k] + ')'; });
      summary.textContent = parts.length ? 'So far: ' + parts.join(', ') + '.' : '';
    })
    .catch(function () {
      setMessage(dishList, 'The list isn’t loading right now. Please try again later.');
      setMessage(gameList, 'The list isn’t loading right now. Please try again later.');
    });
})();

// Venue address and Google Maps link (set in js/config.js)
(function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.venueAddress) return;
  var url = cfg.mapsUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(cfg.venueAddress));
  var hero = document.getElementById('hero-address');
  hero.textContent = cfg.venueAddress;
  hero.href = url;
  hero.target = '_blank';
  hero.rel = 'noopener';
  document.getElementById('address-line').textContent = cfg.venueAddress;
  var link = document.getElementById('map-link');
  link.href = url;
  link.hidden = false;
})();

// Fireflies in the hero and gentle fade-ins while scrolling (skipped for reduced-motion)
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hero = document.querySelector('.hero');
  if (hero) {
    var box = document.createElement('div');
    box.className = 'fireflies';
    box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 16; i++) {
      var s = document.createElement('span');
      s.style.left = (Math.random() * 100) + '%';
      s.style.setProperty('--s', (4 + Math.random() * 6) + 'px');
      s.style.setProperty('--t', (10 + Math.random() * 12) + 's');
      s.style.setProperty('--d', '-' + (Math.random() * 20) + 's');
      s.style.setProperty('--x', (Math.random() * 90 - 45) + 'px');
      box.appendChild(s);
    }
    hero.appendChild(box);
  }

  if (!('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('.section__inner > *');
  document.documentElement.classList.add('js-reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();
