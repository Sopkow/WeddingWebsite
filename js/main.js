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
