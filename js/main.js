// Countdown to the first day of the wedding weekend (midnight Mountain Time, UTC-6 in August).
(function () {
  var el = document.getElementById('days');
  if (!el) return;
  var target = new Date('2027-08-06T00:00:00-06:00').getTime();
  var days = Math.ceil((target - Date.now()) / 86400000);
  var label = el.parentElement;
  if (days > 1) { el.textContent = days; }
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
